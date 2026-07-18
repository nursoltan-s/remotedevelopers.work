/**
 * Homepage featured jobs + company teaser.
 */
(function () {
  async function renderFeatured() {
    const featuredEl = document.getElementById("home-featured");
    if (!featuredEl || !window.RDJobs) return;

    const featured = (window.RD_JOBS || [])
      .filter((j) => j.featured)
      .slice(0, 6);

    // If no curated featured yet after API, show newest partner tech roles
    const cards =
      featured.length > 0
        ? featured
        : (window.RD_JOBS || []).slice(0, 6);

    featuredEl.innerHTML = cards
      .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
      .join("");

    if (featured.length) {
      window.RDJobs.injectSchema(featured);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const featuredEl = document.getElementById("home-featured");
    if (featuredEl) {
      featuredEl.innerHTML =
        '<p class="text-muted text-sm">Loading live remote roles…</p>';
    }

    try {
      if (window.RDJobsAPI?.loadRemoteJobs) {
        await window.RDJobsAPI.loadRemoteJobs();
      }
    } catch (err) {
      console.warn("[RD] API load failed", err);
    }

    await renderFeatured();

    const companiesEl = document.getElementById("home-companies");
    if (companiesEl && window.RD_COMPANIES) {
      companiesEl.innerHTML = window.RD_COMPANIES.slice(0, 8)
        .map(
          (c) => `
          <a href="${window.RDJobs.escapeAttr(c.url)}" target="_blank" rel="noopener noreferrer" class="company-tile">
            ${window.RDJobs.logoMarkHTML(c, { size: 48, className: "w-12 h-12 text-base" })}
            <span class="text-sm font-medium">${window.RDJobs.escapeHtml(c.name)}</span>
          </a>`
        )
        .join("");
    }
  });
})();
