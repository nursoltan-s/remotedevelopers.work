/**
 * Micro-interactions: reveal on scroll, counters, button ripples.
 */
(function () {
  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initReveal() {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;

    if (reduced) {
      nodes.forEach((el) => el.classList.add("revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    nodes.forEach((el) => io.observe(el));
  }

  function animateCounter(el) {
    const target = Number(el.getAttribute("data-count") || 0);
    const suffix = el.getAttribute("data-suffix") || "";
    const prefix = el.getAttribute("data-prefix") || "";
    if (reduced || target <= 0) {
      el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function initCounters() {
    const nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );

    nodes.forEach((el) => io.observe(el));
  }

  function initRipples() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-primary");
      if (!btn || reduced) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  function skeletonCards(count = 3) {
    return Array.from({ length: count })
      .map(() => `<div class="skeleton skeleton-card" aria-hidden="true"></div>`)
      .join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    initReveal();
    initCounters();
    initRipples();
  });

  window.RDUI = { initReveal, initCounters, skeletonCards };
})();
