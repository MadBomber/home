#!/usr/bin/env ruby
# frozen_string_literal: true

# tags.rb -- build-time tag index generator.
#
#   Usage: ruby scripts/tags.rb <study-directory>
#     e.g. ruby scripts/tags.rb src/ntc1y
#          ruby scripts/tags.rb src/blog
#
# Collects the `tags:` array from YAML front matter under the given
# directory and its sub-directories, then (re)creates a "tags"
# sub-directory there containing:
#
#   tags/index.md    -- a word cloud of every tag, sized by page count
#   tags/<slug>.md   -- one page per tag, listing the pages that carry it
#
# Languages. A file named like page.es.md is that page in Spanish (Bridgetown
# serves it under /es/). When the directory holds such files, the same two
# kinds of page are written again for that language, as tags/index.es.md and
# tags/<slug>.es.md, listing only that language's pages and linking only
# within it. A directory with no translated pages gets English pages only,
# exactly as before.
#
# Tags themselves are not translated in front matter: a Spanish essay carries
# the same `tags:` as its English original, so both languages share one slug
# per tag and Bridgetown pairs /blog/tags/grace/ with /es/blog/tags/grace/.
# What a tag is *called* in another language comes from
# <site-src>/_data/tag_names.yml (es: { grace: gracia, ... }); a tag missing
# there is shown as written. The words this script writes itself are in
# STRINGS below.
#
# In a Bible study directory -- one that contains day-N.md files -- only
# those daily pages are scanned, so a week's overview and discussion pages
# (which share the week's title) don't duplicate entries on the tag pages.
# A directory with no day-N.md files (the essays) scans every markdown file.
#
# Any existing tags/ sub-directory is ignored while scanning and is fully
# rebuilt, so a renamed or removed tag never leaves a stale page behind.
#
# Page URLs are computed relative to the PARENT of the given directory,
# which is assumed to be the site source root (e.g. "src"), and every link
# is emitted through relative_url so base_path is honored at build time.
# The word cloud's size classes (tag-size-1 .. tag-size-5) are styled in
# frontend/styles/index.css.

require "yaml"
require "fileutils"

class TagPagesGenerator
  BUCKETS   = 5 # word-cloud size classes, tag-size-1 (rare) .. tag-size-5 (common)
  CLOUD_MIN = 2 # tags on fewer pages than this drop out of the cloud into the A-Z list

  DAY_FILE = /\Aday-\d+(\.[a-z]{2})?\.md\z/

  DEFAULT_LOCALE = "en"

  # Every word this script writes into a page, per language. A language is
  # generated only if it is listed here; add a block to add a language.
  STRINGS = {
    "en" => {
      tag_title:   "Tagged: %{tag}",
      lede_one:    "One page carries the **%{tag}** tag:",
      lede_many:   "%{count} pages carry the **%{tag}** tag:",
      all_topics:  "All topics",
      index_title: "Topic Index",
      index_intro: "Every topic tag in this study. A larger tag appears on more pages;\n" \
                   "the number beside each tag is its page count.",
      rare:        "%{count} more topics, each on a single page",
    },
    "es" => {
      tag_title:   "Tema: %{tag}",
      lede_one:    "Una página lleva el tema **%{tag}**:",
      lede_many:   "%{count} páginas llevan el tema **%{tag}**:",
      all_topics:  "Todos los temas",
      index_title: "Índice de temas",
      index_intro: "Todos los temas de esta sección. Un tema más grande aparece en más páginas;\n" \
                   "el número junto a cada tema indica en cuántas.",
      rare:        "%{count} temas más, cada uno en una sola página",
    },
  }.freeze

  TaggedPage = Data.define(:url, :title, :sort_key, :tags, :locale)

  attr_reader :study_dir, :site_src, :slug, :tags_dir

  def initialize(study_dir)
    @study_dir = File.expand_path(study_dir)
    @site_src  = File.dirname(@study_dir)
    @slug      = File.basename(@study_dir)
    @tags_dir  = File.join(@study_dir, "tags")
  end

  def run
    by_locale = collect_pages.group_by(&:locale)
    maps      = by_locale.transform_values { tag_map(it) }.reject { |_, map| map.empty? }
    abort "No tags found in the front matter under #{study_dir}" if maps.empty?

    FileUtils.rm_rf(tags_dir)
    FileUtils.mkdir_p(tags_dir)
    maps.each { |locale, map| write_locale(locale, map) }
  end

  def write_locale(locale, map)
    map.each do |tag, pages|
      File.write(File.join(tags_dir, file_name(slug_for(tag), locale)), tag_page(tag, pages, locale))
    end
    File.write(File.join(tags_dir, file_name("index", locale)), index_page(map, locale))
    puts "#{locale}: #{map.size} tag pages + #{file_name("index", locale)} written to #{tags_dir}"
  end

  # -- scanning ------------------------------------------------------------

  def collect_pages
    source_files.filter_map do |path|
      fm = front_matter(path) or next
      tags = Array(fm["tags"]).map(&:to_s).reject(&:empty?)
      next if tags.empty?

      build_page(path, fm, tags)
    end.sort_by(&:sort_key)
  end

  # A study directory carries its tags on the daily pages alone; anywhere
  # else (the essays), every markdown file is fair game.
  def source_files
    all = Dir.glob(File.join(study_dir, "**", "*.md"))
             .reject { it.start_with?(tags_dir + File::SEPARATOR) }
    days = all.select { File.basename(it).match?(DAY_FILE) }
    days.any? ? days : all
  end

  def front_matter(path)
    yaml = File.read(path)[/\A---\s*\n(.*?)\n^---\s*$/m, 1]
    yaml ? YAML.safe_load(yaml, permitted_classes: [Date]) : nil
  rescue Psych::SyntaxError => e
    warn "skipping #{path}: #{e.message}"
    nil
  end

  def build_page(path, fm, tags)
    locale = locale_of(path)
    url    = url_for(path)
    week   = fm["week"]
    title  = fm["title"].to_s.strip
    TaggedPage.new(
      url:,
      title: title.empty? ? File.basename(path, ".md") : title,
      sort_key: [week ? 0 : 1, week.to_i, fm["day"].to_i, url],
      tags:,
      locale:
    )
  end

  # The language a source file is in: "es" for page.es.md, the default for
  # page.md. Only languages listed in STRINGS count, so a file like notes.v2.md
  # is an ordinary default-language page.
  def locale_of(path)
    suffix = File.basename(path)[/\.([a-z]{2})\.md\z/, 1]
    suffix && STRINGS.key?(suffix) ? suffix : DEFAULT_LOCALE
  end

  # "" for the default language, "/es" for Spanish -- how Bridgetown prefixes
  # the URLs of a non-default locale.
  def locale_prefix(locale)
    locale == DEFAULT_LOCALE ? "" : "/#{locale}"
  end

  def url_for(path)
    locale = locale_of(path)
    rel = path.delete_prefix(site_src).sub(/\.md\z/, "")
    rel = rel.delete_suffix(".#{locale}") unless locale == DEFAULT_LOCALE
    "#{locale_prefix(locale)}#{rel.delete_suffix("/index")}/"
  end

  def tag_map(pages)
    map = Hash.new { |h, k| h[k] = [] }
    pages.each { |page| page.tags.each { map[it] << page } }
    map
  end

  # -- names ---------------------------------------------------------------

  # { "es" => { "grace" => "gracia", ... } } from <site-src>/_data/tag_names.yml,
  # or {} when the site has no such file.
  def tag_names
    @tag_names ||= begin
      path = File.join(site_src, "_data", "tag_names.yml")
      File.exist?(path) ? (YAML.safe_load_file(path) || {}) : {}
    end
  end

  # What a tag is called in a language: its entry in tag_names.yml, or the
  # tag as written when there is none (always the case for the default).
  def label_for(tag, locale)
    tag_names.dig(locale, tag) || tag
  end

  # Alphabetical order that ignores case and accents, so "Éxodo" files under E.
  def sort_label(label)
    label.unicode_normalize(:nfd).gsub(/\p{Mn}/, "").downcase
  end

  def string(locale, key, **vars)
    format(STRINGS.fetch(locale).fetch(key), **vars)
  end

  # -- output --------------------------------------------------------------

  def slug_for(tag)
    slug = tag.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
    slug == "index" ? "index-tag" : slug
  end

  # index.md / grace.md for the default language, index.es.md / grace.es.md
  # for Spanish.
  def file_name(base, locale)
    locale == DEFAULT_LOCALE ? "#{base}.md" : "#{base}.#{locale}.md"
  end

  def tags_url(locale)
    "#{locale_prefix(locale)}/#{slug}/tags/"
  end

  def tag_href(tag, locale = DEFAULT_LOCALE)
    %(<%= relative_url "#{tags_url(locale)}#{slug_for(tag)}/" %>)
  end

  # Log scale: with counts running 1..46, a linear scale would leave
  # everything but the top tag in the smallest bucket.
  def bucket_for(count, max)
    return 1 if max <= 1 || count <= 1

    (1 + (Math.log(count) / Math.log(max)) * (BUCKETS - 1)).round.clamp(1, BUCKETS)
  end

  def tag_page(tag, pages, locale = DEFAULT_LOCALE)
    label = label_for(tag, locale)
    items = pages.map { %(- [#{it.title}](<%= relative_url "#{it.url}" %>)) }
    lede  = pages.size == 1 ? string(locale, :lede_one, tag: label) : string(locale, :lede_many, count: pages.size, tag: label)

    <<~MD
      ---
      layout: page
      title: "#{string(locale, :tag_title, tag: label)}"
      study_slug: #{slug}
      template_engine: erb
      ---

      #{lede}

      #{items.join("\n")}

      [#{string(locale, :all_topics)}](<%= relative_url "#{tags_url(locale)}" %>)
    MD
  end

  def index_page(map, locale = DEFAULT_LOCALE)
    max    = map.values.map(&:size).max
    counts = map.map { |tag, pages| [tag, label_for(tag, locale), pages.size] }
                .sort_by { |tag, label, _| [sort_label(label), tag] }
    cloud, rare = counts.partition { |_, _, count| count >= CLOUD_MIN }

    cloud_links = cloud.map do |tag, label, count|
      %(  <a class="tag-size-#{bucket_for(count, max)}" href="#{tag_href(tag, locale)}">) +
        %(#{label} <span class="tag-count">#{count}</span></a>)
    end

    body = +<<~MD
      ---
      layout: page
      title: #{string(locale, :index_title)}
      study_slug: #{slug}
      template_engine: erb
      ---

      #{string(locale, :index_intro)}

      <div class="tag-cloud">
      #{cloud_links.join("\n")}
      </div>
    MD

    if rare.any?
      rare_links = rare.map { |tag, label, _| %(<a href="#{tag_href(tag, locale)}">#{label}</a>) }
      body << <<~MD

        <details class="tag-cloud-rare">
        <summary>#{string(locale, :rare, count: rare.size)}</summary>
        <p>#{rare_links.join(" &middot;\n")}</p>
        </details>
      MD
    end

    body
  end
end

if __FILE__ == $PROGRAM_NAME
  dir = ARGV[0]
  abort "Usage: ruby scripts/tags.rb <study-directory>   e.g. ruby scripts/tags.rb src/ntc1y" unless dir
  abort "Not a directory: #{dir}" unless File.directory?(dir)
  TagPagesGenerator.new(dir).run
end
