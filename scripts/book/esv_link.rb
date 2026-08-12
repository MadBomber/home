#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds ESV.org links for the handout's weekly references.
#
# The link text is the abbreviated reference; the URL is built from the full,
# unabbreviated one, so nothing depends on ESV.org understanding the short forms.
#
# URL shape, each verified against the live site:
#   John 1:1-18                  -> /John+1:1-18/
#   1 Corinthians 15             -> /1+Corinthians+15/
#   Genesis 27:41–28:22          -> /Genesis+27:41-28:22/      (en dash -> hyphen)
#   Psalm 33:1-9; Psalm 104:1-9  -> /Psalm+33:1-9;Psalm+104:1-9/
#   Colossians 4 + Philemon      -> /Colossians+4;Philemon/    (plus -> semicolon)
module EsvLink
  BASE = 'https://www.esv.org'

  # A "+" between passages means "and also"; in a URL a plus is a space, so it
  # has to become the semicolon ESV.org uses to join passages.
  PASSAGE_JOINER = /\s*\+\s*/

  # Sources carry one "(review)" note. Parentheses are not part of a citation.
  ANNOTATION = /\s*\([^)]*\)/

  def self.url_for(reference)
    citation = reference.to_s
                        .gsub(ANNOTATION, '')
                        .tr('–—', '--')      # en and em dashes are ranges here
                        .gsub(PASSAGE_JOINER, ';')
                        .strip
                        .squeeze(' ')
                        # A space after the joiner would become "+", giving
                        # ";+Psalm"; the verified form has the books adjacent.
                        .gsub(/\s*;\s*/, ';')
    return nil if citation.empty?

    # Spaces become "+", and the ":" ";" "-" that structure a citation are left
    # as they are -- ESV.org expects them literally.
    "#{BASE}/#{citation.gsub(' ', '+')}/"
  end

  # A Markdown link whose text is `label` and whose target is built from
  # `reference`. Returns the bare label when no URL can be made.
  def self.markdown(label, reference)
    url = url_for(reference)
    url ? "[#{label}](#{url})" : label
  end
end
