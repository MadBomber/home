#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds a .docx style template for pandoc: one for the book, one for the
# handout. They share fonts, sizes and heading styles, and differ only in what
# binding demands -- the book mirrors its margins and ranges its header left,
# the handout has equal side margins and centers its header.
#
# Usage:  ruby scripts/book/build_reference.rb ntc1y
#         ruby scripts/book/build_reference.rb ntc1y handout
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

# Optional second argument selects which style template to build.
KIND = (ARGV[1] || 'book').downcase
abort "unknown kind #{KIND.inspect} -- use 'book' or 'handout'" unless %w[book handout].include?(KIND)
HANDOUT = KIND == 'handout'

BUILD = STUDY.build_dir
OUT   = HANDOUT ? STUDY.handout_reference : STUDY.reference
WORK  = BUILD + ".reference_build_#{KIND}"

BODY_FONT = 'Palatino'   # serif, ships with macOS, reads well at 10pt
MONO_FONT = 'Menlo'      # macOS default monospace
BODY_SIZE = '10pt'

# The handout sets larger. Its grid is what constrains this: at 12pt a quarter
# only fits a page once the memory verses move off the cards onto their own
# page, which is why the two settings travel together.
HANDOUT_BODY_SIZE = '12pt'

# Dark navy: reads as a link on screen, prints at 21% grey (near-black).
LINK_COLOR = '1F3864'

# The book is bound, so its margins mirror: the narrow one always falls at the
# binding, on both sides of the leaf.
MARGIN_INSIDE     = '0.75in'
MARGIN_OUTSIDE    = '1in'
MARGIN_TOP_BOTTOM = '1in'

# The handout is stapled, not bound, so its side margins are equal and the text
# block sits centered on every page rather than shifting between odd and even.
#
# 0.75in on all four sides. The top and bottom are what matter: the constraint
# on this document is vertical, and dropping them from 1in buys the 36pt that
# lets the grid set at 12pt while a quarter still fits its page.
HANDOUT_MARGIN_SIDE = '0.75in'
HANDOUT_MARGIN_TOP_BOTTOM = '0.75in'

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
body_size = HANDOUT ? HANDOUT_BODY_SIZE : BODY_SIZE
officecli 'set', OUT, '/', '--prop', "docDefaults.fontSize=#{body_size}"

# 4. Running header and page-number footer.
#
#    The book gets a running header: STYLEREF tracks the nearest Heading 1, so
#    every page names the section it is in -- worth having across 87 pages.
#
#    The handout names the study instead. A STYLEREF header there would track
#    its Heading 1, the quarter ("Weeks 1-13"), and so repeat the heading
#    directly beneath it; the title and subtitle say something the page does not.
if HANDOUT
  banner = [STUDY.title, STUDY.subtitle].compact.reject(&:empty?).join(' — ')
  officecli 'add', OUT, '/', '--type', 'header', '--prop', 'type=default', '--prop', 'align=center'
  officecli 'set', OUT, '/header[1]', '--prop', "text=#{banner}"
else
  officecli 'add', OUT, '/', '--type', 'header', '--prop', 'type=default', '--prop', 'align=left'
  officecli 'add', OUT, '/header[1]/p[1]', '--type', 'field',
            '--prop', 'fieldType=styleref', '--prop', 'styleName=Heading 1'
end

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

# Hyperlink colour matters for print, because a PDF link annotation itself draws
# nothing -- LibreOffice writes it with no border and no appearance stream, so
# the only ink is the character style's colour. Pandoc's stock 4F81BD prints at
# 47% grey, washing out every reference in the handout's dense grid. This navy
# prints at 21%, effectively black, while still reading as a link on screen.
officecli 'set', OUT, '/styles/Hyperlink', '--prop', "color=#{LINK_COLOR}"

# 6. Page margins. Both documents print double-sided; only the bound one needs
#    its margins to mirror. With mirrorMargins on, marginLeft is the INSIDE edge
#    and marginRight the OUTSIDE, and they swap on even pages so the narrow
#    margin always falls at the binding. The handout keeps mirroring off and
#    sets both sides the same, so the text block does not shift between pages.
if HANDOUT
  officecli 'set', OUT, '/section[1]',
            '--prop', "marginLeft=#{HANDOUT_MARGIN_SIDE}",
            '--prop', "marginRight=#{HANDOUT_MARGIN_SIDE}",
            '--prop', "marginTop=#{HANDOUT_MARGIN_TOP_BOTTOM}",
            '--prop', "marginBottom=#{HANDOUT_MARGIN_TOP_BOTTOM}"

  # Vertically center the page content. Word honours this; LibreOffice ignores
  # it on import (verified: a one-line document in a centered section still
  # renders at the top), so it does nothing for the PDFs this pipeline builds.
  # It is set anyway so the .docx carries the intent for anyone opening it in
  # Word. In the PDF the grid lands centered on its own account -- it is 549pt
  # tall in a 648pt block, and measures within 2pt of centered.
  #
  # Horizontal centering is set on the tables themselves, in build_handout.rb:
  # the grid is 396pt wide in a 486pt block, so it does not fill the width.
  officecli 'set', OUT, '/section[1]', '--prop', 'vAlign=center'
else
  officecli 'set', OUT, '/', '--prop', 'mirrorMargins=true'
  officecli 'set', OUT, '/section[1]',
            '--prop', "marginLeft=#{MARGIN_INSIDE}",
            '--prop', "marginRight=#{MARGIN_OUTSIDE}",
            '--prop', "marginTop=#{MARGIN_TOP_BOTTOM}",
            '--prop', "marginBottom=#{MARGIN_TOP_BOTTOM}"
end

officecli 'save', OUT
officecli 'close', OUT

puts "Wrote #{OUT} (#{OUT.size} bytes)  [#{KIND}]"
replaced.each { |font, n| puts "  font: #{font} -> #{FONT_SUBSTITUTIONS[font]} (#{n} occurrences)" }
puts "  body: #{BODY_FONT} #{body_size}"
puts(if HANDOUT
       "  header: #{banner} (center)   footer: PAGE (center)"
     else
       '  header: STYLEREF "Heading 1" (left)   footer: PAGE (center)'
     end)
puts(if HANDOUT
       "  margins: #{HANDOUT_MARGIN_SIDE} sides / #{HANDOUT_MARGIN_TOP_BOTTOM} top-bottom, not mirrored"
     else
       "  margins: #{MARGIN_INSIDE} inside / #{MARGIN_OUTSIDE} outside, mirrored"
     end)
