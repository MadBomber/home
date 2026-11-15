#!/usr/bin/env ruby
# frozen_string_literal: true

# Spanish names and short forms for the books of the Bible, as the NBLA prints
# them, for the Spanish editions of the handout and book. Each English name the
# studies use maps to its Spanish name; the abbreviations are the common
# Spanish ones and are kept short enough for the handout's calendar cells.
#
# Usage:
#   BibleNamesEs.translate("1 Corinthians 15:55-57")  # => "1 Corintios 15:55-57"
#   BibleNamesEs.abbreviate("1 Corintios 15:55-57")   # => "1 Co 15:55-57"
#   BibleNamesEs.translate("Psalm 33:1-9; Psalm 104:1-9")
#     # => "Salmos 33:1-9; Salmos 104:1-9"
module BibleNamesEs
  NAMES = {
    # Pentateuch
    'Genesis' => 'Génesis', 'Exodus' => 'Éxodo', 'Leviticus' => 'Levítico',
    'Numbers' => 'Números', 'Deuteronomy' => 'Deuteronomio',
    # History
    'Joshua' => 'Josué', 'Judges' => 'Jueces', 'Ruth' => 'Rut',
    '1 Samuel' => '1 Samuel', '2 Samuel' => '2 Samuel',
    '1 Kings' => '1 Reyes', '2 Kings' => '2 Reyes',
    '1 Chronicles' => '1 Crónicas', '2 Chronicles' => '2 Crónicas',
    'Ezra' => 'Esdras', 'Nehemiah' => 'Nehemías', 'Esther' => 'Ester',
    # Wisdom
    'Job' => 'Job', 'Psalms' => 'Salmos', 'Psalm' => 'Salmos', 'Proverbs' => 'Proverbios',
    'Ecclesiastes' => 'Eclesiastés', 'Song of Solomon' => 'Cantares',
    # Major prophets
    'Isaiah' => 'Isaías', 'Jeremiah' => 'Jeremías', 'Lamentations' => 'Lamentaciones',
    'Ezekiel' => 'Ezequiel', 'Daniel' => 'Daniel',
    # Minor prophets
    'Hosea' => 'Oseas', 'Joel' => 'Joel', 'Amos' => 'Amós', 'Obadiah' => 'Abdías',
    'Jonah' => 'Jonás', 'Micah' => 'Miqueas', 'Nahum' => 'Nahúm',
    'Habakkuk' => 'Habacuc', 'Zephaniah' => 'Sofonías', 'Haggai' => 'Hageo',
    'Zechariah' => 'Zacarías', 'Malachi' => 'Malaquías',
    # Gospels and Acts
    'Matthew' => 'Mateo', 'Mark' => 'Marcos', 'Luke' => 'Lucas', 'John' => 'Juan',
    'Acts' => 'Hechos',
    # Paul
    'Romans' => 'Romanos', '1 Corinthians' => '1 Corintios', '2 Corinthians' => '2 Corintios',
    'Galatians' => 'Gálatas', 'Ephesians' => 'Efesios', 'Philippians' => 'Filipenses',
    'Colossians' => 'Colosenses', '1 Thessalonians' => '1 Tesalonicenses',
    '2 Thessalonians' => '2 Tesalonicenses', '1 Timothy' => '1 Timoteo',
    '2 Timothy' => '2 Timoteo', 'Titus' => 'Tito', 'Philemon' => 'Filemón',
    # General epistles and Revelation
    'Hebrews' => 'Hebreos', 'James' => 'Santiago', '1 Peter' => '1 Pedro',
    '2 Peter' => '2 Pedro', '1 John' => '1 Juan', '2 John' => '2 Juan',
    '3 John' => '3 Juan', 'Jude' => 'Judas', 'Revelation' => 'Apocalipsis'
  }.freeze

  ABBREVIATIONS = {
    'Génesis' => 'Gn', 'Éxodo' => 'Éx', 'Levítico' => 'Lv', 'Números' => 'Nm',
    'Deuteronomio' => 'Dt', 'Josué' => 'Jos', 'Jueces' => 'Jue', 'Rut' => 'Rt',
    '1 Samuel' => '1 S', '2 Samuel' => '2 S', '1 Reyes' => '1 R', '2 Reyes' => '2 R',
    '1 Crónicas' => '1 Cr', '2 Crónicas' => '2 Cr', 'Esdras' => 'Esd',
    'Nehemías' => 'Neh', 'Ester' => 'Est', 'Job' => 'Job', 'Salmos' => 'Sal',
    'Proverbios' => 'Pr', 'Eclesiastés' => 'Ec', 'Cantares' => 'Cnt',
    'Isaías' => 'Is', 'Jeremías' => 'Jer', 'Lamentaciones' => 'Lm',
    'Ezequiel' => 'Ez', 'Daniel' => 'Dn', 'Oseas' => 'Os', 'Joel' => 'Jl',
    'Amós' => 'Am', 'Abdías' => 'Abd', 'Jonás' => 'Jon', 'Miqueas' => 'Miq',
    'Nahúm' => 'Nah', 'Habacuc' => 'Hab', 'Sofonías' => 'Sof', 'Hageo' => 'Hag',
    'Zacarías' => 'Zac', 'Malaquías' => 'Mal', 'Mateo' => 'Mt', 'Marcos' => 'Mr',
    'Lucas' => 'Lc', 'Juan' => 'Jn', 'Hechos' => 'Hch', 'Romanos' => 'Ro',
    '1 Corintios' => '1 Co', '2 Corintios' => '2 Co', 'Gálatas' => 'Gá',
    'Efesios' => 'Ef', 'Filipenses' => 'Fil', 'Colosenses' => 'Col',
    '1 Tesalonicenses' => '1 Ts', '2 Tesalonicenses' => '2 Ts',
    '1 Timoteo' => '1 Ti', '2 Timoteo' => '2 Ti', 'Tito' => 'Tit',
    'Filemón' => 'Flm', 'Hebreos' => 'He', 'Santiago' => 'Stg', '1 Pedro' => '1 P',
    '2 Pedro' => '2 P', '1 Juan' => '1 Jn', '2 Juan' => '2 Jn', '3 Juan' => '3 Jn',
    'Judas' => 'Jud', 'Apocalipsis' => 'Ap'
  }.freeze

  # Longest names first, so "1 John" is replaced before "John" can match inside
  # it, and "Psalms" before "Psalm".
  NAME_ORDER   = NAMES.keys.sort_by { |name| -name.length }.freeze
  ABBREV_ORDER = ABBREVIATIONS.keys.sort_by { |name| -name.length }.freeze

  # Replaces each English book name in a reference with its Spanish name,
  # leaving chapter and verse numbers untouched.
  def self.translate(text)
    replace(text, NAME_ORDER, NAMES)
  end

  # Replaces each Spanish book name with its short form.
  def self.abbreviate(text)
    replace(text, ABBREV_ORDER, ABBREVIATIONS)
  end

  # The lookbehind and lookahead keep a name from matching inside a longer word
  # or a name already replaced. Spanish names carry accented letters, so the
  # letter class is Unicode-aware.
  def self.replace(text, order, table)
    order.reduce(text.to_s) do |acc, full|
      acc.gsub(/(?<![\p{L}0-9])#{Regexp.escape full}(?![\p{L}])/, table[full])
    end
  end
  private_class_method :replace
end
