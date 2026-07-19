# remotedevelopers

Static job board for remote developers — HTML, Tailwind CSS (CDN), Alpine.js, and vanilla JS. No backend required.

## Quick start

```bash
# From the project root — any static server works
npx serve .
# or: python3 -m http.server 8080
```

Open `http://localhost:3000` (or the port your server prints).

## Project layout

```
├── index.html          # Homepage
├── jobs.html           # Filterable job board
├── post-job.html       # $5 posting form (payment simulated)
├── companies.html
├── blog.html
├── about.html
├── privacy.html
├── terms.html
├── css/styles.css
├── js/
│   ├── jobs-data.js    # ← edit this to add jobs
│   ├── jobs-utils.js
│   ├── jobs-board.js
│   ├── home.js
│   ├── post-job.js
│   ├── theme.js
│   ├── analytics-config.js  # Cloudflare Web Analytics token
│   └── analytics.js
└── assets/
```

## Adding jobs

Edit [`js/jobs-data.js`](js/jobs-data.js). Append an object to `window.RD_JOBS`:

```js
{
  id: "cur-026",
  title: "Senior Engineer",
  company: "Example Co",
  logo: null,              // or image URL
  salary: "$140k – $180k",
  salaryMin: 140000,       // used by salary filter
  location: "Remote",
  type: "Full-time",       // or "Contract"
  level: "Senior",         // Junior | Mid | Senior | Lead
  tags: ["TypeScript", "React"],
  applyUrl: "https://…",
  featured: false,
  source: "curated",       // or "partner"
  partnerName: undefined,  // e.g. "Remote OK" when source is partner
  postedAt: "2026-07-18T12:00:00Z",
  description: "Optional — used for JobPosting schema",
}
```

Also add companies to `window.RD_COMPANIES` when needed (include a `domain` for logo lookup via icon.horse):

```js
{ name: "Example", initials: "Ex", domain: "example.com", url: "https://example.com" }
```

**Future sync:** see the comment at the top of `jobs-data.js` for Airtable / Google Sheets hydration.

## Theme

Light mode is the default. The nav toggle stores `rd-theme` in `localStorage` (`dark` | `light`).

## Sync & prune jobs (CLI)

Static job data lives in [`data/jobs.json`](data/jobs.json). Scripts update that file and regenerate [`js/jobs-data.js`](js/jobs-data.js).

```bash
# Fetch partner APIs and append new jobs (logs how many were created)
npm run sync-jobs

# Remove jobs with postedAt older than 1 year (logs how many were removed)
npm run prune-jobs

# Regenerate js/jobs-data.js from data/*.json only
npm run generate-jobs

# Generate static SEO pages for every job (also runs after sync/prune)
npm run generate-job-pages

# Refresh sitemap.xml from hubs + blog + jobs on disk
npm run generate-sitemap
```

Partner sources: Remote OK, Jobicy, Arbeitnow, Himalayas.

Each job gets a crawlable page at `/jobs/<slug>` (HTML under `jobs/`). Old links to `/job.html?id=<job-id>` redirect to the slug URL. Job cards and the sitemap use the slug URLs so Google can index title, description, and JobPosting schema from the initial HTML.

The jobs board merges curated sample jobs with free public APIs:

| Source                                 | Endpoint                                      | Notes                            |
| -------------------------------------- | --------------------------------------------- | -------------------------------- |
| [Remote OK](https://remoteok.com)      | `https://remoteok.com/api`                    | CORS OK; link back required      |
| [Jobicy](https://jobicy.com)           | `https://jobicy.com/api/v2/remote-jobs`       | CORS OK; attribution required    |
| [Arbeitnow](https://www.arbeitnow.com) | `https://www.arbeitnow.com/api/job-board-api` | Remote + tech filtered           |
| [Himalayas](https://himalayas.app)     | `/api/himalayas` → upstream API               | Needs Vercel deploy (CORS proxy) |

Himalayas has no browser CORS headers, so [`api/himalayas.js`](api/himalayas.js) proxies it on Vercel. Locally (`npx serve`), the other three feeds still load.

## Analytics (Cloudflare Web Analytics)

Privacy-friendly, cookieless page-view analytics via the Cloudflare beacon.

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/web-analytics), open **Web Analytics** → **Add a site** (hostname e.g. `remotedevelopers.work`).
2. Copy the JavaScript snippet **token**.
3. Set it in [`js/analytics-config.js`](js/analytics-config.js):

```js
window.RD_CF_ANALYTICS_TOKEN = "your-token-here";
```

4. Redeploy. Leave the token empty for local/dev (the beacon will not load).

## Blog

Posts live in [`js/blog-data.js`](js/blog-data.js). Regenerate static SEO pages:

```bash
npm run generate-blog
```

That writes `blog/<slug>.html`, updates the cards on `blog.html`, and refreshes the unified `sitemap.xml` / `robots.txt` (includes hubs, blog, and job pages).

## Deploy

### Cloudflare Pages (recommended)

Requires **Node.js 22+** (`nvm use 22`).

```bash
npm install
npx wrangler login   # once — approve in the browser
npm run deploy
```

Or use an [API token](https://dash.cloudflare.com/profile/api-tokens) with **Cloudflare Pages — Edit** permission:

```bash
export CLOUDFLARE_API_TOKEN=your_token
npm run deploy
```

This uploads the static site and [`functions/api/himalayas.js`](functions/api/himalayas.js). Project name: `remotedevelopers-work`. After deploy, attach a custom domain in the Cloudflare dashboard if you want `remotedevelopers.work`.

### Other hosts

Drop the folder on **Vercel**, **Netlify**, or **Cloudflare Pages** as a static site.

On **Vercel**, the `/api/himalayas` function in [`api/himalayas.js`](api/himalayas.js) enables the Himalayas feed (no build command required). On Cloudflare Pages, use the `functions/` version instead.

## Notes

- **Post a Job**: form has two buttons — **Send email** (mailto `nursoltan.s@gmail.com`) and **Pay $5** (Gumroad).
- Job posts are manually reviewed before appearing in `jobs-data.js`.
