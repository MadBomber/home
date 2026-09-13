#!/usr/bin/env ruby
# frozen_string_literal: true

# link_greek_words.rb
#
# Finds italicized Greek transliterations (e.g. *phronimos*) in day-N.md
# files under a directory tree and replaces each with a link to the
# BibleHub Greek lexicon search that opens in a new browser tab
# (matching the site's audio links):
#
#   *phronimos*  =>  <a href="https://biblehub.com/searchgreek.php?q=phronimos"
#                       target="_blank" rel="noopener"><em>phronimos</em></a>
#
# A word is linked only after live verification: the search page must
# return at least one Strong's entry whose transliteration matches the
# word (diacritics stripped, y/u folded — BibleHub writes "euthus" where
# study text writes "euthys"). This rejects italicized English emphasis
# ("*Parallel Passages*") and Hebrew terms ("*Mashiach*"), which BibleHub
# would otherwise "find" by matching its English gloss text.
#
# Already-linked words are skipped, so the program is idempotent.
#
# --unlink reverses the process: every BibleHub lexicon link is replaced
# by the plain italicized word again. No network access is needed and no
# other links are touched.
#
# Usage:
#   ruby scripts/link_greek_words.rb TARGET [--unlink] [--dry-run] [--quiet]
#
# TARGET is a directory (all day-N.md files under it, recursively) or a
# single markdown file.

require 'net/http'
require 'uri'

class GreekWordLinker
  SEARCH_BASE   = 'https://biblehub.com/searchgreek.php?q='
  USER_AGENT    = 'Mozilla/5.0 (lamplight.guide link_greek_words)'
  MAX_REDIRECTS = 5
  REQUEST_PAUSE = 0.5 # seconds between HTTP requests, politeness

  # Italic span whose content could be a transliterated Greek word or
  # short phrase: 1-4 tokens of letters (diacritics allowed), each token
  # at least two characters. Excludes anything with digits, colons, or
  # markdown punctuation (so *Psalm 2:7* and headings never qualify).
  CANDIDATE = /\A\p{L}{2,}(?: \p{L}{2,}){0,3}\z/

  # Anchor text of a search hit, e.g.
  #   Strong's Greek: 5429. φρόνιμος (phronimos) -- wise
  # Group 1 is the transliteration.
  TRANSLITERATION = /Strong's Greek: \d+\. [^()]+ \(([^)]+)\)/

  # A link this program produces. The named group is the phrase.
  GREEK_LINK = %r{<a href="https://biblehub\.com/searchgreek\.php\?q=[^"]*" target="_blank" rel="noopener"><em>(?<word>[^<\n]+)</em></a>}

  attr_reader :linked, :skipped, :failed, :unlinked

  def initialize(dry_run: false, quiet: false, unlink: false, fetcher: nil)
    @dry_run  = dry_run
    @quiet    = quiet
    @unlink   = unlink
    @fetcher  = fetcher # injectable for tests; defaults to #fetch
    @cache    = {}      # phrase => verified URL / false / :error
    @linked   = Hash.new(0)
    @unlinked = Hash.new(0)
    @skipped  = Set.new
    @failed   = Set.new
  end

  # -- pure helpers -----------------------------------------------------

  def strip_diacritics(str) = str.unicode_normalize(:nfd).gsub(/\p{Mn}/, '')

  # Comparison form: no diacritics, case-folded, upsilon spelling unified.
  def normalize(str) = strip_diacritics(str).downcase.tr('y', 'u')

  def candidate?(phrase) = CANDIDATE.match?(phrase)

  # BibleHub's search matches literal page text, and its transliterations
  # carry acute accents where study text carries macrons ("balló" for
  # *ballō*). Try the plain ASCII form first, then the acute-accent form.
  def query_variants(phrase)
    [strip_diacritics(phrase), phrase.tr('ōēŌĒ', 'óéÓÉ')].uniq
  end

  def search_url(query) = SEARCH_BASE + URI.encode_www_form_component(query)

  # HTML anchor rather than markdown so the link opens in a new tab,
  # like the site's audio links.
  def html_link(phrase, url)
    %(<a href="#{url}" target="_blank" rel="noopener"><em>#{phrase}</em></a>)
  end

  # Minimal HTML entity decoding for BibleHub anchor text.
  def decode_entities(html)
    html.gsub(/&#(\d+);/) { Regexp.last_match(1).to_i.chr(Encoding::UTF_8) }
        .gsub('&amp;', '&').gsub('&quot;', '"').gsub('&apos;', "'")
  end

  # BibleHub bolds the transliteration on exact-match entries
  # ("λέπρα (<b>lepra</b>)"), so tags must go before the scan.
  def strip_tags(html) = html.gsub(/<[^>]+>/, '')

  def transliterations(html)
    decode_entities(strip_tags(html)).scan(TRANSLITERATION).flatten.uniq
  end

  # Classic dynamic-programming edit distance; small inputs only.
  def levenshtein(a, b)
    row = (0..b.length).to_a
    a.each_char.with_index(1) do |ca, i|
      prev_diag = row[0]
      row[0] = i
      b.each_char.with_index(1) do |cb, j|
        prev_diag, row[j] = row[j], [row[j] + 1, row[j - 1] + 1, prev_diag + (ca == cb ? 0 : 1)].min
      end
    end
    row[b.length]
  end

  def common_prefix_length(a, b)
    a.each_char.zip(b.each_char).take_while { _1 == _2 }.length
  end

  # A token matches a lexicon transliteration exactly, or — for inflected
  # forms like *telōnai* against telōnēs — closely enough: at least five
  # letters, a shared four-letter stem, and no more than two edits. The
  # guards keep italicized English words from slipping through.
  def token_match?(token, translits)
    return true if translits.include?(token)
    return false if token.length < 5

    translits.any? do
      common_prefix_length(token, it) >= 4 && levenshtein(token, it) <= 2
    end
  end

  # Every token of the phrase must match a transliteration on its own
  # results page.
  def confirmed_greek?(phrase, html)
    found = transliterations(html).map { normalize(it) }
    phrase.split.all? { token_match?(normalize(it), found) }
  end

  # Unique italic spans in the text worth checking, in order of
  # appearance. Already-linked words sit inside <em> tags with no
  # asterisks, so they never reappear here.
  def italic_candidates(text)
    text.scan(/\*([^*\n]+)\*/)
        .flatten
        .uniq
        .select { candidate?(it) }
  end

  # Replace every occurrence of *phrase* with its link. Linked words no
  # longer contain asterisks, so this cannot double-link on a re-run.
  def link_phrase(text, phrase, url)
    text.gsub(/\*#{Regexp.escape(phrase)}\*/, html_link(phrase, url))
  end

  # Strip every BibleHub lexicon link, restoring the plain italicized
  # word; all other links are left alone. Returns [new_text, phrases].
  def unlink_phrases(text)
    removed  = []
    new_text = text.gsub(GREEK_LINK) do
      removed << Regexp.last_match(:word)
      "*#{Regexp.last_match(:word)}*"
    end
    [new_text, removed]
  end

  # Front matter must never be touched; returns [front_matter, body].
  def split_front_matter(text)
    if text =~ /\A(---\n.*?\n---\n)(.*)\z/m
      [Regexp.last_match(1), Regexp.last_match(2)]
    else
      ['', text]
    end
  end

  # -- verification (network) -------------------------------------------

  # Returns the verified search URL for the phrase, false when no query
  # variant produces a matching lexicon entry, or :error when every
  # variant failed to fetch.
  def verify(phrase)
    @cache.fetch(phrase) do
      fetched_any = false
      url = query_variants(phrase).find do |query|
        html = (@fetcher || method(:fetch)).call(search_url(query))
        sleep REQUEST_PAUSE unless @fetcher
        fetched_any ||= !html.nil?
        html && confirmed_greek?(phrase, html)
      end&.then { search_url(it) }
      @cache[phrase] = url || (fetched_any ? false : :error)
    end
  end

  def fetch(url, redirects_left = MAX_REDIRECTS)
    return nil if redirects_left.zero?

    uri = URI(url)
    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      http.get(uri.request_uri, 'User-Agent' => USER_AGENT)
    end

    case response
    when Net::HTTPSuccess     then response.body.force_encoding(Encoding::UTF_8)
    when Net::HTTPRedirection then fetch(response['location'], redirects_left - 1)
    end
  rescue StandardError => e
    warn "  network error for #{url}: #{e.message}"
    nil
  end

  # -- file processing ---------------------------------------------------

  # A directory yields its day-N.md files, recursively; a file named
  # directly is taken as-is.
  def target_files(target)
    return [target] if File.file?(target)

    Dir.glob(File.join(target, '**', 'day-*.md'))
       .grep(/day-\d+\.md\z/)
       .sort
  end

  def process_file(path)
    @unlink ? unlink_file(path) : link_file(path)
  end

  def unlink_file(path)
    body, removed = unlink_phrases(File.read(path))

    removed.each do |phrase|
      @unlinked[phrase] += 1
      report "  unlinked #{phrase}"
    end

    File.write(path, body) if removed.any? && !@dry_run
    removed.any?
  end

  def link_file(path)
    original             = File.read(path)
    front_matter, body   = split_front_matter(original)
    changed              = false

    italic_candidates(body).each do |phrase|
      case verify(phrase)
      in String => url
        body    = link_phrase(body, phrase, url)
        changed = true
        @linked[phrase] += 1
        report "  linked  #{phrase}"
      in :error
        @failed << phrase
        report "  FAILED  #{phrase} (could not verify, left unchanged)"
      else
        @skipped << phrase
        report "  skipped #{phrase} (no matching Greek lexicon entry)"
      end
    end

    File.write(path, front_matter + body) if changed && !@dry_run
    changed
  end

  def run(target)
    files = target_files(target)
    abort "No day-N.md files found under #{target}" if files.empty?

    files.each do |path|
      report path
      process_file(path)
    end

    summary(files.size)
  end

  private

  def report(message)
    puts message unless @quiet
  end

  def summary(file_count)
    if @unlink
      puts <<~SUMMARY

        #{'DRY RUN — no files were modified' if @dry_run}
        Files examined: #{file_count}
        Links removed:  #{@unlinked.values.sum} (#{@unlinked.keys.sort.join(', ')})
      SUMMARY
    else
      puts <<~SUMMARY

        #{'DRY RUN — no files were modified' if @dry_run}
        Files examined: #{file_count}
        Words linked:   #{@linked.size} unique (#{@linked.values.sum} word/file placements)
        Words skipped:  #{@skipped.size} (#{@skipped.sort.join(', ')})
        Verify errors:  #{@failed.size} (#{@failed.sort.join(', ')})
      SUMMARY
    end
  end
end

if __FILE__ == $PROGRAM_NAME
  dry_run = ARGV.delete('--dry-run')
  quiet   = ARGV.delete('--quiet')
  unlink  = ARGV.delete('--unlink')
  target  = ARGV.first

  unless target && (File.directory?(target) || File.file?(target))
    puts <<~USAGE
      Usage: ruby #{$PROGRAM_NAME} TARGET [--unlink] [--dry-run] [--quiet]

      TARGET is a directory (all day-N.md files under it, recursively)
      or a single markdown file.

      Default: links italicized Greek words to their BibleHub Greek
      lexicon search page. Each word is verified against the live
      lexicon first; unverifiable words are left untouched.

      --unlink removes those links again, restoring plain italics.
      No other links are affected.
    USAGE
    exit 1
  end

  GreekWordLinker.new(dry_run: !!dry_run, quiet: !!quiet, unlink: !!unlink).run(target)
end
