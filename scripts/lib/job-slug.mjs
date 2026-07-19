/**
 * Stable job slugs for static SEO pages (/jobs/<slug>).
 */
import { createHash } from "crypto";

export const SITE = "https://remotedevelopers.work";

export function slugify(text, maxLen = 60) {
  const s = String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return s || "job";
}

/** Compact, URL-safe id suffix — hashes long partner URL ids. */
export function shortJobId(id) {
  const s = String(id || "");
  if (/^[a-z0-9][a-z0-9._-]{0,39}$/i.test(s)) return s.toLowerCase();
  return createHash("sha1").update(s).digest("hex").slice(0, 12);
}

export function buildJobSlug(job) {
  const title = slugify(job?.title, 50);
  const company = slugify(job?.company, 30);
  const id = shortJobId(job?.id);
  return `${title}-${company}-${id}`.replace(/-+/g, "-").slice(0, 120);
}

/** Assign unique slug fields; preserves existing valid slugs when possible. */
export function ensureJobSlugs(jobs) {
  const used = new Set();
  return (jobs || []).map((job) => {
    let slug =
      job.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(job.slug)
        ? job.slug
        : buildJobSlug(job);
    let n = 2;
    const base = slug;
    while (used.has(slug)) {
      slug = `${base}-${n++}`.slice(0, 120);
    }
    used.add(slug);
    return { ...job, slug };
  });
}

export function jobPagePath(job) {
  const slug = job?.slug || buildJobSlug(job);
  return `/jobs/${slug}`;
}

export function jobPageUrl(job) {
  return `${SITE}${jobPagePath(job)}`;
}
