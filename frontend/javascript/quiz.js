// The warm-up quiz. /{study}/quiz/?week=N asks questions drawn from weeks
// 1..N-1 of the pool injected by _quiz.erb from src/_data/{study}/quiz.yml.
// With no parameters the page offers a quiz over everything read so far
// (judged from the reader's progress) and a week picker. Nothing is graded
// or recorded beyond a personal best kept in localStorage under
// `<storage_prefix>_quiz`.

const QUIZ_LENGTH = 8

// --- Injected data (same pattern as journal.js / progress.js) ---

function readJson(id, fallback) {
  try {
    const el = document.getElementById(id)
    if (!el) return fallback
    return JSON.parse(el.textContent) ?? fallback
  } catch { return fallback }
}

function getStudyConfig() { return readJson("study-config-data", { total_weeks: 1, sections: [] }) }
function getStudySlug() { return readJson("study-slug-data", "") }
function getQuizPool() { return readJson("quiz-data", {}) }
function getStoragePrefix() { return getStudyConfig().storage_prefix || "bst" }
function getTotalWeeks() { return getStudyConfig().total_weeks || 1 }

// --- URL mapping (data-driven from study-config-data) ---

function weekPath(week) {
  const config = getStudyConfig()
  const section = (config.sections || []).find(s => week >= s.weeks_start && week <= s.weeks_end)
  if (!section) return "/"
  const wk = String(week).padStart(2, "0")
  const basePath = document.body?.dataset?.basePath || ""
  const studySlug = getStudySlug()
  const studyPfx = studySlug ? `/${studySlug}` : ""
  return `${basePath}${studyPfx}/${section.slug}/week-${wk}`
}

// --- Question pool ---

// Weeks that actually have questions, ascending.
function authoredWeeks(pool) {
  return Object.keys(pool)
    .map(Number)
    .filter(n => Number.isInteger(n) && n >= 1 && (pool[String(n)] || []).length > 0)
    .sort((a, b) => a - b)
}

// Every question from weeks 1..upTo, each tagged with the week it came from.
function questionsThrough(pool, upTo) {
  const questions = []
  for (const w of authoredWeeks(pool)) {
    if (w > upTo) break
    for (const q of pool[String(w)]) questions.push(Object.assign({ week: w }, q))
  }
  return questions
}

function shuffle(items) {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// "weeks 1 to 4", or "week 1" when only one week has questions.
function coverageLabel(pool, upTo) {
  const weeks = authoredWeeks(pool).filter(w => w <= upTo)
  const hi = weeks[weeks.length - 1]
  return weeks.length > 1 ? `weeks 1 to ${hi}` : `week ${hi}`
}

// --- Reading progress (read-only; progress.js owns this key) ---

function getProgress() {
  try {
    const data = localStorage.getItem(`${getStoragePrefix()}_progress`)
    return data ? JSON.parse(data) : {}
  } catch { return {} }
}

// The highest week the reader has touched, judging by the progress keys
// (w{N}d{D}, w{N}overview, w{N}discussion, mv{N}). Zero if none.
function highestWeekTouched() {
  let highest = 0
  for (const key of Object.keys(getProgress())) {
    const m = key.match(/^(?:w|mv)(\d+)/)
    if (m) highest = Math.max(highest, parseInt(m[1], 10))
  }
  return highest
}

// --- Personal bests ---

function getBestKey() { return `${getStoragePrefix()}_quiz` }

function getBests() {
  try {
    const data = localStorage.getItem(getBestKey())
    return data ? JSON.parse(data) : {}
  } catch { return {} }
}

function getBest(quizId) { return getBests()[quizId] || null }

function saveBestIfBetter(quizId, correct, total) {
  const bests = getBests()
  const prev = bests[quizId]
  if (prev && prev.correct / prev.total >= correct / total) return
  bests[quizId] = { correct, total, date: new Date().toISOString() }
  try { localStorage.setItem(getBestKey(), JSON.stringify(bests)) } catch { /* storage full or blocked */ }
}

// --- Views ---

function viewEls() {
  return {
    context: document.getElementById("quiz-context"),
    start: document.getElementById("quiz-start"),
    play: document.getElementById("quiz-play"),
    results: document.getElementById("quiz-results"),
    empty: document.getElementById("quiz-empty"),
  }
}

function showEmpty(message) {
  const els = viewEls()
  els.empty.textContent = message
  els.empty.style.display = "block"
}

function scoreLine(correct, total) {
  const ratio = correct / total
  if (ratio === 1) return "Perfect score. The crowd goes wild!"
  if (ratio >= 0.75) return "Well done. The story is sticking with you."
  if (ratio >= 0.5) return "Not bad, and every miss showed you right where to reread."
  return "The readings will feel like old friends the second time through."
}

// --- Print worksheet ---

// Fills #quiz-print with the whole current draw: numbered questions, each
// choice behind an empty checkbox, then an answer key. Only the print
// stylesheet ever shows it; the quiz-print-ready class tells that
// stylesheet to hide the one-at-a-time view in its favor.
//
// The sheet is a table because that is the one structure browsers repeat
// on every printed page: the thead (quiz title and week) becomes a running
// page header and the tfoot a running footer, so a dropped stack of pages
// can be put back in order. One tbody row per question keeps each question
// whole on a page.
function buildPrintSheet(questions, contextLine) {
  const sheet = document.getElementById("quiz-print")
  if (!sheet) return
  sheet.innerHTML = ""

  const table = document.createElement("table")
  table.classList.add("quiz-print-table")

  const thead = table.createTHead()
  const headCell = document.createElement("td")
  headCell.classList.add("quiz-print-pagehead")
  headCell.textContent = contextLine ? `Warm-Up Quiz · ${contextLine}` : "Warm-Up Quiz"
  thead.insertRow().appendChild(headCell)

  const tfoot = table.createTFoot()
  const footCell = document.createElement("td")
  footCell.classList.add("quiz-print-pagefoot")
  const siteName = (document.title.split("|").pop() || "").trim()
  const printedOn = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
  footCell.textContent = [siteName, `printed ${printedOn}`].filter(Boolean).join(" · ")
  tfoot.insertRow().appendChild(footCell)

  const tbody = document.createElement("tbody")
  table.appendChild(tbody)

  function addRow(content) {
    const row = tbody.insertRow()
    row.classList.add("quiz-print-row")
    row.insertCell().appendChild(content)
    return row
  }

  questions.forEach((q, i) => {
    const block = document.createElement("section")
    block.classList.add("quiz-print-q")

    const question = document.createElement("p")
    question.classList.add("quiz-print-question")
    question.textContent = `${i + 1}. ${q.question}`
    block.appendChild(question)

    for (const choice of q.order) {
      const line = document.createElement("p")
      line.classList.add("quiz-print-choice")
      const box = document.createElement("span")
      box.classList.add("quiz-print-box")
      line.appendChild(box)
      line.append(choice)
      block.appendChild(line)
    }

    addRow(block)
  })

  // The answer key starts on its own page (break-before in the print CSS)
  // so it can be kept back or handed out separately from the questions.
  const key = document.createElement("section")
  key.classList.add("quiz-print-answers")

  const keyHeading = document.createElement("h2")
  keyHeading.textContent = "Answer Key"
  key.appendChild(keyHeading)

  questions.forEach((q, i) => {
    const line = document.createElement("p")
    line.classList.add("quiz-print-answer")
    line.textContent = `${i + 1}. ${q.answer} (${q.ref}, Week ${q.week}, Day ${q.day})`
    key.appendChild(line)
  })

  addRow(key).classList.add("quiz-print-answers-row")

  sheet.appendChild(table)
  document.getElementById("quiz").classList.add("quiz-print-ready")
}

// --- The quiz itself ---

function runQuiz(pool, upToWeek, quizId, contextLine, onward) {
  const els = viewEls()
  els.context.textContent = contextLine
  els.start.style.display = "none"
  els.results.style.display = "none"
  els.play.style.display = "block"

  // Choices are shuffled once per draw, here, so the printed worksheet and
  // the on-screen quiz show every question's choices in the same order.
  const questions = shuffle(questionsThrough(pool, upToWeek))
    .slice(0, QUIZ_LENGTH)
    .map(q => Object.assign({}, q, { order: shuffle(q.choices || []) }))
  buildPrintSheet(questions, contextLine)
  const progressEl = document.getElementById("quiz-progress")
  const questionEl = document.getElementById("quiz-question")
  const choicesEl = document.getElementById("quiz-choices")
  const feedbackEl = document.getElementById("quiz-feedback")
  const nextBtn = document.getElementById("quiz-next")

  let index = 0
  let correctCount = 0

  function renderQuestion() {
    const q = questions[index]
    progressEl.textContent = `Question ${index + 1} of ${questions.length}`
    questionEl.textContent = q.question
    choicesEl.innerHTML = ""
    feedbackEl.innerHTML = ""
    nextBtn.style.display = "none"

    for (const choice of q.order) {
      const btn = document.createElement("button")
      btn.type = "button"
      btn.classList.add("quiz-choice")
      btn.textContent = choice
      btn.setAttribute("data-speak-pause", "")
      btn.addEventListener("click", () => answer(q, choice, btn))
      choicesEl.appendChild(btn)
    }

    questionEl.focus()
  }

  function answer(q, choice, chosenBtn) {
    const right = choice === q.answer
    if (right) correctCount++

    for (const btn of choicesEl.querySelectorAll("button")) {
      btn.disabled = true
      if (btn.textContent === q.answer) btn.classList.add("correct")
    }
    if (!right) chosenBtn.classList.add("incorrect")

    const verdict = document.createElement("p")
    verdict.classList.add("quiz-verdict", right ? "correct" : "incorrect")
    verdict.textContent = right ? "Correct!" : `Not quite. The answer: ${q.answer}`
    feedbackEl.appendChild(verdict)

    const ref = document.createElement("p")
    ref.classList.add("quiz-ref")
    ref.setAttribute("data-speak-pause", "")
    ref.append(`That's from ${q.ref}. `)
    if (q.day) {
      ref.append("Read it again: ")
      const link = document.createElement("a")
      link.href = `${weekPath(q.week)}/day-${q.day}/`
      link.textContent = `Week ${q.week}, Day ${q.day}`
      ref.appendChild(link)
    }
    feedbackEl.appendChild(ref)

    nextBtn.textContent = index + 1 < questions.length ? "Next question" : "See your score"
    nextBtn.style.display = "inline-block"
    nextBtn.focus()
  }

  function showResults() {
    els.play.style.display = "none"

    const prev = getBest(quizId)
    const isNewBest = !prev || correctCount / questions.length > prev.correct / prev.total
    saveBestIfBetter(quizId, correctCount, questions.length)

    els.results.innerHTML = ""

    const heading = document.createElement("h2")
    heading.textContent = `You got ${correctCount} of ${questions.length}.`
    els.results.appendChild(heading)

    const line = document.createElement("p")
    line.textContent = scoreLine(correctCount, questions.length)
    els.results.appendChild(line)

    if (prev && isNewBest) {
      const best = document.createElement("p")
      best.classList.add("quiz-best")
      best.textContent = `A new personal best. Your old mark was ${prev.correct} of ${prev.total}.`
      els.results.appendChild(best)
    } else if (prev) {
      const best = document.createElement("p")
      best.classList.add("quiz-best")
      best.textContent = `Your best on this quiz: ${prev.correct} of ${prev.total}.`
      els.results.appendChild(best)
    }

    const actions = document.createElement("p")
    actions.classList.add("quiz-actions")

    const again = document.createElement("button")
    again.type = "button"
    again.classList.add("quiz-go-btn")
    again.textContent = "Try again"
    again.addEventListener("click", () => {
      runQuiz(pool, upToWeek, quizId, contextLine, onward)
    })
    actions.appendChild(again)

    if (onward) {
      const link = document.createElement("a")
      link.classList.add("quiz-onward")
      link.href = onward.url
      link.textContent = onward.label
      actions.appendChild(link)
    }

    els.results.appendChild(actions)
    els.results.style.display = "block"
  }

  nextBtn.onclick = () => {
    index++
    if (index < questions.length) renderQuestion()
    else showResults()
  }

  renderQuestion()
}

// --- ?week=N ---

function startWeekQuiz(pool, week) {
  const upTo = week - 1
  if (questionsThrough(pool, upTo).length === 0) {
    showEmpty("Questions for the earlier weeks haven't been written yet.")
    return
  }

  const contextLine = `Starting week ${week}: questions from ${coverageLabel(pool, upTo)}.`
  const onward = week <= getTotalWeeks()
    ? { url: `${weekPath(week)}/overview/`, label: `On to week ${week}` }
    : null
  runQuiz(pool, upTo, `week-${week}`, contextLine, onward)
}

// --- No-params view ---

function initStart(pool) {
  const els = viewEls()
  els.context.textContent = "Reconnect with the story before you read on."
  els.start.style.display = "block"

  // "Quiz me on what I've read": only shown once progress reaches a week
  // that has questions behind it.
  const touched = highestWeekTouched()
  if (touched >= 1 && questionsThrough(pool, touched).length > 0) {
    const soFar = document.getElementById("quiz-so-far")
    soFar.textContent = `Quiz me on what I've read (${coverageLabel(pool, touched)})`
    soFar.style.display = "inline-block"
    soFar.addEventListener("click", () => {
      const contextLine = `Everything so far: questions from ${coverageLabel(pool, touched)}.`
      runQuiz(pool, touched, `through-${touched}`, contextLine, null)
    })
  }

  const select = document.getElementById("quiz-week-select")
  for (let w = 2; w <= getTotalWeeks(); w++) {
    const opt = document.createElement("option")
    opt.value = w
    opt.textContent = `Week ${w}`
    select.appendChild(opt)
  }

  document.getElementById("quiz-week-go").addEventListener("click", () => {
    if (select.value) window.location.search = `?week=${select.value}`
  })
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("quiz")) return

  const pool = getQuizPool()
  if (authoredWeeks(pool).length === 0) {
    showEmpty("No quiz questions have been written for this study yet.")
    return
  }

  const params = new URLSearchParams(window.location.search)
  const week = params.get("week") ? parseInt(params.get("week"), 10) : null

  if (week && week > 1) {
    startWeekQuiz(pool, week)
  } else if (week === 1) {
    showEmpty("Week 1 is the very beginning: there is nothing behind you to quiz yet. Come back when you start week 2.")
  } else {
    initStart(pool)
  }
})
