#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds build/<slug>/<slug>.pdf from the .docx using LibreOffice, headlessly.
#
# Usage:
#   ruby scripts/book/build_draft.rb ntc1y   # sources  -> draft.md
#   ruby scripts/book/build_docx.rb  ntc1y   # draft.md -> .docx
#   ruby scripts/book/build_pdf.rb   ntc1y   # .docx    -> .pdf
#
# Why a macro instead of `soffice --convert-to pdf`: a plain convert leaves the
# table of contents empty. The TOC is a field, and its page numbers only exist
# once something paginates the document and updates the index. The Basic macro
# BookExport.xba (beside this script) does that before exporting.
#
# LibreOffice only runs Basic macros from its user profile, so this script
# installs BookExport.xba there on first use and refreshes it when it changes.
# To remove it, delete this from the profile:
#   ~/Library/Application Support/LibreOffice/4/user/basic/Standard/BookExport.xba
# and its <library:element> line in script.xlb beside it.
#
# No Microsoft Word required.

require 'fileutils'
require 'open3'
require 'pathname'
require_relative 'study'

STUDY = Study.from_argv

# Optional second argument selects the handout instead of the book.
KIND = (ARGV[1] || 'book').downcase
abort "unknown document #{KIND.inspect} -- use 'book' or 'handout'" unless %w[book handout].include?(KIND)

SOURCE_DOCX = KIND == 'handout' ? STUDY.handout_docx : STUDY.docx
TARGET_PDF  = KIND == 'handout' ? STUDY.handout_pdf : STUDY.pdf

MACRO_NAME   = 'BookExport'
MACRO        = "Standard.#{MACRO_NAME}.UpdateAndExportPdf"
MACRO_SOURCE = Study::SCRIPTS + "#{MACRO_NAME}.xba"
MACRO_DIR    = Pathname.new(Dir.home) +
               'Library/Application Support/LibreOffice/4/user/basic/Standard'
MACRO_FILE   = MACRO_DIR + "#{MACRO_NAME}.xba"
MACRO_INDEX  = MACRO_DIR + 'script.xlb'

# Earlier name for the same macro, from when the pipeline was ntc1y-only.
STALE_MACROS = %w[Ntc1yBook].freeze

def register_module(name)
  return unless MACRO_INDEX.exist?

  index = MACRO_INDEX.read
  return if index.include?(%(library:name="#{name}"))

  MACRO_INDEX.write index.sub(
    %r{(\s*)</library:library>},
    %(\\1 <library:element library:name="#{name}"/>\\1</library:library>)
  )
end

def unregister_module(name)
  return unless MACRO_INDEX.exist?

  index = MACRO_INDEX.read
  return unless index.include?(%(library:name="#{name}"))

  MACRO_INDEX.write index.sub(%r{\s*<library:element library:name="#{name}"/>}, '')
end

# Drop modules left behind by an older version of this script, so the profile
# does not accumulate duplicates of the same macro under different names.
def remove_stale_macros
  STALE_MACROS.each do |name|
    file = MACRO_DIR + "#{name}.xba"
    next unless file.exist?

    file.delete
    unregister_module name
    puts "Removed stale macro #{name} from the LibreOffice profile"
  end
end

# LibreOffice will only run a Basic macro that lives in its user profile, so the
# repo copy is installed there on first use (and refreshed if it has changed).
# It is added as its own module, leaving any existing Module1 untouched.
def install_macro
  return :missing_profile unless MACRO_DIR.directory?
  return :no_source unless MACRO_SOURCE.exist?

  remove_stale_macros

  if MACRO_FILE.exist? && MACRO_FILE.read == MACRO_SOURCE.read
    register_module MACRO_NAME
    return :current
  end

  FileUtils.cp(MACRO_SOURCE, MACRO_FILE)
  register_module MACRO_NAME
  :installed
end

def soffice_path
  %w[soffice /Applications/LibreOffice.app/Contents/MacOS/soffice].find do |candidate|
    candidate.start_with?('/') ? File.executable?(candidate) : !`which #{candidate}`.empty?
  end
end

bin = soffice_path
abort 'LibreOffice not found (expected soffice on PATH or in /Applications)' unless bin
unless SOURCE_DOCX.exist?
  builder = KIND == "handout" ? "build_handout.rb #{STUDY.slug}" : "build_docx.rb #{STUDY.slug}"
  abort "#{SOURCE_DOCX.basename} not found -- run #{builder} first"
end

# LibreOffice refuses to run a headless macro while a desktop instance holds
# the profile lock, and silently produces nothing.
abort 'LibreOffice is already running -- quit it first, then re-run' \
  unless `pgrep -f '[s]office'`.strip.empty?

case install_macro
when :installed then puts "Installed macro #{MACRO_NAME} into the LibreOffice profile"
when :missing_profile
  abort "LibreOffice profile not found at #{MACRO_DIR}\n" \
        'Launch LibreOffice once to create it, then re-run.'
when :no_source then abort "macro source missing: #{MACRO_SOURCE}"
end

TARGET_PDF.delete if TARGET_PDF.exist?

cmd = [bin, '--headless', '--norestore',
       "macro:///#{MACRO}(#{SOURCE_DOCX},#{TARGET_PDF})"]

output, status = Open3.capture2e(*cmd)
abort "LibreOffice failed:\n#{output}" unless status.success?
abort "LibreOffice reported success but wrote no PDF:\n#{output}" unless TARGET_PDF.exist?

puts "Wrote #{TARGET_PDF} (#{TARGET_PDF.size} bytes)"
