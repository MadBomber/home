#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds reference.docx -- the style template pandoc uses for ntc1y.docx.
#
# Usage:  ruby scripts/book/build_reference.rb ntc1y
#
# Run this only when the book's look needs to change (fonts, sizes, header,
# footer). build_docx.rb consumes the result. reference.docx is a binary, so
# this script is the readable source of truth for what is inside it.
#
# Why the font patching: pandoc's stock reference.docx themes on Aptos /
# Aptos Display (shipped with Microsoft Office) and Consolas. None of those
# exist on macOS without Office installed, so Pages and LibreOffice warn about
# missing fonts and substitute. Everything below is a macOS system font.

require 'fileutils'
require 'open3'
require 'pathname'
require_relative 'study'

STUDY = Study.from_argv
BUILD = STUDY.build_dir
OUT   = STUDY.reference
WORK  = BUILD + '.reference_build'

BODY_FONT = 'Palatino'   # serif, ships with macOS, reads well at 10pt
MONO_FONT = 'Menlo'      # macOS default monospace
BODY_SIZE = '10pt'

# Two-sided printing: the narrow margin sits at the binding on both sides.
MARGIN_INSIDE     = '0.75in'
MARGIN_OUTSIDE    = '1in'
MARGIN_TOP_BOTTOM = '1in'

# Fonts baked into pandoc's stock reference.docx that macOS does not have.
FONT_SUBSTITUTIONS = {
  'Aptos Display' => BODY_FONT,
  'Aptos'         => BODY_FONT,
  'Consolas'      => MONO_FONT
}.freeze

def sh(*cmd)
  out, status = Open3.capture2e(*cmd)
  abort "command failed: #{cmd.join ' '}\n#{out}" unless status.success?
  out
end

def officecli(*args)
  sh('officecli', *args.map(&:to_s))
end

abort 'pandoc not found (brew install pandoc)'   if `which pandoc`.empty?
abort 'officecli not found'                      if `which officecli`.empty?

BUILD.mkpath
FileUtils.rm_rf WORK
FileUtils.rm_f OUT

# 1. Start from pandoc's stock template.
File.write(OUT, sh('pandoc', '--print-default-data-file', 'reference.docx'))

# 2. Swap the Office-only fonts for macOS ones. These live in the theme and
#    styles parts, which officecli's docDefaults props do not reach.
WORK.mkpath
sh('unzip', '-q', OUT.to_s, '-d', WORK.to_s)
FileUtils.chmod_R('u+w', WORK)

replaced = Hash.new 0
%w[word/theme/theme1.xml word/styles.xml].each do |part|
  path = WORK + part
  next unless path.exist?

  xml = path.read
  FONT_SUBSTITUTIONS.each do |from, to|
    count = xml.scan(from).size
    next if count.zero?

    xml = xml.gsub(from, to)
    replaced[from] += count
  end
  path.write xml
end

FileUtils.rm_f OUT
Dir.chdir(WORK) { sh('zip', '-q', '-r', '-X', OUT.to_s, '.') }
FileUtils.rm_rf WORK

# 3. Body font and size, applied as document defaults.
officecli 'open', OUT
officecli 'set', OUT, '/', "--prop", "docDefaults.font=#{BODY_FONT}"
officecli 'set', OUT, '/', "--prop", "docDefaults.fontSize=#{BODY_SIZE}"

# 4. Running header (current section title) and page-number footer. STYLEREF
#    tracks the nearest Heading 1, so each page shows the section it is in.
officecli 'add', OUT, '/', '--type', 'header', '--prop', 'type=default', '--prop', 'align=left'
officecli 'add', OUT, '/header[1]/p[1]', '--type', 'field',
          '--prop', 'fieldType=styleref', '--prop', 'styleName=Heading 1'

officecli 'add', OUT, '/', '--type', 'footer', '--prop', 'type=default', '--prop', 'align=center'
officecli 'add', OUT, '/footer[1]/p[1]', '--type', 'field', '--prop', 'fieldType=page'

# The title page gets its own (empty) header and footer. Without this, STYLEREF
# finds no Heading 1 above it and falls forward to the first one in the book,
# printing "Overview" across the top of the title page.
officecli 'set', OUT, '/section[1]', '--prop', 'titlePage=true'
officecli 'add', OUT, '/', '--type', 'header', '--prop', 'type=first'
officecli 'add', OUT, '/', '--type', 'footer', '--prop', 'type=first'

# 5. Pandoc emits the title block, then the TOC, then the body, with no breaks
#    between them. Breaking before the TOC heading gives the title its own page.
#    (build_draft.rb puts a rule before the body, which the page-break filter
#    turns into the break between the TOC and Section 1.)
officecli 'set', OUT, '/styles/TOCHeading', '--prop', 'pageBreakBefore=true'

#    Heading 1 (the intro and each section title) breaks by style rather than
#    by an explicit rule in the Markdown. Using a rule there put the break
#    paragraph on a page of its own whenever the preceding content happened to
#    end exactly at a page boundary, which produced a stray blank page.
officecli 'set', OUT, '/styles/Heading1', '--prop', 'pageBreakBefore=true'

# Avoid single lines stranded across page boundaries throughout the book.
officecli 'set', OUT, '/styles/Normal', '--prop', 'widowControl=true'

# 6. Two-sided (facing page) printing. With mirrorMargins on, marginLeft is the
#    INSIDE edge and marginRight the OUTSIDE edge, and they swap on even pages
#    so the narrow margin always falls at the binding.
officecli 'set', OUT, '/', '--prop', 'mirrorMargins=true'
officecli 'set', OUT, '/section[1]',
          '--prop', "marginLeft=#{MARGIN_INSIDE}",
          '--prop', "marginRight=#{MARGIN_OUTSIDE}",
          '--prop', "marginTop=#{MARGIN_TOP_BOTTOM}",
          '--prop', "marginBottom=#{MARGIN_TOP_BOTTOM}"

officecli 'save', OUT
officecli 'close', OUT

puts "Wrote #{OUT} (#{OUT.size} bytes)"
replaced.each { |font, n| puts "  font: #{font} -> #{FONT_SUBSTITUTIONS[font]} (#{n} occurrences)" }
puts "  body: #{BODY_FONT} #{BODY_SIZE}"
puts '  header: STYLEREF "Heading 1"   footer: PAGE'
