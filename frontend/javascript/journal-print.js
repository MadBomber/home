// The whole journal for one study on a single page, laid out for reading and
// for the browser's own Print / Save as PDF. It renders from localStorage like
// every other reader feature, so the page is empty for anyone but its owner.

import {
  entryPosition,
  entryText,
  entryTimestamp,
  formatTimestamp,
  sortedEntries,
} from "./journal-entry.js"

// --- Study data (injected by default.erb) ---

function readJSON(id, fallback) {
  const el = document.getElementById(id)
  if (!el) return fallback
  try { return JSON.parse(el.textContent) } catch { return fallback }
}

function getStoragePrefix() {
  return readJSON("study-config-data", {}).storage_prefix || "bst"
}

function getJournal() {
  try {
    const data = JSON.parse(localStorage.getItem(`${getStoragePrefix()}_journal`) || "{}")
    return typeof data === "object" && data !== null && !Array.isArray(data) ? data : {}
  } catch {
    return {}
  }
}

// The reader's own title and reading are stored on the entry, but fall back to
// the study's titles file so an entry written before either was recorded still
// prints with its heading.
function dayFacts(week, day) {
  const titles = readJSON("study-titles-data", {})
  const w = titles[String(week)]
  const d = w && w.days ? w.days[String(day)] : null
  return { title: d ? d.title : "", reading: d ? d.reading : "" }
}

// --- Rendering ---

function entrySection(key, entry) {
  const position = entryPosition(key)
  const facts = position ? dayFacts(position.week, position.day) : { title: "", reading: "" }
  const label = position ? `Week ${position.week}, Day ${position.day}` : key
  const title = entry.title || facts.title
  const reading = entry.reading || facts.reading

  const section = document.createElement("section")
  section.className = "journal-print-entry"

  const heading = document.createElement("h2")
  heading.textContent = title ? `${label} — ${title}` : label
  section.appendChild(heading)

  const meta = [reading, formatTimestamp(entryTimestamp(entry))].filter(Boolean).join(" · ")
  const metaEl = document.createElement("p")
  metaEl.className = "journal-print-meta"
  metaEl.textContent = meta
  section.appendChild(metaEl)

  // textContent, not innerHTML: the entry is the reader's plain text, and CSS
  // white-space keeps their line breaks without any markup being interpreted.
  const body = document.createElement("div")
  body.className = "journal-print-text"
  body.textContent = entryText(entry).trim()
  section.appendChild(body)

  return section
}

function renderEmpty(container) {
  const p = document.createElement("p")
  p.className = "journal-print-empty"
  p.textContent = "There are no journal entries in this browser for this study yet."
  container.appendChild(p)
}

function render() {
  const container = document.getElementById("journal-print-entries")
  const summary = document.getElementById("journal-print-summary")
  const actions = document.getElementById("journal-print-actions")
  if (!container) return

  const entries = sortedEntries(getJournal()).filter(([, entry]) => entryText(entry).trim())
  const count = entries.length

  if (summary) {
    summary.textContent = count === 0
      ? ""
      : `${count} ${count === 1 ? "entry" : "entries"} · printed ${formatTimestamp(new Date())}`
  }

  if (count === 0) {
    if (actions) actions.style.display = "none"
    renderEmpty(container)
    return
  }

  for (const [key, entry] of entries) container.appendChild(entrySection(key, entry))
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("journal-print")) return
  render()

  const printBtn = document.getElementById("journal-print-button")
  if (printBtn) printBtn.addEventListener("click", () => window.print())
})
