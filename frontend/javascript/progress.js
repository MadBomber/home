// --- Storage keys (derived from injected study config) ---

function getStoragePrefix() {
  try {
    const el = document.getElementById("study-config-data")
    if (!el) return "bst"
    return JSON.parse(el.textContent).storage_prefix || "bst"
  } catch { return "bst" }
}

function getProgressKey() { return `${getStoragePrefix()}_progress` }

function getStudySlug() {
  try {
    const el = document.getElementById("study-slug-data")
    if (!el) return ""
    return JSON.parse(el.textContent) || ""
  } catch { return "" }
}

// --- Storage ---

function getProgress() {
  try {
    const data = localStorage.getItem(getProgressKey())
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress) {
  localStorage.setItem(getProgressKey(), JSON.stringify(progress))
}

function getDate(key) { return getProgress()[key] || null }

function markComplete(key) {
  const progress = getProgress()
  if (!progress[key]) progress[key] = new Date().toISOString().split("T")[0]
  saveProgress(progress)
  return progress[key]
}

function markIncomplete(key) {
  const progress = getProgress()
  delete progress[key]
  saveProgress(progress)
}

// --- Keys ---

function sectionKey(s) { return `s${s}` }
function weekOverviewKey(w) { return `w${w}overview` }
function dayKey(w, d) { return `w${w}d${d}` }
function discussionKey(w) { return `w${w}discussion` }
function memoryVerseKey(w) { return `mv${w}` }

function weekItemKeys(w) {
  return [
    weekOverviewKey(w),
    dayKey(w, 1), dayKey(w, 2), dayKey(w, 3), dayKey(w, 4), dayKey(w, 5),
    discussionKey(w),
  ]
}

// --- Study config (injected by default.erb) ---

function getStudyConfig() {
  const el = document.getElementById("study-config-data")
  if (!el) return { total_weeks: 1, sections: [] }
  try { return JSON.parse(el.textContent) } catch { return { total_weeks: 1, sections: [] } }
}

function getSections() {
  return getStudyConfig().sections || []
}

function getTotalWeeks() {
  return getStudyConfig().total_weeks || 1
}

function getTotalItems() {
  const sections = getSections()
  const totalWeeks = getTotalWeeks()
  // sections + weeks × 7 items each
  return sections.length + (totalWeeks * 7)
}

// --- Week/Section completion ---

function getWeekCompletionDate(week) {
  const progress = getProgress()
  let lastDate = null
  for (const key of weekItemKeys(week)) {
    const date = progress[key]
    if (!date) return null
    if (!lastDate || date > lastDate) lastDate = date
  }
  return lastDate
}

function completedItemCount() {
  return Object.keys(getProgress()).length
}

// --- Base path ---

let BASE_PATH = ""

function initBasePath() {
  BASE_PATH = document.body?.dataset?.basePath || ""
}

// --- URL mapping (data-driven) ---

function sectionSlug(sectionNum) {
  const section = getSections().find(s => s.number === sectionNum)
  return section ? section.slug : ""
}

function weekSectionSlug(week) {
  const section = getSections().find(s => week >= s.weeks_start && week <= s.weeks_end)
  return section ? section.slug : ""
}

function studyPrefix() {
  const slug = getStudySlug()
  return slug ? `/${slug}` : ""
}

function weekPath(week) {
  const slug = weekSectionSlug(week)
  const wk = String(week).padStart(2, "0")
  return `${BASE_PATH}${studyPrefix()}/${slug}/week-${wk}`
}

function itemUrl(item) {
  if (item.type === "section") return `${BASE_PATH}${studyPrefix()}/${sectionSlug(item.section)}/`
  if (item.type === "overview") return `${weekPath(item.week)}/overview`
  if (item.type === "day") return `${weekPath(item.week)}/day-${item.day}`
  if (item.type === "discussion") return `${weekPath(item.week)}/discussion`
  return `${BASE_PATH}${studyPrefix()}/`
}

// --- Next reading ---

function findNextReading() {
  const progress = getProgress()
  const sections = getSections()

  for (const section of sections) {
    const sNum = section.number

    if (!progress[sectionKey(sNum)]) {
      return { type: "section", section: sNum, label: `Section ${sNum} Overview` }
    }

    for (let w = section.weeks_start; w <= section.weeks_end; w++) {
      if (!progress[weekOverviewKey(w)]) {
        return { type: "overview", week: w, label: `Week ${w} Overview` }
      }
      for (let d = 1; d <= 5; d++) {
        if (!progress[dayKey(w, d)]) {
          return { type: "day", week: w, day: d, label: `Week ${w}, Day ${d}` }
        }
      }
      if (!progress[discussionKey(w)]) {
        return { type: "discussion", week: w, label: `Week ${w} Discussion` }
      }
    }
  }
  return null
}

// --- UI helpers ---

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function createCheckbox(checked) {
  const cb = document.createElement("input")
  cb.type = "checkbox"
  cb.checked = checked
  cb.classList.add("progress-checkbox")
  return cb
}

function createDateSpan(dateStr) {
  const span = document.createElement("span")
  span.classList.add("progress-date")
  span.textContent = dateStr ? formatDate(dateStr) : ""
  return span
}

function addMarkCompleteButton(container, storageKey) {
  const wrapper = document.createElement("div")
  wrapper.classList.add("day-complete-container")

  const dateStr = getDate(storageKey)
  const btn = document.createElement("button")
  btn.classList.add("day-complete-btn")
  updateButton(btn, !!dateStr)

  const dateSpan = createDateSpan(dateStr)

  btn.addEventListener("click", () => {
    if (getDate(storageKey)) {
      markIncomplete(storageKey)
      dateSpan.textContent = ""
      updateButton(btn, false)
    } else {
      const date = markComplete(storageKey)
      dateSpan.textContent = formatDate(date)
      updateButton(btn, true)
    }
  })

  wrapper.appendChild(btn)
  wrapper.appendChild(dateSpan)

  const hr = container.querySelector("hr")
  const weekNav = container.querySelector(".week-nav")
  if (hr) { hr.parentNode.insertBefore(wrapper, hr) }
  else if (weekNav) { weekNav.parentNode.insertBefore(wrapper, weekNav) }
  else { container.appendChild(wrapper) }
}

function updateButton(btn, isComplete) {
  if (isComplete) {
    btn.textContent = "Completed"
    btn.classList.add("completed")
  } else {
    btn.textContent = "Mark Complete"
    btn.classList.remove("completed")
  }
}

// --- Home page ---

function enhanceHomePage() {
  const container = document.getElementById("todays-study")
  if (container) {
    const next = findNextReading()
    const totalItems = getTotalItems()
    const card = document.createElement("a")
    card.classList.add("todays-study-card")

    if (next) {
      card.href = itemUrl(next)
      card.innerHTML =
        `<span class="todays-study-label">Today's Study</span>` +
        `<span class="todays-study-detail">${next.label}</span>`

      const count = completedItemCount()
      if (count > 0) {
        const pct = Math.round((count / totalItems) * 100)
        card.innerHTML +=
          `<span class="todays-study-progress">${count} of ${totalItems} steps complete (${pct}%)</span>`
      }
    } else {
      card.href = "#"
      card.innerHTML =
        `<span class="todays-study-label">Study Complete!</span>` +
        `<span class="todays-study-detail">You have finished the entire study</span>`
    }

    container.appendChild(card)
  }

  // Week checkboxes in tables, with section overview row
  const tables = document.querySelectorAll("main table")
  tables.forEach(table => {
    // Find the section number from the preceding h2 id (e.g. "section-1")
    let sectionNum = null
    let el = table.previousElementSibling
    while (el) {
      if (el.tagName === "H2" && el.id && el.id.startsWith("section-")) {
        sectionNum = parseInt(el.id.replace("section-", ""), 10)
        break
      }
      el = el.previousElementSibling
    }

    const headerRow = table.querySelector("thead tr")
    if (!headerRow) return

    const thCheck = document.createElement("th")
    thCheck.textContent = ""
    headerRow.insertBefore(thCheck, headerRow.firstChild)

    const thDate = document.createElement("th")
    thDate.textContent = "Completed"
    headerRow.appendChild(thDate)

    const tbody = table.querySelector("tbody")

    // Insert section overview row at the top
    if (sectionNum && tbody) {
      const sectionDate = getDate(sectionKey(sectionNum))
      const sectionRow = document.createElement("tr")
      sectionRow.classList.add("phase-overview-row")

      const sCheckTd = document.createElement("td")
      sCheckTd.classList.add("progress-cell")
      const sCb = createCheckbox(!!sectionDate)
      sCb.disabled = true
      sCb.title = sectionDate ? "Section overview complete" : "Read the section overview to check this off"
      sCheckTd.appendChild(sCb)

      const sNumTd = document.createElement("td")
      sNumTd.textContent = ""

      const sTitleTd = document.createElement("td")
      sTitleTd.innerHTML = `<a href="${BASE_PATH}${studyPrefix()}/${sectionSlug(sectionNum)}/">Section Overview</a>`

      const sLinkTd = document.createElement("td")
      sLinkTd.innerHTML = `<a href="${BASE_PATH}${studyPrefix()}/${sectionSlug(sectionNum)}/">Read</a>`

      const sDateTd = document.createElement("td")
      sDateTd.classList.add("progress-date-cell")
      sDateTd.appendChild(createDateSpan(sectionDate))

      sectionRow.appendChild(sCheckTd)
      sectionRow.appendChild(sNumTd)
      sectionRow.appendChild(sTitleTd)
      sectionRow.appendChild(sLinkTd)
      sectionRow.appendChild(sDateTd)

      tbody.insertBefore(sectionRow, tbody.firstChild)
    }

    const rows = tbody.querySelectorAll("tr:not(.phase-overview-row)")
    rows.forEach(row => {
      const firstCell = row.querySelector("td")
      if (!firstCell) return
      const weekNum = parseInt(firstCell.textContent.trim(), 10)
      if (isNaN(weekNum)) return

      const completionDate = getWeekCompletionDate(weekNum)
      const checkTd = document.createElement("td")
      checkTd.classList.add("progress-cell")
      const cb = createCheckbox(!!completionDate)
      cb.disabled = true
      cb.title = completionDate ? "All 7 items complete" : "Complete all items in this week"
      checkTd.appendChild(cb)
      row.insertBefore(checkTd, row.firstChild)

      const dateTd = document.createElement("td")
      dateTd.classList.add("progress-date-cell")
      dateTd.appendChild(createDateSpan(completionDate))
      row.appendChild(dateTd)
    })
  })
}

// --- Section overview page ---

function enhanceSectionPage(sectionNum) {
  const article = document.querySelector("[data-section]")
  if (!article) return
  addMarkCompleteButton(article, sectionKey(sectionNum))
}

// --- Week overview page ---

function enhanceWeekPage(weekNum) {
  const article = document.querySelector("[data-week]")
  if (!article) return

  addMarkCompleteButton(article, weekOverviewKey(weekNum))

  const table = article.querySelector("table")
  if (!table) return

  const headerRow = table.querySelector("thead tr")
  if (headerRow) {
    const thCheck = document.createElement("th")
    thCheck.textContent = ""
    headerRow.insertBefore(thCheck, headerRow.firstChild)

    const thDate = document.createElement("th")
    thDate.textContent = "Completed"
    headerRow.appendChild(thDate)
  }

  const rows = table.querySelectorAll("tbody tr")
  rows.forEach(row => {
    const firstCell = row.querySelector("td")
    if (!firstCell) return
    const dayNum = parseInt(firstCell.textContent.trim(), 10)
    if (isNaN(dayNum)) return

    const key = dayKey(weekNum, dayNum)
    const dateStr = getDate(key)

    const checkTd = document.createElement("td")
    checkTd.classList.add("progress-cell")
    const cb = createCheckbox(!!dateStr)
    const dateSpan = createDateSpan(dateStr)

    cb.addEventListener("change", () => {
      if (cb.checked) {
        const date = markComplete(key)
        dateSpan.textContent = formatDate(date)
      } else {
        markIncomplete(key)
        dateSpan.textContent = ""
      }
    })
    checkTd.appendChild(cb)
    row.insertBefore(checkTd, row.firstChild)

    const dateTd = document.createElement("td")
    dateTd.classList.add("progress-date-cell")
    dateTd.appendChild(dateSpan)
    row.appendChild(dateTd)
  })
}

// --- Day page ---

function enhanceDayPage(weekNum, dayNum) {
  const article = document.querySelector("[data-week][data-day]")
  if (!article) return
  addMarkCompleteButton(article, dayKey(weekNum, dayNum))
}

// --- Discussion page ---

function enhanceDiscussionPage(weekNum) {
  const article = document.querySelector("[data-week][data-type='discussion']")
  if (!article) return
  addMarkCompleteButton(article, discussionKey(weekNum))
}

// --- Memory verse card page ---

function enhanceMemoryVerseCard(weekNum) {
  const article = document.querySelector("article[data-week]")
  if (!article) return
  addMarkCompleteButton(article, memoryVerseKey(weekNum))
}

// --- Memory verses index page ---

function enhanceMemoryVersesIndex() {
  const totalWeeks = getTotalWeeks()
  const progress = getProgress()

  const summary = document.getElementById("mv-progress-summary")
  if (summary) {
    let memorized = 0
    for (let w = 1; w <= totalWeeks; w++) {
      if (progress[memoryVerseKey(w)]) memorized++
    }
    const pct = totalWeeks > 0 ? Math.round((memorized / totalWeeks) * 100) : 0

    const bar = document.createElement("div")
    bar.classList.add("mv-progress-bar-container")
    bar.innerHTML =
      `<div class="mv-progress-info">` +
      `<strong>${memorized}</strong> of <strong>${totalWeeks}</strong> verses memorized (${pct}%)` +
      `</div>` +
      `<div class="mv-progress-track">` +
      `<div class="mv-progress-fill" style="width: ${pct}%"></div>` +
      `</div>`
    summary.appendChild(bar)
  }

  const tables = document.querySelectorAll("main table")
  tables.forEach(table => {
    const headerRow = table.querySelector("thead tr")
    if (!headerRow) return

    const thCheck = document.createElement("th")
    thCheck.textContent = ""
    headerRow.insertBefore(thCheck, headerRow.firstChild)

    const thDate = document.createElement("th")
    thDate.textContent = "Memorized"
    headerRow.appendChild(thDate)

    const rows = table.querySelectorAll("tbody tr")
    rows.forEach(row => {
      const firstCell = row.querySelector("td")
      if (!firstCell) return
      const weekNum = parseInt(firstCell.textContent.trim(), 10)
      if (isNaN(weekNum)) return

      const key = memoryVerseKey(weekNum)
      const dateStr = getDate(key)

      const checkTd = document.createElement("td")
      checkTd.classList.add("progress-cell")
      const cb = createCheckbox(!!dateStr)
      const dateSpan = createDateSpan(dateStr)

      cb.addEventListener("change", () => {
        if (cb.checked) {
          const date = markComplete(key)
          dateSpan.textContent = formatDate(date)
          updateProgressSummary()
        } else {
          markIncomplete(key)
          dateSpan.textContent = ""
          updateProgressSummary()
        }
      })
      checkTd.appendChild(cb)
      row.insertBefore(checkTd, row.firstChild)

      const dateTd = document.createElement("td")
      dateTd.classList.add("progress-date-cell")
      dateTd.appendChild(dateSpan)
      row.appendChild(dateTd)
    })
  })

  function updateProgressSummary() {
    const prog = getProgress()
    const tw = getTotalWeeks()
    let memorized = 0
    for (let w = 1; w <= tw; w++) {
      if (prog[memoryVerseKey(w)]) memorized++
    }
    const pct = tw > 0 ? Math.round((memorized / tw) * 100) : 0
    const info = document.querySelector(".mv-progress-info")
    if (info) info.innerHTML = `<strong>${memorized}</strong> of <strong>${tw}</strong> verses memorized (${pct}%)`
    const fill = document.querySelector(".mv-progress-fill")
    if (fill) fill.style.width = `${pct}%`
  }
}

// --- Auto-detect and enhance ---

document.addEventListener("DOMContentLoaded", () => {
  initBasePath()
  const article = document.querySelector("article[data-section], article[data-week]")

  if (document.getElementById("mv-progress-summary")) {
    enhanceMemoryVersesIndex()
    return
  }

  if (!article) {
    if (document.querySelector("[data-page='home']")) {
      enhanceHomePage()
    }
    return
  }

  if (article.dataset.section) {
    enhanceSectionPage(parseInt(article.dataset.section))
  } else if (article.dataset.type === "discussion") {
    enhanceDiscussionPage(parseInt(article.dataset.week))
  } else if (article.dataset.type === "memory_verse") {
    enhanceMemoryVerseCard(parseInt(article.dataset.week))
  } else if (article.dataset.day) {
    enhanceDayPage(parseInt(article.dataset.week), parseInt(article.dataset.day))
  } else if (article.dataset.week) {
    enhanceWeekPage(parseInt(article.dataset.week))
  }
})
