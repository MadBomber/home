#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds a short handout for a study: an overview page followed by the weekly
# Bible references laid out as a calendar, a quarter (13 weeks) per page.
#
# Usage:
#   ruby scripts/book/build_handout.rb ntc1y     # -> build/<slug>/<slug>-handout.docx
#   ruby scripts/book/build_pdf.rb ntc1y handout # -> the PDF
#
# Five pages: one overview, four quarters. Book names are abbreviated (see
# bible_abbrev.rb) so a reference fits a three-column cell at 10pt; the books
# keep full names.
#
# The grid is a pandoc grid table, which unlike a pipe table can hold several
# lines and paragraphs per cell. Cell text is wrapped to the source column width
# here, because a source line wider than its column breaks the table syntax.

require 'open3'
require 'pathname'
require 'yaml'
require_relative 'study'
require_relative 'bible_abbrev'

STUDY = Study.from_argv

WEEKS_PER_PAGE = 13
COLUMNS        = 3
CELL_WIDTH     = 34 # characters of cell content; fits "5  Hab 1:1-3:19; Zeph 1:1-3:20"

# A day cell reads "N  Reference". The gap is non-breaking spaces because docx
# collapses a run of ordinary ones, which ran the day number into the reference.
DAY_GAP = "  "

# Indent for the remainder of a reference that wraps to a second line.
READING_INDENT = " " * 3

# Card borders and interior padding, applied after pandoc (see below).
CELL_BORDER  = 'single;0.5pt;AAAAAA'
CELL_PADDING = 80 # twips, ~4pt

def split_frontmatter(path)
  raw = path.read
  if (m = raw.match(/\A---\n(.*?)\n---\n(.*)\z/m))
    [YAML.safe_load(m[1]) || {}, m[2]]
  else
    [{}, raw]
  end
end

# Day rows look like "| 1 | John 1:1-18 | Title |", and in some studies the day
# number is a link: "| [1](../day-1/) | ... |".
READING_ROW = /^\|\s*(?:\[)?[1-5](?:\]\([^)]*\))?\s*\|/

def week_data(week_dir)
  fm, body = split_frontmatter(week_dir + 'overview.md')
  refs = body.lines.grep(READING_ROW).map { |l| l.split('|')[2].to_s.strip }

  {
    number: fm['week'],
    title: fm['title'].to_s,
    section: fm['section'].to_s,
    memory: BibleAbbrev.apply(fm['memory_verse'].to_s),
    readings: refs.map { |r| BibleAbbrev.apply(r) }
  }
end

def wrap(text, width, hanging: '')
  words = text.to_s.split
  return [''] if words.empty?

  lines = [words.shift]
  words.each do |word|
    candidate = "#{lines.last} #{word}"
    if candidate.length <= width
      lines[-1] = candidate
    else
      lines << "#{hanging}#{word}"
    end
  end
  lines
end

# The lines of one calendar cell, before padding.
#
# A blank source line inside a grid-table cell starts a new paragraph, and the
# reference doc's BodyText style carries 9pt before and after -- roughly 54pt of
# dead space per cell, which spilled every quarter onto a second page. So the
# cell is one paragraph throughout and the visual gap is a line holding a single
# space, joined by hard line breaks.
GAP = ' '

def cell_lines(week)
  lines = ["**WEEK #{week[:number]}**"]
  lines += wrap(week[:title], CELL_WIDTH)
  lines << GAP
  week[:readings].each_with_index do |ref, i|
    lines += wrap("#{i + 1}#{DAY_GAP}#{ref}", CELL_WIDTH, hanging: READING_INDENT)
  end
  lines << "*Memory: #{week[:memory]}*" unless week[:memory].empty?
  lines
end

# Pandoc grid tables need every line padded to the column width. A trailing
# backslash makes a hard line break; the last line of a cell must not have one,
# and neither may the empty lines used to pad a short cell to the row height.
def render_row(weeks)
  cells = weeks.map { |w| w ? cell_lines(w) : [] }
  height = cells.map(&:size).max

  padded = cells.map do |lines|
    broken = lines.each_with_index.map do |line, i|
      i < lines.size - 1 ? "#{line}\\" : line
    end
    (broken + [''] * (height - broken.size)).map { |l| l.ljust(CELL_WIDTH + 1) }
  end

  (0...height).map { |i| "| #{padded.map { |c| c[i] }.join('| ')}|" }
end

def rule
  "+#{Array.new(COLUMNS) { '-' * (CELL_WIDTH + 2) }.join('+')}+"
end

def render_grid(weeks)
  rows = weeks.each_slice(COLUMNS).map { |slice| render_row(slice) }
  ([rule] + rows.flat_map { |r| r + [rule] }).join("\n")
end

# The overview page. Its headings deliberately stay below H1: Heading 1 carries
# pageBreakBefore in the reference doc, which is what gives each quarter its own
# page -- an H1 here would push the overview onto a page of its own.
def render_overview
  _fm, body = split_frontmatter(STUDY.source_dir + 'index.md')
  body = body.gsub(/<%=?.*?%>/m, '')
  body = body.gsub(/\[([^\]\n]+)\]\([^)\n]*\)/, '\1').gsub(/\[([^\]\n]+)\]\(\s*\)/, '\1')
  # Web-only document links are not part of a printed handout.
  body = body.sub(/\n### How to Use This Study\b.*\z/m, '').strip
  # The page is plainly the overview; its own heading is redundant next to the
  # title block. Everything below it moves up one level.
  body = body.sub(/\A##\s*Overview[ \t]*\n+/, '')
  body.gsub(/^\#(\#{2,5})(?= )/) { Regexp.last_match(1) }
end

abort "Study sources not found at #{STUDY.source_dir}" unless STUDY.source_dir.directory?
abort 'pandoc not found (brew install pandoc)' if `which pandoc`.empty?
abort "reference.docx not found -- run build_reference.rb #{STUDY.slug}" unless STUDY.reference.exist?

STUDY.prepare_build_dir

weeks = Dir.glob(STUDY.source_dir + 'section-*/week-*/overview.md')
           .sort_by { |f| f[/week-(\d+)/, 1].to_i }
           .map { |f| week_data(Pathname.new(f).dirname) }

unless weeks.size == STUDY.weeks
  abort "#{STUDY.slug}: expected #{STUDY.weeks} weeks, found #{weeks.size}"
end

missing = weeks.reject { |w| w[:readings].any? }
abort "no readings found for weeks: #{missing.map { |w| w[:number] }.join ', '}" if missing.any?

metadata = ['---', %(title: "#{STUDY.title}")]
metadata << %(subtitle: "#{STUDY.subtitle}") if STUDY.subtitle
metadata << %(subtitle: "Reading Plan") unless STUDY.subtitle
metadata << '---'

parts = [render_overview]

weeks.each_slice(WEEKS_PER_PAGE) do |page_weeks|
  heading = "# Weeks #{page_weeks.first[:number]}–#{page_weeks.last[:number]}"
  parts << "#{heading}\n\n#{render_grid(page_weeks)}"
end

md = "#{metadata.join("\n")}\n\n#{parts.join("\n\n")}\n"
STUDY.handout_draft.write md

# The grid table is this many characters wide; telling pandoc so makes it lay the
# table out at the full text width instead of scaling it down proportionally.
table_width = rule.length

cmd = ['pandoc', STUDY.handout_draft.to_s,
       '-o', STUDY.handout_docx.to_s,
       "--columns=#{table_width}",
       "--reference-doc=#{STUDY.reference}"]

output, status = Open3.capture2e(*cmd)
abort "pandoc failed:\n#{output}" unless status.success?

# Pandoc's table style rules only the header row, so the grid arrived as three
# columns of unseparated text. Ruling every cell is what makes it read as a card
# per week, and the padding keeps the text off the rules.
def officecli(*args)
  out, status = Open3.capture2e('officecli', *args.map(&:to_s))
  abort "officecli failed: #{args.join ' '}\n#{out}" unless status.success?
  out
end

tables = officecli('query', STUDY.handout_docx, 'table')
         .lines.filter_map { |l| l[%r{^(/body/tbl\[\d+\])}, 1] }

if tables.any?
  officecli 'open', STUDY.handout_docx
  tables.each do |path|
    officecli 'set', STUDY.handout_docx, path,
              '--prop', "border.all=#{CELL_BORDER}",
              '--prop', "padding=#{CELL_PADDING}"
  end
  officecli 'save', STUDY.handout_docx
  officecli 'close', STUDY.handout_docx
end

puts "Wrote #{STUDY.handout_draft}"
puts "Wrote #{STUDY.handout_docx} (#{STUDY.handout_docx.size} bytes)"
puts "  #{weeks.size} weeks, #{weeks.each_slice(WEEKS_PER_PAGE).count} quarter pages"
