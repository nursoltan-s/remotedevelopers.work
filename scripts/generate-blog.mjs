#!/usr/bin/env node
/**
 * Generate static SEO blog post pages from js/blog-data.js
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BLOG_DIR = join(ROOT, "blog");
const SITE = "https://remotedevelopers.work";

function loadPosts() {
  const src = readFileSync(join(ROOT, "js", "blog-data.js"), "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(src, ctx);
  return ctx.window.RD_BLOG_POSTS;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function headShell({ title, description, canonical, keywords, jsonLd }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(keywords)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${SITE}/assets/logo.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <link rel="icon" href="/assets/favicon.png" type="image/png" />
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Sora:wght@500;600;700&display=swap"
      rel="stylesheet"
    />
    <script>
      try {
        if (localStorage.getItem("rd-theme") !== "dark")
          document.documentElement.classList.add("light");
      } catch (e) {
        document.documentElement.classList.add("light");
      }
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              navy: { DEFAULT: "#0A2540", mid: "#0f3558", light: "#163a5c" },
              accent: { teal: "#14B8A6", cyan: "#22D3EE" },
            },
            fontFamily: {
              display: ["Sora", "system-ui", "sans-serif"],
              sans: ["DM Sans", "system-ui", "sans-serif"],
            },
          },
        },
      };
    </script>
    <link rel="stylesheet" href="/css/styles.css" />
    <script type="application/ld+json">${jsonLd}</script>
  </head>`;
}

function navFooter() {
  return `
    <header class="nav-glass sticky top-0 z-50">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="flex h-16 items-center justify-between gap-4">
          <a href="/" class="flex items-center shrink-0">
            <img src="/assets/logo-nav.png" alt="remotedevelopers.work" class="h-8 sm:h-9 w-auto" width="183" height="40" />
          </a>
          <nav class="hidden lg:flex items-center gap-1" aria-label="Primary">
            <a href="/" class="px-3 py-2 text-sm font-medium text-muted hover:text-[var(--rd-text)]">Home</a>
            <a href="/jobs.html" class="px-3 py-2 text-sm font-medium text-muted hover:text-[var(--rd-text)]">Jobs</a>
            <a href="/post-job.html" class="px-3 py-2 text-sm font-medium text-muted hover:text-[var(--rd-text)]">Post a Job</a>
            <a href="/companies.html" class="px-3 py-2 text-sm font-medium text-muted hover:text-[var(--rd-text)]">Companies</a>
            <a href="/blog.html" class="px-3 py-2 text-sm font-medium text-accent-cyan">Blog</a>
            <a href="/about.html" class="px-3 py-2 text-sm font-medium text-muted hover:text-[var(--rd-text)]">About</a>
          </nav>
          <div class="flex items-center gap-2">
            <button type="button" data-theme-toggle class="btn-secondary !p-2.5" aria-label="Toggle dark and light mode">
              <svg class="theme-icon-moon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              <svg class="theme-icon-sun h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </button>
            <a href="/post-job.html" class="btn-primary !py-2 !px-3 text-sm hidden sm:inline-flex">Post a Job – $5</a>
          </div>
        </div>
      </div>
    </header>`;
}

function pageFooter() {
  return `
    <footer class="border-t border-[var(--rd-border)] mt-8">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <p class="text-muted text-sm mb-2">Made for developers by developers.</p>
        <p class="text-muted text-sm">
          © 2026 remotedevelopers ·
          <a href="/blog.html" class="hover:text-accent-teal">Blog</a> ·
          <a href="/jobs.html" class="hover:text-accent-teal">Jobs</a>
        </p>
      </div>
    </footer>
    <script src="/js/theme.js"></script>
    <script src="/js/analytics-config.js"></script>
    <script src="/js/analytics.js"></script>`;
}

function renderPost(post, related) {
  const canonical = `${SITE}/blog/${post.slug}`;
  const keywords = (post.keywords || []).join(", ");
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "RemoteDevelopers.work",
      url: SITE,
    },
    publisher: {
      "@type": "Organization",
      name: "RemoteDevelopers.work",
      logo: { "@type": "ImageObject", url: `${SITE}/assets/logo.png` },
    },
    mainEntityOfPage: canonical,
    keywords: post.keywords,
  });

  const relatedHtml = related
    .map(
      (r) => `
            <li>
              <a href="/blog/${r.slug}" class="text-accent-teal hover:underline">${escapeHtml(r.title)}</a>
              <span class="text-muted text-sm"> · ${escapeHtml(r.dateLabel)}</span>
            </li>`
    )
    .join("");

  return `${headShell({
    title: `${post.title} — RemoteDevelopers.work`,
    description: post.description,
    canonical,
    keywords,
    jsonLd,
  })}
  <body class="antialiased">
    ${navFooter()}
    <main id="main" class="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <nav class="text-sm text-muted mb-6" aria-label="Breadcrumb">
        <a href="/blog.html" class="hover:text-accent-teal">Blog</a>
        <span class="mx-2">/</span>
        <span>${escapeHtml(post.category)}</span>
      </nav>
      <article>
        <header class="mb-8">
          <p class="text-xs font-semibold text-accent-teal mb-3">${escapeHtml(post.category)}</p>
          <h1 class="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">${escapeHtml(post.title)}</h1>
          <p class="text-muted text-sm">
            <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.dateLabel)}</time>
            <span class="mx-2">·</span>
            ${post.readingMinutes} min read
          </p>
          <p class="text-muted mt-4 text-lg leading-relaxed">${escapeHtml(post.description)}</p>
        </header>
        <div class="job-description blog-prose">
          ${post.body.trim()}
        </div>
      </article>
      <aside class="mt-12 pt-8 border-t border-[var(--rd-border)]">
        <h2 class="font-display text-lg font-semibold mb-4">Related reading</h2>
        <ul class="space-y-2">${relatedHtml}</ul>
        <div class="mt-8 flex flex-wrap gap-3">
          <a href="/jobs.html" class="btn-primary">Browse remote jobs</a>
          <a href="/blog.html" class="btn-secondary">All posts</a>
        </div>
      </aside>
    </main>
    ${pageFooter()}
  </body>
</html>
`;
}

function main() {
  const posts = loadPosts().slice().sort((a, b) => b.date.localeCompare(a.date));
  mkdirSync(BLOG_DIR, { recursive: true });

  for (const post of posts) {
    const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
    const html = renderPost(post, related);
    writeFileSync(join(BLOG_DIR, `${post.slug}.html`), html);
    console.log(`Wrote blog/${post.slug}.html`);
  }

  // Cloudflare Pages serves /blog/slug from blog/slug.html automatically
  const urls = [
    "",
    "jobs.html",
    "post-job.html",
    "companies.html",
    "blog.html",
    "about.html",
    "privacy.html",
    "terms.html",
    ...posts.map((p) => `blog/${p.slug}`),
  ];

  const lastmod = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE}/${u}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;
  writeFileSync(join(ROOT, "sitemap.xml"), sitemap);

  writeFileSync(
    join(ROOT, "robots.txt"),
    `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`
  );

  // Inject static cards into blog.html for SEO (no JS required)
  const blogIndexPath = join(ROOT, "blog.html");
  let blogIndex = readFileSync(blogIndexPath, "utf8");
  const cards = posts
    .map((post) => {
      const href = `/blog/${post.slug}`;
      return `        <article class="job-card p-6 flex flex-col">
          <div class="flex items-center justify-between gap-2 mb-2">
            <p class="text-xs font-semibold text-accent-teal">${escapeHtml(post.category)}</p>
            <time class="text-xs text-muted" datetime="${escapeHtml(post.date)}">${escapeHtml(post.dateLabel)}</time>
          </div>
          <h2 class="font-display text-lg font-semibold mb-2">
            <a href="${escapeHtml(href)}" class="hover:text-accent-teal transition-colors">${escapeHtml(post.title)}</a>
          </h2>
          <p class="text-muted text-sm flex-1 leading-relaxed">${escapeHtml(post.description)}</p>
          <div class="mt-4 flex items-center justify-between gap-3">
            <span class="text-xs text-muted">${post.readingMinutes || 5} min read</span>
            <a href="${escapeHtml(href)}" class="text-sm font-medium text-accent-teal hover:underline">Read →</a>
          </div>
        </article>`;
    })
    .join("\n");

  if (
    !blogIndex.includes("<!-- blog-list:start -->") ||
    !blogIndex.includes("<!-- blog-list:end -->")
  ) {
    throw new Error("blog.html missing blog-list markers");
  }
  blogIndex = blogIndex.replace(
    /<!-- blog-list:start -->[\s\S]*?<!-- blog-list:end -->/,
    `<!-- blog-list:start -->\n${cards}\n        <!-- blog-list:end -->`
  );
  writeFileSync(blogIndexPath, blogIndex);

  console.log(`Generated ${posts.length} posts + sitemap.xml + robots.txt + blog.html`);
}

main();
