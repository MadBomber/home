// Random Tip button on tip pages (src/_layouts/tip.erb). Reuses the same
// #tips-data JSON island the tip banner reads, but always takes the list in
// the page's own language: a Spanish tip page leads to another Spanish tip.

import { readJsonIsland, pickLanguage, pageLanguage } from "./reader-language.js"

function getTips() {
  const tips = pickLanguage(readJsonIsland("tips-data"), pageLanguage()).value
  return Array.isArray(tips) ? tips : []
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
