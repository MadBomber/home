#!/usr/bin/env ruby
# frozen_string_literal: true

# tags.rb -- build-time tag index generator.
#
#   Usage: ruby scripts/tags.rb <study-directory>
#     e.g. ruby scripts/tags.rb src/ntc1y
#
# Collects the `tags:` array from the YAML front matter of every markdown
# file under the given directory and its sub-directories, then (re)creates
# a "tags" sub-directory there containing:
#
#   tags/index.md    -- a word cloud of every tag, sized by page count
#   tags/<slug>.md   -- one page per tag, listing the pages that carry it
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

  # Reading order within a week: the overview opens it, the discussion closes it.
  # Pages without week/day front matter (essays) simply sort by URL.
  KIND_ORDER = { "overview" => 0, "day" => 1, "memory-verse" => 2, "discussion" => 3 }.freeze

  TaggedPage = Data.define(:url, :title, :sort_key, :tags)

  attr_reader :study_dir, :site_src, :slug, :tags_dir

  def initialize(study_dir)
    @study_dir = File.expand_path(study_dir)
    @site_src  = File.dirname(@study_dir)
    @slug      = File.basename(@study_dir)
    @tags_dir  = File.join(@study_dir, "tags")
  end

  def run
    map = tag_map(collect_pages)
    abort "No tags found in the front matter under #{study_dir}" if map.empty?

    FileUtils.rm_rf(tags_dir)
    FileUtils.mkdir_p(tags_dir)
    map.each do |tag, pages|
      File.write(File.join(tags_dir, "#{slug_for(tag)}.md"), tag_page(tag, pages))
    end
    File.write(File.join(tags_dir, "index.md"), index_page(map))
    puts "#{map.size} tag pages + index.md written to #{tags_dir}"
  end

  # -- scanning ------------------------------------------------------------

  def collect_pages
    Dir.glob(File.join(study_dir, "**", "*.md")).filter_map do |path|
      next if path.start_with?(tags_dir + File::SEPARATOR)

      fm = front_matter(path) or next
      tags = Array(fm["tags"]).map(&:to_s).reject(&:empty?)
      next if tags.empty?

      build_page(path, fm, tags)
    end.sort_by(&:sort_key)
  end

  def front_matter(path)
    yaml = File.read(path)[/\A---\s*\n(.*?)\n^---\s*$/m, 1]
    yaml ? YAML.safe_load(yaml, permitted_classes: [Date]) : nil
  rescue Psych::SyntaxError => e
    warn "skipping #{path}: #{e.message}"
    nil
  end

  def build_page(path, fm, tags)
    url   = url_for(path)
    week  = fm["week"]
    title = fm["title"].to_s.strip
    TaggedPage.new(
      url:,
      title: title.empty? ? File.basename(path, ".md") : title,
      sort_key: [week ? 0 : 1, week.to_i, KIND_ORDER.fetch(page_kind(path), 9), fm["day"].to_i, url],
      tags:
    )
  end

  def page_kind(path)
    base = File.basename(path, ".md")
    base.start_with?("day-") ? "day" : base
  end

  def url_for(path)
    rel = path.delete_prefix(site_src).sub(/\.md\z/, "").delete_suffix("/index")
    "#{rel}/"
  end

  def tag_map(pages)
    map = Hash.new { |h, k| h[k] = [] }
    pages.each { |page| page.tags.each { map[it] << page } }
    map
  end

  # -- output --------------------------------------------------------------

  def slug_for(tag)
    slug = tag.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
    slug == "index" ? "index-tag" : slug
  end

  def tag_href(tag)
    %(<%= relative_url "/#{slug}/tags/#{slug_for(tag)}/" %>)
  end

  # Log scale: with counts running 1..46, a linear scale would leave
  # everything but the top tag in the smallest bucket.
  def bucket_for(count, max)
    return 1 if max <= 1 || count <= 1

    (1 + (Math.log(count) / Math.log(max)) * (BUCKETS - 1)).round.clamp(1, BUCKETS)
  end

  def tag_page(tag, pages)
    items = pages.map { %(- [#{it.title}](<%= relative_url "#{it.url}" %>)) }
    lede = pages.size == 1 ? "One page carries" : "#{pages.size} pages carry"

    <<~MD
      ---
      layout: page
      title: "Tagged: #{tag}"
      study_slug: #{slug}
      template_engine: erb
      ---

      #{lede} the **#{tag}** tag:

      #{items.join("\n")}

      [All topics](<%= relative_url "/#{slug}/tags/" %>)
    MD
  end

  def index_page(map)
    counts = map.transform_values(&:size)
    max = counts.values.max
    cloud, rare = counts.sort.partition { |_, count| count >= CLOUD_MIN }

    cloud_links = cloud.map do |tag, count|
      %(  <a class="tag-size-#{bucket_for(count, max)}" href="#{tag_href(tag)}">) +
        %(#{tag} <span class="tag-count">#{count}</span></a>)
    end

    body = +<<~MD
      ---
      layout: page
      title: Topic Index
      study_slug: #{slug}
      template_engine: erb
      ---

      Every topic tag in this study. A larger tag appears on more pages;
      the number beside each tag is its page count.

      <div class="tag-cloud">
      #{cloud_links.join("\n")}
      </div>
    MD

    if rare.any?
      rare_links = rare.map { |tag, _| %(<a href="#{tag_href(tag)}">#{tag}</a>) }
      body << <<~MD

        <details class="tag-cloud-rare">
        <summary>#{rare.size} more topics, each on a single page</summary>
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
