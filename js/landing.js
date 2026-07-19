/**
 * SEO landing pages: filter RD_JOBS by data-landing-* attrs on #landing-jobs.
 */
(function () {
  function parseList(attr) {
    return String(attr || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function matches(job, cfg) {
    if (cfg.tags.length) {
      const jobTags = (job.tags || []).map((t) => String(t).toLowerCase());
      const hay = [job.title, ...(job.tags || [])].join(" ").toLowerCase();
      const ok = cfg.tags.some(
        (t) => jobTags.includes(t.toLowerCase()) || hay.includes(t.toLowerCase()),
      );
      if (!ok) return false;
    }

    if (cfg.salaryMin > 0) {
      if (!job.salaryMin || job.salaryMin < cfg.salaryMin) return false;
    }

    if (cfg.location) {
      const hay = [job.location, job.title, ...(job.tags || [])]
        .join(" ")
        .toLowerCase();
      const keys = cfg.locationKeys.length
        ? cfg.locationKeys
        : [cfg.location.toLowerCase()];
      if (!keys.some((k) => hay.includes(k.toLowerCase()))) {
        // Worldwide: show all remote
        if (cfg.location.toLowerCase() !== "worldwide") return false;
      }
    }

    return true;
  }

  async function run() {
    const mount = document.getElementById("landing-jobs");
    if (!mount || !window.RDJobs) return;

    const cfg = {
      tags: parseList(mount.getAttribute("data-landing-tags")),
      salaryMin: Number(mount.getAttribute("data-landing-salary-min") || 0),
      location: mount.getAttribute("data-landing-location") || "",
      locationKeys: parseList(mount.getAttribute("data-landing-location-keys")),
      limit: Number(mount.getAttribute("data-landing-limit") || 12),
    };

    mount.innerHTML =
      window.RDUI?.skeletonCards?.(3) ||
      '<p class="text-muted text-sm">Loading…</p>';

    try {
      if (window.RDJobsAPI?.loadRemoteJobs) {
        await window.RDJobsAPI.loadRemoteJobs();
      }
    } catch (err) {
      console.warn("[RD] landing load failed", err);
    }

    const jobs = (window.RD_JOBS || [])
      .filter((j) => matches(j, cfg))
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
      .slice(0, cfg.limit);

    const countEl = document.getElementById("landing-count");
    if (countEl) {
      countEl.textContent = `${jobs.length} matching role${jobs.length === 1 ? "" : "s"}`;
    }

    if (!jobs.length) {
      mount.innerHTML = `
        <div class="surface-panel p-8 text-center">
          <p class="font-semibold">No matching jobs right now</p>
          <p class="text-muted text-sm mt-2">Browse the full board for the latest remote openings.</p>
          <a href="/jobs.html" class="btn-primary mt-6 inline-flex">Browse all jobs</a>
        </div>`;
      return;
    }

    mount.innerHTML = jobs
      .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
      .join("");
  }

  document.addEventListener("DOMContentLoaded", run);
})();
