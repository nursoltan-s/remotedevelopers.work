/**
 * Shared job rendering + relative time helpers.
 */
window.RDJobs = (function () {
  function initials(name) {
    return (name || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  function relativeTime(iso) {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  function findCompany(name) {
    const list = window.RD_COMPANIES || [];
    return list.find(
      (c) => c.name.toLowerCase() === String(name || "").toLowerCase(),
    );
  }

  /** Resolve logo URL: explicit logo, then icon.horse by domain */
  function companyLogoUrl(company) {
    if (!company) return null;
    if (company.logo) return company.logo;
    if (company.domain) return `https://icon.horse/icon/${company.domain}`;
    return null;
  }

  function logoMarkHTML(companyOrName, { size = 56, className = "" } = {}) {
    const company =
      typeof companyOrName === "string"
        ? findCompany(companyOrName) || {
            name: companyOrName,
            initials: initials(companyOrName),
          }
        : companyOrName || { name: "?", initials: "?" };

    const label = company.initials || initials(company.name);
    const src = companyLogoUrl(company);
    const safeLabel = escapeHtml(label);

    if (!src) {
      return `<div class="logo-mark ${className}" aria-hidden="true">${safeLabel}</div>`;
    }

    return `<div class="logo-mark ${className}" aria-hidden="true">
      <img
        src="${escapeAttr(src)}"
        alt=""
        loading="lazy"
        width="${size}"
        height="${size}"
        data-fallback="${escapeAttr(label)}"
        onerror="this.onerror=null;var p=this.parentElement;p.textContent=this.dataset.fallback;this.remove();"
      />
    </div>`;
  }

  function jobDetailUrl(job) {
    const id = encodeURIComponent(String(job?.id ?? ""));
    // Include hash as backup: some static servers (cleanUrls) redirect
    // /job.html?id=… → /job and drop the query string; browsers keep the hash.
    return `/job.html?id=${id}#${id}`;
  }

  function formatPostedDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return relativeTime(iso);
    }
  }

  /** Light sanitize for partner HTML descriptions */
  function sanitizeJobHtml(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
      .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
      .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
      .replace(/javascript:/gi, "");
  }

  function jobCardHTML(job, { showFeatured = true, animate = false } = {}) {
    const matched = findCompany(job.company);
    const logoSrc = job.logo || companyLogoUrl(matched);
    const fallback = initials(job.company);
    const logoInner = logoSrc
      ? `<img src="${escapeAttr(logoSrc)}" alt="" loading="lazy" width="48" height="48" data-fallback="${escapeAttr(fallback)}" onerror="this.onerror=null;var p=this.parentElement;p.textContent=this.dataset.fallback;this.remove();" />`
      : escapeHtml(fallback);
    const featuredBadge =
      showFeatured && job.featured
        ? `<span class="badge-featured">Featured</span>`
        : "";

    const partnerNote =
      job.source === "partner" && job.partnerName
        ? `<span class="text-muted text-xs">via ${escapeHtml(job.partnerName)}</span>`
        : "";

    const salary = job.salary
      ? `<span class="badge-salary">${escapeHtml(job.salary)}</span>`
      : "";

    const tags = (job.tags || [])
      .slice(0, 4)
      .map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`)
      .join("");

    const location = job.location || "Remote Worldwide";
    const anim = animate ? " fade-up" : "";
    const detailUrl = jobDetailUrl(job);

    return `
      <article class="job-card p-6 sm:p-7${anim}" data-job-id="${escapeAttr(job.id)}">
        <div class="flex flex-col gap-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-4 min-w-0">
              <a href="${escapeAttr(detailUrl)}" class="logo-mark !w-12 !h-12" aria-hidden="true">${logoInner}</a>
              <div class="min-w-0">
                <p class="text-sm font-medium text-muted mb-1">
                  ${escapeHtml(job.company)}
                  ${partnerNote ? ` · ${partnerNote}` : ""}
                </p>
                <h3 class="font-display text-xl sm:text-2xl font-semibold leading-snug">
                  <a href="${escapeAttr(detailUrl)}" class="hover:text-[var(--rd-primary)] transition-colors">
                    ${escapeHtml(job.title)}
                  </a>
                </h3>
              </div>
            </div>
            <div class="flex flex-col items-end gap-2 shrink-0">
              ${featuredBadge}
              <time class="text-muted text-xs" datetime="${escapeAttr(job.postedAt)}">Posted ${relativeTime(job.postedAt)}</time>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge-remote">Remote Worldwide</span>
            ${salary}
            <span class="tag-chip">${escapeHtml(location)}</span>
            ${job.level ? `<span class="tag-chip">${escapeHtml(job.level)}</span>` : ""}
          </div>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap gap-1.5">${tags}</div>
            <a
              class="btn-apply"
              href="${escapeAttr(job.applyUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >Apply <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </article>
    `;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function buildJobPostingSchema(jobs) {
    const items = (jobs || [])
      .filter((j) => j.source === "curated" && j.applyUrl)
      .slice(0, 10)
      .map((job) => {
        const schema = {
          "@type": "JobPosting",
          title: job.title,
          description: job.description || `${job.title} at ${job.company}`,
          datePosted: job.postedAt,
          employmentType: job.type === "Contract" ? "CONTRACTOR" : "FULL_TIME",
          hiringOrganization: {
            "@type": "Organization",
            name: job.company,
          },
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: "Worldwide",
          },
          url: job.applyUrl,
        };
        if (job.salary && job.salaryMin) {
          schema.baseSalary = {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: {
              "@type": "QuantitativeValue",
              value: job.salaryMin,
              unitText: "YEAR",
            },
          };
        }
        return schema;
      });

    return {
      "@context": "https://schema.org",
      "@graph": items,
    };
  }

  function injectSchema(jobs) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(buildJobPostingSchema(jobs));
    document.head.appendChild(script);
  }

  return {
    initials,
    relativeTime,
    formatPostedDate,
    findCompany,
    companyLogoUrl,
    logoMarkHTML,
    jobDetailUrl,
    jobCardHTML,
    sanitizeJobHtml,
    escapeHtml,
    escapeAttr,
    buildJobPostingSchema,
    injectSchema,
  };
})();
