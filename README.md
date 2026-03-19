# Bible Study Template

A reusable [Bridgetown 2.1](https://www.bridgetownrb.com/) static site template for publishing weekly Bible studies. Content is organized in three layers — **sections** (upper) / **weeks** (middle) / **days** (lower) — and ships with a full set of reader features out of the box.

Built from the same foundation as [A Year at His Feet](https://github.com/MadBomber/ntc1y_guide).

---

## Features

- **Progress tracking** — readers mark days, weeks, and sections complete; stored privately in their browser
- **H.E.A.R. Journal** — per-day journaling (Highlight, Explain, Apply, Respond); stored locally
- **Memory verse pages** — dedicated layout with cross-references and audio support
- **Reading plan** — auto-generated from your data files
- **Read-aloud** — text-to-speech for any page
- **Settings** — light/dark theme, font size, feature toggles
- **Group email sharing** — export journal entries to share with a small group
- **Community discussions** — [Giscus](https://giscus.app/) (GitHub Discussions-backed comments, opt-in)
- **Bible reference linking** — [RefTagger](https://faithlife.com/products/reftagger) auto-links scripture references
- **Responsive navbar** with hamburger menu for mobile
- **FOUC prevention** — theme and feature state applied before first paint

All user data stays in the browser (`localStorage`). Nothing is sent to a server.

---

## Prerequisites

- Ruby 4.0+ with Bundler
- Node.js 18+ with npm
- A GitHub account (for Giscus discussions, optional)

---

## Quick Start

### 1. Clone and install

```sh
git clone https://github.com/MadBomber/bible_study_template.git my_study
cd my_study
bundle install && npm install
```

### 2. Start the development server

```sh
bin/bridgetown start
```

Open `http://localhost:4000`. You will see the sample content.

### 3. Build for production

```sh
bin/bridgetown deploy
```

Output goes to `output/`.

---

## Configuring Your Study

### Site identity — `src/_data/site_metadata.yml`

```yaml
title: "My Bible Study"
tagline: "A short phrase describing the study"
author: "Your Name"
email: you@example.com
description: >-
  A one-paragraph description for search engines and social sharing.
```

### Study structure — `src/_data/study_config.yml`

This is the master configuration. Every section and week count must be reflected here.

```yaml
storage_prefix: "myStudy"   # unique key for localStorage — no spaces

total_weeks: 12             # total weeks across all sections

sections:
  - number: 1
    title: "The Covenants"
    slug: "covenants"       # must match the directory name under src/
    weeks_start: 1
    weeks_end: 6
  - number: 2
    title: "The Kingdom"
    slug: "kingdom"
    weeks_start: 7
    weeks_end: 12
```

**Important:** When you change `storage_prefix`, also update the two string literals in `src/_partials/_head.erb` that reference `bst_settings`. Search for `bst_settings` and replace both occurrences with `<your_prefix>_settings`.

### Week-to-section routing — `src/_data/week_phases.yml`

Maps each week number to the section slug it belongs to. Must stay in sync with `study_config.yml`.

```yaml
1: covenants
2: covenants
# ...
7: kingdom
# ...
```

### Week and day titles — `src/_data/study_titles.json`

Powers the H.E.A.R. Journal header and reading plan. Add one entry per week.

```json
{
  "1": {
    "title": "The Covenant with Noah",
    "days": {
      "1": { "title": "Day 1 Title", "reading": "Genesis 6:1-22" },
      "2": { "title": "Day 2 Title", "reading": "Genesis 7:1-24" },
      "3": { "title": "Day 3 Title", "reading": "Genesis 8:1-22" },
      "4": { "title": "Day 4 Title", "reading": "Genesis 9:1-17" },
      "5": { "title": "Day 5 Title", "reading": "Genesis 9:18-29" }
    }
  }
}
```

---

## File Naming Conventions

All content lives under `src/`. The directory hierarchy mirrors the three-layer structure of the site.

### Directory names

| Level | Pattern | Example |
|-------|---------|---------|
| Study root | `{study-slug}/` | `src/study-01/` |
| Section | `{section-slug}/` | `src/study-01/section-01/` |
| Week | `week-NN/` (zero-padded) | `src/study-01/section-01/week-01/` |

Section slugs are arbitrary but must match `study_config.yml` and `week_phases.yml`. Use lowercase, hyphens only — no spaces or underscores.

Week directories are always two digits (`week-01`, `week-09`, `week-12`).

### File names within a week directory

| File | Purpose | Fixed name? |
|------|---------|-------------|
| `overview.md` | Week introduction | yes |
| `day-1.md` … `day-5.md` | Daily study pages | yes |
| `discussion.md` | Group discussion guide | yes |
| `memory-verse.md` | Weekly memory verse | yes |

All file names within a week are fixed. Do not rename them — the week navigation bar and JavaScript progress tracking depend on them.

### Study-level files

| File | Purpose |
|------|---------|
| `{study-slug}/index.md` | Study landing/overview page |
| `{study-slug}/memory-verses.erb` | Auto-generated memory verse table (do not edit) |
| `{study-slug}/reading-plan.erb` | Printable reading plan |
| `{study-slug}/hear-journal.erb` | H.E.A.R. journal app page |
| `{study-slug}/group-settings.erb` | Per-study settings page |
| `{study-slug}/{section-slug}/index.md` | Section overview page |

---

## Front Matter Reference

Every page type uses a specific set of front matter fields. The fields listed as **required** must be present for the page to render and for progress tracking and navigation to work correctly. Optional fields add content but are safe to omit.

### Study index — `src/{study-slug}/index.md`

```yaml
---
layout: page
title: "Study Title"
study_slug: study-01        # must match the directory name
---
```

### Section index — `src/{study-slug}/{section-slug}/index.md`

```yaml
---
layout: page
title: "Section 1: The Covenants"
section_number: 1           # integer; drives section progress tracking
study_slug: study-01
---
```

### Week overview — `src/{study-slug}/{section-slug}/week-NN/overview.md`

```yaml
---
layout: page
title: "The Covenant with Noah"
week: 1                     # integer; must match the directory number
section: "Section 1: The Covenants"
study_slug: study-01
date_range: "Days 1–5"      # optional; displayed in the page header
chapters:                   # optional; list of scripture chapters covered
  - Genesis 6
  - Genesis 7
tags:                       # optional
  - section-1
---
```

### Daily page — `src/{study-slug}/{section-slug}/week-NN/day-N.md`

```yaml
---
layout: page
title: "A World Gone Wrong"
week: 1
day: 1                      # integer 1–5; drives progress tracking
reading: "Genesis 6:1-22"   # optional; displayed in the journal header
parallel_passages: "Matthew 24:37-39"  # optional
section: "Section 1: The Covenants"
study_slug: study-01
tags:                       # optional
  - section-1
---
```

Suggested body sections:

```markdown
## Reading: Genesis 6:1–22

## Historical Context

## Key Themes

## Connections

## Reflection Questions

## Prayer
```

### Discussion guide — `src/{study-slug}/{section-slug}/week-NN/discussion.md`

```yaml
---
layout: page
title: "Week 1 Discussion"
week: 1
type: discussion            # required — drives progress tracking
section: "Section 1: The Covenants"
study_slug: study-01
tags:                       # optional
  - discussion
  - section-1
---
```

### Memory verse — `src/{study-slug}/{section-slug}/week-NN/memory-verse.md`

```yaml
---
layout: memory_verse
type: memory_verse          # required — drives layout logic and progress tracking
week: 1
title: "The Covenant with Noah"
section: "Section 1: The Covenants"
study_slug: study-01
memory_verse: "Genesis 9:13"         # reference only (book chapter:verse)
verse_text: "I have set my rainbow in the clouds, and it will be the sign of the covenant between me and the earth."
translation: "NIV"
connections:                # optional; shown at the bottom of the verse page
  - "Revelation 4:3 — a rainbow around the throne"
  - "2 Peter 2:5 — Noah as a herald of righteousness"
---

## Why This Verse

A short paragraph explaining why this verse captures the week's central theme
and why it is worth committing to memory.
```

| Field | Required | Notes |
|-------|----------|-------|
| `memory_verse` | yes | Book and reference, e.g. `"Genesis 9:13"` |
| `verse_text` | yes | The verse verbatim — used for audio playback and display everywhere |
| `translation` | yes | Version abbreviation, e.g. `ESV`, `NIV`, `NASB` |
| `connections` | no | Cross-references shown at the bottom of the verse page |
| `type: memory_verse` | yes | Do not change |
| `layout: memory_verse` | yes | Do not change |

Once the front matter is filled in, the site does the rest automatically:

- The **individual memory verse page** renders the verse, audio button, connections list, and "Why This Verse" body.
- Every **other page that week** (overview, days 1–5, discussion) shows a callout at the top and bottom with the verse and icons.
- The **study-level memory verses table** (`/{study-slug}/memory-verses/`) adds a row for the week — no editing required.

### Front matter fields at a glance

| Field | Used on | Purpose |
|-------|---------|---------|
| `layout` | all | Template to use — `page`, `memory_verse`, or `default` |
| `title` | all | Page title shown in `<h1>` and browser tab |
| `study_slug` | all content pages | Namespace for localStorage and cross-page lookups |
| `week` | week pages | Integer week number; drives nav, callouts, progress |
| `day` | day pages | Integer 1–5; drives progress tracking |
| `section` | week pages | Display label for the section (shown in breadcrumb) |
| `section_number` | section index | Integer; drives section-level progress tracking |
| `type` | discussion, memory verse | `discussion` or `memory_verse`; drives progress routing |
| `memory_verse` | memory-verse.md | Scripture reference |
| `verse_text` | memory-verse.md | Verbatim verse text |
| `translation` | memory-verse.md | Bible version abbreviation |
| `connections` | memory-verse.md | List of cross-references |

---

## Adding Content

Create a directory under `src/` for each new section, then add week directories inside it. The required file names within each week are fixed — see [File Naming Conventions](#file-naming-conventions) and [Front Matter Reference](#front-matter-reference) above for the full details.

```
src/
  {study-slug}/
    index.md
    memory-verses.erb         ← auto-generated; copy from an existing study
    {section-slug}/
      index.md
      week-01/
        overview.md
        day-1.md … day-5.md
        discussion.md
        memory-verse.md       ← fill in verse_text, memory_verse, translation
```

After adding files, register the new section in `study_config.yml` and `week_phases.yml`. No other configuration is needed.

---

## Enabling Giscus Discussions

Giscus displays GitHub Discussions as a comment widget on each page. It is opt-in — readers enable it in Settings.

1. Go to [giscus.app](https://giscus.app/) and configure it for your GitHub repo.
2. Copy the values it gives you into `frontend/javascript/discussions.js`:

```javascript
script.setAttribute("data-repo", "YOUR_GITHUB_USERNAME/YOUR_REPO")
script.setAttribute("data-repo-id", "YOUR_REPO_ID")
script.setAttribute("data-category", "Page Comments")
script.setAttribute("data-category-id", "YOUR_CATEGORY_ID")
```

---

## Deploying to GitHub Pages

1. Set `base_path` in `config/initializers.rb` to match your repo name:

```ruby
base_path "/my_study"
```

2. Update `publicPath` in `esbuild.config.js` to match:

```javascript
publicPath: "/my_study/_bridgetown/static"
```

3. Build and push the `output/` directory to your `gh-pages` branch, or configure a GitHub Actions workflow to run `bin/bridgetown deploy`.

---

## Deleting the Sample Content

Once you have added your own content, remove the sample:

1. Delete `src/sample/`
2. Remove the `sample` section from `src/_data/study_config.yml`
3. Remove the `1: sample` entry from `src/_data/week_phases.yml`
4. Clear the sample week from `src/_data/study_titles.json`
5. Update `src/index.md` if it references the sample section

---

## Project Structure

```
src/
  _data/
    site_metadata.yml     # site title, author, description
    study_config.yml      # sections, total weeks, storage prefix
    week_phases.yml       # week number → section slug map
    study_titles.json     # week/day titles and readings for journal
  _layouts/
    default.erb           # base layout; injects config JSON for JS
    home.erb              # homepage; loops sections from config
    page.erb              # weekly/daily pages with prev/next nav
    memory_verse.erb      # memory verse layout with audio widget
  _partials/
    _head.erb             # meta, CSS, FOUC-prevention script
    _footer.erb
  _components/shared/
    navbar.erb / navbar.rb
  <section-slug>/
    index.md              # section overview page
    week-NN/
      overview.md
      day-1.md … day-5.md
      discussion.md
      memory-verse.md
  index.md                # homepage
  memory-verses.erb       # auto-generated memory verses table
  reading-plan.erb        # auto-generated reading plan
  hear-journal.erb        # H.E.A.R. journal app page
  settings.erb            # reader settings page

frontend/
  javascript/
    index.js              # entry point; imports all modules
    progress.js           # progress tracking
    hear-journal.js       # journal UI and localStorage
    settings.js           # theme, font, feature toggles
    memory-verse-audio.js # audio playback for memory verses
    page-speak.js         # read-aloud
    group-share.js        # group email export
    discussions.js        # Giscus integration
    hamburger-menu.js     # mobile nav
  styles/
    index.css             # main stylesheet
    syntax-highlighting.css
```

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `bin/bridgetown start` | Development server at `localhost:4000` |
| `bin/bridgetown deploy` | Production build to `output/` |
| `bin/bridgetown console` | Interactive console with site loaded |
| `npm run esbuild` | Build frontend assets (minified) |
| `npm run esbuild-dev` | Build frontend assets in watch mode |
| `rake clean` | Remove build artifacts |
