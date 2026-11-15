import { TIP_DISMISSED_KEY } from "./storage-keys.js"
import { readJsonIsland, pickLanguage, markLanguage } from "./reader-language.js"

// The tips in the reader's language, and which language that turned out to
// be. #tips-data holds one list per language (see _banner_data.erb).
function getTips() {
  const { lang, value } = pickLanguage(readJsonIsland("tips-data"))
  return { lang, tips: Array.isArray(value) ? value : [] }
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

  const { lang, tips } = getTips()
  const tip = currentTip(tips)
  if (!tip || !tip.title || isDismissedThisWeek(tip)) return

  const link = document.getElementById("tip-banner-link")
  if (link) {
    link.href = tip.url
    link.textContent = tip.title
  }

  // The labels were rendered in the page's language; switch them when the
  // tip is in another one.
  const close = document.getElementById("tip-banner-dismiss")
  const messages = pickLanguage(readJsonIsland("banner-messages"), lang).value || {}
  if (messages.tip_label) banner.setAttribute("aria-label", messages.tip_label)
  if (messages.dismiss_tip) close?.setAttribute("aria-label", messages.dismiss_tip)
  markLanguage(banner, lang)

  banner.hidden = false

  function dismiss() {
    try { localStorage.setItem(TIP_DISMISSED_KEY, tip.weekKey) } catch {}
    banner.hidden = true
  }

  link?.addEventListener("click", dismiss)
  close?.addEventListener("click", (e) => {
    e.preventDefault()
    dismiss()
  })
})
