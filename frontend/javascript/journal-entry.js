// The shape of one journal entry, shared by every page that reads one: the
// journal itself, the settings page's export and import, and the group share
// button. All three had grown their own copy of entryText(); the entry shape
// is defined once, here.
//
// An entry is { text, reading, title, updated }. Only text is required — the
// single field is the whole entry, and one with no text in it is no entry.

export function entryText(entry) {
  return entry && typeof entry === "object" && typeof entry.text === "string" ? entry.text : ""
}

export function hasText(entry) {
  return entryText(entry).trim().length > 0
}

// Every entry carries the moment it was last written in "updated". An entry
// not yet written reads as now, so a header always has a date to show.
export function entryTimestamp(entry) {
  const stored = entry && typeof entry.updated === "string" ? new Date(entry.updated) : null
  return stored && !Number.isNaN(stored.getTime()) ? stored : new Date()
}

export function formatTimestamp(date) {
  return date.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })
}

// Keys are "w{week}-d{day}". Sorting them as strings puts week 10 before week
// 2, so both numbers are pulled out and compared as numbers.
export function entryPosition(key) {
  const match = /^w(\d+)-d(\d+)$/.exec(key)
  return match ? { week: Number(match[1]), day: Number(match[2]) } : null
}

export function sortedEntries(data) {
  return Object.entries(data).sort(([a], [b]) => {
    const posA = entryPosition(a)
    const posB = entryPosition(b)
    if (!posA || !posB) return a.localeCompare(b)
    return posA.week - posB.week || posA.day - posB.day
  })
}
