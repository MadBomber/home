document.addEventListener("DOMContentLoaded", () => {
  const dropdowns = Array.from(document.querySelectorAll(".bc-has-dropdown"))
  if (!dropdowns.length) return

  function closeAll() {
    dropdowns.forEach(d => {
      d.classList.remove("bc-open")
      d.querySelector(".bc-toggle")?.setAttribute("aria-expanded", "false")
    })
  }

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector(".bc-toggle")
    if (!toggle) return

    toggle.addEventListener("click", (e) => {
      e.stopPropagation()
      const isOpen = dropdown.classList.contains("bc-open")
      closeAll()
      if (!isOpen) {
        dropdown.classList.add("bc-open")
        toggle.setAttribute("aria-expanded", "true")
      }
    })

    dropdown.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeAll)
    })
  })

  document.addEventListener("click", closeAll)
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll() })
})
