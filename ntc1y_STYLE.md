# Style Guide: A Year at His Feet (ntc1y)

This guide codifies the style already in use across the ntc1y study — the 52-week,
260-chapter chronological journey through the New Testament under `src/ntc1y/` and
`src/_data/ntc1y/`. It was derived from the published content, not imposed on it:
when in doubt, the existing pages are the precedent.

Scope: study content only — day pages, week overviews, discussion guides, memory
verse pages, section indexes, tag pages, and the ntc1y data files. Blog essays are
governed by [`STYLE.md`](STYLE.md) instead; where the two disagree (deity pronouns,
footnotes, dash usage), this file wins inside the study. Site mechanics (layouts,
storage keys, build invariants) are documented in [`CLAUDE.md`](CLAUDE.md) and are
not repeated here except where they constrain authoring.

---

## Voice and Tone

The study is written by a teacher, not a lecturer or a devotional greeting card.
Its register sits between the two: scholarly content delivered warmly.

- **Second person plural journey.** The reader is addressed as "you" and included
  in "we": "We begin our journey through the New Testament not with a manger scene
  but with eternity." The study is a shared walk, and the voice never forgets a
  year-long arc is underway ("Everything that follows in the remaining forty-eight
  weeks flows from what happens here").
- **Confident, reverent, unhedged about the text's claims.** "This is the
  foundation of Trinitarian theology, stated with breathtaking economy." Awe is
  expressed through concrete assertion, not exclamation points.
- **Even-handed on genuinely debated questions.** Where scholarship is divided,
  present both sides without forcing a verdict: "Whether Paul expected an imminent
  return of Christ or was referring to the ongoing pressures of persecution…"
  Date books with ranges ("likely written between 85 and 95 AD"), and use
  "likely," "probably," "may have been" for historical reconstruction — never for
  the theological claims of the text itself.
- **Vivid concreteness over abstraction.** "Shepherds working the night shift,"
  "a sign with teeth in it," "the God who spoke galaxies into existence now cries,
  nurses, sleeps." One striking image per idea; never a pile-up.
- **Theological center.** Evangelical, Trinitarian, Christ-centered. The whole New
  Testament is read as one story whose hinge is the incarnation, cross, and
  resurrection. Old Testament connections are treated as design, not coincidence.

---

## Scripture

- **Translation is ESV**, everywhere: quotations, memory verses (`translation: ESV`
  in front matter), and the audio links. Do not mix translations.
- **Quotations are run into prose in double quotes**, with the reference either
  woven into the sentence or given in a trailing parenthesis:
  - "In the beginning was the Word, and the Word was with God, and the Word was God."
  - "your prayer has been heard… and you shall call his name John" (Luke 1:13).
- Use `(v. 1)` / `(vv. 3-4)` when the chapter is already established by the page's
  reading; full `Book 1:2-3` references otherwise. `cf.` is fine for comparisons.
- **Verse ranges use a plain hyphen**: `John 1:1-18`, `Luke 23:26-56`. No en dashes
  inside references.
- **Deity pronouns are lowercase** ("reveal who he is," "his people," "his glory"),
  matching the ESV's own style. This deliberately differs from the essay guide.
- Ellipses in quotations use three dots (`...` or `…` — both occur; don't churn
  existing pages over it).

## Greek and Hebrew

- Transliterated terms are *italicized*: *Logos*, *eskenosen*, *peri de*,
  *mishkan*.
- On first significant use in a page, a Greek term is wrapped in a BibleHub search
  link, opening in a new tab:

  ```html
  <a href="https://biblehub.com/searchgreek.php?q=Logos" target="_blank" rel="noopener"><em>Logos</em></a>
  ```

  Later mentions in the same page may be plain `*italics*`. Multi-word terms join
  with `+` in the query (`?q=peri+de`).
- Always gloss: give the translation in quotes immediately ("dwelt," more literally
  "tabernacled"). A term is introduced because it unlocks meaning — grammar detail
  (anarthrous *theos*, the force of *pros*) appears only when it carries
  theological weight, and it is always explained in plain language.

---

## Mechanics

- **Dashes.** The workhorse dash in study prose is a spaced double hyphen
  (`word -- word`); the large majority of day pages use it. True em dashes (`—`)
  appear in newer material — memory-verse commentary, some titles ("Hard Teaching
  — Many Disciples Desert"). Either is acceptable; be consistent within a page,
  and don't convert existing pages wholesale.
- **Headings.** Body sections are `##` (H2). `###` (H3) subheadings appear only
  occasionally inside a long Historical Context ("The Three Temptations and
  Deuteronomy"). Never `#` in the body — the layout renders the title.
- **Bold** is for list-item lead terms (`**Incarnation** -- …`), not for emphasis
  in running prose. *Italics* are for transliterated terms, book/work titles, and
  the rare stress.
- **Titles** (front matter and `study_titles.json`) use title case, `&` and `+`
  freely for compression ("Magi Visit, Flight to Egypt, Return to Nazareth",
  "1 John 5 + 2 John + 3 John"), and an em dash or spaced `--` for a subtitle
  turn. Day titles summarize the reading's content, not a sermon point.
- **External links** always carry `target="_blank" rel="noopener"` and are written
  as raw HTML anchors. Internal links are Markdown: relative within a week
  (`../day-1/`), root-absolute for the shared reference pages
  (`/characters/mary/`, `/locations/nazareth/`), and ERB `relative_url` in
  `template_engine: erb` pages.
- No footnotes anywhere in the study (footnotes are an essay convention).

---

## Page Templates

Week directories are zero-padded (`week-01`); file names within a week are fixed:
`overview.md`, `day-1.md`–`day-5.md`, `discussion.md`, `memory-verse.md`
(see CLAUDE.md). Every page's front matter carries `study_slug: ntc1y`.

### Day page (`day-N.md`)

Front matter, in this order:

```yaml
---
week: 30
day: 3
title: Marriage, Singleness, and Undivided Devotion
reading: 1 Corinthians 7
parallel_passages: Matthew 19:3-12; Mark 10:2-12   # optional; ~half the pages
section: The Early Church
tags:
- corinthians
- marriage
layout: page
study_slug: ntc1y
---
```

`parallel_passages` is a semicolon-separated list. `tags` are kebab-case; reuse
existing tags (see the Tags section) before minting new ones.

Body sections, in this exact order, all H2:

1. **`## Reading: <reference>`** — the reference matches the `reading` front
   matter exactly. Immediately under it, the audio line:

   ```markdown
   Listen to: <a href="https://www.biblegateway.com/audio/mclean/esv/1Cor.7" target="_blank" rel="noopener">1 Corinthians chapter 7</a>
   ```

   The URL is BibleGateway's Max McLean ESV recording; the path segment is the
   book abbreviation with no spaces (`John.1`, `1Cor.7`, `Rev.4`) and the link
   text is spelled out ("1 Corinthians chapter 7"). Audio covers whole chapters —
   for a partial-chapter reading, link the chapter it falls in.

2. **`## Historical Context`** — the heart of the page: four to seven substantial
   paragraphs. Despite the heading, this is context *and* commentary: authorship
   and dating, cultural/political background, a guided walk through the passage's
   argument, key Greek terms with BibleHub links, and theological significance.
   Move from background to text to meaning. This is where the teaching happens;
   everything after it is distillation.

3. **`## Key Themes`** — exactly three bullets, each `**Bold Theme Name** -- one
   to two sentences.` The themes name what the passage is *about* theologically,
   not plot points.

4. **`## Connections`** — bullets with bold lead labels, normally:
   - `**Old Testament Roots**:` the passages standing behind today's text
   - `**New Testament Echoes**:` where the same theme resurfaces elsewhere
   - `**Parallel Passages**:` synoptic or epistolary parallels (include when the
     front matter has `parallel_passages`; otherwise this bullet may be omitted)

5. **`## Reflection Questions`** — exactly three, numbered. They climb: question 1
   observes the text, question 2 interprets it, question 3 turns it personally
   ("What currently divides your devotion…?"). Questions are open — never
   yes/no, never rhetorical.

6. **`## Prayer`** — one paragraph, addressed to Father, Lord, or Lord Jesus as
   the passage suggests. It weaves the day's own language and images back into
   petition ("the light that shines in the darkness and cannot be overcome") and
   closes in Jesus' name with "Amen." The prayer prays the passage; it never
   introduces new teaching.

**Legacy variant:** the five week-02 day pages use an older shape (an epigraph
blockquote after the audio link, `## Study Questions`, `## Cross-References`,
`## Prayer Focus`). They are grandfathered — do not imitate them, and do not
"fix" them without a deliberate migration pass.

### Week overview (`overview.md`)

Front matter: `week`, `section`, `title`, `date_range: Week N`, `chapters` (list
of the five readings, in order), `tags` (the week's two or three big topics),
`memory_verse` (reference only), `layout: page`, `study_slug`.

Body sections:

1. **`## The Big Picture`** — three paragraphs telling the week as one story:
   where we are in the year's arc, what the five readings do together, and why it
   matters. This is narrative, not a list.
2. **`## This Week's Readings`** — a table: Day | Reading | Title, the title
   linking `(../day-N/)`. Must agree with the day pages and `study_titles.json`.
3. **`## Key Characters`** — bulleted `**[Name](/characters/slug/)** -- one-line
   identification.` Only characters actually appearing in this week's readings.
4. **`## Key Locations`** — same shape, linking `/locations/slug/`.
5. **`## Key Themes`** — bold term + two-to-three-sentence explanation; usually
   four themes, spanning the week rather than one day.

Section-06 overviews drift ("Big Picture", "Daily Readings", "Key Characters This
Week"). The headings above are the canonical set for new material.

### Discussion guide (`discussion.md`)

Front matter: `week`, `title` (same as the week's), `type: discussion`,
`tags: [discussion, week-N]`, `layout: page`, `section`, `study_slug`.

The discussion pages vary more than any other type; the canonical shape is:

1. **`## Opening Question`** — one ice-breaker rooted in ordinary experience,
   before any Bible content ("Think about a time when you received news that
   completely changed the direction of your life…").
2. **`## Review`** — one paragraph retelling the week's readings in order.
3. **`## Study Questions`** — five numbered questions, each anchored to a
   specific reading and often pairing an observation with an application
   ("What is Matthew telling us… What does this say about God's willingness…?").
4. **`## Going Deeper`** — one meatier paragraph-length prompt, often built on a
   Greek term or a cross-reading theme, for groups with time.
5. **`## Application`** — two or three bullets turning the week toward the coming
   week's living.
6. **`## Prayer Focus`** — a paragraph directing (not scripting) the group's
   prayer, tied to the week's theme.

Questions are written for a lay group: no unexplained jargon, nothing that
requires commentary access to answer, and never a question with a single
"correct" answer the leader is meant to fish for.

### Memory verse (`memory-verse.md`)

Front matter carries the whole apparatus; all eleven fields are present on every
page:

```yaml
---
layout: memory_verse
type: memory_verse
image: week-01-memory-verse.png      # always week-NN-memory-verse.png
week: 1
section: The Coming of Christ
title: The Word Became Flesh          # the week's title
memory_verse: "John 1:14"
verse_text: "And the Word became flesh and dwelt among us, …"
translation: ESV
connections:
  - "Day 1 — John's prologue is the source of this verse, …"
  - "Day 3 — Mary's Magnificat celebrates the same reality: …"
study_slug: ntc1y
---
```

`verse_text` is the exact ESV wording. `connections` entries are strings shaped
`"Day N — clause"` (true em dash), linking the verse to two or three of the
week's days.

The body is one or two short paragraphs of commentary: why *this* verse is the
week's anchor, usually with one Greek term unpacked. It is the most concentrated
writing in the study — no section headings, no questions, no prayer.

### Section index (`section-NN/index.md`)

Front matter: `section_number`, `title`, `weeks` ("1–4", en dash), `layout: page`,
`section`, `study_slug`. Body: an italic `*Weeks 1–4*` line, `## Overview` (three
to four narrative paragraphs framing the section's arc, same voice as the Big
Picture), then `## Weeks in This Section` — a table of Week | Title | `[Start](week-NN/overview/)`.

### Tag pages (`tags/*.md`)

One file per tag, `template_engine: erb`, title `"Tagged: <tag>"`. Body: a count
sentence ("One page carries the **nicodemus** tag:" / "N pages carry…"), a
bulleted list of day-page links via `relative_url`, and an `[All topics]` footer
link. `tags/index.md` is the tag cloud. These pages mirror the `tags:` front
matter of the day pages — when a day page's tags change, regenerate or update the
tag pages and the cloud counts to match. Prefer an existing tag over a synonym
(`john-the-baptist`, not `baptist-john`); tags are kebab-case, lowercase.

---

## Characters and Locations

The pages under `src/characters/` and `src/locations/` are site-global, but they
were built for this study and week overviews link into them.

- Front matter: `title`, one-sentence `blurb` written with flair ("The elderly
  priest struck silent at the altar of incense, whose loosed tongue sang the
  Benedictus."); characters list their `locations`; locations carry
  `location_type`, `map_lat`/`map_lon`, and `map_alt` text.
- Body opens with a `<figure class="location-figure">`: public-domain or CC art
  with a genuinely descriptive `alt` (composition, not just subject), and a
  `figcaption` giving work, artist, date, license, and a Wikimedia Commons link.
- Two to four paragraphs of the same warm-scholar prose, then
  `## In the New Testament` — a bulleted list of the person's or place's scenes
  with references — and the closing ERB partial (`character_locations` /
  `location_map`).

---

## Data Files (`src/_data/ntc1y/`)

These must stay in agreement with the content pages; a mismatch is a bug.

- **`study_titles.json`** — one line, week → `{title, days: {N: {title, reading}}}`.
  Titles and readings must match the day pages' front matter exactly; the
  navigation and journal read from here.
- **`study_config.yml`** — sections, week ranges, `storage_prefix`, Giscus repo.
  Changes here pair with `week_phases.yml` (week number → section slug).
- **`quiz.yml`** — question pool keyed by week-of-reading (quoted keys: `"1":`).
  Each question: `question`, four `choices` (the renderer shuffles), `answer`
  repeated verbatim from choices, `ref`, `day`. Questions test recall of the
  reading itself ("When Zechariah doubted the angel's promise, what happened to
  him?") — never interpretation or application, and never trick distractors.
  Blanks in a prompt are three underscores (`'the ___'`).
- **`timeline.yml`** — the header comment in the file is its own spec (BC years
  negative, `label_pos` values, the AD 30 chronology assumption). Follow it.

---

## Checklist for a New Day Page

1. Front matter complete and ordered; `reading` matches the `## Reading:` heading,
   `week`/`day` match the path, tags reused where possible.
2. Audio link points at the right McLean ESV chapter.
3. Historical Context: 4–7 paragraphs, background → text → meaning, Greek terms
   italicized and BibleHub-linked on first use.
4. Exactly three Key Themes, three Reflection Questions (observe → interpret →
   apply), Connections with OT Roots and NT Echoes.
5. Prayer echoes the day's language and ends in Jesus' name, "Amen."
6. All Scripture quoted from the ESV; deity pronouns lowercase; verse ranges
   hyphenated.
7. `study_titles.json` updated (title + reading), week overview table updated,
   tag pages regenerated if tags changed, and a `quiz.yml` pool entry considered
   for the week.
