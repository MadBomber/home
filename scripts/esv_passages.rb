#!/usr/bin/env ruby
# frozen_string_literal: true

# esv_passages.rb -- fetch ESV passage text from api.esv.org and embed it in a
# study's day pages.
#
#   Usage: ruby scripts/esv_passages.rb <study-directory> [--dry-run]
#     e.g. ruby scripts/esv_passages.rb src/sotm
#
# Reads two front-matter keys from every day-N.md under the given directory:
#
#   reading:        the day's primary passage  -> embedded under "## Reading:"
#   other_witness:  the parallel account       -> embedded under "## The Other Witness"
#
# A blank or missing other_witness is skipped, which is how the days where Luke
# preserves nothing of the saying stay empty.
#
# Re-runnable. An existing <blockquote class="passage"> under either heading is
# replaced rather than duplicated, so refreshing the cache is just running this
# again. Crossway asks that cached text be cleared periodically so text fixes
# propagate; that is what a re-run does.
#
# LICENSE CEILING. Crossway's API terms permit storing at most 500 verses, or
# one-half of any book, whichever is less. This script counts what it embeds and
# refuses to write anything if the total would exceed VERSE_CAP. The count is of
# verses stored on disk, so it is the number the terms actually care about.
#
# Requires ESV_API_KEY in the environment. Free, non-commercial, from api.esv.org.

require "json"
require "net/http"
require "uri"

VERSE_CAP = 500

# 60 requests/minute is the documented ceiling; stay comfortably under it.
REQUEST_INTERVAL = 1.1

API = URI("https://api.esv.org/v3/passage/text/")

# Plain text, verse numbers on every verse (including the first, so the count is
# reliable), and nothing else -- no headings, footnotes, reference line, rules,
# or inline copyright. The page supplies its own citation and the site footer
# carries the notice.
PARAMS = {
  "include-passage-references"      => "false",
  "include-verse-numbers"           => "true",
  "include-first-verse-numbers"     => "true",
  "include-footnotes"               => "false",
  "include-headings"                => "false",
  "include-short-copyright"         => "false",
  "include-passage-horizontal-lines" => "false",
  "include-heading-horizontal-lines" => "false",
}.freeze

Passage = Data.define(:reference, :html, :verse_count)

class EsvClient
  class Error < StandardError; end

  def initialize(key)
    @key  = key
    @last = nil
  end

  # One reference in, one Passage out. Single references only -- callers split
  # multi-reference strings so each passage gets its own canonical citation.
  def fetch(reference)
    throttle
    body = get(reference)

    text = Array(body["passages"]).first
    raise Error, "no text returned for #{reference.inspect}" if text.nil? || text.strip.empty?

    canonical = body["canonical"].to_s
    canonical = reference if canonical.empty?

    Passage.new(reference: canonical, html: to_html(text), verse_count: text.scan(/\[\d+\]/).size)
  end

  private

  def throttle
    return @last = Time.now if @last.nil?

    elapsed = Time.now - @last
    sleep(REQUEST_INTERVAL - elapsed) if elapsed < REQUEST_INTERVAL
    @last = Time.now
  end

  def get(reference)
    uri       = API.dup
    uri.query = URI.encode_www_form(PARAMS.merge("q" => reference))

    request = Net::HTTP::Get.new(uri)
    request["Authorization"] = "Token #{@key}"

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }

    unless response.is_a?(Net::HTTPSuccess)
      raise Error, "api.esv.org returned #{response.code} for #{reference.inspect}"
    end

    JSON.parse(response.body)
  end

  # The API returns paragraphs separated by blank lines, with verse numbers in
  # square brackets. Numbers become <sup data-nospeak> so page-speak.js drops
  # them from its snapshot -- visible on the page, never read aloud.
  def to_html(text)
    text.strip.split(/\n{2,}/).map { |para|
      para = para.gsub(/\s*\n\s*/, " ").strip
      para = para.gsub(/\[(\d+)\]\s*/) { %(<sup data-nospeak>#{$1}</sup>) }
      "<p>#{para}</p>"
    }.join("\n")
  end
end

# --- page rewriting ---------------------------------------------------------

# Everything from the heading to the next "## " heading (or end of file) is the
# section. Within it, an existing passage blockquote or the scaffold's TODO
# placeholder is replaced; anything else the author has written is left alone
# and the blockquote is inserted above it.
def embed(content, heading, blocks)
  section = /^(\#\#[ ]#{Regexp.escape(heading)}[^\n]*\n)(.*?)(?=^\#\#[ ]|\z)/m

  content.sub(section) do
    head = $1
    body = $2

    body = body.sub(/\A\s*<blockquote class="passage">.*?<\/blockquote>\n*/m, "")
    body = body.sub(/\A\s*TODO — the passage itself\.[^\n]*\n(?:[^\n]+\n)*?\n/, "")
    body = body.sub(/\A\n+/, "")

    # The trailing blank line matters: kramdown needs one between an HTML block
    # and the "## " heading that follows, or the heading is swallowed into it.
    "#{head}\n#{blocks}\n\n#{body}"
  end
end

def blockquote(passage)
  <<~HTML.chomp
    <blockquote class="passage">
    #{passage.html}
    <cite data-speak-pause>#{passage.reference} (ESV)</cite>
    </blockquote>
  HTML
end

def front_matter_value(content, key)
  value = content[/^#{key}:[ ]*(.*)$/, 1].to_s.strip
  value.empty? ? nil : value
end

# --- main -------------------------------------------------------------------

study_dir = ARGV.find { |a| !a.start_with?("--") }
dry_run   = ARGV.include?("--dry-run")

abort "usage: ruby scripts/esv_passages.rb <study-directory> [--dry-run]" unless study_dir
abort "no such directory: #{study_dir}" unless Dir.exist?(study_dir)

key = ENV["ESV_API_KEY"]
abort "ESV_API_KEY is not set. Get a free non-commercial key at https://api.esv.org/" if key.to_s.empty?

client = EsvClient.new(key)
pages  = Dir.glob(File.join(study_dir, "**", "day-*.md")).sort
abort "no day pages found under #{study_dir}" if pages.empty?

total   = 0
pending = []

pages.each do |path|
  content = File.read(path)
  label   = path.delete_prefix("#{Dir.pwd}/")

  targets = {
    "Reading:"          => front_matter_value(content, "reading"),
    "The Other Witness" => front_matter_value(content, "other_witness"),
  }

  updated = content

  targets.each do |heading, references|
    next if references.nil?

    # "Reading:" appears in the page as "## Reading: Matthew 7:24-27".
    heading_match = heading == "Reading:" ? "Reading:" : heading

    passages = references.split(";").map(&:strip).reject(&:empty?).map { |ref|
      passage = client.fetch(ref)
      total  += passage.verse_count
      passage
    }

    blocks  = passages.map { |p| blockquote(p) }.join("\n\n")
    rewrote = embed(updated, heading_match, blocks)

    if rewrote == updated
      warn "  ! could not find '## #{heading}' in #{label}"
    else
      updated = rewrote
    end

    puts format("  %-22s %s (%d verses)", heading, passages.map(&:reference).join("; "),
                passages.sum(&:verse_count))
  end

  next if updated == content

  pending << [path, updated]
  puts label
end

puts
puts "#{total} verses across #{pending.size} pages (cap #{VERSE_CAP})"

if total > VERSE_CAP
  abort "REFUSING TO WRITE: #{total} verses exceeds Crossway's #{VERSE_CAP}-verse storage limit.\n" \
        "Trim some references and re-run."
end

if dry_run
  puts "dry run -- nothing written"
else
  pending.each { |path, body| File.write(path, body) }
  puts "wrote #{pending.size} pages"
end
