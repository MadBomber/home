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
    const text = speakTarget.innerText
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
