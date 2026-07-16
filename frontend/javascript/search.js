// Essay search for the Search tab on /blog/.
//
// The index (src/search-index.json, ~190K gzipped) is fetched on the reader's
// first submitted query and cached for the rest of the session — never on page
// load. Everything below assumes that index is the only data source; there is
// no server involved.

const INDEX_URL = "/search-index.json"
const SNIPPET_RADIUS = 90
const MAX_RESULTS = 20

let searchIndex = null   // cached entries once fetched
let indexRequest = null  // in-flight fetch, so a double-submit doesn't refetch

// --- Index loading ---

async function loadIndex() {
  if (searchIndex) return searchIndex
  if (indexRequest) return indexRequest

  indexRequest = fetch(INDEX_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Search index request failed: ${response.status}`)
      return response.json()
    })
    .then((entries) => {
      // Precompute the lowercased fields once; every query reuses them.
      searchIndex = entries.map((entry) => ({
        ...entry,
        _title: entry.title.toLowerCase(),
        _description: (entry.description || "").toLowerCase(),
        _content: (entry.content || "").toLowerCase(),
      }))
      return searchIndex
    })
    .finally(() => { indexRequest = null })

  return indexRequest
}

// --- Query handling ---

// Single letters ("a", "I") are noise, but single digits carry meaning in a
// Scripture reference — "John 3" must not silently become a search for "John".
function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((token) => token.length > 1 || /^[0-9]$/.test(token))
}

// A query is a list of terms, all of which must match (AND). A run of words
// inside double quotes becomes a single phrase term that must appear intact,
// so `"acts 14"` is a different query from `acts 14`.
function parseQuery(query) {
  const terms = []

  const unquoted = query.replace(/[“"]([^”"]*)[”"]/g, (_match, phrase) => {
    const words = tokenize(phrase)
    if (words.length === 1) terms.push({ type: "word", value: words[0] })
    else if (words.length > 1) terms.push({ type: "phrase", value: words })
    return " "
  })

  for (const word of tokenize(unquoted)) terms.push({ type: "word", value: word })

  return terms
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Match on a word boundary but allow any suffix, so "pray" finds "prayer" and
// "praying" — the "close matches" a reader expects without a stemmer. Phrase
// terms allow any run of non-word characters between words, so `"acts 14"`
// still matches "Acts 14:23".
function termRegExp(term, flags = "g") {
  const words = term.type === "phrase" ? term.value : [term.value]
  const pattern = words.map(escapeRegExp).join("\\W+")
  return new RegExp(`\\b${pattern}`, flags)
}

function countMatches(haystack, term) {
  const matches = haystack.match(termRegExp(term))
  return matches ? matches.length : 0
}

// Every term must appear somewhere in the essay; a single miss disqualifies it.
// Returns 0 for "no match" so callers can filter on score alone.
function scoreEntry(entry, terms) {
  let score = 0

  for (const term of terms) {
    const inTitle = countMatches(entry._title, term)
    const inDescription = countMatches(entry._description, term)
    const inContent = countMatches(entry._content, term)

    if (inTitle + inDescription + inContent === 0) return 0

    // A title hit is worth far more than a body hit, and body hits are capped so
    // one long essay repeating a word can't bury a short essay that's about it.
    score += inTitle * 10
    score += inDescription * 4
    score += Math.min(inContent, 12)
  }

  return score
}

function search(entries, query) {
  const terms = parseQuery(query)
  if (terms.length === 0) return []

  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((result) => ({ ...result, snippet: buildSnippet(result.entry, terms) }))
}

// --- Rendering ---

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function highlight(text, terms) {
  let html = escapeHtml(text)
  for (const term of terms) {
    html = html.replace(termRegExp(term, "gi"), (match) => `<mark>${match}</mark>`)
  }
  return html
}

// Pull a window of prose around the first matching term so the reader can see
// why an essay matched, rather than just its description.
function buildSnippet(entry, terms) {
  const content = entry.content || ""
  if (!content) return ""

  let position = -1
  for (const term of terms) {
    const match = entry._content.search(termRegExp(term))
    if (match !== -1 && (position === -1 || match < position)) position = match
  }
  if (position === -1) return ""

  let start = Math.max(0, position - SNIPPET_RADIUS)
  let end = Math.min(content.length, position + SNIPPET_RADIUS)

  // Avoid slicing words in half.
  if (start > 0) {
    const space = content.indexOf(" ", start)
    if (space !== -1 && space < position) start = space + 1
  }
  if (end < content.length) {
    const space = content.lastIndexOf(" ", end)
    if (space !== -1 && space > position) end = space
  }

  const prefix = start > 0 ? "…" : ""
  const suffix = end < content.length ? "…" : ""
  return prefix + content.slice(start, end).trim() + suffix
}

function resultCard(result, terms) {
  const { entry, snippet } = result
  const card = document.createElement("a")
  card.className = "blog-post-card search-result-card"
  card.href = entry.url

  const meta = [entry.date, entry.collection ? "Collection" : null].filter(Boolean).join(" · ")

  card.innerHTML = `
    <div class="blog-post-card-header">
      <h2>${highlight(entry.title, terms)}</h2>
    </div>
    <div class="blog-post-card-body">
      ${meta ? `<p class="blog-post-card-meta"><span class="blog-post-card-date">${escapeHtml(meta)}</span></p>` : ""}
      ${snippet ? `<p class="search-result-snippet">${highlight(snippet, terms)}</p>` : ""}
      <span class="blog-post-card-read">Read article &rarr;</span>
    </div>
  `
  return card
}

// A phrase is shown quoted, so `“acts 17”` reads as one term rather than two.
function termLabel(term) {
  return term.type === "phrase" ? `“${term.value.join(" ")}”` : term.value
}

// "11 essays found containing acts AND 17" — spelling out the joins makes the
// AND condition obvious without the reader having to find the hint text.
// Built from nodes rather than a template string: these are the reader's own
// words coming back out, and textContent can't inject anything.
function countLine(total, terms) {
  const line = document.createElement("p")
  line.className = "search-result-count"
  line.appendChild(
    document.createTextNode(`${total} ${total === 1 ? "essay" : "essays"} found containing `)
  )

  terms.forEach((term, index) => {
    if (index > 0) {
      const join = document.createElement("span")
      join.className = "search-count-and"
      join.textContent = "AND"
      line.append(" ", join, " ")
    }
    const label = document.createElement("span")
    label.className = "search-count-term"
    label.textContent = termLabel(term)
    line.appendChild(label)
  })

  return line
}

function renderResults(container, results, query) {
  container.innerHTML = ""
  const terms = parseQuery(query)

  if (results.length === 0) {
    const empty = document.createElement("p")
    empty.className = "blog-empty search-message"
    empty.textContent = "No results were found."
    container.appendChild(empty)
    return
  }

  container.appendChild(countLine(results.length, terms))

  const list = document.createElement("div")
  list.className = "blog-post-list"
  for (const result of results) list.appendChild(resultCard(result, terms))
  container.appendChild(list)
}

function renderMessage(container, message) {
  container.innerHTML = ""
  const p = document.createElement("p")
  p.className = "blog-empty search-message"
  p.textContent = message
  container.appendChild(p)
}

// --- Wiring ---

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("blog-search-form")
  if (!form) return

  const input = document.getElementById("blog-search-input")
  const results = document.getElementById("blog-search-results")
  const clearButton = document.getElementById("blog-search-clear")

  form.addEventListener("submit", async (event) => {
    event.preventDefault()

    const query = input.value.trim()
    if (!query) {
      renderMessage(results, "Enter a word or phrase to search for.")
      return
    }

    renderMessage(results, "Searching…")

    try {
      const entries = await loadIndex()
      renderResults(results, search(entries, query), query)
    } catch (error) {
      console.error(error)
      renderMessage(results, "The search index could not be loaded. Please try again.")
    }
  })

  clearButton?.addEventListener("click", () => {
    input.value = ""
    results.innerHTML = ""
    input.focus()
  })
})
