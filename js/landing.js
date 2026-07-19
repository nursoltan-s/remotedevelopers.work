/**
 * SEO landing pages: filter RD_JOBS by data-landing-* attrs on #landing-jobs.
 *
 * Supported attrs:
 *   data-landing-tags          comma tags (OR match title/tags)
 *   data-landing-salary-min    number
 *   data-landing-location      display location label
 *   data-landing-location-keys comma substrings for location match
 *   data-landing-company       company name substring
 *   data-landing-level         junior|mid|senior|lead|staff|principal (OR list)
 *   data-landing-type          Full-time|Contract|Freelance|Part-time|Internship (OR list)
 *   data-landing-query         free-text keywords (OR) against title/company/tags/description
 *   data-landing-limit         max cards (default 12)
 */
(function () {
  const LEVEL_ALIASES = {
    junior: ["junior", "entry", "entry-level", "associate", "intern"],
    mid: ["mid", "mid-level", "middle", "intermediate"],
    senior: ["senior", "sr", "sr."],
    lead: ["lead", "tech lead", "team lead"],
    staff: ["staff"],
    principal: ["principal"],
  };

  function parseList(attr) {
    return String(attr || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function jobHaystack(job) {
    return [
      job.title,
      job.company,
      job.location,
      job.type,
      job.level,
      job.description,
      ...(job.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function matchesLevel(job, levels) {
    if (!levels.length) return true;
    const level = String(job.level || "").toLowerCase();
    const title = String(job.title || "").toLowerCase();
    return levels.some((raw) => {
      const key = raw.toLowerCase();
      const aliases = LEVEL_ALIASES[key] || [key];
      return aliases.some((a) => level.includes(a) || title.includes(a));
    });
  }

  function matchesType(job, types) {
    if (!types.length) return true;
    const jobType = String(job.type || "").toLowerCase();
    const hay = jobHaystack(job);
    return types.some((t) => {
      const needle = t.toLowerCase();
      return jobType.includes(needle) || hay.includes(needle);
    });
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
        if (cfg.location.toLowerCase() !== "worldwide") return false;
      }
    }

    if (cfg.company) {
      const company = String(job.company || "").toLowerCase();
      if (!company.includes(cfg.company.toLowerCase())) return false;
    }

    if (!matchesLevel(job, cfg.levels)) return false;
    if (!matchesType(job, cfg.types)) return false;

    if (cfg.query.length) {
      const hay = jobHaystack(job);
      if (!cfg.query.some((q) => hay.includes(q.toLowerCase()))) return false;
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
      company: mount.getAttribute("data-landing-company") || "",
      levels: parseList(mount.getAttribute("data-landing-level")),
      types: parseList(mount.getAttribute("data-landing-type")),
      query: parseList(mount.getAttribute("data-landing-query")),
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
