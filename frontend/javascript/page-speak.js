document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".toolbar-speak-btn")
  if (!btn || !("speechSynthesis" in window)) return

  const synth = window.speechSynthesis

  btn.addEventListener("click", () => {
    if (synth.speaking) {
      synth.cancel()
      btn.classList.remove("speaking")
      btn.dataset.tooltip = "Read page aloud"
      return
    }

    const article = document.querySelector("article")
    if (!article) return

    const speakTarget = article.querySelector(".blog-post-body") || article

    // Inline SVG graphics (the location maps, the timeline) carry <text>
    // labels that read as word salad when spoken. display:none removes an
    // element from innerText, so hide them for the snapshot and restore
    // them before the browser can repaint. Captions live outside the <svg>
    // and are still spoken. data-nospeak opts out any future non-SVG block.
    const skips = speakTarget.querySelectorAll("svg, [data-nospeak]")
    const saved = []
    skips.forEach((el) => { saved.push(el.style.display); el.style.display = "none" })

    // Buttons and other short blocks (the quiz's answer choices) reach
    // innerText separated only by newlines, which voices read straight
    // through. Elements marked data-speak-pause get a period appended for
    // the snapshot, unless they already end in punctuation, so each is
    // spoken as its own sentence. Restored before the browser repaints,
    // like the SVG hiding above.
    const pauses = speakTarget.querySelectorAll("[data-speak-pause]")
    const dots = []
    pauses.forEach((el) => {
      const spoken = el.innerText.trim()
      if (spoken && !/[.!?:;]$/.test(spoken)) {
        const dot = document.createTextNode(".")
        el.appendChild(dot)
        dots.push(dot)
      }
    })

    const text = speakTarget.innerText
    dots.forEach((dot) => dot.remove())
    skips.forEach((el, i) => { el.style.display = saved[i] })
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => {
      btn.classList.add("speaking")
      btn.dataset.tooltip = "Stop reading"
    }

    utterance.onend = () => {
      btn.classList.remove("speaking")
      btn.dataset.tooltip = "Read page aloud"
    }

    utterance.onerror = () => {
      btn.classList.remove("speaking")
      btn.dataset.tooltip = "Read page aloud"
    }

    synth.speak(utterance)
  })
})
