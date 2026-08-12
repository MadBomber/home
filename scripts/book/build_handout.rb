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
require_relative 'esv_link'

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

# Link each reading to the passage on ESV.org. The link annotation itself prints
# nothing (LibreOffice writes it with no border and no appearance stream); what
# prints is the Hyperlink style's colour, which build_reference.rb sets to a dark
# navy that reproduces at 21% grey -- near-black, so a printed handout still
# reads as plain text.
LINK_REFERENCES = true

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
    # Keep the full reference alongside the abbreviation: the link text is the
    # short form, but the URL is built from the full one so ESV.org never has to
    # understand an abbreviation.
    readings: refs.map { |r| { label: BibleAbbrev.apply(r), full: r } }
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

def cell_lines(week, links)
  lines = ["**WEEK #{week[:number]}**"]
  lines += wrap(week[:title], CELL_WIDTH)
  lines << GAP
  week[:readings].each_with_index do |reading, i|
    # Every abbreviated reference fits one line (the longest is 27 characters,
    # and 5 + two spaces + 27 is inside the cell), so a reading never has to
    # wrap -- which matters because link markup must not straddle a line break.
    # Only the reference is linked; the day number stays plain text.
    lines << "#{i + 1}#{DAY_GAP}#{links.reference(reading[:label], reading[:full])}"
  end
  lines << "*Memory: #{week[:memory]}*" unless week[:memory].empty?
  lines
end

# Collects reference-style Markdown links: the table cell holds a short
# "[label][id]" and the URLs are defined after the tables. An inline link would
# put the whole URL in the cell, and a grid-table source line cannot be wider
# than its column.
class LinkTable
  def initialize(enabled)
    @enabled = enabled
    @definitions = []
  end

  def reference(label, citation)
    return label unless @enabled

    url = EsvLink.url_for(citation)
    return label unless url

    id = "r#{@definitions.size + 1}"
    @definitions << "[#{id}]: #{url}"
    "[#{label}][#{id}]"
  end

  def definitions = @definitions
  def any? = @definitions.any?
end

# The visible width of a source line, ignoring Markdown markup, so cells are
# padded by what the reader sees rather than by what the source spends on links.
def visible_width(line)
  line.gsub(/\[([^\]]*)\]\[[^\]]*\]/, '\1').gsub(/\*+/, '').length
end

# Pandoc grid tables need every line padded to the column width. A trailing
# backslash makes a hard line break; the last line of a cell must not have one,
# and neither may the empty lines used to pad a short cell to the row height.
# Appends the hard line breaks. Done before the column width is measured: the
# trailing backslash counts toward the line's width, and measuring without it
# made the single longest line in the document overflow its column by one
# character, pushing that row's "|" out of line and breaking the grid.
def add_line_breaks(lines)
  lines.each_with_index.map { |line, i| i < lines.size - 1 ? "#{line}\\" : line }
end

def render_row(cells, width)
  height = cells.map(&:size).max

  padded = cells.map do |lines|
    (lines + [''] * (height - lines.size)).map { |l| l.ljust(width + 1) }
  end

  (0...height).map { |i| "| #{padded.map { |c| c[i] }.join('| ')}|" }
end

def rule(width)
  "+#{Array.new(COLUMNS) { '-' * (width + 2) }.join('+')}+"
end

# Cells are built once (so link ids are issued once, in order), then measured:
# the source columns must be wide enough for the longest line including its
# "[label][id]" markup, which is wider than what the reader sees.
# One width for every quarter, measured across the whole study, so all four
# grids are the same size on the page instead of each sizing to its own longest
# reference.
def render_grid(cells, width)
  rows = cells.each_slice(COLUMNS).map do |slice|
    # 13 weeks in 3 columns leaves a partial last row. Every row still needs its
    # full complement of cells, or the row has fewer "|" than the rule has "+"
    # and pandoc has to guess at the missing ones.
    render_row(slice + Array.new(COLUMNS - slice.size) { [] }, width)
  end
  ([rule(width)] + rows.flat_map { |r| r + [rule(width)] }).join("\n")
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
unless STUDY.handout_reference.exist?
  abort "reference-handout.docx not found -- run: build_reference.rb #{STUDY.slug} handout"
end

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

links = LinkTable.new(LINK_REFERENCES)

# Build every cell first, in week order, so link ids are issued in order and one
# column width can be measured across the whole study.
cells = weeks.map { |w| add_line_breaks(cell_lines(w, links)) }
width = [cells.flatten.map(&:length).max, CELL_WIDTH].max

parts = [render_overview]

weeks.each_slice(WEEKS_PER_PAGE).with_index do |page_weeks, page|
  heading = "# Weeks #{page_weeks.first[:number]}–#{page_weeks.last[:number]}"
  page_cells = cells[page * WEEKS_PER_PAGE, page_weeks.size]
  parts << "#{heading}\n\n#{render_grid(page_cells, width)}"
end

# Reference-link definitions go after the tables, out of the cells.
parts << links.definitions.join("\n") if links.any?

md = "#{metadata.join("\n")}\n\n#{parts.join("\n\n")}\n"

# Every line of a grid table must be exactly as wide as its rule, or pandoc
# misreads the row and the cells come out scrambled. That is a silent failure --
# the document still builds and only looks wrong in print -- so it is checked
# here. Scoped to the grid blocks: the overview page holds an ordinary pipe
# table whose rows are ragged by design.
expected = rule(width).length
seen_rule = false
bad = []

md.lines.map(&:chomp).each do |line|
  seen_rule = true if line.start_with?('+--')
  # The overview's pipe table precedes every grid, so anything before the first
  # rule is not ours to police.
  next unless seen_rule && line.start_with?('+--', '|')

  bad << line unless line.length == expected
end

unless bad.empty?
  abort "malformed grid: #{bad.size} line(s) are not #{expected} characters wide\n" +
        bad.first(3).map { |l| "  #{l.length}: #{l[0, 110]}" }.join("\n")
end

STUDY.handout_draft.write md

# Telling pandoc how wide the widest grid is makes it lay the table out at the
# full text width instead of scaling it down proportionally.
table_width = md.lines.filter_map { |l| l.strip.length if l.start_with?('+--') }.max || 72

cmd = ['pandoc', STUDY.handout_draft.to_s,
       '-o', STUDY.handout_docx.to_s,
       "--columns=#{table_width}",
       "--reference-doc=#{STUDY.handout_reference}"]

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
              '--prop', "padding=#{CELL_PADDING}",
              '--prop', 'align=center'
  end
  officecli 'save', STUDY.handout_docx
  officecli 'close', STUDY.handout_docx
end

puts "Wrote #{STUDY.handout_draft}"
puts "Wrote #{STUDY.handout_docx} (#{STUDY.handout_docx.size} bytes)"
puts "  #{weeks.size} weeks, #{weeks.each_slice(WEEKS_PER_PAGE).count} quarter pages"
