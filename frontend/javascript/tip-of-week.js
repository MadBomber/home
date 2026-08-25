import { TIP_DISMISSED_KEY } from "./storage-keys.js"

function getTips() {
  try {
    const el = document.getElementById("tips-data")
    const tips = el ? JSON.parse(el.textContent) : []
    return Array.isArray(tips) ? tips : []
  } catch {
    return []
  }
}

// ISO 8601 week number (Thursday of the week decides which year it belongs
// to). This no longer picks which tip shows — it only marks which week the
// reader is in, so a dismissal holds until that week rolls over.
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

// A fresh random tip on every page load — the reader can run into several
// different tips across the week. Dismissing does not target this specific
// tip; it silences the banner for the rest of the current ISO week, see
// isDismissedThisWeek below.
function currentTip(tips) {
  if (tips.length === 0) return null
  const { year, week } = isoWeek(new Date())
  const tip = tips[Math.floor(Math.random() * tips.length)]
  return { ...tip, weekKey: `${year}-W${String(week).padStart(2, "0")}` }
}

function isDismissedThisWeek(tip) {
  try {
    return localStorage.getItem(TIP_DISMISSED_KEY) === tip.weekKey
  } catch {
    return false
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("tip-banner")
  if (!banner) return

  const tip = currentTip(getTips())
  if (!tip || !tip.title || isDismissedThisWeek(tip)) return

  const link = document.getElementById("tip-banner-link")
  if (link) {
    link.href = tip.url
    link.textContent = tip.title
  }

  banner.hidden = false

  function dismiss() {
    try { localStorage.setItem(TIP_DISMISSED_KEY, tip.weekKey) } catch {}
    banner.hidden = true
  }

  link?.addEventListener("click", dismiss)
  document.getElementById("tip-banner-dismiss")?.addEventListener("click", (e) => {
    e.preventDefault()
    dismiss()
  })
})
