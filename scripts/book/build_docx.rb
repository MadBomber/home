#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds build/<slug>/<slug>.docx (Microsoft Word) from draft.md via pandoc.
#
# Usage:
#   ruby scripts/book/build_draft.rb ntc1y   # regenerate draft.md from sources
#   ruby scripts/book/build_docx.rb  ntc1y   # then build the Word document
#
# Requires: pandoc (brew install pandoc). No LaTeX or PDF engine needed --
# pandoc writes .docx natively.
#
# What the pieces do:
#   --toc --toc-depth=2   inserts a real Word TOC field (TOC \o "1-2" \h \z \u).
#                         LibreOffice fills in the PAGE NUMBERS; build_pdf.rb
#                         does that as part of exporting.
#   --lua-filter          turns the "---" rules in draft.md into real page
#                         breaks (pandoc renders them as bordered paragraphs
#                         otherwise).
#   --reference-doc       supplies 10pt body text, heading styles, mirrored
#                         margins, the running section-title header (STYLEREF
#                         "Heading 1") and the page-number footer (PAGE field).
#
# Title-page artwork and byline come from studies/<slug>.yml. To change the body
# font or margins, edit build_reference.rb.

require 'open3'
require 'pathname'
require_relative 'study'

STUDY = Study.from_argv

TOC_DEPTH = 2

abort 'pandoc not found (brew install pandoc)' if `which pandoc`.empty?
abort "draft.md not found -- run build_draft.rb #{STUDY.slug} first" unless STUDY.draft.exist?
abort "reference.docx not found -- run build_reference.rb #{STUDY.slug}" unless STUDY.reference.exist?
abort "pagebreak.lua not found at #{STUDY.filter}" unless STUDY.filter.exist?

def officecli(*args)
  out, status = Open3.capture2e('officecli', *args.map(&:to_s))
  abort "officecli failed: #{args.join ' '}\n#{out}" unless status.success?
  out
end

# Drop any officecli resident still holding the previous build. pandoc is about
# to overwrite this file behind officecli's back, and a live resident would
# later flush its stale copy back over the new one -- which silently duplicated
# the title image and added a page.
Open3.capture2e('officecli', 'close', STUDY.docx.to_s) if STUDY.docx.exist?

cmd = [
  'pandoc', STUDY.draft.to_s,
  '-o', STUDY.docx.to_s,
  '--toc',
  "--toc-depth=#{TOC_DEPTH}",
  "--lua-filter=#{STUDY.filter}",
  "--reference-doc=#{STUDY.reference}"
]

output, status = Open3.capture2e(*cmd)
abort "pandoc failed:\n#{output}" unless status.success?

# Pandoc has no way to put an image inside its generated title block, and the
# body it writes begins after the table of contents. So the artwork and byline
# go in afterwards, between the title (/body/p[1]) and the TOC content control
# that follows it.
image = STUDY.title_image

if image.nil?
  warn "note: #{STUDY.slug} has no title_page.image configured -- text-only title page"
elsif !image.exist?
  warn "note: title image missing at #{image} -- text-only title page"
end

if image&.exist?
  officecli 'open', STUDY.docx
  officecli 'add', STUDY.docx, '/body', '--type', 'paragraph',
            '--after', '/body/p[1]', '--prop', 'align=center'

  picture = ['add', STUDY.docx, '/body/p[2]', '--type', 'picture',
             '--prop', "src=#{image}",
             '--prop', "width=#{STUDY.title_image_width}"]
  crop = STUDY.title_image_crop_bottom.to_i
  picture += ['--prop', "cropBottom=#{crop}"] if crop.positive?
  picture += ['--prop', "alt=#{STUDY.title_image_alt}"] unless STUDY.title_image_alt.empty?
  officecli(*picture)

  if STUDY.byline
    # At 5in the artwork reaches to within ~35pt of the bottom margin, so the
    # byline already sits at the foot of the page. More than ~20pt of lead here
    # pushes it onto page 2.
    officecli 'add', STUDY.docx, '/body', '--type', 'paragraph',
              '--after', '/body/p[2]',
              '--prop', 'align=right',
              '--prop', "text=#{STUDY.byline}",
              '--prop', 'spaceBefore=18pt'
  end

  officecli 'save', STUDY.docx
  officecli 'close', STUDY.docx
elsif STUDY.byline
  officecli 'open', STUDY.docx
  officecli 'add', STUDY.docx, '/body', '--type', 'paragraph',
            '--after', '/body/p[1]',
            '--prop', 'align=right',
            '--prop', "text=#{STUDY.byline}",
            '--prop', 'spaceBefore=24pt'
  officecli 'save', STUDY.docx
  officecli 'close', STUDY.docx
end

puts "Wrote #{STUDY.docx} (#{STUDY.docx.size} bytes)"
