// Giscus discussions integration.
// To enable: go to https://giscus.app, configure it for your GitHub repo,
// and fill in the data-* attributes below with your values.
// Then in Settings, users can turn on Community Discussions to load the widget.

function loadGiscus() {
  const container = document.querySelector(".page-discussions .giscus")
  if (!container) return

  let theme = "light"
  try {
    const settings = JSON.parse(localStorage.getItem("bst_settings") || "{}")
    if (settings.features?.discussions !== true) return
    if (settings.discussionTheme) theme = settings.discussionTheme
  } catch { return }

  const script = document.createElement("script")
  script.src = "https://giscus.app/client.js"
  // TODO: Replace these with your own values from https://giscus.app
  script.setAttribute("data-repo", "YOUR_GITHUB_USERNAME/YOUR_DISCUSSIONS_REPO")
  script.setAttribute("data-repo-id", "YOUR_REPO_ID")
  script.setAttribute("data-category", "Page Comments")
  script.setAttribute("data-category-id", "YOUR_CATEGORY_ID")
  script.setAttribute("data-mapping", "pathname")
  script.setAttribute("data-strict", "1")
  script.setAttribute("data-reactions-enabled", "1")
  script.setAttribute("data-emit-metadata", "0")
  script.setAttribute("data-input-position", "top")
  script.setAttribute("data-theme", theme)
  script.setAttribute("data-lang", "en")
  script.setAttribute("data-loading", "lazy")
  script.crossOrigin = "anonymous"
  script.async = true

  container.appendChild(script)
}

document.addEventListener("DOMContentLoaded", loadGiscus)
