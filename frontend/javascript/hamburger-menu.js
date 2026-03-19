document.addEventListener("DOMContentLoaded", () => {
  const btn  = document.querySelector(".hamburger-btn")
  const menu = document.querySelector(".hamburger-menu")
  if (!btn || !menu) return

  function closeMenu() {
    menu.classList.remove("open")
    btn.setAttribute("aria-expanded", "false")
  }

  // Toggle the hamburger menu open/closed
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    const isOpen = menu.classList.toggle("open")
    btn.setAttribute("aria-expanded", String(isOpen))
  })

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) closeMenu()
  })

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu()
  })

  // Accordion section toggles — each opens/closes independently
  menu.querySelectorAll(".nav-accordion-toggle").forEach(toggle => {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation()
      const expanded = toggle.getAttribute("aria-expanded") === "true"
      toggle.setAttribute("aria-expanded", String(!expanded))
    })
  })

  // Leaf links (not accordion toggles) close the whole menu
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu)
  })
})
