/**
 * Theme: light by default, dark via removing html.light, persisted in localStorage.
 */
(function () {
  const KEY = "rd-theme";

  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }

  function getStored() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }

  function init() {
    const stored = getStored();
    applyTheme(stored === "dark" ? "dark" : "light");
  }

  function toggle() {
    const next = document.documentElement.classList.contains("light")
      ? "dark"
      : "light";
    applyTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }

  init();

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", toggle);
    });

    const menuBtn = document.querySelector("[data-mobile-menu]");
    const mobileNav = document.querySelector("[data-mobile-nav]");
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener("click", () => {
        const open = mobileNav.classList.toggle("hidden") === false;
        menuBtn.setAttribute("aria-expanded", String(open));
      });
    }
  });

  window.RDTheme = { toggle, applyTheme };
})();
