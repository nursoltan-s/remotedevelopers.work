/**
 * Unified sitemap + robots.txt writer.
 * Scans static HTML on disk so hubs, blog, landings, and jobs stay in sync.
 */
import { existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { ROOT } from "./io.mjs";

export const SITE = "https://remotedevelopers.work";

const ROOT_PAGES = [
  "",
  "jobs.html",
  "post-job.html",
  "companies.html",
  "blog.html",
  "about.html",
  "privacy.html",
  "terms.html",
  "tech.html",
  "roles.html",
  "guides.html",
  "salary.html",
];

const SCAN_DIRS = [
  "blog",
  "jobs",
  "tech",
  "locations",
  "roles",
  "salary",
  "companies",
  "guides",
];

function listHtmlSlugs(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith(".html"))
    .map((f) => `${dir}/${f.replace(/\.html$/, "")}`);
}

/** Collect all sitemap paths (empty string = homepage). */
export function collectSitemapPaths() {
  const urls = new Set(ROOT_PAGES);

  for (const dir of SCAN_DIRS) {
    for (const path of listHtmlSlugs(dir)) {
      urls.add(path);
    }
  }

  return [...urls].sort((a, b) => a.localeCompare(b));
}

export function writeSitemap(paths = collectSitemapPaths()) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const unique = [...new Set(paths)].sort((a, b) => a.localeCompare(b));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique
  .map((u) => {
    const loc =
      u === "" || u === "/"
        ? `${SITE}/`
        : `${SITE}/${u.replace(/^\//, "")}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  })
  .join("\n")}
</urlset>
`;

  writeFileSync(join(ROOT, "sitemap.xml"), sitemap, "utf8");
  writeFileSync(
    join(ROOT, "robots.txt"),
    `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`,
    "utf8",
  );

  return unique.length;
}
