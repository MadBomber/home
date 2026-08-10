// --- Storage helpers (mirrors progress.js key scheme) ---

function getStudyProgress(prefix) {
  try {
    const data = localStorage.getItem(`${prefix}_progress`)
    return data ? JSON.parse(data) : {}
  } catch { return {} }
}

// --- Count helpers ---

function completedCount(progress) {
  return Object.keys(progress).length
}

function totalItems(studyConfig) {
  const sections = studyConfig.sections || []
  const totalWeeks = studyConfig.total_weeks || 0
  return sections.length + (totalWeeks * 7)
}

// --- Keys (mirrors progress.js key scheme) ---

function sectionKey(s) { return `s${s}` }
function weekOverviewKey(w) { return `w${w}overview` }
function dayKey(w, d) { return `w${w}d${d}` }
function discussionKey(w) { return `w${w}discussion` }

// --- Next reading, scoped to a single study's own config/progress ---
//
// Resumes right after whichever item was completed most recently in
// reading order, rather than the first incomplete item overall — so
// completing a day out of order (e.g. without marking its week/section
// overview complete) still advances to the next day, not backward to
// the skipped overview.

function studyItemSequence(studyConfig) {
  const items = []
  const sections = studyConfig.sections || []

  for (const section of sections) {
    const sNum = section.number
    items.push({ type: "section", section: sNum, key: sectionKey(sNum), label: `Section ${sNum} Overview` })

    for (let w = section.weeks_start; w <= section.weeks_end; w++) {
      items.push({ type: "overview", week: w, key: weekOverviewKey(w), label: `Week ${w} Overview` })
      for (let d = 1; d <= 5; d++) {
        items.push({ type: "day", week: w, day: d, key: dayKey(w, d), label: `Week ${w}, Day ${d}` })
      }
      items.push({ type: "discussion", week: w, key: discussionKey(w), label: `Week ${w} Discussion` })
    }
  }
  return items
}

function findNextReading(progress, studyConfig) {
  const items = studyItemSequence(studyConfig)

  let lastCompletedIndex = -1
  items.forEach((item, i) => {
    if (progress[item.key]) lastCompletedIndex = i
  })

  return items[lastCompletedIndex + 1] || null
}

// --- URL mapping, scoped to a single study's own slug/config ---

function studySectionSlug(studyConfig, sectionNum) {
  const section = (studyConfig.sections || []).find(s => s.number === sectionNum)
  return section ? section.slug : ""
}

function studyWeekSectionSlug(studyConfig, week) {
  const section = (studyConfig.sections || []).find(s => week >= s.weeks_start && week <= s.weeks_end)
  return section ? section.slug : ""
}

function studyItemUrl(basePath, studySlug, studyConfig, item) {
  const prefix = `${basePath}/${studySlug}`
  if (item.type === "section") return `${prefix}/${studySectionSlug(studyConfig, item.section)}/`

  const slug = studyWeekSectionSlug(studyConfig, item.week)
  const wk = String(item.week).padStart(2, "0")
  const weekPath = `${prefix}/${slug}/week-${wk}`

  if (item.type === "overview") return `${weekPath}/overview`
  if (item.type === "day") return `${weekPath}/day-${item.day}`
  if (item.type === "discussion") return `${weekPath}/discussion`
  return `${prefix}/`
}

// --- Hydrate study cards ---

document.addEventListener("DOMContentLoaded", () => {
  const basePath = (document.body?.dataset?.basePath || "").replace(/\/$/, "")

  document.querySelectorAll(".study-card[data-study-slug]").forEach(card => {
    const studySlug = card.dataset.studySlug
    const prefix    = card.dataset.storagePrefix

    let studyConfig = {}
    try { studyConfig = JSON.parse(card.dataset.config) } catch {}

    const progress = getStudyProgress(prefix)
    const count    = completedCount(progress)
    const total    = totalItems(studyConfig)

    if (count === 0) return

    // Has progress — render progress bar, linked to the next uncompleted step
    const pct        = total > 0 ? Math.round((count / total) * 100) : 0
    const progressEl = card.querySelector(".study-card-progress")
    if (!progressEl) return

    const next = findNextReading(progress, studyConfig)

    const infoText = next
      ? `${count} of ${total} steps complete (${pct}%) — continue to ${next.label} →`
      : `${count} of ${total} steps complete (${pct}%)`

    progressEl.innerHTML =
      `<div class="study-progress-info">${infoText}</div>` +
      `<div class="study-progress-track">` +
      `<div class="study-progress-fill" style="width:${pct}%"></div>` +
      `</div>`

    if (next) {
      const link = document.createElement("a")
      link.className = progressEl.className
      link.href = studyItemUrl(basePath, studySlug, studyConfig, next)
      link.innerHTML = progressEl.innerHTML
      progressEl.replaceWith(link)
    }
  })
})
