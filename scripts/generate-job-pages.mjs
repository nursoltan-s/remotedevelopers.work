#!/usr/bin/env node
/**
 * Generate static SEO job detail pages from data/jobs.json
 * Writes jobs/<slug>.html, ensures slugs, refreshes unified sitemap.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import {
  ROOT,
  loadJobs,
  saveJson,
  JOBS_JSON,
  generateJobsDataJs,
  stripHtml,
} from "./lib/io.mjs";
import {
  SITE,
  ensureJobSlugs,
  jobPageUrl,
} from "./lib/job-slug.mjs";
import { writeSitemap } from "./lib/write-sitemap.mjs";

const JOBS_DIR = join(ROOT, "jobs");
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function sanitizeJobHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

function formatPostedDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function plainDescription(job) {
  if (job.description) return String(job.description).slice(0, 5000);
  if (job.descriptionHtml) return stripHtml(job.descriptionHtml).slice(0, 5000);
  return `${job.title} at ${job.company}. Remote developer role.`;
}

function metaDescription(job) {
  return plainDescription(job).slice(0, 160);
}

function employmentType(job) {
  const t = String(job.type || "").toLowerCase();
  if (t.includes("contract") || t.includes("freelance")) return "CONTRACTOR";
  if (t.includes("part")) return "PART_TIME";
  return "FULL_TIME";
}

function validThrough(job) {
  const t = Date.parse(job.postedAt || "");
  if (!Number.isFinite(t)) return undefined;
  return new Date(t + ONE_YEAR_MS).toISOString().slice(0, 10);
}

function buildJobPostingLd(job) {
  const url = jobPageUrl(job);
  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: plainDescription(job),
    datePosted: job.postedAt
      ? String(job.postedAt).slice(0, 10)
      : undefined,
    employmentType: employmentType(job),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: {
      "@type": "Country",
      name: "Worldwide",
    },
    url,
    identifier: {
      "@type": "PropertyValue",
      name: "RemoteDevelopers.work",
      value: String(job.id),
    },
    directApply: false,
  };
  const through = validThrough(job);
  if (through) schema.validThrough = through;
  if (job.salaryMin && job.salaryMin > 0) {
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
}

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function logoHtml(job) {
  const label = initials(job.company);
  if (job.logo) {
    return `<div class="logo-mark w-16 h-16 text-xl" aria-hidden="true">
      <img src="${escapeAttr(job.logo)}" alt="" width="64" height="64" loading="lazy"
        data-fallback="${escapeAttr(label)}"
        onerror="this.onerror=null;var p=this.parentElement;p.textContent=this.dataset.fallback;this.remove();" />
    </div>`;
  }
  return `<div class="logo-mark w-16 h-16 text-xl" aria-hidden="true">${escapeHtml(label)}</div>`;
}

function headShell({ title, description, canonical, jsonLd }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${SITE}/assets/og-image.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <link rel="icon" href="/assets/favicon.png" type="image/png" />
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/400.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/500.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/600.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/700.css" rel="stylesheet" />
    <script>
      try {
        if (localStorage.getItem("rd-theme") === "light")
          document.documentElement.classList.add("light");
      } catch (e) {}
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              navy: { DEFAULT: "#0B1220", mid: "#111827", light: "#1F2937" },
              accent: { teal: "#3B82F6", cyan: "#6366F1" },
            },
            fontFamily: {
              display: ["Geist Sans", "Inter", "system-ui", "sans-serif"],
              sans: ["Geist Sans", "Inter", "system-ui", "sans-serif"],
            },
          },
        },
      };
    </script>
    <link rel="stylesheet" href="/css/styles.css" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1570747115569078"
     crossorigin="anonymous"></script>
    <script type="application/ld+json">${jsonLd}</script>
  </head>`;
}

function renderJobPage(job) {
  const canonical = jobPageUrl(job);
  const title = `${job.title} at ${job.company} — RemoteDevelopers.work`;
  const description = metaDescription(job);
  const jsonLd = JSON.stringify(buildJobPostingLd(job));

  const tags = (job.tags || [])
    .map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`)
    .join("");

  const salary = job.salary
    ? `<span class="badge-salary">${escapeHtml(job.salary)}</span>`
    : "";

  const partner =
    job.source === "partner" && job.partnerName
      ? `<p class="text-muted text-sm mt-2">Syndicated from
          <a href="${escapeAttr(job.partnerUrl || "#")}" class="text-[var(--rd-primary)] hover:underline" target="_blank" rel="noopener noreferrer">${escapeHtml(job.partnerName)}</a>
        </p>`
      : "";

  const featured = job.featured
    ? `<span class="badge-featured">Featured</span>`
    : "";

  let body;
  if (job.descriptionHtml) {
    body = `<div class="job-description">${sanitizeJobHtml(job.descriptionHtml)}</div>`;
  } else if (job.description) {
    body = `<div class="job-description"><p>${escapeHtml(job.description)}</p></div>`;
  } else {
    body = `<p class="text-muted">No description provided. Use Apply to view the full posting on the source site.</p>`;
  }

  const postedLabel = formatPostedDate(job.postedAt);
  const applyUrl = escapeAttr(job.applyUrl || "/jobs.html");

  return `${headShell({ title, description, canonical, jsonLd })}
  <body class="antialiased">
    <div data-rd-header="jobs"></div>
    <script src="/js/chrome.js"></script>

    <main id="main" class="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <a href="/jobs.html" class="text-sm text-[var(--rd-primary)] hover:underline inline-flex mb-6">← Back to jobs</a>

      <header class="surface-panel p-6 sm:p-8 mb-6">
        <div class="flex flex-col sm:flex-row gap-5 sm:items-start">
          ${logoHtml(job)}
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-2">${featured}</div>
            <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight">${escapeHtml(job.title)}</h1>
            <p class="text-muted mt-2 text-lg">${escapeHtml(job.company)}</p>
            ${partner}
            <div class="flex flex-wrap items-center gap-2 mt-4">
              <span class="badge-remote">Remote</span>
              ${salary}
              ${job.type ? `<span class="tag-chip">${escapeHtml(job.type)}</span>` : ""}
              ${job.level ? `<span class="tag-chip">${escapeHtml(job.level)}</span>` : ""}
            </div>
            ${
              postedLabel
                ? `<p class="text-muted text-sm mt-4"><time datetime="${escapeAttr(job.postedAt)}">Posted ${escapeHtml(postedLabel)}</time></p>`
                : ""
            }
          </div>
          <a class="btn-primary shrink-0 self-start" href="${applyUrl}" target="_blank" rel="noopener noreferrer">Apply</a>
        </div>
      </header>

      <section class="surface-panel p-6 sm:p-8 mb-6">
        <h2 class="font-display text-lg font-semibold mb-4">Skills &amp; tags</h2>
        <div class="flex flex-wrap gap-2">${tags || '<span class="text-muted text-sm">No tags listed</span>'}</div>
      </section>

      <section class="surface-panel p-6 sm:p-8 mb-8">
        <h2 class="font-display text-lg font-semibold mb-4">Job description</h2>
        ${body}
      </section>

      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <a href="/jobs.html" class="btn-secondary inline-flex justify-center">Back to jobs</a>
        <a class="btn-primary inline-flex justify-center" href="${applyUrl}" target="_blank" rel="noopener noreferrer">Apply for this role</a>
      </div>
    </main>

    <div data-rd-footer></div>
    <script>window.RDChrome && window.RDChrome.mount();</script>
    <script src="/js/theme.js"></script>
    <script src="/js/ui.js"></script>
    <script src="/js/analytics-config.js"></script>
    <script src="/js/analytics.js"></script>
  </body>
</html>
`;
}

export function generateJobPages() {
  const jobs = ensureJobSlugs(loadJobs());
  saveJson(JOBS_JSON, jobs);
  generateJobsDataJs();

  mkdirSync(JOBS_DIR, { recursive: true });

  const keep = new Set();
  for (const job of jobs) {
    if (!job.slug) continue;
    const file = `${job.slug}.html`;
    keep.add(file);
    writeFileSync(join(JOBS_DIR, file), renderJobPage(job), "utf8");
  }

  // Remove stale pages
  let removed = 0;
  if (existsSync(JOBS_DIR)) {
    for (const f of readdirSync(JOBS_DIR)) {
      if (!f.endsWith(".html")) continue;
      if (keep.has(f)) continue;
      unlinkSync(join(JOBS_DIR, f));
      removed++;
    }
  }

  const sitemapCount = writeSitemap();
  return { count: jobs.length, removed, sitemapCount };
}

function main() {
  const { count, removed, sitemapCount } = generateJobPages();
  console.log(
    `Generated ${count} job pages under jobs/ (removed ${removed} stale). Sitemap: ${sitemapCount} urls.`,
  );
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
