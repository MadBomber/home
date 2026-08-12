#!/usr/bin/env ruby
# frozen_string_literal: true

# Shared configuration for the book build scripts.
#
# Each build script starts with:
#   require_relative 'study'
#   study = Study.from_argv
#
# which resolves the slug from ARGV[0], loads studies/<slug>.yml, and exposes
# the paths every stage needs.

require 'yaml'
require 'pathname'

class Study
  SCRIPTS = Pathname.new(__dir__)
  REPO    = SCRIPTS.parent.parent

  attr_reader :slug, :config

  def self.available
    Dir.glob(SCRIPTS + 'studies/*.yml').map { |f| File.basename(f, '.yml') }.sort
  end

  # Reads the study slug from the command line. Deliberately required rather
  # than defaulted: with more than one study a silent default builds the wrong
  # book, and the outputs differ only by content.
  def self.from_argv(argv = ARGV)
    slug = argv[0].to_s.strip
    if slug.empty?
      abort "usage: ruby #{$PROGRAM_NAME} <study-slug>\n" \
            "available: #{available.join ', '}"
    end
    new(slug)
  end

  def initialize(slug)
    @slug = slug
    path = SCRIPTS + "studies/#{slug}.yml"
    unless path.exist?
      abort "unknown study #{slug.inspect} (no #{path.relative_path_from REPO})\n" \
            "available: #{self.class.available.join ', '}"
    end

    @config = YAML.safe_load(path.read) || {}
  end

  # --- paths ---

  def source_dir  = REPO + "src/#{slug}"
  def build_dir   = REPO + "build/#{slug}"
  def draft       = build_dir + 'draft.md'
  def reference   = build_dir + 'reference.docx'
  def docx        = build_dir + "#{slug}.docx"
  def pdf         = build_dir + "#{slug}.pdf"

  # Tracked inputs sit beside the scripts, not in the generated build dir.
  def filter      = SCRIPTS + 'pagebreak.lua'

  # --- title page ---

  def title_image
    name = title_page['image']
    return nil if name.nil? || name.to_s.strip.empty?

    SCRIPTS + name
  end

  def title_image_width       = title_page.fetch('image_width', '5in')
  def title_image_crop_bottom = title_page.fetch('image_crop_bottom', 0)
  def title_image_alt         = title_page['image_alt'].to_s.strip
  def byline                  = title_page['byline']

  # --- settings ---

  def sections         = config.fetch('sections')
  def weeks            = config.fetch('weeks')
  def week_page_breaks = config.fetch('week_page_breaks', false)
  def fix_em_dashes    = config.fetch('fix_em_dashes', false)
  def fix_phase_labels = config.fetch('fix_phase_labels', false)
  def heading_aliases  = config.fetch('heading_aliases', nil) || {}

  def section_mode     = section_page.fetch('mode', 'overview_only')
  def weeks_table      = section_page['weeks_table']
  def drop_headings    = section_page.fetch('drop_headings', nil) || []

  def prepare_build_dir
    build_dir.mkpath
    self
  end

  private

  def section_page = config.fetch('section_page', nil) || {}
  def title_page   = config.fetch('title_page', nil) || {}
end
