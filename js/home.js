/**
 * Homepage: featured jobs, stats, tech counts, search form.
 */
(function () {
  const FEATURED_BRANDS = [
    "GitLab",
    "Shopify",
    "Vercel",
    "Cloudflare",
    "Supabase",
    "Canonical",
    "Stripe",
    "Docker",
  ];

  const TECH_PAGES = [
    { name: "React", slug: "react", tags: ["React"] },
    { name: "Python", slug: "python", tags: ["Python"] },
    { name: "TypeScript", slug: "typescript", tags: ["TypeScript", "TS"] },
    { name: "Node.js", slug: "nodejs", tags: ["Node.js", "Node"] },
    { name: "Go", slug: "go", tags: ["Go", "Golang"] },
    { name: "Rust", slug: "rust", tags: ["Rust"] },
    { name: "DevOps", slug: "devops", tags: ["DevOps", "Kubernetes", "Docker"] },
    { name: "AWS", slug: "aws", tags: ["AWS"] },
    { name: "AI", slug: "ai", tags: ["AI", "ML", "Machine Learning", "LLM"] },
    {
      name: "Data Eng",
      slug: "data-engineer",
      tags: ["Data Engineer", "Data Engineering", "ETL"],
    },
    { name: "Flutter", slug: "flutter", tags: ["Flutter", "Dart"] },
    { name: "Java", slug: "java", tags: ["Java", "Spring"] },
  ];

  function countByTags(tags) {
    const jobs = window.RD_JOBS || [];
    const lower = tags.map((t) => t.toLowerCase());
    return jobs.filter((j) =>
      (j.tags || []).some((t) => lower.includes(String(t).toLowerCase())),
    ).length;
  }

  function skeletonHTML() {
    return window.RDUI?.skeletonCards?.(4) || "";
  }

  async function renderFeatured() {
    const featuredEl = document.getElementById("home-featured");
    if (!featuredEl || !window.RDJobs) return;

    const featured = (window.RD_JOBS || []).filter((j) => j.featured).slice(0, 6);
    const cards =
      featured.length > 0 ? featured : (window.RD_JOBS || []).slice(0, 6);

    featuredEl.innerHTML = cards
      .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
      .join("");

    if (featured.length) {
      window.RDJobs.injectSchema(featured);
    }
  }

  function renderBrands() {
    const el = document.getElementById("home-brands");
    if (!el) return;
    el.innerHTML = FEATURED_BRANDS.map(
      (name) =>
        `<div class="logo-wall-item" data-reveal>${window.RDJobs.escapeHtml(name)}</div>`,
    ).join("");
  }

  function renderTech() {
    const el = document.getElementById("home-tech");
    if (!el) return;

    el.innerHTML = TECH_PAGES.map((t) => {
      const live = countByTags(t.tags);
      const display = live > 0 ? live.toLocaleString() : "—";
      return `
        <a href="/tech/${t.slug}.html" class="browse-card" data-reveal>
          <span class="font-display text-xl font-semibold">${window.RDJobs.escapeHtml(t.name)}</span>
          <span class="text-muted text-sm">${display} Jobs</span>
        </a>`;
    }).join("");
  }

  function updateLiveStats() {
    const jobs = window.RD_JOBS || [];
    const updatedEl = document.getElementById("trust-updated");
    if (!updatedEl) return;

    if (window.RD_API_STATUS?.lastUpdated) {
      const mins = Math.max(
        1,
        Math.round(
          (Date.now() - new Date(window.RD_API_STATUS.lastUpdated).getTime()) /
            60000,
        ),
      );
      updatedEl.textContent =
        mins < 60
          ? `Last updated ${mins} minute${mins === 1 ? "" : "s"} ago · ${jobs.length.toLocaleString()} live listings`
          : `Updated daily · ${jobs.length.toLocaleString()} live listings`;
    } else {
      updatedEl.textContent = `Updated daily · ${jobs.length.toLocaleString()} live listings`;
    }
  }

  function bindHomeSearch() {
    const form = document.getElementById("home-search-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = form.querySelector('[name="q"]')?.value?.trim() || "";
      const role = form.querySelector('[name="role"]')?.value || "";
      const level = form.querySelector('[name="level"]')?.value || "";
      const location = form.querySelector('[name="location"]')?.value || "";
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (role) params.set("role", role);
      if (level) params.set("level", level);
      if (location) params.set("location", location);
      const qs = params.toString();
      window.location.href = `/jobs.html${qs ? `?${qs}` : ""}`;
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const featuredEl = document.getElementById("home-featured");
    if (featuredEl) {
      featuredEl.innerHTML = skeletonHTML();
    }

    renderBrands();
    bindHomeSearch();

    try {
      if (window.RDJobsAPI?.loadRemoteJobs) {
        await window.RDJobsAPI.loadRemoteJobs();
      }
    } catch (err) {
      console.warn("[RD] API load failed", err);
    }

    await renderFeatured();
    renderTech();
    updateLiveStats();
    window.RDUI?.initReveal?.();
    window.RDUI?.initCounters?.();
  });
})();
