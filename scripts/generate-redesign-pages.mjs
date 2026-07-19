/**
 * Generate SEO landing pages (priority keyword set) + secondary chrome pages.
 * Run: node scripts/generate-redesign-pages.mjs
 *
 * Priority: high buyer-intent keywords (tech, geo, salary, company, seniority, type).
 * Thin long-tail pages intentionally deferred.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sitemapUrls = [];

function head({ title, description, canonical, active }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://remotedevelopers.work${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://remotedevelopers.work${canonical}" />
    <meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />
    <meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />
    <meta property="og:image" content="https://remotedevelopers.work/assets/og-image.svg" />
    <meta name="twitter:card" content="summary_large_image" />
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
  </head>
  <body class="antialiased">
    <div data-rd-header="${active}"></div>
    <script src="/js/chrome.js"></script>
`;
}

function foot(extraScripts = "") {
  return `
    <div data-rd-footer></div>
    <script>window.RDChrome && window.RDChrome.mount();</script>
    <script src="/js/theme.js"></script>
    <script src="/js/ui.js"></script>
    ${extraScripts}
    <script src="/js/analytics-config.js"></script>
    <script src="/js/analytics.js"></script>
  </body>
</html>
`;
}

function landingScripts() {
  return `
    <script src="/js/jobs-data.js"></script>
    <script src="/js/jobs-utils.js"></script>
    <script src="/js/jobs-api.js"></script>
    <script src="/js/landing.js"></script>
  `;
}

function relatedLinksHTML(links = []) {
  if (!links.length) return "";
  return `
      <aside class="mt-14 pt-10 border-t border-[var(--rd-border)]" data-reveal>
        <h2 class="font-display font-semibold text-lg mb-4">Related searches</h2>
        <ul class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
          ${links
            .map(
              (l) =>
                `<li><a href="${l.href}" class="hover:text-[var(--rd-primary)]">${l.label}</a></li>`,
            )
            .join("\n")}
        </ul>
      </aside>`;
}

function writeLanding({
  file,
  active,
  title,
  description,
  canonical,
  h1,
  intro,
  tags = "",
  salaryMin = "",
  location = "",
  locationKeys = "",
  company = "",
  level = "",
  type = "",
  query = "",
  ctaHref = "/jobs.html",
  ctaLabel = "Browse all jobs",
  related = [],
  sitemap = true,
}) {
  const attrs = [
    tags ? `data-landing-tags="${tags}"` : "",
    salaryMin ? `data-landing-salary-min="${salaryMin}"` : "",
    location ? `data-landing-location="${location}"` : "",
    locationKeys ? `data-landing-location-keys="${locationKeys}"` : "",
    company ? `data-landing-company="${company}"` : "",
    level ? `data-landing-level="${level}"` : "",
    type ? `data-landing-type="${type}"` : "",
    query ? `data-landing-query="${query}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const html =
    head({ title, description, canonical, active }) +
    `
    <main id="main" class="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
      <div class="max-w-3xl mb-10" data-reveal>
        <h1 class="text-display-lg font-display">${h1}</h1>
        <p class="text-muted mt-4 text-lg leading-relaxed">${intro}</p>
        <p id="landing-count" class="text-sm text-muted mt-3"></p>
        <a href="${ctaHref}" class="btn-primary mt-6 inline-flex">${ctaLabel}</a>
      </div>
      <div id="landing-jobs" class="grid gap-5" ${attrs}></div>
      ${relatedLinksHTML(related)}
    </main>
` +
    foot(landingScripts());

  const out = path.join(root, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  if (sitemap) sitemapUrls.push(canonical);
  console.log("wrote", file);
}

function writeSimple({
  file,
  active,
  title,
  description,
  canonical,
  body,
  extraScripts = "",
  sitemap = true,
}) {
  const html =
    head({ title, description, canonical, active }) +
    `
    <main id="main" class="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
      ${body}
    </main>
` +
    foot(extraScripts);
  const out = path.join(root, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  if (sitemap) sitemapUrls.push(canonical);
  console.log("wrote", file);
}

function cardGrid(items) {
  return items
    .map(
      (i) =>
        `<a href="${i.href}" class="browse-card" data-reveal><span class="font-semibold text-lg">${i.label}</span>${i.sub ? `<span class="block text-sm text-muted mt-1">${i.sub}</span>` : ""}</a>`,
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// Priority 50 — high buyer-intent SEO landings
// ---------------------------------------------------------------------------

const techs = [
  { slug: "react", name: "React", tags: "React", keyword: "remote react jobs" },
  { slug: "python", name: "Python", tags: "Python", keyword: "remote python jobs" },
  {
    slug: "javascript",
    name: "JavaScript",
    tags: "JavaScript,JS,TypeScript",
    keyword: "remote javascript jobs",
  },
  {
    slug: "typescript",
    name: "TypeScript",
    tags: "TypeScript,TS",
    keyword: "remote typescript jobs",
  },
  {
    slug: "nodejs",
    name: "Node.js",
    tags: "Node.js,Node,NodeJS",
    keyword: "remote nodejs jobs",
  },
  { slug: "go", name: "Golang", tags: "Go,Golang", keyword: "remote golang jobs" },
  { slug: "rust", name: "Rust", tags: "Rust", keyword: "remote rust jobs" },
  { slug: "java", name: "Java", tags: "Java,Spring,Spring Boot", keyword: "remote java jobs" },
  { slug: "php", name: "PHP", tags: "PHP", keyword: "remote php jobs" },
  { slug: "laravel", name: "Laravel", tags: "Laravel,PHP", keyword: "remote laravel jobs" },
  { slug: "ruby", name: "Ruby", tags: "Ruby", keyword: "remote ruby jobs" },
  {
    slug: "rails",
    name: "Ruby on Rails",
    tags: "Rails,Ruby on Rails,Ruby",
    keyword: "remote rails jobs",
  },
  { slug: "flutter", name: "Flutter", tags: "Flutter,Dart", keyword: "remote flutter jobs" },
  {
    slug: "react-native",
    name: "React Native",
    tags: "React Native,ReactNative",
    keyword: "remote react native jobs",
  },
  {
    slug: "devops",
    name: "DevOps",
    tags: "DevOps,SRE,Platform,Kubernetes,Docker",
    keyword: "remote devops jobs",
  },
  {
    slug: "kubernetes",
    name: "Kubernetes",
    tags: "Kubernetes,K8s",
    keyword: "remote kubernetes jobs",
  },
  { slug: "aws", name: "AWS", tags: "AWS,Amazon Web Services", keyword: "remote aws jobs" },
  {
    slug: "ai",
    name: "AI Engineer",
    tags: "AI,ML,Machine Learning,LLM,AI Engineer",
    keyword: "remote ai engineer jobs",
    h1: "Remote AI Engineer Jobs",
  },
  {
    slug: "data-engineer",
    name: "Data Engineer",
    tags: "Data Engineer,Data Engineering,ETL,Spark,Airflow",
    keyword: "remote data engineer jobs",
    h1: "Remote Data Engineer Jobs",
  },
  {
    slug: "machine-learning",
    name: "Machine Learning",
    tags: "Machine Learning,ML,AI,Deep Learning",
    keyword: "remote machine learning jobs",
  },
];

for (const t of techs) {
  const h1 = t.h1 || `Remote ${t.name} Jobs`;
  writeLanding({
    file: `tech/${t.slug}.html`,
    active: "jobs",
    title: `${h1} — remotedevelopers`,
    description: `Find ${t.keyword}. Curated remote-only ${t.name} engineering roles from startups and global companies.`,
    canonical: `/tech/${t.slug}.html`,
    h1,
    intro: `Curated remote ${t.name} roles from startups and global companies. Developer-first. Remote-only.`,
    tags: t.tags,
    related: [
      { href: "/jobs.html", label: "All remote jobs" },
      { href: "/salary.html", label: "Salary pages" },
      { href: "/roles/senior-developer.html", label: "Senior remote jobs" },
    ],
  });
}

// Role / category pages (frontend, backend, fullstack, software engineer, tech)
const roles = [
  {
    slug: "frontend-developer",
    h1: "Remote Frontend Developer Jobs",
    tags: "React,Vue,Angular,TypeScript,JavaScript,Frontend,Next.js",
    query: "frontend,front-end,front end",
    intro: "Remote frontend engineering roles — React, Vue, Angular, and modern web stacks.",
  },
  {
    slug: "backend-developer",
    h1: "Remote Backend Developer Jobs",
    tags: "Python,Node.js,Go,Java,Rust,Backend,API",
    query: "backend,back-end,back end",
    intro: "Remote backend engineering roles across APIs, services, and data platforms.",
  },
  {
    slug: "full-stack-developer",
    h1: "Remote Full Stack Developer Jobs",
    tags: "Full Stack,Fullstack,TypeScript,React,Node.js",
    query: "full stack,fullstack,full-stack",
    intro: "Remote full-stack roles spanning product UI and backend services.",
  },
  {
    slug: "software-engineer",
    h1: "Remote Software Engineer Jobs",
    tags: "",
    query: "software engineer,software developer,engineer",
    intro: "Remote software engineering jobs — curated and partner listings, remote-only.",
  },
  {
    slug: "tech",
    h1: "Remote Tech Jobs",
    tags: "",
    query: "engineer,developer,software,devops,data,product",
    intro: "Remote tech jobs for developers, engineers, and technical builders.",
  },
  {
    slug: "startup",
    h1: "Remote Startup Jobs",
    tags: "",
    query: "startup,early stage,seed,series a,yc",
    intro: "Remote developer jobs at startups — early-stage, seed, Series A, and venture-backed teams.",
  },
  {
    slug: "ai-startup",
    h1: "Remote AI Startup Jobs",
    tags: "AI,ML,LLM",
    query: "startup,ai startup,llm,openai,anthropic",
    intro: "Remote engineering roles at AI startups building products on LLMs and applied ML.",
  },
  {
    slug: "saas",
    h1: "Remote SaaS Jobs",
    tags: "",
    query: "saas,b2b,software as a service",
    intro: "Remote developer jobs at SaaS companies — product, platform, and infrastructure roles.",
  },
  {
    slug: "yc-startup",
    h1: "YC Startup Jobs (Remote)",
    tags: "",
    query: "yc,y combinator,ycombinator",
    intro: "Remote developer jobs at Y Combinator startups and alumni companies.",
  },
  {
    slug: "contract-developer",
    h1: "Remote Contract Developer Jobs",
    type: "Contract",
    intro: "Remote contract and contractor engineering roles — flexible, project-based, remote-only.",
  },
  {
    slug: "freelance-developer",
    h1: "Remote Freelance Developer Jobs",
    type: "Freelance,Contract",
    query: "freelance,contractor,contract",
    intro: "Remote freelance developer jobs and contractor engagements.",
  },
  {
    slug: "junior-developer",
    h1: "Junior Remote Developer Jobs",
    level: "junior",
    intro: "Junior and entry-level remote developer roles — remote-only, curated for early-career engineers.",
  },
  {
    slug: "senior-developer",
    h1: "Senior Remote Developer Jobs",
    level: "senior",
    intro: "Senior remote engineering roles across stacks — ownership-heavy, remote-first teams.",
  },
  {
    slug: "senior-react",
    h1: "Senior Remote React Jobs",
    tags: "React",
    level: "senior",
    intro: "Senior remote React engineering jobs — product UI, design systems, and frontend architecture.",
  },
  {
    slug: "senior-python",
    h1: "Senior Remote Python Jobs",
    tags: "Python",
    level: "senior",
    intro: "Senior remote Python roles across backend, data, and platform engineering.",
  },
  {
    slug: "senior-golang",
    h1: "Senior Remote Golang Jobs",
    tags: "Go,Golang",
    level: "senior",
    intro: "Senior remote Go / Golang engineering jobs — services, infra, and high-performance systems.",
  },
];

for (const r of roles) {
  writeLanding({
    file: `roles/${r.slug}.html`,
    active: "jobs",
    title: `${r.h1} — remotedevelopers`,
    description: `${r.h1}. Curated remote-only developer jobs.`,
    canonical: `/roles/${r.slug}.html`,
    h1: r.h1,
    intro: r.intro,
    tags: r.tags || "",
    level: r.level || "",
    type: r.type || "",
    query: r.query || "",
    related: [
      { href: "/jobs.html", label: "All remote jobs" },
      { href: "/tech/react.html", label: "Remote React jobs" },
      { href: "/tech/python.html", label: "Remote Python jobs" },
    ],
  });
}

// Locations
const locations = [
  { slug: "worldwide", name: "Worldwide", keys: "" },
  { slug: "usa", name: "USA", keys: "usa,united states,america,us-only,u.s." },
  {
    slug: "europe",
    name: "Europe",
    keys: "europe,eu,emea,germany,france,netherlands,spain,portugal,poland",
  },
  { slug: "canada", name: "Canada", keys: "canada" },
  { slug: "uk", name: "UK", keys: "uk,united kingdom,london,britain,england" },
  {
    slug: "germany",
    name: "Germany",
    keys: "germany,berlin,munich,hamburg,deutschland",
  },
  { slug: "asia", name: "Asia", keys: "asia,india,singapore,japan,korea,apac" },
  { slug: "latam", name: "LATAM", keys: "latam,latin,brazil,mexico,argentina" },
  { slug: "australia", name: "Australia", keys: "australia,new zealand,apac" },
];

for (const loc of locations) {
  writeLanding({
    file: `locations/${loc.slug}.html`,
    active: "jobs",
    title: `Remote Jobs ${loc.name} — remotedevelopers`,
    description: `Remote developer jobs ${loc.name === "Worldwide" ? "open worldwide" : `for ${loc.name}`}. Curated remote-only engineering roles.`,
    canonical: `/locations/${loc.slug}.html`,
    h1: `Remote Jobs — ${loc.name}`,
    intro: `Remote-only developer roles ${loc.slug === "worldwide" ? "open worldwide" : `with ${loc.name} timezone or hiring focus`}.`,
    location: loc.name,
    locationKeys: loc.keys,
    related: [
      { href: "/locations/worldwide.html", label: "Worldwide" },
      { href: "/locations/usa.html", label: "USA" },
      { href: "/locations/europe.html", label: "Europe" },
    ],
  });
}

// Salary pages
const salaryPages = [
  {
    slug: "100k",
    title: "Remote Developer Jobs $100k+",
    tags: "",
    salaryMin: "100000",
    intro: "Remote developer jobs paying $100k+ when salary is listed.",
  },
  {
    slug: "150k",
    title: "Remote Developer Jobs $150k+",
    tags: "",
    salaryMin: "150000",
    intro: "High-paying remote engineering roles — $150k+ when salary is listed.",
  },
  {
    slug: "200k",
    title: "Remote Developer Jobs $200k+",
    tags: "",
    salaryMin: "200000",
    intro: "Top-of-market remote developer jobs — $200k+ when salary is listed.",
  },
  {
    slug: "react-100k",
    title: "Remote React Jobs over $100k",
    tags: "React",
    salaryMin: "100000",
    intro: "High-paying remote React engineering roles — $100k+ when salary is listed.",
  },
  {
    slug: "golang",
    title: "Remote Golang Jobs",
    tags: "Go,Golang",
    salaryMin: "",
    intro: "Remote Go / Golang engineering jobs from startups and global companies.",
  },
  {
    slug: "rust",
    title: "Remote Rust Jobs",
    tags: "Rust",
    salaryMin: "",
    intro: "Remote Rust engineering roles — systems, infra, and product teams.",
  },
  {
    slug: "python",
    title: "Remote Python Jobs",
    tags: "Python",
    salaryMin: "",
    intro: "Remote Python jobs across backend, data, and platform roles.",
  },
  {
    slug: "ai",
    title: "Remote AI Jobs",
    tags: "AI,ML,Machine Learning,LLM",
    salaryMin: "",
    intro: "Remote AI / ML engineering roles — LLMs, applied ML, and research-adjacent product work.",
  },
];

for (const s of salaryPages) {
  writeLanding({
    file: `salary/${s.slug}.html`,
    active: "salary",
    title: `${s.title} — remotedevelopers`,
    description: `${s.title}. Curated remote-only developer jobs.`,
    canonical: `/salary/${s.slug}.html`,
    h1: s.title,
    intro: s.intro,
    tags: s.tags,
    salaryMin: s.salaryMin,
    related: [
      { href: "/salary/100k.html", label: "$100k+" },
      { href: "/salary/150k.html", label: "$150k+" },
      { href: "/salary/200k.html", label: "$200k+" },
    ],
  });
}

// Company landings (Tier 5 priority set)
const companies = [
  { slug: "openai", name: "OpenAI" },
  { slug: "stripe", name: "Stripe" },
  { slug: "shopify", name: "Shopify" },
  { slug: "github", name: "GitHub" },
  { slug: "vercel", name: "Vercel" },
  { slug: "cloudflare", name: "Cloudflare" },
  { slug: "gitlab", name: "GitLab" },
];

for (const c of companies) {
  writeLanding({
    file: `companies/${c.slug}.html`,
    active: "companies",
    title: `${c.name} Remote Jobs — remotedevelopers`,
    description: `${c.name} remote jobs for developers. Track remote-only openings when listed on our board.`,
    canonical: `/companies/${c.slug}.html`,
    h1: `${c.name} Remote Jobs`,
    intro: `Remote developer roles at ${c.name} when they appear on our board. Remote-only — no hybrid noise.`,
    company: c.name,
    related: [
      { href: "/companies.html", label: "All companies" },
      { href: "/jobs.html", label: "Browse jobs" },
      { href: "/roles/startup.html", label: "Startup jobs" },
    ],
  });
}

// ---------------------------------------------------------------------------
// Hubs
// ---------------------------------------------------------------------------

writeSimple({
  file: "salary.html",
  active: "salary",
  title: "Remote Developer Salaries — remotedevelopers",
  description:
    "Explore remote developer jobs by compensation. $100k, $150k, $200k salary hubs and stack-specific pages.",
  canonical: "/salary.html",
  body: `
      <div class="max-w-3xl mb-12" data-reveal>
        <h1 class="text-display-lg font-display">Salary pages</h1>
        <p class="text-muted mt-4 text-lg">High-intent salary searches — browse remote roles by compensation band and stack.</p>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        ${cardGrid(
          salaryPages.map((s) => ({
            href: `/salary/${s.slug}.html`,
            label: s.title,
          })),
        )}
      </div>
  `,
});

writeSimple({
  file: "tech.html",
  active: "jobs",
  title: "Remote Jobs by Technology — remotedevelopers",
  description:
    "Browse remote developer jobs by stack: React, Python, Go, Rust, AI, DevOps, and more.",
  canonical: "/tech.html",
  body: `
      <div class="max-w-3xl mb-12" data-reveal>
        <h1 class="text-display-lg font-display">Jobs by technology</h1>
        <p class="text-muted mt-4 text-lg">Technology-specific remote job pages — high buyer intent, curated listings.</p>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${cardGrid(
          techs.map((t) => ({
            href: `/tech/${t.slug}.html`,
            label: t.h1 || `Remote ${t.name} Jobs`,
          })),
        )}
      </div>
  `,
});

writeSimple({
  file: "roles.html",
  active: "jobs",
  title: "Remote Jobs by Role — remotedevelopers",
  description:
    "Browse remote developer jobs by role, seniority, and employment type.",
  canonical: "/roles.html",
  body: `
      <div class="max-w-3xl mb-12" data-reveal>
        <h1 class="text-display-lg font-display">Jobs by role</h1>
        <p class="text-muted mt-4 text-lg">Seniority, employment type, and category landings that convert.</p>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        ${cardGrid(
          roles.map((r) => ({
            href: `/roles/${r.slug}.html`,
            label: r.h1,
          })),
        )}
      </div>
  `,
});

// Guides hub + pages
const guides = [
  {
    slug: "how-to-find-remote-jobs",
    title: "How to Find Remote Jobs",
    body: `
      <p class="text-muted text-lg leading-relaxed mb-6">Remote-only boards beat keyword-searching LinkedIn. Start here, filter by stack and salary, and apply on the company site.</p>
      <ul class="space-y-3 text-muted list-disc pl-5">
        <li>Use stack + seniority filters instead of generic “remote” searches.</li>
        <li>Prefer listings with salary bands — they signal mature remote culture.</li>
        <li>Apply within 48 hours of posting; remote roles move fast.</li>
        <li>Keep a short async-ready portfolio and timezone note in your resume.</li>
      </ul>
      <p class="mt-8"><a href="/jobs.html" class="btn-primary inline-flex">Browse remote jobs</a></p>
    `,
  },
  {
    slug: "top-remote-companies",
    title: "Top Remote Companies",
    body: `
      <p class="text-muted text-lg leading-relaxed mb-6">Companies that treat remote as a first-class setup — not an afterthought.</p>
      <ul class="space-y-3 text-muted list-disc pl-5">
        <li>GitLab, Shopify, Vercel, Cloudflare, Supabase, Canonical, Stripe, Docker</li>
        <li>Look for published handbooks, async norms, and timezone flexibility.</li>
        <li>Check our <a class="text-[var(--rd-primary)] hover:underline" href="/companies.html">companies</a> page for hiring teams.</li>
      </ul>
    `,
  },
  {
    slug: "best-countries",
    title: "Best Countries for Remote Developers",
    body: `
      <p class="text-muted text-lg leading-relaxed mb-6">Timezone overlap, cost of living, and visa-friendly hiring all matter.</p>
      <ul class="space-y-3 text-muted list-disc pl-5">
        <li><strong class="text-[var(--rd-text)]">Americas:</strong> strong overlap with US product teams.</li>
        <li><strong class="text-[var(--rd-text)]">Europe:</strong> GDPR-native companies and EU remote hubs.</li>
        <li><strong class="text-[var(--rd-text)]">Asia / LATAM / Australia:</strong> growing fully-distributed engineering orgs.</li>
      </ul>
      <p class="mt-8"><a href="/locations/worldwide.html" class="btn-primary inline-flex">Browse by region</a></p>
    `,
  },
  {
    slug: "negotiate-salary",
    title: "How to Negotiate Remote Salary",
    body: `
      <p class="text-muted text-lg leading-relaxed mb-6">Remote pay varies by company policy — geo-adjusted vs global bands.</p>
      <ul class="space-y-3 text-muted list-disc pl-5">
        <li>Ask early whether compensation is location-based or role-based.</li>
        <li>Anchor with market data for your stack and seniority.</li>
        <li>Negotiate total package: equity, equipment, coworking, learning stipend.</li>
      </ul>
      <p class="mt-8"><a href="/salary.html" class="btn-primary inline-flex">Explore salary pages</a></p>
    `,
  },
  {
    slug: "react-interview-questions",
    title: "React Interview Questions",
    body: `
      <p class="text-muted text-lg leading-relaxed mb-6">A practical set for remote React interviews — async take-homes and live pairing.</p>
      <ul class="space-y-3 text-muted list-disc pl-5">
        <li>Explain reconciliation and when memoization actually helps.</li>
        <li>Design a data-fetching layer with loading, error, and cache states.</li>
        <li>Discuss accessibility and performance budgets for SPAs.</li>
        <li>Walk through a past production incident and your debugging process.</li>
      </ul>
      <p class="mt-8"><a href="/tech/react.html" class="btn-primary inline-flex">Remote React jobs</a></p>
    `,
  },
  {
    slug: "remote-resume",
    title: "Remote Resume Guide",
    body: `
      <p class="text-muted text-lg leading-relaxed mb-6">Remote hiring managers scan for async communication and ownership.</p>
      <ul class="space-y-3 text-muted list-disc pl-5">
        <li>Lead with outcomes, stack, and distributed-team experience.</li>
        <li>State timezone and overlap hours clearly.</li>
        <li>Link GitHub, portfolio, and writing that shows clarity.</li>
        <li>Keep it to one page unless staff/principal scope demands more.</li>
      </ul>
    `,
  },
];

writeSimple({
  file: "guides.html",
  active: "guides",
  title: "Remote Guides — remotedevelopers",
  description: "Guides for finding remote developer jobs, negotiating salary, and interviewing.",
  canonical: "/guides.html",
  body: `
      <div class="max-w-3xl mb-12" data-reveal>
        <h1 class="text-display-lg font-display">Remote guides</h1>
        <p class="text-muted mt-4 text-lg">Practical playbooks for remote-first careers.</p>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        ${cardGrid([
          ...guides.map((g) => ({ href: `/guides/${g.slug}.html`, label: g.title })),
          { href: "/blog.html", label: "More from the blog →" },
        ])}
      </div>
  `,
});

for (const g of guides) {
  writeSimple({
    file: `guides/${g.slug}.html`,
    active: "guides",
    title: `${g.title} — remotedevelopers`,
    description: `${g.title}. Remote-first career advice for developers.`,
    canonical: `/guides/${g.slug}.html`,
    body: `
      <article class="max-w-3xl" data-reveal>
        <h1 class="text-display-lg font-display mb-6">${g.title}</h1>
        ${g.body}
      </article>
    `,
  });
}

writeSimple({
  file: "contact.html",
  active: "",
  title: "Contact — remotedevelopers",
  description: "Contact remotedevelopers about listings, partnerships, or support.",
  canonical: "/contact.html",
  body: `
      <div class="max-w-xl" data-reveal>
        <h1 class="text-display-lg font-display">Contact</h1>
        <p class="text-muted mt-4 text-lg">Questions about listings, partnerships, or the weekly digest?</p>
        <p class="mt-6"><a class="text-[var(--rd-primary)] font-semibold hover:underline" href="mailto:hello@remotedevelopers.work">hello@remotedevelopers.work</a></p>
        <a href="/post-job.html" class="btn-primary mt-8 inline-flex">Post a Job</a>
      </div>
  `,
});

writeSimple({
  file: "sign-in.html",
  active: "signin",
  title: "Sign In — remotedevelopers",
  description: "Sign in to remotedevelopers. Coming soon.",
  canonical: "/sign-in.html",
  body: `
      <div class="max-w-md mx-auto text-center surface-panel p-10" data-reveal>
        <h1 class="text-display-md font-display">Sign in</h1>
        <p class="text-muted mt-4">Account sign-in is coming soon. Browse jobs without an account today.</p>
        <a href="/jobs.html" class="btn-primary mt-8 inline-flex">Browse jobs</a>
      </div>
  `,
});

// RSS feed
fs.writeFileSync(
  path.join(root, "feed.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>remotedevelopers — Remote Developer Jobs</title>
    <link>https://remotedevelopers.work/</link>
    <description>Curated remote-only developer jobs. Updated daily.</description>
    <language>en-us</language>
    <item>
      <title>Latest remote developer jobs</title>
      <link>https://remotedevelopers.work/jobs.html</link>
      <description>Browse curated remote engineering roles.</description>
      <guid>https://remotedevelopers.work/jobs.html</guid>
    </item>
    <item>
      <title>Remote guides</title>
      <link>https://remotedevelopers.work/guides.html</link>
      <description>Guides for remote developer careers.</description>
      <guid>https://remotedevelopers.work/guides.html</guid>
    </item>
  </channel>
</rss>
`,
);
console.log("wrote feed.xml");

// Core pages for sitemap (not generated above)
const coreSitemap = [
  "/",
  "/jobs.html",
  "/companies.html",
  "/about.html",
  "/blog.html",
  "/post-job.html",
  "/privacy.html",
  "/terms.html",
];
const allUrls = [...new Set([...coreSitemap, ...sitemapUrls])].sort();
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>https://remotedevelopers.work${u === "/" ? "/" : u}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`,
);
console.log(`wrote sitemap.xml (${allUrls.length} urls)`);

// robots.txt
fs.writeFileSync(
  path.join(root, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: https://remotedevelopers.work/sitemap.xml
`,
);
console.log("wrote robots.txt");

console.log(`\nDone. Generated ${sitemapUrls.length} landing/hub URLs.`);
