/**
 * Job detail page — load by ?id=, then re-fetch full description via API.
 */
(function () {
  function getId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("id");
    if (fromQuery) return fromQuery;

    // Fallback when cleanUrls redirect stripped ?id=
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    if (hash.startsWith("id=")) return decodeURIComponent(hash.slice(3));
    try {
      return decodeURIComponent(hash);
    } catch {
      return hash;
    }
  }

  function findJob(id) {
    if (window.RDJobsAPI?.findJobById) {
      return window.RDJobsAPI.findJobById(id);
    }
    return (window.RD_JOBS || []).find((j) => String(j.id) === String(id));
  }

  function renderLoading(msg) {
    const root = document.getElementById("job-detail");
    if (!root) return;
    root.innerHTML = `<p class="text-muted">${msg || "Loading job details…"}</p>`;
  }

  function renderNotFound() {
    const root = document.getElementById("job-detail");
    if (!root) return;
    root.innerHTML = `
      <div class="surface-panel p-8 text-center">
        <h1 class="font-display text-2xl font-bold mb-3">Job not found</h1>
        <p class="text-muted mb-6">This listing may have expired or the link is invalid.</p>
        <a href="/jobs.html" class="btn-primary inline-flex">Browse jobs</a>
      </div>`;
    document.title = "Job not found — RemoteDevelopers.work";
  }

  function renderJob(job) {
    const root = document.getElementById("job-detail");
    if (!root || !window.RDJobs) return;

    const {
      escapeHtml,
      escapeAttr,
      logoMarkHTML,
      formatPostedDate,
      relativeTime,
      sanitizeJobHtml,
    } = window.RDJobs;

    const tags = (job.tags || [])
      .map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`)
      .join("");

    const salary = job.salary
      ? `<span class="badge-salary">${escapeHtml(job.salary)}</span>`
      : "";

    const partner =
      job.source === "partner" && job.partnerName
        ? `<p class="text-muted text-sm mt-2">Syndicated from
            <a href="${escapeAttr(job.partnerUrl || "#")}" class="text-accent-teal hover:underline" target="_blank" rel="noopener noreferrer">${escapeHtml(job.partnerName)}</a>
          </p>`
        : "";

    const featured = job.featured
      ? `<span class="badge-featured">Featured</span>`
      : "";

    let body = "";
    if (job.descriptionHtml) {
      body = `<div class="job-description">${sanitizeJobHtml(job.descriptionHtml)}</div>`;
    } else if (job.description) {
      body = `<div class="job-description"><p>${escapeHtml(job.description)}</p></div>`;
    } else {
      body = `<p class="text-muted">No description provided. Use Apply to view the full posting on the source site.</p>`;
    }

    const postedLabel = formatPostedDate(job.postedAt);
    const postedRel = relativeTime(job.postedAt);

    root.innerHTML = `
      <a href="/jobs.html" class="text-sm text-accent-teal hover:underline inline-flex mb-6">← Back to jobs</a>

      <header class="surface-panel p-6 sm:p-8 mb-6">
        <div class="flex flex-col sm:flex-row gap-5 sm:items-start">
          ${logoMarkHTML(findCompanyOrName(job), { size: 64, className: "w-16 h-16 text-xl" })}
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-2">${featured}</div>
            <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight">${escapeHtml(job.title)}</h1>
            <p class="text-muted mt-2 text-lg">${escapeHtml(job.company)}</p>
            ${partner}
            <div class="flex flex-wrap items-center gap-2 mt-4">
              <span class="badge-remote">🌍 Remote</span>
              ${salary}
              <span class="tag-chip">${escapeHtml(job.type || "")}</span>
              <span class="tag-chip">${escapeHtml(job.level || "")}</span>
            </div>
            <p class="text-muted text-sm mt-4">
              <time datetime="${escapeAttr(job.postedAt)}">Posted ${escapeHtml(postedLabel)}</time>
              <span aria-hidden="true"> · </span>
              <span>${escapeHtml(postedRel)}</span>
            </p>
          </div>
          <a
            class="btn-primary shrink-0 self-start"
            href="${escapeAttr(job.applyUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >Apply</a>
        </div>
      </header>

      <section class="surface-panel p-6 sm:p-8 mb-6">
        <h2 class="font-display text-lg font-semibold mb-4">Skills & tags</h2>
        <div class="flex flex-wrap gap-2">${tags || '<span class="text-muted text-sm">No tags listed</span>'}</div>
      </section>

      <section class="surface-panel p-6 sm:p-8 mb-8">
        <h2 class="font-display text-lg font-semibold mb-4">Job description</h2>
        ${body}
      </section>

      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <a href="/jobs.html" class="btn-secondary inline-flex justify-center">Back to jobs</a>
        <a
          class="btn-primary inline-flex justify-center"
          href="${escapeAttr(job.applyUrl)}"
          target="_blank"
          rel="noopener noreferrer"
        >Apply for this role</a>
      </div>
    `;

    document.title = `${job.title} at ${job.company} — RemoteDevelopers.work`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && job.description) {
      meta.setAttribute("content", job.description.slice(0, 160));
    }
  }

  function findCompanyOrName(job) {
    const matched = window.RDJobs.findCompany?.(job.company);
    if (matched) {
      return {
        ...matched,
        logo: job.logo || matched.logo,
      };
    }
    return {
      name: job.company,
      logo: job.logo || null,
      initials: window.RDJobs.initials(job.company),
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const id = getId();
    if (!id) {
      renderNotFound();
      return;
    }

    renderLoading("Loading job…");

    // Fast paint from cache / curated
    let job = findJob(id);
    if (job) renderJob(job);
    else renderLoading("Fetching job from partner API…");

    // Ensure list is warm, then re-fetch this jobId for full description
    try {
      if (window.RDJobsAPI?.loadRemoteJobs) {
        await window.RDJobsAPI.loadRemoteJobs();
      }
    } catch (err) {
      console.warn("[RD] list load failed on detail", err);
    }

    try {
      if (window.RDJobsAPI?.fetchJobDetail) {
        if (!job) renderLoading("Loading full job description…");
        job = await window.RDJobsAPI.fetchJobDetail(id);
      } else {
        job = findJob(id);
      }
    } catch (err) {
      console.warn("[RD] fetchJobDetail failed", err);
      job = findJob(id);
    }

    if (job) renderJob(job);
    else renderNotFound();
  });
})();
