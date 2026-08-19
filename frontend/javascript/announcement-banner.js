import { BANNER_KEY } from "./storage-keys.js"

function getAnnouncement() {
  try {
    const el = document.getElementById("announcement-data")
    return el ? JSON.parse(el.textContent) : null
  } catch {
    return null
  }
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

  banner.hidden = false

  function dismiss() {
    try { localStorage.setItem(BANNER_KEY, announcement.date) } catch {}
    banner.hidden = true
  }

  document.getElementById("announcement-banner-link")?.addEventListener("click", dismiss)
  document.getElementById("announcement-banner-dismiss")?.addEventListener("click", (e) => {
    e.preventDefault()
    dismiss()
  })
})
