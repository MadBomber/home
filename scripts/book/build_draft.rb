#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds build/<slug>/draft.md from a study's sources under src/<slug>/.
#
# Usage:  ruby scripts/book/build_draft.rb ntc1y
#         ruby scripts/book/build_draft.rb ot1y
#
# The study sources are READ ONLY -- this script never writes to them. draft.md
# is generated output, overwritten on every run: make content changes in the
# sources, or in this script, never in draft.md.
#
# Per-study differences (counts, prose quirks, how section pages are handled)
# live in studies/<slug>.yml, not here.
#
# Book structure produced:
#   title metadata -> src/<slug>/index.md frontmatter title
#   intro page     -> src/<slug>/index.md body
#   section page   -> src/<slug>/section-NN/index.md
#   week page      -> src/<slug>/section-NN/week-NN/overview.md
#
# Heading hierarchy:
#   H1  section titles ("# Section N. Name") and the intro
#   H2  week titles ("## Week N. Title")
#   H3  everything inside a week or a section page

require 'yaml'
require 'pathname'
require_relative 'study'

STUDY = Study.from_argv
SRC   = STUDY.source_dir
OUT   = STUDY.draft

# The weekly readings table would otherwise render as three equal columns,
# wrapping the long title cells onto extra lines -- once per week.
#
# Pandoc derives relative column widths from the dash counts in the separator
# row, but ONLY when that row is wider than its --columns setting (72 by
# default); a narrower separator silently falls back to equal widths. So the
# separator below is deliberately long, and proportioned to the content:
#
#   8  Day      sized for the header word, not the single digit beneath it
#              (at 5 dashes the heading itself wrapped to "Da / y")
#   24 Reading  fits all but one of the references; going wider to catch the
#              last one ("Matthew 25:31-46 + Luke 21") cost a whole page
#   56 Title    the remainder, which is where the long text lives
READINGS_SEPARATOR = "|#{'-' * 8}|#{'-' * 24}|#{'-' * 56}|"

def split_frontmatter(path)
  raw = path.read
  if (m = raw.match(/\A---\n(.*?)\n---\n(.*)\z/m))
    [YAML.safe_load(m[1]) || {}, m[2]]
  else
    [{}, raw]
  end
end

# Links are dead in a non-interactive PDF: keep the label, drop the target.
def deactivate_links(text)
  text.gsub(/\[([^\]\n]+)\]\([^)\n]*\)/, '\1')
end

def strip_erb(text)
  text.gsub(/<%=?.*?%>/m, '')
end

# Some studies write em dashes as a spaced double hyphen, which would print
# literally. Requiring a space on both sides leaves table rules (|-----|) and
# the "---" page separators untouched.
def em_dashes(text)
  return text unless STUDY.fix_em_dashes

  text.gsub(' -- ', ' — ')
end

# Some prose calls a section a "Phase" (leftover internal naming). Phase
# numbering matches section numbering 1:1, so only the noun changes. Lowercase
# "phase" is left alone -- it is used in its ordinary English sense.
def phases_to_sections(text)
  return text unless STUDY.fix_phase_labels

  text.gsub(/\bPhase (\d+)\b/, 'Section \1')
end

def normalize_headings(text)
  STUDY.heading_aliases.each do |from, to|
    text = text.gsub(/^#{Regexp.escape(from)}[ \t]*$/, to)
  end
  text
end

def widen_readings_table(text)
  text.gsub(/^(\|\s*Day\s*\|\s*Reading\s*\|[^|\n]*\|)\n\|[-|\s]+\|[ \t]*$/) do
    "#{Regexp.last_match(1)}\n#{READINGS_SEPARATOR}"
  end
end

# Push every ATX heading one level deeper.
def demote_headings(text)
  text.gsub(/^(\#{1,5})(?= )/) { "##{Regexp.last_match(1)}" }
end

# Pull every ATX heading one level up.
def promote_headings(text)
  text.gsub(/^\#(\#{1,5})(?= )/) { Regexp.last_match(1) }
end

# Remove a "## Heading" and everything under it, up to the next H2 or the end.
def drop_section(text, heading)
  text.gsub(/^##\s*#{Regexp.escape heading}[ \t]*\n.*?(?=^##\s|\z)/m, '')
end

# The week's frontmatter carries only the reference; the verse text itself
# lives in the sibling memory-verse.md.
def memory_verse_block(week_dir, fm)
  ref = fm['memory_verse']
  return nil if ref.nil? || ref.to_s.strip.empty?

  mv_path = week_dir + 'memory-verse.md'
  verse = translation = nil
  if mv_path.exist?
    mv_fm, = split_frontmatter(mv_path)
    verse       = mv_fm['verse_text']
    translation = mv_fm['translation']
  end

  citation = translation ? "#{ref} (#{translation})" : ref.to_s
  lines = ["*Memory Verse: #{citation}*"]
  lines << "\n> #{verse.strip}" if verse && !verse.strip.empty?
  lines.join("\n")
end

def render_week(week_dir)
  fm, body = split_frontmatter(week_dir + 'overview.md')

  header = ["## Week #{fm['week']}. #{fm['title']}"]
  if (mv = memory_verse_block(week_dir, fm))
    header << mv
  end

  body = widen_readings_table(body)
  # Normalize while the headings are still H2, then demote the body to H3.
  body = demote_headings(normalize_headings(phases_to_sections(em_dashes(deactivate_links(body))))).strip
  "#{header.join("\n")}\n\n#{body}"
end

def render_section(section_dir)
  fm, body = split_frontmatter(section_dir + 'index.md')
  body = phases_to_sections(em_dashes(deactivate_links(body))).strip

  # The "*Weeks N-M*" line and any body H1 are regenerated in the header below.
  body = body.sub(/\A#[^\n]*\n+/, '')
  body = body.sub(/\A\*Weeks[^\n]*\*\s*/, '')

  # Web navigation and any authoring-only sections named in the study config.
  body = drop_section(body, STUDY.weeks_table) if STUDY.weeks_table
  STUDY.drop_headings.each { |h| body = drop_section(body, h) }
  body = body.sub(/^\*\*See also:\*\*.*\z/m, '')
  body = body.sub(/\n---\s*\z/, '')

  body = if STUDY.section_mode == 'overview_only'
           # The page is one essay under an "## Overview" heading: keep the
           # prose, drop the heading (H2 is reserved for week titles).
           body.sub(/^##\s*Overview[ \t]*\n+/, '').strip
         else
           # Keep the whole page, demoted so its headings sit below the weeks.
           demote_headings(body).strip
         end

  # Prefer `section` over `title`: it spells out "and" where `title` sometimes
  # uses "&", matching the section names in the intro's overview table.
  name = fm['section'] || fm['title']

  ["# Section #{fm['section_number']}. #{name}", "*Weeks #{fm['weeks']}*", '', body].join("\n").strip
end

# The book title becomes a pandoc metadata block rather than a heading in the
# body. Pandoc places the generated table of contents immediately after the
# title block, which is the only way to get title page -> TOC -> body order in
# docx; with the title as a plain heading the TOC lands ahead of it.
#
# The subtitle rides along as pandoc's `subtitle`, which the docx writer renders
# in the Subtitle style on the line below the title.
def render_title_metadata
  lines = ['---', %(title: "#{STUDY.title}")]
  lines << %(subtitle: "#{STUDY.subtitle}") if STUDY.subtitle
  lines << '---'
  lines.join("\n")
end

def render_intro
  _fm, body = split_frontmatter(SRC + 'index.md')
  body = strip_erb(em_dashes(deactivate_links(body))).strip
  body = body.gsub(/\[([^\]\n]+)\]\(\s*\)/, '\1')
  # These sections point at web-only documents that are not part of the PDF.
  body = body.sub(/\n### How to Use This Study\b.*\z/m, '').strip
  # Title is now metadata, so lift "Overview" to H1 to sit level with sections.
  promote_headings(body)
end

abort "Study sources not found at #{SRC}" unless SRC.directory?

STUDY.prepare_build_dir

section_dirs = Dir.glob(SRC + 'section-*').sort.map { |d| Pathname.new(d) }
unless section_dirs.size == STUDY.sections
  abort "#{STUDY.slug}: expected #{STUDY.sections} sections, found #{section_dirs.size}"
end

parts = [render_intro]
week_count = 0

section_dirs.each do |section_dir|
  parts << render_section(section_dir)

  week_dirs = Dir.glob(section_dir + 'week-*')
                 .sort_by { |d| d[/week-(\d+)/, 1].to_i }
                 .map { |d| Pathname.new(d) }

  week_dirs.each do |week_dir|
    parts << render_week(week_dir)
    week_count += 1
  end
end

unless week_count == STUDY.weeks
  abort "#{STUDY.slug}: expected #{STUDY.weeks} weeks, found #{week_count}"
end

# Join the parts, putting a rule (a page break, via pagebreak.lua) only before
# parts that do NOT open with an H1. Sections and the intro are H1 and get their
# page break from the Heading 1 style itself; adding a rule as well would break
# twice and leave a blank page between them.
body = parts.each_with_index.map do |part, index|
  next part if index.zero?

  break_before_part = !part.start_with?('# ') && STUDY.week_page_breaks
  break_before_part ? "\n\n---\n\n#{part}" : "\n\n#{part}"
end.join

OUT.write("#{render_title_metadata}\n\n#{body}\n")

puts "Wrote #{OUT}"
puts "  #{STUDY.slug}: #{section_dirs.size} sections, #{week_count} weeks, #{parts.size} parts"
puts "  #{OUT.read.lines.size} lines"
