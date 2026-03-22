# LampLight.Guide/home

Built from https://github.com/MadBomber/bible_study_template

A [Bridgetown 2.1](https://www.bridgetownrb.com/) static site that publishes multiple Bible studies. Content is organized in four layers — **study → section → week → day** — with all reader data (progress, journal, settings) stored in `localStorage` only; nothing is sent to a server.

---

## Commands

```sh
bin/bridgetown start       # dev server at http://localhost:4000
bin/bridgetown deploy      # production build → output/
bin/bridgetown console     # interactive console with site loaded
npm run esbuild            # build frontend assets (minified)
npm run esbuild-dev        # build frontend assets in watch mode
rake clean                 # remove build artifacts
```

> `config/initializers.rb` is **not** auto-reloaded. Restart the server after editing it.

---

## Architecture

### Multi-study data layout

```
src/_data/
  studies.yml              # registry — one entry per study
  study_config.yml         # fallback/global config (sample content)
  study_titles.json        # fallback
  week_phases.yml          # fallback
  {study-slug}/
    study_config.yml       # sections, total_weeks, storage_prefix
    study_titles.json      # week/day titles and readings
    week_phases.yml        # week number → section slug map
```

### Content structure

```
src/
  documents/               # global shared documents
  {study-slug}/
    index.md
    memory-verses.erb
    reading-plan.erb
    hear-journal.erb
    group-settings.erb
    documents/             # study-specific document overrides
    {section-slug}/
      index.md
      week-NN/
        overview.md
        day-1.md … day-5.md
        discussion.md
        memory-verse.md
```

### Document resolution

`plugins/builders/document_resolver.rb` runs at `post_read` and merges global documents (`src/documents/`) with per-study overrides (`src/{study-slug}/documents/`). A study override replaces the global document with the same slug; any slug not overridden falls back to the global version.

**Display order** for the documents menu is controlled by `PREFERRED_ORDER` in the resolver:

```
choose-jesus → how-to-use → hear-method → about
```

Any document with a slug not in that list appears after those four, in alphabetical order.

---

## Adding Resource Documents

### Global documents

Global documents are available to every study unless overridden. Place a Markdown file in `src/documents/`. The filename (without `.md`) becomes the document's slug and its URL segment.

**Required frontmatter:**

```yaml
---
layout: page
title: Full Page Title
document_title: Short Nav Label
description: One-sentence description shown in the documents menu.
---
```

| Key | Purpose |
|-----|---------|
| `layout` | Always `page` |
| `title` | Full `<title>` and `<h1>` |
| `document_title` | Label used in the documents navigation menu (shorter than `title`) |
| `description` | Shown as a subtitle in the documents menu |

**Example** — adding a document about biblical covenants:

1. Create `src/documents/covenants.md` with the frontmatter above.
2. The document is immediately available at `/documents/covenants/` and appears in every study's documents menu after the four preferred-order slots.

To promote a new document into the preferred display order, add its slug to `PREFERRED_ORDER` in `plugins/builders/document_resolver.rb` at the desired position.

### Study-specific document overrides

To replace a global document with a study-specific version, place a file with the **same slug** under `src/{study-slug}/documents/`. The per-study file must use identical frontmatter keys.

**Example** — override `how-to-use` for study `ot1y`:

```
src/ot1y/documents/how-to-use.md
```

The resolver merges by slug: the study-specific file replaces the global one for that study; all other global documents remain visible.

To add a **new** document that appears only for one study (not globally), place it in `src/{study-slug}/documents/` with any slug not already used globally. It will appear only in that study's documents menu.

---

## Adding a New Bible Study

A new study requires changes in five areas: the study registry, a data directory, a content directory, the study-level ERB pages, and (optionally) study-specific documents.

### 1. Choose a slug

The slug is the unique identifier for the study. It must:

- Be lowercase, using only letters, digits, and hyphens
- Match exactly across: `src/_data/studies.yml`, the data directory (`src/_data/{slug}/`), and the content directory (`src/{slug}/`)

**Example slugs:** `ntc1y`, `ot1y`, `acts-study`

### 2. Register the study in `src/_data/studies.yml`

```yaml
- slug: "your-slug"
  hidden: true           # set false when ready to publish
  title: "Full Study Title"
  tagline: "A short descriptive phrase"
  image: ""              # path relative to src/images/, or leave blank
  description: >-
    One paragraph shown on the landing page card.
```

Set `hidden: true` while the study is under construction. The study still builds and can be visited by URL — it is simply omitted from the landing page card grid.

### 3. Create the data directory

Create `src/_data/{slug}/` with three files:

#### `study_config.yml`

```yaml
storage_prefix: "your-slug"   # MUST be unique across all studies
total_weeks: 52                # total number of weeks in the study

sections:
  - number: 1
    title: "Section One Title"
    slug: "section-01"
    weeks_start: 1
    weeks_end: 8

  - number: 2
    title: "Section Two Title"
    slug: "section-02"
    weeks_start: 9
    weeks_end: 20
  # … one entry per section
```

> **`storage_prefix` must be unique.** It is the localStorage key prefix for all reader data (progress, journal entries, settings). Reusing a prefix across studies will cause data collisions.

#### `week_phases.yml`

One entry per week mapping the week number to its section slug:

```yaml
1: section-01
2: section-01
3: section-01
# …
9: section-02
10: section-02
# …
```

#### `study_titles.json`

A JSON object keyed by week number, containing title and daily reading data consumed by the reading plan and other frontend features. Mirror the structure of an existing study's `study_titles.json` (e.g., `src/_data/ot1y/study_titles.json`).

### 4. Create the content directory

Create `src/{slug}/` with the following files:

#### `index.md` — study landing page

```yaml
---
layout: page
title: "Study Title"
study_slug: your-slug
template_engine: erb
---
```

Include an overview table linking to each section, and a link to the How to Use document.

#### `reading-plan.erb`

```yaml
---
layout: page
title: Reading Plan Handout
study_slug: your-slug
permalink: /your-slug/reading-plan/
---
```

Copy the ERB body from an existing study and substitute the study slug in the two `site.data.{slug}` references.

#### `memory-verses.erb`

```yaml
---
layout: page
title: Memory Verses
study_slug: your-slug
permalink: /your-slug/memory-verses/
---
```

#### `hear-journal.erb`

```yaml
---
title: H.E.A.R. Journal
layout: default
study_slug: your-slug
permalink: /your-slug/hear-journal/
---
```

Copy the HTML body verbatim from an existing study — it contains no study-specific markup.

#### `group-settings.erb`

```yaml
---
layout: page
title: Study Settings
study_slug: your-slug
permalink: /your-slug/group-settings/
---
```

### 5. Create section directories

For each section defined in `study_config.yml`, create `src/{slug}/{section-slug}/index.md`:

```yaml
---
section_number: 1
title: "Section One Title"
weeks: "1–8"
layout: page
section: Section One Title
study_slug: your-slug
---
```

### 6. Create week directories

Week directory names are always zero-padded to two digits: `week-01`, `week-02`, …, `week-52`. Each week contains exactly seven files:

#### `overview.md`

```yaml
---
week: 1
section: Section One Title
title: Week Title
date_range: "Week 1"
chapters:
  - Book 1:1-10
  - Book 1:11-20
  - Book 2:1-15
  - Book 2 (review)
  - Psalm 1
tags:
  - section-tag
memory_verse: "Book 1:1"
layout: page
study_slug: your-slug
---
```

#### `day-1.md` through `day-5.md`

```yaml
---
week: 1
day: 1
title: "Day Title"
reading: "Book 1:1-10"
parallel_passages: John 1:1-5, Colossians 1:15-17
section: Section One Title
tags:
  - section-tag
  - topic-tag
layout: page
study_slug: your-slug
---
```

#### `discussion.md`

```yaml
---
week: 1
title: Week Title
section: Section One Title
tags:
  - discussion
  - section-tag
layout: page
study_slug: your-slug
type: discussion
---
```

#### `memory-verse.md`

```yaml
---
layout: memory_verse
week: 1
section: Section One Title
title: Week Title
memory_verse: "Book 1:1"
verse_text: "The full text of the verse."
translation: ESV
connections:
  - "Day 1 — how this verse connects to Day 1's reading"
  - "Day 2 — how this verse connects to Day 2's reading"
  - "Day 3 — how this verse connects to Day 3's reading"
  - "Day 4 — how this verse connects to Day 4's reading"
  - "Day 5 — how this verse connects to Day 5's reading"
study_slug: your-slug
type: memory_verse
---
```

### 7. Checklist

- [ ] Entry added to `src/_data/studies.yml` with correct `slug`
- [ ] `src/_data/{slug}/study_config.yml` created with unique `storage_prefix`
- [ ] `src/_data/{slug}/week_phases.yml` has one entry per week
- [ ] `src/_data/{slug}/study_titles.json` created
- [ ] `src/{slug}/index.md` created
- [ ] `src/{slug}/reading-plan.erb`, `memory-verses.erb`, `hear-journal.erb`, `group-settings.erb` created
- [ ] Each section has `src/{slug}/{section-slug}/index.md`
- [ ] Each week has all seven files with correct zero-padded directory name
- [ ] `storage_prefix` does not collide with any other study
- [ ] `hidden: false` set when ready to publish

---

## Key Invariants

- **`storage_prefix`** in each `study_config.yml` must be unique across studies. Changing it after a study is in use will orphan reader data already stored under the old prefix.
- **`base_path`** in `config/initializers.rb` and `publicPath` in `esbuild.config.js` are derived automatically from `File.basename(Dir.pwd)` — they equal the repo directory name and require no manual editing.
- Week directories are always zero-padded: `week-01`, not `week-1`. File names within a week are fixed (`overview.md`, `day-1.md`–`day-5.md`, `discussion.md`, `memory-verse.md`).
- When adding a section or week, update both `study_config.yml` and `week_phases.yml`; no other configuration is needed.
- The `document_title` frontmatter key controls the label shown in the documents navigation menu. If omitted, `title` is used as the fallback.
