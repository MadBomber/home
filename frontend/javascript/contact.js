// Contact page.
//
// The site is static, so there is nothing to POST a form to. This composes the
// message into a mailto: and hands it to the reader's own mail app, the same
// approach group-share.js takes for sending a day's reading to a study group.
//
// The address is kept in pieces and joined at runtime so it never appears as a
// harvestable mailto: href in the delivered HTML.

const ADDRESS_LOCAL = "step-hazy-runny"
const ADDRESS_HOST  = "duck.com"

// A reader who clicks an essay byline (blog_post.erb) or the footer Contact
// link (_footer.erb) arrives with ?about=<path>. That page's address becomes
// the selected topic, and from there the subject line, so the message arrives
// naming exactly the page they were reading.
//
// The parameter carries a path and never a whole address. The origin is added
// here, from the page the reader is actually on, so a hand-crafted link cannot
// put someone else's domain in the subject of the mail they send.
const PAGE_PARAM    = "about"
const PAGE_PATH_MAX = 200

export function contactAddress() {
  return ADDRESS_LOCAL + String.fromCharCode(64) + ADDRESS_HOST
}

// --- Message assembly ---
//
// These three are pure — they touch no DOM — so they can be exercised on their
// own without a page around them.

export function buildSubject(topic) {
  return topic ? `LampLight.Guide — ${topic}` : "LampLight.Guide"
}

export function buildBody(message, name) {
  const parts = [message.trim()]

  if (name.trim()) {
    parts.push("")
    parts.push(`— ${name.trim()}`)
  }

  return parts.join("\n")
}

// Pure: hand it a query string and an origin, get back the address of the page
// it names. Anything that is not a plain path on this site comes back empty —
// "//evil.example" and "https://evil.example" are both rejected, so the subject
// line can only ever name a page here.
export function pageUrlFromQuery(search, origin) {
  let path = null

  try {
    path = new URLSearchParams(search || "").get(PAGE_PARAM)
  } catch {
    return ""
  }

  path = (path || "").trim().slice(0, PAGE_PATH_MAX)
  if (!path.startsWith("/") || path.startsWith("//")) return ""

  return `${origin || ""}${path}`
}

export function buildMailtoLink(topic, message, name) {
  const subject = encodeURIComponent(buildSubject(topic))
  const body    = encodeURIComponent(buildBody(message, name))
  return `mailto:${contactAddress()}?subject=${subject}&body=${body}`
}

// --- Status display ---

function showStatus(message) {
  const el = document.getElementById("contact-status")
  if (!el) return
  el.textContent = message
  el.classList.add("visible")
  setTimeout(() => el.classList.remove("visible"), 6000)
}

// --- Wiring ---

function revealAddress() {
  const link = document.getElementById("contact-address-link")
  if (!link) return
  const address = contactAddress()
  link.textContent = address
  link.href = `mailto:${address}`
}

// Adds the page address as a topic of its own and selects it. It is set with
// textContent and .value rather than any markup, so a value arriving from the
// query string is text and only ever text.
function prefillTopicFromPage() {
  const url = pageUrlFromQuery(window.location.search, window.location.origin)
  if (!url) return

  const select = document.getElementById("contact-topic")
  if (!select) return

  const option = document.createElement("option")
  option.value = url
  option.textContent = url
  select.prepend(option)
  select.value = url

  const heading = document.getElementById("contact-page-note")
  if (heading) {
    // No quotation marks around the address — they read as part of it.
    heading.textContent = `Your message will name the page you came from: ${url} — change the topic below if it is about something else.`
    heading.hidden = false
  }
}

function handleSubmit(e) {
  e.preventDefault()

  const message = document.getElementById("contact-message")?.value || ""
  if (!message.trim()) {
    showStatus("Please write a message first.")
    return
  }

  const topic = document.getElementById("contact-topic")?.value || ""
  const name  = document.getElementById("contact-name")?.value || ""

  window.location.href = buildMailtoLink(topic, message, name)
  showStatus("Your mail app should be opening with the message ready to send.")
}

function handleCopyAddress() {
  const address = contactAddress()

  if (!navigator.clipboard) {
    showStatus(`Copy this address: ${address}`)
    return
  }

  navigator.clipboard.writeText(address)
    .then(() => showStatus("Address copied."))
    .catch(() => showStatus(`Copy this address: ${address}`))
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form")
  if (!form) return

  revealAddress()
  prefillTopicFromPage()
  form.addEventListener("submit", handleSubmit)

  const copyBtn = document.getElementById("contact-copy-address")
  if (copyBtn) copyBtn.addEventListener("click", handleCopyAddress)
})
