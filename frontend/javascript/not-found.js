// The 404 page. A static host serves the one /404.html for every missing
// address, in whatever language the reader was browsing, so that page carries
// its message in every language (src/404.erb, one [data-lang-block] each) and
// this shows the right one: the language of the address that was not found
// (/es/...) when it names one, otherwise the reader's chosen language.
// Without JavaScript the English block stays visible.

import { readerLanguage } from "./reader-language.js"

// Pure: the language a path is under, out of the ones offered. "/es/blog/x/"
// with ["en", "es"] gives "es"; an unprefixed path gives null.
export function languageOfPath(pathname, languages) {
  const first = String(pathname || "").split("/")[1] || ""
  return languages.includes(first) ? first : null
}

document.addEventListener("DOMContentLoaded", () => {
  const blocks = Array.from(document.querySelectorAll("[data-lang-block]"))
  if (blocks.length === 0) return

  const languages = blocks.map(b => b.dataset.langBlock)
  const wanted = languageOfPath(window.location.pathname, languages) || readerLanguage()
  const chosen = blocks.find(b => b.dataset.langBlock === wanted)
  if (!chosen) return

  blocks.forEach(b => { b.hidden = b !== chosen })
  if (chosen.dataset.title) document.title = chosen.dataset.title
})
