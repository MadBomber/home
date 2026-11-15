import {
  CUSTOM_METHOD,
  DEFAULT_JOURNAL_PLACEHOLDER,
  PROMPT_METHODS,
  findMethod,
  methodPlaceholder,
} from "./journal-prompt.js"
import { BANNER_KEY, GROUP_KEY, SETTINGS_KEY, TIP_DISMISSED_KEY } from "./storage-keys.js"
import { entryText } from "./journal-entry.js"
import { loadMessages } from "./messages.js"

const DEFAULT_SETTINGS = {
  features: {
    journal: true,
    speak: true,
    group: false,
    discussions: false,
    tips: true,
    quiz: false,
  },
  siteTheme: "light",
  fontSize: 18,
  quizLength: 10,
  quizLookback: 4,
  journalPromptMethod: CUSTOM_METHOD,
  journalPlaceholder: DEFAULT_JOURNAL_PLACEHOLDER,
}

// Quiz settings are clamped on read as well as on entry, so a hand-edited
// localStorage value cannot break the draw. quiz.js applies the same limits.
function clampQuizLength(n) {
  return Number.isInteger(n) ? Math.min(20, Math.max(5, n)) : DEFAULT_SETTINGS.quizLength
}

function clampQuizLookback(n) {
  return Number.isInteger(n) ? Math.min(6, Math.max(1, n)) : DEFAULT_SETTINGS.quizLookback
}

// --- Settings storage ---

function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
    return {
      features: { ...DEFAULT_SETTINGS.features, ...(stored.features || {}) },
      siteTheme: stored.siteTheme || DEFAULT_SETTINGS.siteTheme,
      fontSize: parseInt(stored.fontSize, 10) || DEFAULT_SETTINGS.fontSize,
      quizLength: clampQuizLength(parseInt(stored.quizLength, 10)),
      quizLookback: clampQuizLookback(parseInt(stored.quizLookback, 10)),
      journalPromptMethod: findMethod(stored.journalPromptMethod)
        ? stored.journalPromptMethod
        : DEFAULT_SETTINGS.journalPromptMethod,
      journalPlaceholder: typeof stored.journalPlaceholder === "string"
        ? stored.journalPlaceholder
        : DEFAULT_SETTINGS.journalPlaceholder,
      // The header's language switcher writes this (bstSetLanguage in
      // _head.erb); the FOUC script reads it. There is no default: a reader
      // who never chose stays on whatever page they opened.
      ...(typeof stored.language === "string" ? { language: stored.language } : {}),
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
//
// Rewrites the same !important stylesheet the FOUC-prevention script in
// _head.erb injects before paint (id="feature-visibility-style"), rather
// than toggling each element's inline style. That script's rule has to be
// !important to reliably beat page-specific CSS, and an inline style can't
// outrank an !important stylesheet rule — so turning a feature back on
// mid-page used to leave it hidden until the next full page load.

function applyFeatureVisibility() {
  const settings = getSettings()
  const css = Object.entries(settings.features)
    .filter(([, enabled]) => !enabled)
    .map(([feature]) => `[data-feature="${feature}"]{display:none!important}`)
    .join("")

  let style = document.getElementById("feature-visibility-style")
  if (!style) {
    style = document.createElement("style")
    style.id = "feature-visibility-style"
    document.head.appendChild(style)
  }
  style.textContent = css
}

// --- Messages ---
//
// Every string this script shows comes from src/_locales/<lang>.yml under
// settings_js, which settings.erb injects as JSON in the page's language. The
// script keeps no English of its own: a new message needs a key there first.
// %{name} placeholders are filled from vars; count-based pairs end in
// _one / _other and are picked by msgCount.

// The lookup itself lives in messages.js, shared with the other pages.

const { msg, msgCount } = loadMessages("settings-messages")

// --- Journal entry prompt (the ghost text in an empty entry box) ---

function initJournalPlaceholder() {
  const select = document.getElementById("setting-journal-method")
  const field = document.getElementById("setting-journal-placeholder")
  if (!select || !field) return

  const options = [
    { id: CUSTOM_METHOD, name: msg("write_my_own") },
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
    showStatus(method ? msg("prompt_set_method", { name: method.name }) : msg("prompt_set_custom"))
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
      showStatus(msg("prompt_saved"))
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
  if (count === 0) { showStatus(msg("journal_none_export", { study: studyTitle })); return }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(data, `${prefix}-journal-${today}.json`)
  showStatus(msgCount("journal_exported", count, { study: studyTitle }))
}


function importJournal(prefix, studyTitle, file, onImported) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result)
      if (!validateJournalData(parsed)) { showStatus(msg("journal_invalid")); return }

      const data = normalizeJournalData(parsed)
      const count = Object.keys(data).length
      if (count === 0) { showStatus(msg("journal_file_empty")); return }

      const existing = journalEntryCount(prefix)
      let question = msgCount("journal_import_confirm", count, { study: studyTitle })
      if (existing > 0) question += msgCount("journal_import_replace", existing)

      if (window.confirm(question)) {
        localStorage.setItem(journalKey(prefix), JSON.stringify(data))
        showStatus(msgCount("journal_imported", count, { study: studyTitle }))
        onImported()
        updateStorageInfo()
      }
    } catch {
      showStatus(msg("file_unreadable"))
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
    showStatus(msg("journal_none_clear", { study: studyTitle }))
    onCleared()
    updateStorageInfo()
    return
  }

  const question = msgCount("journal_clear_confirm", count, { study: studyTitle })
  if (window.confirm(question)) {
    localStorage.removeItem(journalKey(prefix))
    showStatus(msg("journal_cleared", { study: studyTitle }))
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
    const studyTitle = block.querySelector(".settings-progress-study-title")?.textContent || msg("this_study")
    const infoEl      = block.querySelector(".settings-progress-study-info")

    function refreshInfo() {
      if (!infoEl) return
      const count = journalEntryCount(prefix)
      infoEl.textContent = count === 0
        ? msg("journal_stored_none")
        : msgCount("journal_stored", count)
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
  if (count === 0) { showStatus(msg("progress_none_export", { study: studyTitle })); return }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(data, `${prefix}-progress-${today}.json`)
  showStatus(msgCount("progress_exported", count, { study: studyTitle }))
}

function importProgress(prefix, studyTitle, file, onImported) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result)
      if (!validateProgressData(data)) { showStatus(msg("progress_invalid")); return }

      const count = Object.keys(data).length
      if (count === 0) { showStatus(msg("progress_file_empty")); return }

      const existing = progressItemCount(prefix)
      let question = msgCount("progress_import_confirm", count, { study: studyTitle })
      if (existing > 0) question += msgCount("progress_import_replace", existing)

      if (window.confirm(question)) {
        localStorage.setItem(progressKey(prefix), JSON.stringify(data))
        showStatus(msgCount("progress_imported", count, { study: studyTitle }))
        onImported()
        updateStorageInfo()
      }
    } catch {
      showStatus(msg("file_unreadable"))
    }
  }
  reader.readAsText(file)
}

function clearProgress(prefix, studyTitle, onCleared) {
  const count = progressItemCount(prefix)
  if (count === 0) { showStatus(msg("progress_none_clear", { study: studyTitle })); return }

  const question = msgCount("progress_clear_confirm", count, { study: studyTitle })
  if (window.confirm(question)) {
    localStorage.removeItem(progressKey(prefix))
    showStatus(msg("progress_cleared", { study: studyTitle }))
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
    const studyTitle = block.querySelector(".settings-progress-study-title")?.textContent || msg("this_study")
    const infoEl      = block.querySelector(".settings-progress-study-info")

    let studyConfig = {}
    try { studyConfig = JSON.parse(block.dataset.config) } catch {}

    function refreshInfo() {
      if (!infoEl) return
      const count = progressItemCount(prefix)
      const total = progressTotalItems(studyConfig)
      infoEl.textContent = count === 0
        ? msg("progress_none")
        : msg("progress_steps", { count, total })
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
    empty.textContent = msg("group_empty")
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
    removeBtn.textContent = msg("remove")
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
    if (!email) { showStatus(msg("email_required")); return }

    const members = getGroupMembers()
    if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      showStatus(msg("email_duplicate"))
      return
    }

    members.push({ name, email })
    saveGroupMembers(members)
    renderGroupMemberList()
    nameInput.value = ""
    emailInput.value = ""
    nameInput.focus()
    showStatus(msg("member_added", { name: name || email }))
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
  infoEl.textContent = count === 0 ? msg("group_none") : msgCount("group_count", count)
}

function exportGroup() {
  const members = getGroupMembers()
  if (members.length === 0) { showStatus(msg("group_none_export")); return }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(members, `bst-group-${today}.json`)
  showStatus(msgCount("group_exported", members.length))
}

function importGroup(file) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result)
      if (!Array.isArray(data)) { showStatus(msg("group_invalid")); return }
      const valid = data.every(m => typeof m === "object" && m !== null && typeof m.email === "string")
      if (!valid) { showStatus(msg("group_invalid_email")); return }

      const count = data.length
      if (count === 0) { showStatus(msg("group_file_empty")); return }

      const existing = getGroupMembers().length
      let question = msgCount("group_import_confirm", count)
      if (existing > 0) question += msgCount("group_import_replace", existing)

      if (window.confirm(question)) {
        saveGroupMembers(data)
        renderGroupMemberList()
        showStatus(msgCount("group_imported", count))
      }
    } catch {
      showStatus(msg("file_unreadable"))
    }
  }
  reader.readAsText(file)
}

function clearGroup() {
  const count = getGroupMembers().length
  if (count === 0) { showStatus(msg("group_none_clear")); return }

  const question = msgCount("group_clear_confirm", count)
  if (window.confirm(question)) {
    localStorage.removeItem(GROUP_KEY)
    renderGroupMemberList()
    updateGroupInfo()
    updateStorageInfo()
    showStatus(msg("group_cleared"))
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
    el.textContent = msg("storage_used", { kb: (totalBytes / 1024).toFixed(1) })
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
    "setting-tips": "tips",
    "setting-quiz": "quiz",
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
      showStatus(msg("theme_set", { theme: siteThemeSelect.options[siteThemeSelect.selectedIndex].text }))
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
    showStatus(msg("font_size_set", { px }))
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

  const quizLengthInput = document.getElementById("setting-quiz-length")
  if (quizLengthInput) {
    quizLengthInput.value = settings.quizLength
    quizLengthInput.addEventListener("change", () => {
      const s = getSettings()
      s.quizLength = clampQuizLength(parseInt(quizLengthInput.value, 10))
      saveSettings(s)
      quizLengthInput.value = s.quizLength
      showStatus(msg("quiz_length_set", { count: s.quizLength }))
    })
  }

  const quizLookbackInput = document.getElementById("setting-quiz-lookback")
  if (quizLookbackInput) {
    quizLookbackInput.value = settings.quizLookback
    quizLookbackInput.addEventListener("change", () => {
      const s = getSettings()
      s.quizLookback = clampQuizLookback(parseInt(quizLookbackInput.value, 10))
      saveSettings(s)
      quizLookbackInput.value = s.quizLookback
      showStatus(msgCount("quiz_lookback_set", s.quizLookback))
    })
  }

  const resetBannerBtn = document.getElementById("settings-reset-banner")
  if (resetBannerBtn) {
    resetBannerBtn.addEventListener("click", () => {
      localStorage.removeItem(BANNER_KEY)
      showStatus(msg("banner_reset"))
    })
  }

  const resetTipBtn = document.getElementById("settings-reset-tip")
  if (resetTipBtn) {
    resetTipBtn.addEventListener("click", () => {
      localStorage.removeItem(TIP_DISMISSED_KEY)
      showStatus(msg("tip_reset"))
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
