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

  // Any link or button tap in the menu closes it
  menu.querySelectorAll("a, button").forEach(el => {
    el.addEventListener("click", closeMenu)
  })
})
