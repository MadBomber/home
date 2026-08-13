// Single source of truth for the journal entry prompt: the ghost text shown in
// an empty entry box, and the optional set of headings a reader can drop into
// an entry to organize it. settings.js lets the reader choose; journal.js paints
// the result. Nothing else should hardcode these strings.

// NOTE: keep "bst_settings" in step with SETTINGS_KEY in settings.js.
const SETTINGS_KEY = "bst_settings"

export const DEFAULT_JOURNAL_PLACEHOLDER = "Enter your observation here."
export const CUSTOM_METHOD = "custom"

// The three common Bible journaling frameworks. They ask much the same
// questions, cut differently: SOAP opens by copying the verse out, HEAR by
// picking a phrase, OIA drops the prayer step and stays with the text.
export const PROMPT_METHODS = [
  {
    id: "hear",
    name: "H.E.A.R.",
    steps: [
      { label: "Highlight", question: "which verse or phrase stood out?" },
      { label: "Explain", question: "what did it mean to its first readers?" },
      { label: "Apply", question: "what does it mean for your life today?" },
      { label: "Respond", question: "write a prayer, or one thing you will do." },
    ],
  },
  {
    id: "soap",
    name: "S.O.A.P.",
    steps: [
      { label: "Scripture", question: "write out the verse." },
      { label: "Observation", question: "what do you notice in it?" },
      { label: "Application", question: "how does this apply to you right now?" },
      { label: "Prayer", question: "write your response to God." },
    ],
  },
  {
    id: "oia",
    name: "O.I.A.",
    steps: [
      { label: "Observation", question: "what does the text say?" },
      { label: "Interpretation", question: "what does it mean?" },
      { label: "Application", question: "how does it apply to you?" },
    ],
  },
  // For readers using this as a prayer journal rather than a study journal.
  {
    id: "acts",
    name: "A.C.T.S.",
    steps: [
      { label: "Adoration", question: "what do you praise God for?" },
      { label: "Confession", question: "what do you need to admit to Him?" },
      { label: "Thanksgiving", question: "what are you thankful for today?" },
      { label: "Supplication", question: "what are you asking of Him?" },
    ],
  },
]

// --- Prompt library (injected by the journal page from journal_prompts.yml) ---

export function getPromptLibrary() {
  const el = document.getElementById("journal-prompts-data")
  if (!el) return []
  try {
    const prompts = JSON.parse(el.textContent)
    return Array.isArray(prompts) ? prompts.filter(p => typeof p === "string" && p.trim()) : []
  } catch {
    return []
  }
}

// Never returns the prompt already showing, so the button always visibly
// changes something.
export function randomPrompt(exclude) {
  const prompts = getPromptLibrary().filter(p => p !== exclude)
  if (prompts.length === 0) return ""
  return prompts[Math.floor(Math.random() * prompts.length)]
}

export function findMethod(id) {
  return PROMPT_METHODS.find(method => method.id === id) || null
}

function storedSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
  } catch {
    return {}
  }
}

export function getPromptMethodId() {
  const id = storedSettings().journalPromptMethod
  return findMethod(id) ? id : CUSTOM_METHOD
}

// Ghost text: the whole method, one step per line.
export function methodPlaceholder(method) {
  return method.steps.map(step => `${step.label}: ${step.question}`).join("\n")
}

// Insertable text: every question, with room to write under each. This is real
// text the reader edits, so it stays put once they start typing.
export function methodInsertText(method) {
  return method.steps.map(step => `${step.label}: ${step.question}\n`).join("\n")
}

export function getJournalPlaceholder() {
  const method = findMethod(getPromptMethodId())
  if (method) return methodPlaceholder(method)

  const custom = storedSettings().journalPlaceholder
  const text = typeof custom === "string" ? custom.trim() : ""
  return text || DEFAULT_JOURNAL_PLACEHOLDER
}

