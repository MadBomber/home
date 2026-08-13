import {
  PROMPT_METHODS,
  findMethod,
  getJournalPlaceholder,
  getPromptLibrary,
  methodInsertText,
  randomPrompt,
} from "./journal-prompt.js"
import {
  entryText,
  entryTimestamp,
  formatTimestamp,
  hasText,
} from "./journal-entry.js"

// --- Storage keys (derived from injected study config) ---

function getStoragePrefix() {
  try {
    const el = document.getElementById("study-config-data")
    if (!el) return "bst"
    return JSON.parse(el.textContent).storage_prefix || "bst"
  } catch { return "bst" }
}

function getJournalKey() { return `${getStoragePrefix()}_journal` }

function getStudySlug() {
  try {
    const el = document.getElementById("study-slug-data")
    if (!el) return ""
    return JSON.parse(el.textContent) || ""
  } catch { return "" }
}


// --- Storage ---

function getJournal() {
  try {
    const data = localStorage.getItem(getJournalKey())
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveJournal(journal) {
  localStorage.setItem(getJournalKey(), JSON.stringify(journal))
}

function entryKey(week, day) {
  return `w${week}-d${day}`
}

function getEntry(week, day) {
  return getJournal()[entryKey(week, day)] || null
}

// The text is the whole entry now, so an entry emptied of text is no entry at
// all: it is removed rather than stored blank, which keeps the export, the
// entry counts on the settings page and the week picker honest.
function saveEntry(week, day, entry) {
  const journal = getJournal()
  if (hasText(entry)) {
    entry.updated = new Date().toISOString()
    journal[entryKey(week, day)] = entry
  } else {
    delete journal[entryKey(week, day)]
  }
  saveJournal(journal)
}

// --- Entry text ---

function buildEntry(existing, text, reading, title) {
  const entry = Object.assign({}, existing)
  entry.text = text
  if (reading) entry.reading = reading
  if (title) entry.title = title
  return entry
}

function autosize(textarea) {
  textarea.style.height = "auto"
  textarea.style.height = `${textarea.scrollHeight}px`
}

// --- Entry timestamp ---

function showTimestamp(el, entry) {
  if (!el) return
  const date = entryTimestamp(entry)
  el.setAttribute("datetime", date.toISOString())
  el.textContent = formatTimestamp(date)
}

// --- Prompt menu ---

// Ghost text vanishes at the first keystroke, which is exactly when a prompt is
// still needed. This menu puts the questions into the entry as real text.
// An empty entry is replaced; an entry with writing in it is appended to, so
// nothing the reader wrote is ever lost.
function addPromptMenu(textarea, onChange) {
  const hasLibrary = getPromptLibrary().length > 0

  const select = document.createElement("select")
  select.className = "journal-prompt-menu"
  select.setAttribute("aria-label", "Insert a prompt into this entry")

  const options = [
    { value: "", label: "Insert a prompt…" },
    ...PROMPT_METHODS.map(method => ({ value: `method:${method.id}`, label: method.name })),
  ]
  if (hasLibrary) options.push({ value: "random", label: "Random question" })

  for (const option of options) {
    const el = document.createElement("option")
    el.value = option.value
    el.textContent = option.label
    select.appendChild(el)
  }

  let inserted = ""
  let lastPrompt = ""

  function untouched() {
    return textarea.value.trim() === "" || textarea.value === inserted
  }

  function insert(text) {
    let cursorAt
    if (untouched()) {
      textarea.value = text
      inserted = text
      cursorAt = text.indexOf("\n") + 1
    } else {
      const existing = textarea.value.replace(/\s+$/, "")
      textarea.value = `${existing}\n\n${text}`
      inserted = ""
      cursorAt = textarea.value.length
    }

    autosize(textarea)
    textarea.focus()
    textarea.setSelectionRange(cursorAt, cursorAt)
    onChange()
  }

  select.addEventListener("change", () => {
    const choice = select.value
    select.value = "" // so the same choice can be picked again

    if (choice === "random") {
      const prompt = randomPrompt(lastPrompt)
      if (!prompt) return
      lastPrompt = prompt
      insert(`${prompt}\n\n`)
      return
    }

    const method = findMethod(choice.replace("method:", ""))
    if (method) insert(methodInsertText(method))
  })

  return select
}

// --- Study config (injected by default.erb) ---

function getStudyConfig() {
  const el = document.getElementById("study-config-data")
  if (!el) return { total_weeks: 52, sections: [] }
  try { return JSON.parse(el.textContent) } catch { return { total_weeks: 52, sections: [] } }
}

function getTotalWeeks() {
  return getStudyConfig().total_weeks || 52
}

// --- Study titles lookup ---

function getStudyTitles() {
  const el = document.getElementById("study-titles-data")
  if (!el) return {}
  try { return JSON.parse(el.textContent) } catch { return {} }
}

function weekTitle(week) {
  const titles = getStudyTitles()
  const w = titles[String(week)]
  return w ? w.title : ""
}

function dayTitle(week, day) {
  const titles = getStudyTitles()
  const w = titles[String(week)]
  if (!w || !w.days) return ""
  const d = w.days[String(day)]
  return d ? d.title : ""
}

function dayReading(week, day) {
  const titles = getStudyTitles()
  const w = titles[String(week)]
  if (!w || !w.days) return ""
  const d = w.days[String(day)]
  return d ? d.reading : ""
}

// --- URL mapping (data-driven from study-config-data) ---

function weekPath(week) {
  const config = getStudyConfig()
  const section = (config.sections || []).find(s => week >= s.weeks_start && week <= s.weeks_end)
  if (!section) return "/"
  const wk = String(week).padStart(2, "0")
  const basePath = document.body?.dataset?.basePath || ""
  const studySlug = getStudySlug()
  const studyPfx = studySlug ? `/${studySlug}` : ""
  return `${basePath}${studyPfx}/${section.slug}/week-${wk}`
}

// --- Query params ---

function getParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    week: params.get("week") ? parseInt(params.get("week"), 10) : null,
    day: params.get("day") ? parseInt(params.get("day"), 10) : null,
    reading: params.get("reading") || "",
    title: params.get("title") || "",
  }
}

// --- Day form ---

function initDayForm(week, day, reading, title) {
  const titleEl = document.getElementById("journal-title")
  const contextEl = document.getElementById("journal-context")
  const form = document.getElementById("journal-day-form")
  const statusEl = document.getElementById("journal-status")

  const dTitle = title || dayTitle(week, day) || "Journal Entry"
  const dReading = reading || dayReading(week, day)
  titleEl.textContent = `Week ${week}, Day ${day}: ${dTitle}`
  if (dReading) contextEl.textContent = `Reading: ${dReading}`
  form.style.display = "block"

  const textarea = document.getElementById("journal-text")
  if (!textarea) return

  const timestampEl = document.getElementById("journal-timestamp")

  textarea.placeholder = getJournalPlaceholder()
  textarea.value = entryText(getEntry(week, day))
  showTimestamp(timestampEl, getEntry(week, day))
  autosize(textarea)

  function save() {
    saveEntry(week, day, buildEntry(getEntry(week, day), textarea.value, dReading, dTitle))
    // Read back rather than trust the entry just built: an emptied box deletes
    // it, and the header falls back to the current date and time.
    showTimestamp(timestampEl, getEntry(week, day))
    showStatus(statusEl, "Saved")
  }

  let saveTimeout = null
  textarea.addEventListener("input", () => {
    autosize(textarea)
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(save, 800)
  })

  textarea.parentNode.insertBefore(addPromptMenu(textarea, save), textarea)
}

function showStatus(el, message) {
  el.textContent = message
  el.classList.add("visible")
  setTimeout(() => { el.classList.remove("visible") }, 2000)
}

// --- Week view ---

function initWeekView(week) {
  const titleEl = document.getElementById("journal-title")
  const weekView = document.getElementById("journal-week-view")
  const entriesEl = document.getElementById("journal-week-entries")

  const wTitle = weekTitle(week)
  titleEl.textContent = `Week ${week} Journal`
  if (wTitle) {
    const contextEl = document.getElementById("journal-context")
    contextEl.textContent = wTitle
  }
  weekView.style.display = "block"

  const tabBar = document.createElement("div")
  tabBar.classList.add("journal-tabs")

  const panels = []

  for (let d = 1; d <= 5; d++) {
    const entry = getEntry(week, d) || {}
    const dTitle = dayTitle(week, d) || entry.title || `Day ${d}`
    const dReading = dayReading(week, d) || entry.reading || ""
    const hasContent = hasText(entry)

    const tab = document.createElement("button")
    tab.classList.add("journal-tab")
    tab.setAttribute("role", "tab")
    tab.setAttribute("aria-selected", d === 1 ? "true" : "false")
    tab.innerHTML = `<span class="journal-tab-num">Day ${d}</span>`
    if (hasContent) tab.classList.add("has-entry")
    tabBar.appendChild(tab)

    const panel = document.createElement("div")
    panel.classList.add("journal-tab-panel")
    panel.setAttribute("role", "tabpanel")
    if (d !== 1) panel.style.display = "none"

    const dayHeader = document.createElement("h3")
    const dayLink = document.createElement("a")
    dayLink.href = `${weekPath(week)}/day-${d}`
    dayLink.textContent = dTitle
    dayHeader.appendChild(dayLink)
    panel.appendChild(dayHeader)

    if (dReading) {
      const readingEl = document.createElement("p")
      readingEl.classList.add("journal-week-reading")
      readingEl.textContent = dReading
      panel.appendChild(readingEl)
    }

    const timestampEl = document.createElement("time")
    timestampEl.classList.add("journal-timestamp")
    showTimestamp(timestampEl, entry)
    panel.appendChild(timestampEl)

    const statusEl = document.createElement("div")
    statusEl.classList.add("journal-status")

    const fieldDiv = document.createElement("div")
    fieldDiv.classList.add("journal-field")

    const textarea = document.createElement("textarea")
    textarea.classList.add("journal-entry")
    textarea.rows = 12
    textarea.setAttribute("aria-label", `Journal entry for day ${d}`)
    textarea.placeholder = getJournalPlaceholder()
    textarea.value = entryText(entry)

    fieldDiv.appendChild(addPromptMenu(textarea, saveDay))
    fieldDiv.appendChild(textarea)
    panel.appendChild(fieldDiv)
    panel.appendChild(statusEl)

    function saveDay() {
      const edited = buildEntry(getEntry(week, d), textarea.value, dReading, dTitle)
      saveEntry(week, d, edited)
      showTimestamp(timestampEl, getEntry(week, d))
      showStatus(statusEl, "Saved")
      tab.classList.toggle("has-entry", hasText(edited))
    }

    let saveTimeout = null
    textarea.addEventListener("input", () => {
      autosize(textarea)
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(saveDay, 800)
    })



    panels.push(panel)

    tab.addEventListener("click", () => {
      tabBar.querySelectorAll(".journal-tab").forEach(t => {
        t.classList.remove("active")
        t.setAttribute("aria-selected", "false")
      })
      tab.classList.add("active")
      tab.setAttribute("aria-selected", "true")
      panels.forEach(p => p.style.display = "none")
      panel.style.display = "block"
      autosize(textarea)
    })
  }

  tabBar.querySelector(".journal-tab").classList.add("active")
  entriesEl.appendChild(tabBar)
  panels.forEach(p => entriesEl.appendChild(p))

  // A textarea has no scrollHeight until it is both in the DOM and visible,
  // so the first panel is sized here and the rest on tab activation.
  const firstTextarea = panels[0].querySelector("textarea")
  if (firstTextarea) autosize(firstTextarea)
}

// --- No params view ---

function initNoParams() {
  const noParams = document.getElementById("journal-no-params")
  noParams.style.display = "block"

  const select = document.getElementById("journal-week-select")
  const journal = getJournal()
  const totalWeeks = getTotalWeeks()

  for (let w = 1; w <= totalWeeks; w++) {
    const opt = document.createElement("option")
    opt.value = w
    let hasEntry = false
    for (let d = 1; d <= 5; d++) {
      if (hasText(journal[entryKey(w, d)])) { hasEntry = true; break }
    }
    opt.textContent = `Week ${w}${hasEntry ? " *" : ""}`
    select.appendChild(opt)
  }

  document.getElementById("journal-week-go").addEventListener("click", () => {
    const week = select.value
    if (week) window.location.search = `?week=${week}`
  })
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  const journalEl = document.getElementById("journal")
  if (!journalEl) return

  const { week, day, reading, title } = getParams()

  if (week && day) {
    initDayForm(week, day, reading, title)
  } else if (week) {
    initWeekView(week)
  } else {
    initNoParams()
  }
})
