// Random Tip button on tip pages (src/_layouts/tip.erb). Reuses the same
// #tips-data JSON island tip-of-week.js injects on every page.

function getTips() {
  try {
    const el = document.getElementById("tips-data")
    const tips = el ? JSON.parse(el.textContent) : []
    return Array.isArray(tips) ? tips : []
  } catch {
    return []
  }
}

function goToRandomTip() {
  const tips = getTips()
  if (tips.length === 0) return

  // Excludes the tip already on screen so the button always goes somewhere new.
  const candidates = tips.filter(t => t.url !== window.location.pathname)
  const pool = candidates.length > 0 ? candidates : tips
  const pick = pool[Math.floor(Math.random() * pool.length)]

  window.location.href = pick.url
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-tip-random]").forEach(btn => {
    btn.addEventListener("click", goToRandomTip)
  })
})
