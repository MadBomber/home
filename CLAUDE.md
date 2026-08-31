# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A [Bridgetown 2.1](https://www.bridgetownrb.com/) static site that publishes multiple Bible studies. Content is organized in three layers — **study → section → week → day** — with all reader data (progress, journal, settings) stored in `localStorage` only; nothing is sent to a server.

This repo extends the single-study template into a multi-study site. The landing page (`src/index.erb`) loops over entries in `src/_data/studies.yml` and renders a card for each study.

## Writing Style

When writing, editing, or reviewing essay/blog content (`src/blog/*.md`), follow [`STYLE.md`](STYLE.md) — the authoritative guide for voice, tone, sentence structure, Scripture formatting, footnote conventions, and essay structure. Consult it before drafting or revising any prose in this repo.

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
| `storage-keys.js` | The two global localStorage keys, shared by every module |
| `journal-entry.js` | The entry shape: text, timestamp, and week/day ordering helpers |
| `journal-print.js` | Renders the whole journal onto the print page |

### Journal

One page per study at `/{study-slug}/journal/`, plus a study-less fallback at `/journal/`, all rendered from `_partials/_journal_form.erb`. Three views, selected by query string:

| URL | View |
|-----|------|
| `?week=N&day=N` | that day's entry |
| `?week=N` | the week's five days as tabs |
| no params | week picker |

Each entry is a single autosizing textarea. There is no fixed structure: readers use it for study notes, prayer, questions, or anything else.

Every entry carries a timestamp in its `updated` field, shown in the entry header as a `<time class="journal-timestamp">` — in the page header for a day view, under the reading in each week-view tab. It shows the entry's own saved time; an entry not yet written shows the current date and time. Writing repaints it from storage, so the header and the stored value can never disagree.

Above every entry box is a menu that inserts either a method's questions (H.E.A.R., S.O.A.P., O.I.A., A.C.T.S., all defined in `journal-prompt.js`) or one random question from `src/_data/journal_prompts.yml`. An empty entry is replaced; an entry that already holds the reader's writing is appended to, so insertion can never destroy anything.

The ghost text in an empty box comes from the reader's own setting (`journalPromptMethod` and `journalPlaceholder` inside `bst_settings`), chosen on the settings page under **Journal Data**.

## Key Invariants

- **`storage_prefix`** in each `study_config.yml` must be unique across studies. It scopes the per-study keys only — `<prefix>_journal` and `<prefix>_progress`.
- Settings (`bst_settings`) and the study group (`bst_group`) are **global**, not per-study: one settings object and one group list for the whole site. Both names live in `frontend/javascript/storage-keys.js` and every module imports them from there. The single exception is the FOUC-prevention script in `src/_partials/_head.erb`, which runs before the bundle and repeats `"bst_settings"` by hand.
- Journal entries live in `localStorage` under `<storage_prefix>_journal`, keyed `w{week}-d{day}`, shaped `{ text, reading, title, updated }`. The older `<storage_prefix>_hear` key and its `h`/`e`/`a`/`r` fields are no longer read by anything; that data is orphaned rather than deleted.
- An entry with no text in it is not stored: emptying the box deletes the entry. The text field is the whole entry, so a blank one is nothing — counts, exports and imports never include them.
- `updated` is the entry's timestamp. `saveEntry` in `journal.js` stamps it on every save and it travels with the entry through export and import; nothing else should write it.
- Anything that reads an entry — its text, its timestamp, its place in week/day order — goes through `frontend/javascript/journal-entry.js`. Three modules had grown their own `entryText`; do not add a fourth.
- JSON is the journal's only file format, and the only thing Import reads. A readable copy comes from the print page instead — the browser's own Print / Save as PDF.
- Every study has a print page at `/{study-slug}/journal/print/` (plus a study-less `/journal/print/`), rendered from `src/_partials/_journal_print.erb` by `journal-print.js`. The pages are generated one per entry in `src/_data/studies.yml`; adding a study means adding `src/{slug}/journal-print.erb` alongside its `journal.erb`. `print_heading` in the front matter is the on-page `<h1>`; `title` becomes the `<title>`, which is what browsers use to name the saved PDF.
- Entry text goes into the print page with `textContent`, never `innerHTML`, and `.journal-print-text` uses `white-space: pre-wrap`. The reader's line breaks survive and their angle brackets stay literal.
- Journal prompts belong in `src/_data/journal_prompts.yml` and nowhere else. `src/documents/journaling.md` renders its lists from that file and `_journal_form.erb` injects the same data for the entry menu, so adding a prompt in one place is enough.
- Prompt method wording and the default placeholder live only in `frontend/javascript/journal-prompt.js`. Do not repeat either in ERB or CSS.
- Inject JSON into a page with `<%==`, never `<%=`. ERB escapes quotes to `&quot;`, and `JSON.parse` then fails at runtime with no build error.
- **`base_path`** in `config/initializers.rb` and `publicPath` in `esbuild.config.js` are both derived automatically from `File.basename(Dir.pwd)` / `import.meta.url` — they always equal the repo directory name and require no manual editing.
- Week directory names are always zero-padded two digits (`week-01`, not `week-1`). File names within a week are fixed (`overview.md`, `day-1.md`–`day-5.md`, `discussion.md`, `memory-verse.md`).
- When adding a new section or week, update both `study_config.yml` and `week_phases.yml` for that study; no other configuration is needed.
- Adding a new study requires: a directory under `src/`, a data directory under `src/_data/`, and an entry in `src/_data/studies.yml`.
- Set `hidden: true` on a studies.yml entry to omit it from the landing page (use while a study is under construction). Omitting the key or setting it to `false` shows the study.
