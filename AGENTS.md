# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What This Is

A [Bridgetown 2.1](https://www.bridgetownrb.com/) static site that publishes multiple Bible studies. Content is organized in three layers — **study → section → week → day** — with all reader data (progress, journal, settings) stored in `localStorage` only; nothing is sent to a server.

This repo extends the single-study template into a multi-study site. The landing page (`src/index.erb`) loops over entries in `src/_data/studies.yml` and renders a card for each study.

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

## Architecture

### Multi-study data layout

Each study has its own data directory that mirrors the top-level data files:

```
src/_data/
  studies.yml          # registry — one entry per study (slug, title, tagline, image, description)
  journal_prompts.yml  # journal prompt groups, shared by the Journaling document and the entry menu
  study_config.yml     # fallback/global config (used by sample content)
  study_titles.json    # fallback
  week_phases.yml      # fallback
  study_01/
    study_config.yml   # sections, total_weeks, storage_prefix for study-01
    study_titles.json  # week/day titles and readings for study-01
    week_phases.yml    # week number → section slug map for study-01
  study_02/
    …
```

### Content structure

```
src/
  {study-slug}/                    # e.g. study-01/
    index.md
    memory-verses.erb
    reading-plan.erb
    journal.erb
    group-settings.erb
    documents/                     # study-specific document overrides
    {section-slug}/                # e.g. section-01/
      index.md
      week-NN/                     # zero-padded, e.g. week-01/
        overview.md
        day-1.md … day-5.md
        discussion.md
        memory-verse.md
  documents/                       # global shared documents (how-to-use, journaling, about)
```

### Document resolution (`plugins/builders/document_resolver.rb`)

The `DocumentResolver` builder runs at `post_read` and merges global documents under `src/documents/` with per-study overrides under `src/{study-slug}/documents/`. The merged list is stored in `site.data[:resolved_documents]` keyed by study slug and `"global"`. Preferred display order is `choose-jesus → how-to-use → journaling → about`.

### Layouts and partials

- `default.erb` — base shell; injects study config JSON for JavaScript consumption
- `page.erb` — weekly/daily pages with prev/next nav and memory verse callout
- `memory_verse.erb` — verse display with audio widget
- `home.erb` — landing page
- `_partials/_head.erb` — meta, CSS, FOUC-prevention script; contains two `bst_settings` literals that must be updated if `storage_prefix` changes
- `_partials/_journal_form.erb` — the journal page body (day form, week tabs, week picker); also injects the prompt library as JSON

### Frontend (esbuild + PostCSS)

Entry point: `frontend/javascript/index.js`. Each feature is its own module:

| File | Responsibility |
|------|---------------|
| `progress.js` | Day/week/section completion tracking in localStorage |
| `journal.js` | Journal entry CRUD, and the prompt menu above each entry |
| `journal-prompt.js` | Prompt methods, the prompt library, and the reader's chosen prompt |
| `settings.js` | Theme, font size, feature toggles |
| `memory-verse-audio.js` | TTS for memory verse pages |
| `page-speak.js` | Read-aloud for any page |
| `discussions.js` | Giscus (GitHub Discussions) widget |
| `group-share.js` | Email export of journal entries |

### Journal

One page per study at `/{study-slug}/journal/`, plus a study-less fallback at `/journal/`, all rendered from `_partials/_journal_form.erb`. Three views, selected by query string:

| URL | View |
|-----|------|
| `?week=N&day=N` | that day's entry |
| `?week=N` | the week's five days as tabs |
| no params | week picker |

Each entry is a single autosizing textarea. There is no fixed structure: readers use it for study notes, prayer, questions, or anything else.

Above every entry box is a menu that inserts either a method's questions (H.E.A.R., S.O.A.P., O.I.A., A.C.T.S., all defined in `journal-prompt.js`) or one random question from `src/_data/journal_prompts.yml`. An empty entry is replaced; an entry that already holds the reader's writing is appended to, so insertion can never destroy anything.

The ghost text in an empty box comes from the reader's own setting (`journalPromptMethod` and `journalPlaceholder` inside `bst_settings`), chosen on the settings page under **Journal Data**.

## Key Invariants

- **`storage_prefix`** in each `study_config.yml` must be unique across studies. When changing it, also update the two `bst_settings` string literals in `src/_partials/_head.erb`.
- Journal entries live in `localStorage` under `<storage_prefix>_journal`, keyed `w{week}-d{day}`, shaped `{ text, reading, title, updated }`. The older `<storage_prefix>_hear` key and its `h`/`e`/`a`/`r` fields are no longer read by anything; that data is orphaned rather than deleted.
- Journal prompts belong in `src/_data/journal_prompts.yml` and nowhere else. `src/documents/journaling.md` renders its lists from that file and `_journal_form.erb` injects the same data for the entry menu, so adding a prompt in one place is enough.
- Prompt method wording and the default placeholder live only in `frontend/javascript/journal-prompt.js`. Do not repeat either in ERB or CSS.
- Inject JSON into a page with `<%==`, never `<%=`. ERB escapes quotes to `&quot;`, and `JSON.parse` then fails at runtime with no build error.
- **`base_path`** in `config/initializers.rb` and `publicPath` in `esbuild.config.js` are both derived automatically from `File.basename(Dir.pwd)` / `import.meta.url` — they always equal the repo directory name and require no manual editing.
- Week directory names are always zero-padded two digits (`week-01`, not `week-1`). File names within a week are fixed (`overview.md`, `day-1.md`–`day-5.md`, `discussion.md`, `memory-verse.md`).
- When adding a new section or week, update both `study_config.yml` and `week_phases.yml` for that study; no other configuration is needed.
- Adding a new study requires: a directory under `src/`, a data directory under `src/_data/`, and an entry in `src/_data/studies.yml`.
- Set `hidden: true` on a studies.yml entry to omit it from the landing page (use while a study is under construction). Omitting the key or setting it to `false` shows the study.
