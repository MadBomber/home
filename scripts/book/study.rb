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
#
# Language: BOOK_LANG=es builds the Spanish edition. English sources are the
# study itself under src/<slug>/; Spanish sources mirror that tree under
# translations/es/<slug>/ (same filenames), and the outputs carry a ".es"
# before their extension (ntc1y.es.pdf, ntc1y-handout.es.pdf). Headings the
# scripts write themselves come from STRINGS below; per-study Spanish title
# page and heading aliases come from the `es:` block of studies/<slug>.yml.

require 'yaml'
require 'pathname'

class Study
  SCRIPTS = Pathname.new(__dir__)
  REPO    = SCRIPTS.parent.parent

  LANGS = %w[en es].freeze

  # Words the build scripts write into the documents, by language.
  STRINGS = {
    'en' => {
      week: 'Week', weeks: 'Weeks', section: 'Section',
      memory_verse: 'Memory Verse', memory_verses: 'Memory Verses',
      week_short: 'Wk', memory_column: 'Memory Verse', reading_plan: 'Reading Plan', toc: 'Table of Contents',
      overview_heading: 'Overview', how_to_use_heading: 'How to Use This Study',
      readings_header: %w[Day Reading Title],
    },
    'es' => {
      week: 'Semana', weeks: 'Semanas', section: 'Sección',
      memory_verse: 'Versículo para memorizar', memory_verses: 'Versículos para memorizar',
      week_short: 'Sem.', memory_column: 'Versículo', reading_plan: 'Plan de lectura', toc: 'Índice',
      overview_heading: 'Panorama general', how_to_use_heading: 'Cómo usar este estudio',
      readings_header: %w[Día Lectura Título],
    },
  }.freeze

  attr_reader :slug, :config, :lang

  def self.available
    Dir.glob(SCRIPTS + 'studies/*.yml').map { |f| File.basename(f, '.yml') }.sort
  end

  def self.lang_from_env(env = ENV)
    lang = env.fetch('BOOK_LANG', 'en').to_s.strip.downcase
    lang = 'en' if lang.empty?
    abort "unknown BOOK_LANG #{lang.inspect} -- use one of: #{LANGS.join ', '}" unless LANGS.include?(lang)
    lang
  end

  # Reads the study slug from the command line. Deliberately required rather
  # than defaulted: with more than one study a silent default builds the wrong
  # book, and the outputs differ only by content.
  def self.from_argv(argv = ARGV)
    slug = argv[0].to_s.strip
    if slug.empty?
      abort "usage: [BOOK_LANG=es] ruby #{$PROGRAM_NAME} <study-slug>\n" \
            "available: #{available.join ', '}"
    end
    new(slug, lang: lang_from_env)
  end

  def initialize(slug, lang: 'en')
    @slug = slug
    @lang = lang
    path = SCRIPTS + "studies/#{slug}.yml"
    unless path.exist?
      abort "unknown study #{slug.inspect} (no #{path.relative_path_from REPO})\n" \
            "available: #{self.class.available.join ', '}"
    end

    @config = YAML.safe_load(path.read) || {}
  end

  def english? = lang == 'en'

  def strings = STRINGS.fetch(lang)
  def s(key)  = strings.fetch(key)

  # --- paths ---

  # The English study is the site's own content; a translation mirrors its
  # tree under translations/<lang>/<slug>/ with the same filenames.
  def english_source_dir = REPO + "src/#{slug}"
  def source_dir         = english? ? english_source_dir : REPO + "translations/#{lang}/#{slug}"

  def build_dir   = REPO + "build/#{slug}"
  def suffix      = english? ? '' : ".#{lang}"
  def draft       = build_dir + "draft#{suffix}.md"
  def reference   = build_dir + 'reference.docx'
  def docx        = build_dir + "#{slug}#{suffix}.docx"
  def pdf         = build_dir + "#{slug}#{suffix}.pdf"

  # The handout is a separate, much shorter document: an overview page followed
  # by a quarter-per-page grid of just the weekly references.
  def handout_draft     = build_dir + "handout#{suffix}.md"
  def handout_docx      = build_dir + "#{slug}-handout#{suffix}.docx"
  def handout_pdf       = build_dir + "#{slug}-handout#{suffix}.pdf"
  # The handout has its own style template: equal side margins rather than the
  # book's mirrored ones, and a centered header. That header names the study, so
  # the handout template is per language; the book's (a STYLEREF field) is not.
  def handout_reference = build_dir + "reference-handout#{suffix}.docx"

  # Tracked inputs sit beside the scripts, not in the generated build dir.
  def filter      = SCRIPTS + 'pagebreak.lua'

  # --- title page ---

  # Book title. Falls back to the study's index.md frontmatter title (in this
  # language's sources), so the book matches the site unless the book
  # deliberately differs (e.g. moving the "Old Testament" half of the site
  # title down into the subtitle).
  def title
    configured = title_page['title']
    return configured unless configured.nil? || configured.to_s.strip.empty?

    index = source_dir + 'index.md'
    return nil unless index.exist?

    fm = index.read[/\A---\n(.*?)\n---\n/m, 1].to_s
    (YAML.safe_load(fm) || {})['title']
  end

  def subtitle
    value = title_page['subtitle']
    return nil if value.nil? || value.to_s.strip.empty?

    value
  end

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
  def heading_aliases  = localized('heading_aliases') || {}

  def section_mode     = section_page.fetch('mode', 'overview_only')
  def weeks_table      = localized('weeks_table', section_page)
  def drop_headings    = localized('drop_headings', section_page) || []

  def prepare_build_dir
    build_dir.mkpath
    self
  end

  private

  def section_page = config.fetch('section_page', nil) || {}

  # Title page settings: the language block overrides the English, key by key,
  # so Spanish needs only a title, subtitle and byline and inherits the artwork.
  def title_page
    base = config.fetch('title_page', nil) || {}
    english? ? base : base.merge(lang_block.fetch('title_page', nil) || {})
  end

  # The `es:` block of the study config. Keys inside it mirror the top level
  # (heading_aliases, section_page.weeks_table, section_page.drop_headings,
  # title_page) and replace their English counterparts when building Spanish.
  def lang_block
    return {} if english?

    config.fetch(lang, nil) || {}
  end

  # A setting in this language: from the lang block when it has one, else the
  # English value. `scope` is the English hash to read the fallback from.
  def localized(key, scope = config)
    unless english?
      block = scope.equal?(config) ? lang_block : (lang_block.fetch('section_page', nil) || {})
      return block[key] if block.key?(key)
    end
    scope[key]
  end
end
