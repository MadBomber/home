// Strings a script shows to the reader.
//
// src/_locales reaches ERB only, so a page whose script shows text injects the
// strings it needs as JSON, in the page's language:
//
//   <script id="contact-messages" type="application/json"><%== t("contact_js").to_json %></script>
//
// and the script reads them through loadMessages("contact-messages"). A script
// keeps no English of its own: a new message is added to en.yml and es.yml
// first. %{name} placeholders are filled from vars; count-based pairs end in
// _one / _other and are picked by msgCount.

// Pure: fills %{name} placeholders in `text` from `vars`. A placeholder with
// no value becomes the empty string.
export function interpolate(text, vars = {}) {
  return String(text).replace(/%\{(\w+)\}/g, (_, name) => (name in vars ? String(vars[name]) : ""))
}

// Pure: builds { msg, msgCount } over a plain { key: "text" } map. A missing
// key comes back as the key itself, so a gap is visible rather than blank.
export function messagesFrom(map) {
  const table = map && typeof map === "object" ? map : {}

  function msg(key, vars = {}) {
    return interpolate(typeof table[key] === "string" ? table[key] : key, vars)
  }

  function msgCount(key, count, vars = {}) {
    return msg(count === 1 ? `${key}_one` : `${key}_other`, { count, ...vars })
  }

  return { msg, msgCount }
}

// Reads the JSON island with this id and returns { msg, msgCount } for it.
export function loadMessages(id) {
  let map = {}
  try { map = JSON.parse(document.getElementById(id)?.textContent || "{}") } catch {}
  return messagesFrom(map)
}
