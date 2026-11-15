#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds Bible Gateway links to the NBLA for the Spanish handout, the
# counterpart of esv_link.rb. Bible Gateway accepts English book names for
# every version, so the URL is built from the English reference and the
# version parameter selects the Spanish text; the link text is the Spanish
# short form. Several passages are joined with ";", as ESV.org does.
#
#   John 1:1-18                 -> ?search=John+1:1-18&version=NBLA
#   Colossians 4 + Philemon     -> ?search=Colossians+4;Philemon&version=NBLA
module NblaLink
  BASE    = 'https://www.biblegateway.com/passage/'
  VERSION = 'NBLA'

  PASSAGE_JOINER = /\s*\+\s*/
  ANNOTATION     = /\s*\([^)]*\)/

  def self.url_for(reference)
    citation = reference.to_s
                        .gsub(ANNOTATION, '')
                        .tr('–—', '--')
                        .gsub(PASSAGE_JOINER, ';')
                        .strip
                        .squeeze(' ')
                        .gsub(/\s*;\s*/, ';')
    return nil if citation.empty?

    "#{BASE}?search=#{citation.gsub(' ', '+')}&version=#{VERSION}"
  end
end
