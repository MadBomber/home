// Giscus discussions integration.
// Per-study configuration lives in src/_data/{study}/study_config.yml
// under a `discussions:` key. If the current study has no discussions
// config, the widget is silently skipped.

import { SETTINGS_KEY } from "./storage-keys.js"

function loadGiscus() {
  const container = document.querySelector(".page-discussions .giscus")
  if (!container) return

  let theme = "light"
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
    if (settings.features?.discussions !== true) return
    const themeMap = { light: "light", dark: "dark", auto: "preferred_color_scheme" }
    theme = themeMap[settings.siteTheme] || "light"
  } catch { return }

  const studyConfig = JSON.parse(
    document.getElementById("study-config-data")?.textContent || "{}"
  )
  const disc = studyConfig.discussions
  if (!disc?.repo || !disc?.repo_id || !disc?.category_id) return

  const script = document.createElement("script")
  script.src = "https://giscus.app/client.js"
  script.setAttribute("data-repo",            disc.repo)
  script.setAttribute("data-repo-id",         disc.repo_id)
  script.setAttribute("data-category",        disc.category || "Page Comments")
  script.setAttribute("data-category-id",     disc.category_id)
  script.setAttribute("data-mapping",         "pathname")
  script.setAttribute("data-strict",          "1")
  script.setAttribute("data-reactions-enabled", "1")
  script.setAttribute("data-emit-metadata",   "0")
  script.setAttribute("data-input-position",  "top")
  script.setAttribute("data-theme",           theme)
  script.setAttribute("data-lang",            "en")
  script.setAttribute("data-loading",         "lazy")
  script.crossOrigin = "anonymous"
  script.async = true

  container.appendChild(script)
}

document.addEventListener("DOMContentLoaded", loadGiscus)
