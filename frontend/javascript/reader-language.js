// Which language the reader wants, for the parts of a page that can follow
// the reader rather than the page: the announcement and tip banners. A page
// that exists only in English still renders in English, but its banners are
// filled in by script, so they can be in the language the reader chose.

import { SETTINGS_KEY } from "./storage-keys.js"

// The language this page was rendered in (<html lang>, set by Bridgetown).
export function pageLanguage() {
  return document.documentElement.lang || "en"
}

// The language the reader picked in the header switcher (`language` in
// bst_settings, written by bstSetLanguage in _head.erb). A reader who never
// picked one gets the page's language.
export function readerLanguage() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
    if (stored && typeof stored.language === "string" && stored.language) return stored.language
  } catch {}
  return pageLanguage()
}

// Parses a JSON island (<script type="application/json" id="...">).
export function readJsonIsland(id) {
  try {
    const el = document.getElementById(id)
    return el ? JSON.parse(el.textContent) : null
  } catch {
    return null
  }
}

// Picks one language's entry out of a { en: ..., es: ... } map: the wanted
// language when the map has something for it, otherwise the page's language.
// Returns { lang, value } so the caller can mark the element's language;
// value is null when the map has nothing usable.
export function pickLanguage(map, wanted = readerLanguage(), fallback = pageLanguage()) {
  if (!map || typeof map !== "object") return { lang: fallback, value: null }
  const lang = [wanted, fallback].find(l => !isEmpty(map[l]))
  return lang ? { lang, value: map[lang] } : { lang: fallback, value: null }
}

function isEmpty(value) {
  return value == null || (Array.isArray(value) && value.length === 0)
}

// Marks an element as being in `lang` when that differs from the page, so a
// screen reader pronounces a Spanish banner on an English page as Spanish.
export function markLanguage(el, lang) {
  if (!el) return
  if (lang && lang !== pageLanguage()) el.setAttribute("lang", lang)
  else el.removeAttribute("lang")
}
