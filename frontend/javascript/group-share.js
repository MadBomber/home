// --- Storage keys (derived from injected study config) ---

function getStoragePrefix() {
  try {
    const el = document.getElementById("study-config-data")
    if (!el) return "bst"
    return JSON.parse(el.textContent).storage_prefix || "bst"
  } catch { return "bst" }
}

function getGroupKey() { return `${getStoragePrefix()}_group` }
function getHearKey()  { return `${getStoragePrefix()}_hear` }

function getStudySlug() {
  try {
    const el = document.getElementById("study-slug-data")
    if (!el) return ""
    return JSON.parse(el.textContent) || ""
  } catch { return "" }
}

function getGroupMembers() {
  try { return JSON.parse(localStorage.getItem(getGroupKey()) || "[]") } catch { return [] }
}

function buildMailtoLink() {
  const members = getGroupMembers()
  if (members.length === 0) return null

  const emails = members.map(m => m.email).join(",")

  const article = document.querySelector("article[data-week]")
  const pageTitle = document.querySelector("h1")
  let subject = "Bible Study"

  if (article) {
    const week = article.dataset.week
    const day = article.dataset.day
    const title = pageTitle ? pageTitle.textContent.trim() : ""

    if (day) {
      subject = `Bible Study: Week ${week}, Day ${day}`
      if (title) subject += ` — ${title}`
    } else if (article.dataset.type === "discussion") {
      subject = `Bible Study: Week ${week} Discussion`
      if (title) subject += ` — ${title}`
    } else {
      subject = `Bible Study: Week ${week} Overview`
      if (title) subject += ` — ${title}`
    }
  } else if (pageTitle) {
    subject = `Bible Study: ${pageTitle.textContent.trim()}`
  }

  const parts = []
  parts.push(document.title || "Bible Study")
  parts.push(window.location.href)
  parts.push("")

  // Include H.E.A.R. Highlight if available for this day
  if (article && article.dataset.week && article.dataset.day) {
    try {
      const journal = JSON.parse(localStorage.getItem(getHearKey()) || "{}")
      const key = `w${article.dataset.week}-d${article.dataset.day}`
      const entry = journal[key]
      if (entry && entry.h && entry.h.trim()) {
        parts.push("What stood out to me:")
        parts.push(entry.h.trim())
        parts.push("")
      }
    } catch {}
  }

  parts.push("---")
  parts.push("")

  const body = parts.join("\n")
  return `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function handleShareClick(e) {
  const members = getGroupMembers()
  if (members.length === 0) {
    e.preventDefault()
    const basePath = document.body?.dataset?.basePath || ""
    const studySlug = getStudySlug()
    const settingsPath = studySlug
      ? `${basePath}/${studySlug}/group-settings/`
      : `${basePath}/settings/#group-members`
    window.location.href = settingsPath
    return
  }

  const href = buildMailtoLink()
  if (href) {
    e.preventDefault()
    window.location.href = href
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.getElementById("toolbar-share-email")
  if (shareBtn) {
    shareBtn.addEventListener("click", handleShareClick)
  }
})
