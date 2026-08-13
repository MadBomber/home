import {
  CUSTOM_METHOD,
  DEFAULT_JOURNAL_PLACEHOLDER,
  PROMPT_METHODS,
  findMethod,
  methodPlaceholder,
} from "./journal-prompt.js"
import { GROUP_KEY, SETTINGS_KEY } from "./storage-keys.js"
import { entryText } from "./journal-entry.js"

const DEFAULT_SETTINGS = {
  features: {
    journal: true,
    speak: true,
    group: false,
    discussions: false,
  },
  siteTheme: "light",
  fontSize: 18,
  journalPromptMethod: CUSTOM_METHOD,
  journalPlaceholder: DEFAULT_JOURNAL_PLACEHOLDER,
}

// --- Settings storage ---

function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
    return {
      features: { ...DEFAULT_SETTINGS.features, ...(stored.features || {}) },
      siteTheme: stored.siteTheme || DEFAULT_SETTINGS.siteTheme,
      fontSize: parseInt(stored.fontSize, 10) || DEFAULT_SETTINGS.fontSize,
      journalPromptMethod: findMethod(stored.journalPromptMethod)
        ? stored.journalPromptMethod
        : DEFAULT_SETTINGS.journalPromptMethod,
      journalPlaceholder: typeof stored.journalPlaceholder === "string"
        ? stored.journalPlaceholder
        : DEFAULT_SETTINGS.journalPlaceholder,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  applyFeatureVisibility()
}

// --- Site theme ---

function syncGiscusTheme(siteTheme) {
  const themeMap = { light: "light", dark: "dark", auto: "preferred_color_scheme" }
  const iframe = document.querySelector("iframe.giscus-frame")
  if (!iframe) return
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme: themeMap[siteTheme] || "light" } } },
    "https://giscus.app"
  )
}

function applySiteTheme() {
  const settings = getSettings()
  document.documentElement.setAttribute("data-theme", settings.siteTheme)
  syncGiscusTheme(settings.siteTheme)
}

// --- Font size ---

function applyFontSize() {
  const settings = getSettings()
  document.documentElement.style.fontSize = (settings.fontSize || 18) + "px"
}

// --- Feature visibility ---

function applyFeatureVisibility() {
  const settings = getSettings()
  document.querySelectorAll("[data-feature]").forEach(el => {
    const feature = el.dataset.feature
    if (feature in settings.features) {
      el.style.display = settings.features[feature] ? "" : "none"
    }
  })
}

// --- Journal entry prompt (the ghost text in an empty entry box) ---

function initJournalPlaceholder() {
  const select = document.getElementById("setting-journal-method")
  const field = document.getElementById("setting-journal-placeholder")
  if (!select || !field) return

  const options = [
    { id: CUSTOM_METHOD, name: "Write my own" },
    ...PROMPT_METHODS.map(method => ({ id: method.id, name: method.name })),
  ]

  for (const option of options) {
    const el = document.createElement("option")
    el.value = option.id
    el.textContent = option.name
    select.appendChild(el)
  }

  field.placeholder = DEFAULT_JOURNAL_PLACEHOLDER

  // The one textarea does double duty: it previews a chosen method (read only,
  // since the method owns its wording) and edits the reader's own prompt.
  function showMethod(id) {
    const method = findMethod(id)
    field.readOnly = !!method
    field.classList.toggle("settings-textarea-readonly", !!method)
    field.value = method ? methodPlaceholder(method) : getSettings().journalPlaceholder
    field.rows = method ? method.steps.length : 4
  }

  const settings = getSettings()
  select.value = settings.journalPromptMethod
  showMethod(settings.journalPromptMethod)

  select.addEventListener("change", () => {
    const s = getSettings()
    s.journalPromptMethod = select.value
    saveSettings(s)
    showMethod(select.value)
    const method = findMethod(select.value)
    showStatus(method ? `Journal prompt set to ${method.name}` : "Journal prompt set to your own wording.")
  })

  let saveTimeout = null
  field.addEventListener("input", () => {
    if (field.readOnly) return
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      // A blank field falls back to the default rather than leaving an empty
      // box with no prompt at all.
      const text = field.value.trim() || DEFAULT_JOURNAL_PLACEHOLDER
      const s = getSettings()
      s.journalPlaceholder = text
      saveSettings(s)
      showStatus("Journal prompt saved.")
    }, 600)
  })

  field.addEventListener("blur", () => {
    if (!field.readOnly && !field.value.trim()) field.value = DEFAULT_JOURNAL_PLACEHOLDER
  })
}

// --- Journal data helpers (scoped to a single study's storage_prefix) ---

function journalKey(prefix) { return `${prefix}_journal` }

// The single text field is the whole entry, so an entry with no text in it is
// nothing — an emptied text box leaves one behind. Counting, exporting and
// importing all ignore them.
function normalizeJournalData(data) {
  const normalized = {}
  for (const [key, entry] of Object.entries(data)) {
    const text = entryText(entry)
    if (!text.trim()) continue

    const clean = { text }
    if (typeof entry.reading === "string") clean.reading = entry.reading
    if (typeof entry.title === "string") clean.title = entry.title
    if (typeof entry.updated === "string") clean.updated = entry.updated
    normalized[key] = clean
  }
  return normalized
}

function getJournalData(prefix) {
  try {
    const data = JSON.parse(localStorage.getItem(journalKey(prefix)) || "{}")
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {}
    return normalizeJournalData(data)
  } catch {
    return {}
  }
}

function journalEntryCount(prefix) {
  return Object.keys(getJournalData(prefix)).length
}

function validateJournalData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false
  for (const entry of Object.values(data)) {
    if (typeof entry !== "object" || entry === null) return false
    if (typeof entry.text !== "string") return false
  }
  return true
}

// --- Progress data helpers (scoped to a single study's storage_prefix) ---

function progressKey(prefix) { return `${prefix}_progress` }

function getProgressData(prefix) {
  try {
    return JSON.parse(localStorage.getItem(progressKey(prefix)) || "{}")
  } catch {
    return {}
  }
}

function progressItemCount(prefix) {
  return Object.keys(getProgressData(prefix)).length
}

function progressTotalItems(studyConfig) {
  const sections = studyConfig.sections || []
  const totalWeeks = studyConfig.total_weeks || 0
  return sections.length + (totalWeeks * 7)
}

function validateProgressData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "string") return false
  }
  return true
}

// --- Download helper ---

function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- Journal export/import/clear (scoped to a single study) ---

function exportJournal(prefix, studyTitle) {
  const data = getJournalData(prefix)
  const count = Object.keys(data).length
  if (count === 0) { showStatus(`No journal entries to export for ${studyTitle}.`); return }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(data, `${prefix}-journal-${today}.json`)
  showStatus(`Exported ${studyTitle} journal (${count} ${count === 1 ? "entry" : "entries"}).`)
}


function importJournal(prefix, studyTitle, file, onImported) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result)
      if (!validateJournalData(parsed)) { showStatus("Invalid journal file."); return }

      const data = normalizeJournalData(parsed)
      const count = Object.keys(data).length
      if (count === 0) { showStatus("The file contains no journal entries."); return }

      const existing = journalEntryCount(prefix)
      let msg = `Import ${studyTitle} journal (${count} ${count === 1 ? "entry" : "entries"})?`
      if (existing > 0) msg += ` This will replace your current ${existing} ${existing === 1 ? "entry" : "entries"}.`

      if (window.confirm(msg)) {
        localStorage.setItem(journalKey(prefix), JSON.stringify(data))
        showStatus(`Imported ${studyTitle} journal (${count} ${count === 1 ? "entry" : "entries"}).`)
        onImported()
        updateStorageInfo()
      }
    } catch {
      showStatus("Could not read file. Make sure it is a valid JSON file.")
    }
  }
  reader.readAsText(file)
}

function clearJournal(prefix, studyTitle, onCleared) {
  const count = journalEntryCount(prefix)

  // Emptied text boxes can still occupy storage with nothing to show for it,
  // so those are swept out without asking.
  if (count === 0) {
    localStorage.removeItem(journalKey(prefix))
    showStatus(`No journal entries to clear for ${studyTitle}.`)
    onCleared()
    updateStorageInfo()
    return
  }

  const msg = `This will permanently delete ${count} journal ${count === 1 ? "entry" : "entries"} for ${studyTitle} from this browser. This cannot be undone.\n\nContinue?`
  if (window.confirm(msg)) {
    localStorage.removeItem(journalKey(prefix))
    showStatus(`All journal entries for ${studyTitle} have been cleared.`)
    onCleared()
    updateStorageInfo()
  }
}

function initJournalStudyBlocks() {
  document.querySelectorAll(".settings-progress-study").forEach(block => {
    const exportBtn  = block.querySelector(".settings-export-journal")
    const importBtn  = block.querySelector(".settings-import-journal")
    const importFile = block.querySelector(".settings-import-journal-file")
    const clearBtn   = block.querySelector(".settings-clear-journal")
    if (!exportBtn && !importBtn && !clearBtn) return

    const prefix     = block.dataset.storagePrefix
    const studyTitle = block.querySelector(".settings-progress-study-title")?.textContent || "this study"
    const infoEl      = block.querySelector(".settings-progress-study-info")

    function refreshInfo() {
      if (!infoEl) return
      const count = journalEntryCount(prefix)
      infoEl.textContent = count === 0
        ? "No journal entries stored."
        : `${count} journal ${count === 1 ? "entry" : "entries"} stored.`
    }

    if (exportBtn) exportBtn.addEventListener("click", () => exportJournal(prefix, studyTitle))

    if (importBtn && importFile) {
      importBtn.addEventListener("click", () => importFile.click())
      importFile.addEventListener("change", () => {
        if (importFile.files.length > 0) {
          importJournal(prefix, studyTitle, importFile.files[0], refreshInfo)
          importFile.value = ""
        }
      })
    }

    if (clearBtn) clearBtn.addEventListener("click", () => clearJournal(prefix, studyTitle, refreshInfo))

    refreshInfo()
  })
}

// --- Progress export/import/clear (scoped to a single study) ---

function exportProgress(prefix, studyTitle) {
  const data = getProgressData(prefix)
  const count = Object.keys(data).length
  if (count === 0) { showStatus(`No progress data to export for ${studyTitle}.`); return }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(data, `${prefix}-progress-${today}.json`)
  showStatus(`Exported ${studyTitle} progress (${count} ${count === 1 ? "item" : "items"}).`)
}

function importProgress(prefix, studyTitle, file, onImported) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result)
      if (!validateProgressData(data)) { showStatus("Invalid progress file."); return }

      const count = Object.keys(data).length
      if (count === 0) { showStatus("The file contains no progress data."); return }

      const existing = progressItemCount(prefix)
      let msg = `Import progress for ${studyTitle} (${count} ${count === 1 ? "item" : "items"})?`
      if (existing > 0) msg += ` This will replace your current progress (${existing} ${existing === 1 ? "item" : "items"}).`

      if (window.confirm(msg)) {
        localStorage.setItem(progressKey(prefix), JSON.stringify(data))
        showStatus(`Imported ${studyTitle} progress (${count} ${count === 1 ? "item" : "items"}).`)
        onImported()
        updateStorageInfo()
      }
    } catch {
      showStatus("Could not read file. Make sure it is a valid JSON file.")
    }
  }
  reader.readAsText(file)
}

function clearProgress(prefix, studyTitle, onCleared) {
  const count = progressItemCount(prefix)
  if (count === 0) { showStatus(`No progress data to clear for ${studyTitle}.`); return }

  const msg = `This will permanently delete all progress for ${studyTitle} (${count} completed ${count === 1 ? "item" : "items"}) from this browser. This cannot be undone.\n\nContinue?`
  if (window.confirm(msg)) {
    localStorage.removeItem(progressKey(prefix))
    showStatus(`All progress for ${studyTitle} has been cleared.`)
    onCleared()
    updateStorageInfo()
  }
}

function initProgressStudyBlocks() {
  document.querySelectorAll(".settings-progress-study").forEach(block => {
    const exportBtn  = block.querySelector(".settings-export-progress")
    const importBtn  = block.querySelector(".settings-import-progress")
    const importFile = block.querySelector(".settings-import-progress-file")
    const clearBtn   = block.querySelector(".settings-clear-progress")
    if (!exportBtn && !importBtn && !clearBtn) return

    const prefix     = block.dataset.storagePrefix
    const studyTitle = block.querySelector(".settings-progress-study-title")?.textContent || "this study"
    const infoEl      = block.querySelector(".settings-progress-study-info")

    let studyConfig = {}
    try { studyConfig = JSON.parse(block.dataset.config) } catch {}

    function refreshInfo() {
      if (!infoEl) return
      const count = progressItemCount(prefix)
      const total = progressTotalItems(studyConfig)
      infoEl.textContent = count === 0
        ? "No progress recorded."
        : `${count} of ${total} steps complete.`
    }

    if (exportBtn) exportBtn.addEventListener("click", () => exportProgress(prefix, studyTitle))

    if (importBtn && importFile) {
      importBtn.addEventListener("click", () => importFile.click())
      importFile.addEventListener("change", () => {
        if (importFile.files.length > 0) {
          importProgress(prefix, studyTitle, importFile.files[0], refreshInfo)
          importFile.value = ""
        }
      })
    }

    if (clearBtn) clearBtn.addEventListener("click", () => clearProgress(prefix, studyTitle, refreshInfo))

    refreshInfo()
  })
}

// --- Group member management ---

function getGroupMembers() {
  try { return JSON.parse(localStorage.getItem(GROUP_KEY) || "[]") } catch { return [] }
}

function saveGroupMembers(members) {
  localStorage.setItem(GROUP_KEY, JSON.stringify(members))
  updateGroupInfo()
  updateStorageInfo()
}

function renderGroupMemberList() {
  const list = document.getElementById("group-member-list")
  if (!list) return

  const members = getGroupMembers()
  list.innerHTML = ""

  if (members.length === 0) {
    const empty = document.createElement("p")
    empty.className = "settings-info"
    empty.textContent = "No group members yet. Add someone to get started."
    list.appendChild(empty)
    return
  }

  members.forEach((member, index) => {
    const row = document.createElement("div")
    row.className = "group-member-row"

    const info = document.createElement("span")
    info.className = "group-member-info"
    info.textContent = member.name ? `${member.name} — ${member.email}` : member.email

    const removeBtn = document.createElement("button")
    removeBtn.className = "group-member-remove"
    removeBtn.textContent = "Remove"
    removeBtn.addEventListener("click", () => {
      const current = getGroupMembers()
      current.splice(index, 1)
      saveGroupMembers(current)
      renderGroupMemberList()
    })

    row.appendChild(info)
    row.appendChild(removeBtn)
    list.appendChild(row)
  })
}

function initGroupMemberForm() {
  const addBtn = document.getElementById("group-add-member")
  const nameInput = document.getElementById("group-member-name")
  const emailInput = document.getElementById("group-member-email")
  if (!addBtn || !nameInput || !emailInput) return

  function addMember() {
    const name = nameInput.value.trim()
    const email = emailInput.value.trim()
    if (!email) { showStatus("Please enter an email address."); return }

    const members = getGroupMembers()
    if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      showStatus("That email address is already in your group.")
      return
    }

    members.push({ name, email })
    saveGroupMembers(members)
    renderGroupMemberList()
    nameInput.value = ""
    emailInput.value = ""
    nameInput.focus()
    showStatus(`Added ${name || email} to your group.`)
  }

  addBtn.addEventListener("click", addMember)
  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addMember() }
  })
}

function updateGroupInfo() {
  const infoEl = document.getElementById("settings-group-info")
  if (!infoEl) return
  const count = getGroupMembers().length
  infoEl.textContent = count === 0 ? "No group members." : `${count} ${count === 1 ? "member" : "members"} in your study group.`
}

function exportGroup() {
  const members = getGroupMembers()
  if (members.length === 0) { showStatus("No group members to export."); return }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(members, `bst-group-${today}.json`)
  showStatus(`Exported ${members.length} group ${members.length === 1 ? "member" : "members"}.`)
}

function importGroup(file) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result)
      if (!Array.isArray(data)) { showStatus("Invalid group file."); return }
      const valid = data.every(m => typeof m === "object" && m !== null && typeof m.email === "string")
      if (!valid) { showStatus("Invalid group file. Each member must have an email."); return }

      const count = data.length
      if (count === 0) { showStatus("The file contains no group members."); return }

      const existing = getGroupMembers().length
      let msg = `Import ${count} group ${count === 1 ? "member" : "members"}?`
      if (existing > 0) msg += ` This will replace your current ${existing} ${existing === 1 ? "member" : "members"}.`

      if (window.confirm(msg)) {
        saveGroupMembers(data)
        renderGroupMemberList()
        showStatus(`Imported ${count} group ${count === 1 ? "member" : "members"}.`)
      }
    } catch {
      showStatus("Could not read file. Make sure it is a valid JSON file.")
    }
  }
  reader.readAsText(file)
}

function clearGroup() {
  const count = getGroupMembers().length
  if (count === 0) { showStatus("No group members to clear."); return }

  const msg = `This will remove all ${count} ${count === 1 ? "member" : "members"} from your study group. This cannot be undone.\n\nContinue?`
  if (window.confirm(msg)) {
    localStorage.removeItem(GROUP_KEY)
    renderGroupMemberList()
    updateGroupInfo()
    updateStorageInfo()
    showStatus("All group members have been removed.")
  }
}

// --- Status display ---

function showStatus(message) {
  const el = document.getElementById("settings-status")
  if (!el) return
  el.textContent = message
  el.classList.add("visible")
  setTimeout(() => el.classList.remove("visible"), 4000)
}

// --- Info displays ---

function updateStorageInfo() {
  const el = document.getElementById("settings-storage-info")
  if (!el) return
  try {
    let totalBytes = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) totalBytes += localStorage.getItem(key).length * 2
    }
    el.textContent = `Storage used: ${(totalBytes / 1024).toFixed(1)} KB`
  } catch {
    el.textContent = ""
  }
}

// --- Settings page init ---

function initSettingsPage() {
  const page = document.getElementById("settings-page")
  if (!page) return

  const settings = getSettings()

  const toggles = {
    "setting-journal": "journal",
    "setting-speak": "speak",
    "setting-group": "group",
    "setting-discussions": "discussions",
  }

  for (const [id, feature] of Object.entries(toggles)) {
    const el = document.getElementById(id)
    if (!el) continue
    el.checked = settings.features[feature] !== false
    el.addEventListener("change", () => {
      const s = getSettings()
      s.features[feature] = el.checked
      saveSettings(s)
    })
  }

  initJournalPlaceholder()
  initJournalStudyBlocks()
  initProgressStudyBlocks()

  initGroupMemberForm()
  renderGroupMemberList()

  const exportGroupBtn = document.getElementById("settings-export-group")
  if (exportGroupBtn) exportGroupBtn.addEventListener("click", exportGroup)

  const importGroupBtn = document.getElementById("settings-import-group")
  const importGroupFile = document.getElementById("settings-import-group-file")
  if (importGroupBtn && importGroupFile) {
    importGroupBtn.addEventListener("click", () => importGroupFile.click())
    importGroupFile.addEventListener("change", () => {
      if (importGroupFile.files.length > 0) { importGroup(importGroupFile.files[0]); importGroupFile.value = "" }
    })
  }

  const clearGroupBtn = document.getElementById("settings-clear-group")
  if (clearGroupBtn) clearGroupBtn.addEventListener("click", clearGroup)

  const siteThemeSelect = document.getElementById("setting-site-theme")
  if (siteThemeSelect) {
    siteThemeSelect.value = settings.siteTheme || "light"
    siteThemeSelect.addEventListener("change", () => {
      const s = getSettings()
      s.siteTheme = siteThemeSelect.value
      saveSettings(s)
      applySiteTheme()
      showStatus(`Site theme set to "${siteThemeSelect.options[siteThemeSelect.selectedIndex].text}".`)
    })
  }

  const decreaseBtn = document.getElementById("font-size-decrease")
  const increaseBtn = document.getElementById("font-size-increase")
  const fontSizeInput = document.getElementById("font-size-value")

  function clampFontSize(value) {
    return Math.min(40, Math.max(8, Math.round(value)))
  }

  function applyAndSaveFontSize(px) {
    const s = getSettings()
    s.fontSize = px
    saveSettings(s)
    applyFontSize()
    fontSizeInput.value = px
    showStatus(`Font size set to ${px}px.`)
  }

  if (decreaseBtn && increaseBtn && fontSizeInput) {
    fontSizeInput.value = settings.fontSize || 18

    decreaseBtn.addEventListener("click", () => {
      applyAndSaveFontSize(clampFontSize((parseInt(fontSizeInput.value, 10) || 18) - 1))
    })

    increaseBtn.addEventListener("click", () => {
      applyAndSaveFontSize(clampFontSize((parseInt(fontSizeInput.value, 10) || 18) + 1))
    })

    fontSizeInput.addEventListener("change", () => {
      applyAndSaveFontSize(clampFontSize(parseInt(fontSizeInput.value, 10) || 18))
    })
  }

  updateGroupInfo()
  updateStorageInfo()
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  applySiteTheme()
  applyFontSize()
  applyFeatureVisibility()
  initSettingsPage()
})
