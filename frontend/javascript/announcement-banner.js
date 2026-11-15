import { BANNER_KEY } from "./storage-keys.js"
import { readJsonIsland, pickLanguage, markLanguage } from "./reader-language.js"

// The announcement in the reader's language: { title, href, date, lang }.
// #announcement-data holds one per language (see _banner_data.erb).
function getAnnouncement() {
  const { lang, value } = pickLanguage(readJsonIsland("announcement-data"))
  return value ? { ...value, lang } : null
}

function isDismissed(announcement) {
  try {
    const dismissed = localStorage.getItem(BANNER_KEY)
    if (!dismissed) return false
    const announcementDate = new Date(announcement.date)
    const dismissedDate = new Date(dismissed)
    if (isNaN(announcementDate) || isNaN(dismissedDate)) return false
    return announcementDate <= dismissedDate
  } catch {
    return false
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("announcement-banner")
  if (!banner) return

  const announcement = getAnnouncement()
  if (!announcement || !announcement.title || isDismissed(announcement)) return

  const link = document.getElementById("announcement-banner-link")
  const close = document.getElementById("announcement-banner-dismiss")
  const messages = pickLanguage(readJsonIsland("banner-messages"), announcement.lang).value || {}

  if (link) {
    link.textContent = announcement.title
    if (announcement.href) link.href = announcement.href
  }
  if (messages.announcement_label) banner.setAttribute("aria-label", messages.announcement_label)
  if (messages.dismiss_announcement) close?.setAttribute("aria-label", messages.dismiss_announcement)
  markLanguage(banner, announcement.lang)

  banner.hidden = false

  function dismiss() {
    try { localStorage.setItem(BANNER_KEY, announcement.date) } catch {}
    banner.hidden = true
  }

  link?.addEventListener("click", dismiss)
  close?.addEventListener("click", (e) => {
    e.preventDefault()
    dismiss()
  })
})
