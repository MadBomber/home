#!/usr/bin/env ruby
# frozen_string_literal: true

# Standard short forms for the books of the Bible, used to fit the weekly
# references into the handout's narrow calendar cells. The books themselves keep
# full names, where there is room for them.
#
# Covers all 57 book names that appear in the studies' readings. Abbreviating
# takes the longest ot1y reference from 37 characters to 27, which is what makes
# a three-column grid possible at 10pt.
module BibleAbbrev
  ABBREVIATIONS = {
    # Pentateuch
    'Genesis' => 'Gen', 'Exodus' => 'Exod', 'Leviticus' => 'Lev',
    'Numbers' => 'Num', 'Deuteronomy' => 'Deut',
    # History
    'Joshua' => 'Josh', 'Judges' => 'Judg', 'Ruth' => 'Ruth',
    '1 Samuel' => '1 Sam', '2 Samuel' => '2 Sam',
    '1 Kings' => '1 Kgs', '2 Kings' => '2 Kgs',
    '1 Chronicles' => '1 Chr', '2 Chronicles' => '2 Chr',
    'Ezra' => 'Ezra', 'Nehemiah' => 'Neh', 'Esther' => 'Esth',
    # Wisdom
    'Job' => 'Job', 'Psalms' => 'Ps', 'Psalm' => 'Ps', 'Proverbs' => 'Prov',
    'Ecclesiastes' => 'Eccl', 'Song of Solomon' => 'Song',
    # Major prophets
    'Isaiah' => 'Isa', 'Jeremiah' => 'Jer', 'Lamentations' => 'Lam',
    'Ezekiel' => 'Ezek', 'Daniel' => 'Dan',
    # Minor prophets
    'Hosea' => 'Hos', 'Joel' => 'Joel', 'Amos' => 'Amos', 'Obadiah' => 'Obad',
    'Jonah' => 'Jonah', 'Micah' => 'Mic', 'Nahum' => 'Nah',
    'Habakkuk' => 'Hab', 'Zephaniah' => 'Zeph', 'Haggai' => 'Hag',
    'Zechariah' => 'Zech', 'Malachi' => 'Mal',
    # Gospels and Acts
    'Matthew' => 'Matt', 'Mark' => 'Mark', 'Luke' => 'Luke', 'John' => 'John',
    'Acts' => 'Acts',
    # Paul
    'Romans' => 'Rom', '1 Corinthians' => '1 Cor', '2 Corinthians' => '2 Cor',
    'Galatians' => 'Gal', 'Ephesians' => 'Eph', 'Philippians' => 'Phil',
    'Colossians' => 'Col', '1 Thessalonians' => '1 Thess',
    '2 Thessalonians' => '2 Thess', '1 Timothy' => '1 Tim',
    '2 Timothy' => '2 Tim', 'Titus' => 'Titus', 'Philemon' => 'Phlm',
    # General epistles and Revelation
    'Hebrews' => 'Heb', 'James' => 'Jas', '1 Peter' => '1 Pet',
    '2 Peter' => '2 Pet', '1 John' => '1 John', '2 John' => '2 John',
    '3 John' => '3 John', 'Jude' => 'Jude', 'Revelation' => 'Rev'
  }.freeze

  # Longest names first, so "1 John" is replaced before "John" can match inside
  # it, and "Psalms" before "Psalm".
  ORDER = ABBREVIATIONS.keys.sort_by { |name| -name.length }.freeze

  # Replaces full book names with their short forms, leaving chapter and verse
  # numbers untouched. The lookbehind and lookahead keep it from firing inside a
  # longer word or a name already shortened.
  def self.apply(text)
    ORDER.reduce(text.to_s) do |acc, full|
      acc.gsub(/(?<![A-Za-z0-9])#{Regexp.escape full}(?![A-Za-z])/, ABBREVIATIONS[full])
    end
  end
end
