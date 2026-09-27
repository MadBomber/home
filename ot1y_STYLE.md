# Style Guide: A Year at His Feet — Old Testament (ot1y)

This guide codifies the style already in use across the ot1y study: the 52-week
journey through the Old Testament under `src/ot1y/` and `src/_data/ot1y/`,
organized around the eight covenants from creation to consummation. It was derived
from the published content, not imposed on it. All 260 day pages, 52 overviews,
52 discussion guides, and 52 memory-verse pages share one template, so the
existing pages are the precedent. When in doubt, match them.

Scope: study content only. That means day pages, week overviews, discussion
guides, memory-verse pages, section indexes, tag pages, and the ot1y data files.
Blog essays follow [`STYLE.md`](STYLE.md) instead, and where the two disagree
(deity pronouns, footnotes, dash usage), this file wins inside the study. The New
Testament study has its own guide, [`ntc1y_STYLE.md`](ntc1y_STYLE.md). The two
share a voice but not a page template (see "How ot1y Differs from ntc1y" at the
end). Site mechanics (layouts, storage keys, build invariants) are in
[`CLAUDE.md`](CLAUDE.md) and are repeated here only where they constrain
authoring.

---

## Voice and Tone

The voice is the same warm scholar who teaches the New Testament study. The
difference is that here every page reads the Old Testament forward toward Christ.

- **A shared journey.** The reader is "you" and the group is "we." The year-long
  arc stays in view: "In eight weeks you will journey with one family through whom
  God intends to bless every family on earth."
- **Short declaratives for weight.** The ot1y prose builds force with runs of
  short sentences: "The door shuts. God himself closes it." "One door. One act.
  Salvation and judgment in a single gesture." Use the device at a turning point,
  not in every paragraph.
- **The ancient Near East as foil.** Over half the day pages set the text against
  its world: Ra and Shamash against "the greater light," Akkadian *sikiltu*
  behind *segullah*, temple-statue religion against a God who descends on a
  mountain in full view. The contrast serves the text. It shows what Israel's
  God is *not*, and it is never a detour into comparative religion.
- **Confident about the text, careful about reconstruction.** State the text's
  theological claims plainly. Use "likely" and "probably" only for historical
  reconstruction, such as dates, customs, and locations.
- **Christ-centered in every page.** The whole Old Testament points to Jesus.
  Pages vary *how* it arrives (type, promise, pattern, prophecy, echo, a question
  left hanging) and never question *whether* it does.

## Reading Discipline

These rules come from the review corrections made across the study (the pattern
Donny Durr first caught in ntc1y). A page that breaks one of them is wrong even
if everything it says is true.

- **Attribute to the day's reading only what is in the day's reading.** The
  Historical Context, Key Themes, Reflection Questions, and Prayer discuss the
  verses on the page. When a detail belongs to tomorrow's reading, it belongs to
  tomorrow's page. For example, the Genesis 22:1-8 day does not mention the ram,
  and the Exodus 11 day does not mention the Passover blood. The same rule
  applies across weeks. Exodus 12:46 ("not one of his bones") is read in week 19,
  so the week 18 pages don't use it.
- **Cover the whole reading.** Every verse range must get some attention. If
  Genesis 1:24-25 (the land animals) sits inside the reading, Historical Context
  says something about it.
- **Readings tile the text.** Consecutive readings meet with no gaps and no
  overlaps: Genesis 1:14-23, then 1:24-31, not 1:14-25 then 1:26-31. Fix a
  reading range in all five places at once: the day's `reading`, its
  `## Reading` bullet, `study_titles.json`, the overview's `chapters` list and
  readings table, and any discussion `### Day N` heading or memory-verse
  connection that quotes the range.
- **Let the Old Testament keep its questions until the Christ section.** The
  text-bound sections are Historical Context, Key Themes, the overview's
  Overview and Key Themes, and the discussion's Review. They stay inside what
  the narrative itself knows. When the text leaves a question open, leave it
  open there: "What that pattern is building toward, the narrative does not yet
  say." Name the fulfillment in **Christ in This Day** / **Christ in This Week**,
  which exist for exactly that.
- **Later Scripture is quoted by reference, not smuggled in.** Pages may cite
  any other book, Old or New Testament, when the citation is explicit (book,
  chapter, verse) and it lives in Connections or the Christ section. What they
  must not do is read a later passage's details into today's text without
  naming the source.

---

## Scripture

- **Translation is ESV** everywhere: quotations, memory verses
  (`translation: ESV`), and discussion blockquotes. Quote the wording exactly.
  Don't mix translations.
- **LORD** stays in capitals wherever the ESV prints it for the divine name
  (221 of 260 day pages use it). Write it as plain capitals, with no HTML
  small-caps markup.
- **Quotations run into the prose** in double quotes, followed by a
  parenthetical reference: "But God remembered Noah" (Genesis 8:1).
- **Reference form.** Use a full `Book 1:2-3` reference for any passage outside
  the day's reading. Inside the day's reading, a bare `(1:14)` or `(22:8)` is
  the house style. It appears in 186 of 260 day pages; `(v. 4)` is rare. Use
  `cf.` sparingly.
- **Verse ranges use a plain hyphen**: `Exodus 20:22-21:36`, `Genesis 1:24-31`.
  Never an en dash inside a reference. The en dash is only for week ranges and
  chapter spans in section indexes (`9–16`, `Genesis 12–14`).
- **Deity pronouns are lowercase**: he, his, him, himself. This matches the ESV
  and ntc1y, and deliberately differs from the essay guide.
- **Ellipses** are three periods (`...`), the only form used in ot1y.

## Hebrew (and Greek)

- **Hebrew is the working language of this study.** Nearly every day page (258
  of 260) introduces at least one transliterated term: *tanninim*, *segullah*,
  *zakar*, *ruach*, *tehom*, *Elohim yir'eh-lo*, *Aqedah*.
- Transliterations are *italicized*, lowercase unless the term is a name or
  title (*Aqedah*, *Elohim*). Italicize them every time, not just the first.
- **Always gloss immediately.** Give the meaning in quotes right after the term,
  or nearby: "The Hebrew word *zakar*, 'remembered,' does not mean God had
  forgotten." A term earns its place by unlocking the text. Grammar appears only
  when it carries theological weight.
- **Tie a term to its other appearances** when that is the point. Examples:
  *yarad* at Babel and at Sinai, *ruach* in Genesis 1:2 and 8:1. This is the
  main way the study shows the Old Testament's internal design.
- **Greek appears only when the New Testament or the Septuagint is in view**
  (71 pages), usually in Christ in This Day: *basileion hierateuma* translating
  *mamlekhet kohanim*, for instance. Same rules: italicize and gloss.
- **No lexicon links.** Unlike ntc1y, ot1y does not link terms to BibleHub. Keep
  it that way unless the whole study is converted in one pass.

---

## Mechanics

- **Dashes vary by page type**, and each type is consistent within itself:

  | Page type | Dash |
  |---|---|
  | Day pages, discussion guides | spaced double hyphen `--` (all of them) |
  | Front-matter titles, `study_titles.json` | `--` for the subtitle turn |
  | Overviews, memory-verse pages, section indexes | em dash `—` |

  Some overviews and memory-verse pages mix in `--` as well. Don't churn
  existing pages over it, but use the page type's form in new material.
- **Headings.** Body sections are `##`. `###` appears only for the discussion
  guide's per-day question groups. Day pages never use `#` in the body, since
  the layout renders the title. Section indexes are the one exception (see below).
- **Bold** marks list-item lead terms (`**Grace before law** -- …`) and the
  Connections labels. It is not used for emphasis in running prose. *Italics*
  are for transliterations, the rare stressed word, and titles of works.
- **Theme and question labels use sentence case in day pages** ("Grace before
  law," "The holiness that burns") and title case in discussion question leads
  ("**The Door God Shuts.**"). Title case also occurs in some day-page themes,
  which is acceptable.
- **No links in day pages.** None of the 260 day pages contains a Markdown or
  HTML link, and there are no audio links. Navigation is the layout's job.
- **No footnotes** anywhere in the study.

---

## Page Templates

Week directories are zero-padded (`week-01`), and file names within a week are
fixed. Every page's front matter carries `study_slug: ot1y`. Sections are
covenants, and each section's `section:` value is its covenant name exactly as
in `study_config.yml` ("Creation Covenant", "Mosaic Covenant", …).

### Day page (`day-N.md`)

Front matter, in this order (`parallel_passages` is the only optional key):

```yaml
---
week: 20
day: 1
title: "Sinai -- Thunder, Fire, and a Kingdom of Priests"
reading:
- Exodus 19:1-25
parallel_passages:
- Deuteronomy 4:10-13
- Psalm 68:7-8
section: Mosaic Covenant
tags:
- covenant-5
- sinai
- theophany
- priesthood
layout: page
study_slug: ot1y
---
```

- `title` is always double-quoted.
- `reading` is a YAML list with **one reference per item**, even when there is
  only one. Every item names its book (`Genesis 22:1-8`, never a bare
  `22:1-8`). Wherever the reading appears as a single string (in
  `study_titles.json`, the overview's `chapters` and readings table, and the
  discussion's `### Day N` heading), the items are joined with `"; "`. The
  navbar's Journal link joins them the same way.
- `parallel_passages` (optional) lists **genuine parallel accounts only**, the
  same convention as ntc1y. Like `reading`, it is a YAML list with one
  reference per item. A comma appears only inside a single reference
  (`Revelation 16:2, 21`). When no parallel account exists, omit the key. No
  layout reads the field. It must list exactly the references in the body's
  **Parallel Passages** paragraph. See "Parallel accounts" below for what
  qualifies.
- `tags`: the first tag is **always** the section's covenant tag,
  `covenant-1` … `covenant-8`. Follow it with three to five topic tags, which
  are kebab-case and lowercase. Reuse an existing tag before minting a new one
  (`ls src/ot1y/tags/`).

Body sections, in this exact order, all `##`:

1. **`## Reading`**: one bullet per `reading` item, in the same order and with
   the same wording.

   ```markdown
   ## Reading

   - Exodus 19:1-25
   ```

2. **`## Historical Context`**: usually five paragraphs (four to seven is
   normal). Move from setting (where we are in the story, what just happened)
   to the ancient Near Eastern world, to a walk through the passage with its
   Hebrew terms, to what the text reveals about God. This section stays inside
   the reading (see Reading Discipline).

3. **`## Christ in This Day`**: three paragraphs (sometimes four). This is where
   the day's text meets Jesus, and the New Testament is quoted in full ESV
   wording. Build from the text outward: the typological link, the explicit New
   Testament use of the passage when there is one, and the pattern's arc across
   Scripture. Each paragraph makes one connection. This is the section ntc1y
   does not have, and it is the reason the study exists.

4. **`## Key Themes`**: exactly three bullets:
   `**Theme name** -- two to four sentences.` The themes name what the passage
   teaches about God and his people. They are not plot points, and they stay on
   the Old Testament side of the line.

5. **`## Connections`**: bold labels, each on its own line, each followed by a
   *paragraph* (not bullets):

   ```markdown
   **Old Testament Roots**

   The burning bush (Exodus 3:1-6) was the private preview of what Sinai
   reveals publicly. …

   **New Testament Echoes**

   Hebrews 12:18-24 explicitly contrasts Sinai's terror with …

   **Parallel Passages**

   Deuteronomy 4:10-13 retells the Sinai theophany …
   ```

   **Old Testament Roots** and **New Testament Echoes** are on every page.
   **Parallel Passages** appears only when `parallel_passages` does, and it
   discusses exactly those references. Every reference is written out in full
   with a sentence saying why it matters. A bare list of references is not a
   connection.

   **Parallel accounts.** A parallel is a passage that records the *same event*
   or reproduces the *same text* as the day's reading:
   - another narrative of the event: Samuel/Kings ↔ Chronicles, Exodus/Numbers ↔
     Deuteronomy's retellings, Isaiah 36–39 ↔ 2 Kings 18–20, Jeremiah 52 ↔
     2 Kings 25
   - a later passage that narrates the event: the historical psalms (78, 105,
     106, 136) at the relevant verses, Nehemiah 9, Stephen's speech in Acts 7
   - a psalm whose heading ties it to the event: Psalm 34 and 56 for David at
     Gath, Psalm 51 for Nathan's rebuke
   - duplicated text: Psalm 18 ↔ 2 Samuel 22, Exodus 20 ↔ Deuteronomy 5,
     repeated law collections on one subject, the tabernacle instructions ↔ its
     construction, Isaiah 2:2-4 ↔ Micah 4:1-3
   - parallel genealogies: Genesis 5, 11, 36 ↔ 1 Chronicles 1

   Thematic echoes, types, fulfillments, New Testament interpretation, and
   similar-but-different events are *not* parallels. They belong in Old
   Testament Roots, New Testament Echoes, or Christ in This Day.

6. **`## Reflection Questions`**: exactly three, numbered, with a blank line
   between them. They climb. Question 1 observes the text (often restating a
   detail), question 2 wrestles with its meaning or tension, and question 3
   turns personal, usually through the Christ connection ("Peter applies this
   calling to you…"). Each question may be two or three sentences. They are
   open, never yes/no.

7. **`## Prayer`**: one paragraph. The address draws on the passage's picture
   of God: "Lord God," "Father," "Lord Jesus," "God of the mountain," "Lord of
   hosts." The prayer praises God in the day's own images, confesses honestly,
   asks for something specific, and names Christ before it ends. It closes with
   "Amen.", usually after "In Jesus' name," "In his name we pray," or "In your
   name." The prayer prays the passage. It never introduces new teaching.

### Week overview (`overview.md`)

Front matter, in this order: `week`, `section`, `title`, `date_range: "Week N"`,
`chapters` (the five readings, in day order, matching the day pages exactly),
`tags` (just the covenant tag), `memory_verse` (quoted reference),
`layout: page`, `study_slug`.

Body sections:

1. **`## Overview`**: five to eight paragraphs telling the week as one story,
   in the em-dash, short-declarative style. It is a narrative, not a list of
   days, and it stays inside the week's readings.
2. **`## This Week's Readings`**: a table of Day | Reading | Title, with the day
   number linking to `(../day-N/)`. The title must match the day page and
   `study_titles.json` character for character.
3. **`## Key Themes`**: four or five bullets, `**Theme** — explanation`, with an
   em dash, each spanning the whole week.
4. **`## Christ in This Week`**: three paragraphs gathering the week's
   Christological threads into one picture.

ot1y overviews have no Key Characters or Key Locations sections.

### Discussion guide (`discussion.md`)

Front matter, in this order: `week`, `title` (the week's title), `section`,
`tags` (`discussion` plus the covenant tag), `layout: page`, `study_slug`,
`type: discussion`.

The body's major sections are separated by `---` rules:

1. **`## Opening`**: "Begin by reciting this week's memory verse together:",
   then the verse as a blockquote in exact ESV wording, attributed
   `-- Reference (ESV)`. Then an ice-breaker paragraph drawn from ordinary
   experience that leads into the week's theme.
2. **`## Review: The Big Picture`**: one long paragraph retelling the five
   readings in order.
3. **`## Discussion Questions`**: five `### Day N: <day title> (<reading>)`
   groups, followed by `### Synthesis`. Questions are numbered continuously
   through the whole guide (usually 12–15 in all), and each opens with a bold
   title-case lead (`1. **Found Righteous.** …`). A question quotes or points to
   a specific verse, explains what the group needs to know, then asks. It
   usually pairs an observation with an application. The Synthesis question
   draws the whole week toward the gospel.
4. **`## Going Deeper: Connections Across the Week`**: exactly three bullets,
   each `**Title.**` followed by a full paragraph tracing one theme across the
   week and across Scripture.
5. **`## Application`**: exactly three bullets, labeled `**Personal:**`,
   `**Relational:**`, and `**Formational:**`, each giving one concrete thing to
   do this week.
6. **`## Closing Prayer`**: a paragraph that *directs* the group's prayer
   through the arc of the week ("Begin with the shut door… Move to the
   waters… close with…"). It does not script the prayer.
7. **`## Looking Ahead`**: one short paragraph previewing next week's readings.
   It raises next week's question without answering it.

Write for a lay group. Explain every Hebrew term used in a question, require no
commentary to answer, and never fish for a single "correct" answer.

### Memory verse (`memory-verse.md`)

Front matter, in this order:

```yaml
---
layout: memory_verse
week: 6
section: Noahic Covenant
title: The Flood                    # the week's title
memory_verse: "Genesis 7:1"
verse_text: "Then the LORD said to Noah, \"Go into the ark, …\""
translation: ESV
connections:
  - "Day 1 — …"
  - "Day 2 — …"
  - "Day 3 — …"
  - "Day 4 — …"
  - "Day 5 — …"
study_slug: ot1y
type: memory_verse
---
```

- `verse_text` is the exact ESV wording, with inner quotes escaped.
- **There are exactly five connections, one per day, in day order.** Each is
  `"Day N — …"` (true em dash) and runs two to four sentences, showing how
  that day's reading, and only that day's, bears on the verse. The Reading
  Discipline applies here too: a Day 2 connection may not borrow a Day 3
  detail.

The body is `## Why This Verse` and then three paragraphs. First, why *this*
verse anchors the week (usually unpacking one Hebrew term). Second, how it
captures the week's movement. Third, the Christological line, with the New
Testament quoted.

### Section index (`section-NN/index.md`)

Front matter: `section_number`, `title` (quoted covenant name),
`weeks` ("9–16", en dash), `layout: page`, `section`, `study_slug`.

This is the only page type with a body `#` heading:
`# <Covenant Name>: <Subtitle>`, followed by an italic `*Weeks 9–16*` line.
The sections, in order:

1. `## Overview`: one long narrative paragraph covering the whole covenant arc.
2. `## Weeks in This Covenant`: a table of Week | linked title
   `[Title](week-NN/overview/)` | chapter span.
3. `## The Foundation`: the covenant's founding text, with a blockquote
   `— Reference (ESV)`, and how the covenant unfolds.
4. `## Key Old Testament Passages`: a Passage | Significance table.
5. `## Fulfilled in Christ`: a New Testament | Connection table.
6. `## In Your Study`: how the NT companion study (ntc1y) picks up this
   covenant.
7. `## Looking Ahead`: where the covenant's promise finally lands.
8. `## The Personal Dimension`: the covenant as a matter of individual trust,
   closing on a blockquoted verse.
9. `## Content Expansion`: bulleted topics for further study.

It closes with a `---` rule and a `**See also:**` line linking the previous and
next covenants.

Sections 1 and 8 vary: section 1 adds "A Note on Science and Origins," and
section 8 uses "Fulfilled — and Yet to Come — in Christ" and "The Full Circle."
Those variations are intentional and fit their covenants.

### Tag pages (`tags/*.md`)

The tag pages are generated. Run `ruby scripts/tags.rb src/ot1y` after changing any
day page's `tags`. It rewrites one `template_engine: erb` page per tag (title
`"Tagged: <tag>"`, a count sentence, the day-page links, an `[All topics]`
footer) and rebuilds the tag cloud in `tags/index.md`. Don't hand-edit them.

---

## Data Files (`src/_data/ot1y/`)

These must agree with the content pages. A mismatch is a bug.

- **`study_titles.json`**: one line, week → `{title, days: {N: {title,
  reading}}}`. Day titles and readings must match each day page's front matter
  and the overview table exactly, `--` included. The navigation and journal read
  from here.
- **`study_config.yml`**: eight covenant sections, their week ranges, and
  `storage_prefix: "ot1y"`. A change here pairs with `week_phases.yml`.
- **No `quiz.yml` or `timeline.yml` yet.** A quiz would follow the ntc1y quiz
  rules (recall only, four choices, `answer` verbatim from `choices`).
  CLAUDE.md notes that an ot1y timeline needs a non-linear treatment and should
  not copy the ntc1y one.

---

## How ot1y Differs from ntc1y

| | ntc1y | ot1y |
|---|---|---|
| Reading block | `## Reading: <ref>` + BibleGateway audio link | `## Reading` + one bullet, no audio |
| Christ section | none (the text *is* about Christ) | `## Christ in This Day` / `## Christ in This Week` |
| Connections | bullets with bold inline labels | bold labels on their own lines, paragraph under each |
| Original language | Greek, BibleHub-linked on first use | Hebrew, italicized, not linked |
| Overview | Big Picture, Readings, Key Characters, Key Locations, Key Themes | Overview, Readings, Key Themes, Christ in This Week |
| Discussion | Opening Question, Review, Study Questions (5), Going Deeper, Application, Prayer Focus | Opening (memory verse + ice-breaker), Review, per-day question groups + Synthesis, Going Deeper (3), Application (3, labeled), Closing Prayer, Looking Ahead |
| Memory-verse connections | two or three days | all five days |
| Tags | topic tags | covenant tag first, then topic tags |

The two studies share one `parallel_passages` convention: genuine parallel
accounts only, semicolon-separated, and omitted when there are none.

---

## Checklist for a New or Revised Day Page

1. The front matter keys are in order, `title` is quoted, `reading` (and
   `parallel_passages`, if present) is a list with one full reference per item,
   and `week`/`day` match the path. The first tag is the covenant tag, and topic
   tags are reused where possible.
2. The `## Reading` bullet matches `reading`, and the range meets its
   neighbors' ranges with no gap or overlap.
3. Historical Context covers every part of the reading and nothing from
   tomorrow's. Hebrew terms are italicized and glossed.
4. Christ in This Day makes the New Testament connection, with the New
   Testament quoted exactly from the ESV.
5. There are exactly three Key Themes and three Reflection Questions
   (observe → wrestle → apply). Connections has OT Roots and NT Echoes, plus
   Parallel Passages only for genuine parallel accounts, matching the front
   matter.
6. The Prayer is one paragraph, prays the passage, names Christ, and ends with
   "Amen."
7. The ESV is used throughout. LORD is in capitals, deity pronouns are
   lowercase, verse ranges are hyphenated, and dashes are `--`.
8. `study_titles.json`, the overview's `chapters` and readings table, the
   discussion's `### Day N` heading, and the memory-verse connection all agree
   with the page.
9. If tags changed, run `ruby scripts/tags.rb src/ot1y`.
