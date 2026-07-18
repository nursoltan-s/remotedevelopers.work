/**
 * Fetch + normalize remote jobs from free public APIs.
 * Sources: Himalayas, Remote OK, Jobicy, Arbeitnow
 * (Attribution required — see partnerName / footer links.)
 *
 * Also: fetchJobDetail(jobId) re-fetches a single listing with full description.
 */
(function () {
  const TECH_HINT =
    /\b(engineer|developer|devops|frontend|front-end|backend|back-end|full[\s-]?stack|software|sre|platform|mobile|ios|android|react|typescript|javascript|python|golang|rust|kubernetes|machine learning|ml engineer|data engineer|data scientist|qa engineer|security engineer|cloud|infra|programmer|coding|web developer|staff engineer|principal engineer)\b/i;

  const TECH_TAGS = new Set(
    (window.RD_TECH_TAGS || []).map((t) => t.toLowerCase())
  );

  function fmtSalary(min, max, currency, period) {
    const cur = currency || "USD";
    const sym = cur === "USD" ? "$" : `${cur} `;
    const p = (period || "").toLowerCase();
    const suffix = p.includes("hour")
      ? "/hr"
      : p.includes("month")
        ? "/mo"
        : "";

    const fmt = (n) => {
      if (n == null || n === 0) return null;
      if (n >= 1000 && !suffix) return `${sym}${Math.round(n / 1000)}k`;
      return `${sym}${Number(n).toLocaleString()}`;
    };

    const a = fmt(min);
    const b = fmt(max);
    if (a && b) return `${a} – ${b}${suffix}`;
    if (a) return `From ${a}${suffix}`;
    if (b) return `Up to ${b}${suffix}`;
    return null;
  }

  function mapLevel(raw) {
    const s = Array.isArray(raw) ? raw.join(" ") : String(raw || "");
    const t = s.toLowerCase();
    if (/lead|staff|principal|director|executive|head|manager|vp/.test(t))
      return "Lead";
    if (/senior|sr\.|mid-senior/.test(t)) return "Senior";
    if (/junior|entry|intern|graduate|jr\./.test(t)) return "Junior";
    if (/mid|intermediate/.test(t)) return "Mid";
    return "Mid";
  }

  function mapType(raw) {
    const t = String(Array.isArray(raw) ? raw[0] : raw || "").toLowerCase();
    if (/contract|freelance|consultant/.test(t)) return "Contract";
    return "Full-time";
  }

  function pickTags(list) {
    const out = [];
    const seen = new Set();
    for (const item of list || []) {
      if (!item) continue;
      const raw = String(item).replace(/&amp;/g, "&").trim();
      if (!raw || raw.length > 32) continue;
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      if (
        TECH_TAGS.has(key) ||
        TECH_HINT.test(raw) ||
        /^[a-z0-9.+#\- ]{2,24}$/i.test(raw)
      ) {
        seen.add(key);
        out.push(raw);
      }
      if (out.length >= 6) break;
    }
    return out;
  }

  function isTechJob(title, tags) {
    if (TECH_HINT.test(title || "")) return true;
    const joined = (tags || []).join(" ");
    if (TECH_HINT.test(joined)) return true;
    const lower = (tags || []).map((t) => String(t).toLowerCase());
    return lower.some((t) =>
      [
        "dev",
        "eng",
        "software",
        "engineer",
        "developer",
        "javascript",
        "typescript",
        "python",
        "react",
        "node",
        "java",
        "golang",
        "rust",
        "devops",
        "sre",
        "frontend",
        "backend",
        "full stack",
        "fullstack",
        "web development",
        "it",
      ].includes(t)
    );
  }

  function dedupeKey(job) {
    return `${(job.title || "").toLowerCase()}|${(job.company || "").toLowerCase()}`;
  }

  function stripHtml(html) {
    return String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  function descFields(htmlOrText) {
    if (!htmlOrText)
      return { description: undefined, descriptionHtml: undefined };
    const raw = String(htmlOrText);
    const looksHtml = /<[a-z][\s\S]*>/i.test(raw);
    return {
      descriptionHtml: looksHtml ? raw : undefined,
      description: stripHtml(raw).slice(0, 500) || undefined,
    };
  }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        Accept: "application/json",
        ...(opts?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  }

  /* —— Normalizers —— */
  function normalizeRemoteOK(j) {
    if (!j || !j.id || !j.position) return null;
    const salary =
      j.salary_min || j.salary_max
        ? fmtSalary(j.salary_min, j.salary_max, "USD", "annual")
        : null;
    return {
      id: `rok-${j.id}`,
      title: j.position,
      company: j.company || "Unknown",
      logo: j.company_logo || j.logo || null,
      salary,
      salaryMin: Number(j.salary_min) || 0,
      location: "Remote",
      type: mapType((j.tags || []).join(" ")),
      level: mapLevel((j.tags || []).join(" ")),
      tags: pickTags(j.tags),
      applyUrl: j.url || j.apply_url,
      featured: false,
      source: "partner",
      partnerName: "Remote OK",
      partnerUrl: "https://remoteok.com",
      postedAt: j.date || new Date((j.epoch || 0) * 1000).toISOString(),
      ...descFields(j.description),
    };
  }

  function normalizeJobicy(j) {
    if (!j || !j.id || !j.jobTitle) return null;
    const salary = fmtSalary(
      j.salaryMin ?? j.annualSalaryMin,
      j.salaryMax ?? j.annualSalaryMax,
      j.salaryCurrency,
      j.salaryPeriod || "annual"
    );
    return {
      id: `jcy-${j.id}`,
      title: j.jobTitle,
      company: j.companyName || "Unknown",
      logo: j.companyLogo || null,
      salary,
      salaryMin: Number(j.salaryMin ?? j.annualSalaryMin) || 0,
      location: "Remote",
      type: mapType(j.jobType),
      level: mapLevel(j.jobLevel),
      tags: pickTags([
        ...(Array.isArray(j.jobIndustry) ? j.jobIndustry : [j.jobIndustry]),
        ...(typeof j.jobType === "string" ? [j.jobType] : j.jobType || []),
      ]),
      applyUrl: j.url,
      featured: false,
      source: "partner",
      partnerName: "Jobicy",
      partnerUrl: "https://jobicy.com",
      postedAt: j.pubDate || new Date().toISOString(),
      ...descFields(j.jobDescription || j.jobExcerpt),
    };
  }

  function normalizeArbeitnow(j) {
    if (!j || !j.slug) return null;
    return {
      id: `arn-${j.slug}`,
      title: j.title,
      company: j.company_name || "Unknown",
      logo: null,
      salary: null,
      salaryMin: 0,
      location: "Remote",
      type: mapType((j.job_types || []).join(" ")),
      level: mapLevel((j.tags || []).join(" ")),
      tags: pickTags(j.tags),
      applyUrl: j.url,
      featured: false,
      source: "partner",
      partnerName: "Arbeitnow",
      partnerUrl: "https://www.arbeitnow.com",
      postedAt: j.created_at
        ? new Date(j.created_at * 1000).toISOString()
        : new Date().toISOString(),
      ...descFields(j.description),
    };
  }

  function normalizeHimalayas(j) {
    if (!j || !j.title) return null;
    const salary = fmtSalary(
      j.minSalary,
      j.maxSalary,
      j.currency,
      j.salaryPeriod
    );
    return {
      id: `him-${j.guid || j.applicationLink}`,
      title: j.title,
      company: j.companyName || "Unknown",
      logo: j.companyLogo || null,
      salary,
      salaryMin: Number(j.minSalary) || 0,
      location: "Remote",
      type: mapType(j.employmentType),
      level: mapLevel(j.seniority),
      tags: pickTags(j.categories),
      applyUrl: j.applicationLink,
      featured: false,
      source: "partner",
      partnerName: "Himalayas",
      partnerUrl: "https://himalayas.app",
      postedAt: j.pubDate
        ? new Date(j.pubDate * 1000).toISOString()
        : new Date().toISOString(),
      ...descFields(j.description || j.excerpt),
    };
  }

  /* —— List feeds —— */
  async function fromRemoteOK() {
    const data = await fetchJSON("https://remoteok.com/api", {
      headers: { "User-Agent": "remotedevelopers/1.0" },
    });
    return (Array.isArray(data) ? data : [])
      .filter((j) => j && j.id && j.position)
      .filter((j) => isTechJob(j.position, j.tags))
      .slice(0, 40)
      .map(normalizeRemoteOK)
      .filter(Boolean);
  }

  async function fromJobicy() {
    const data = await fetchJSON(
      "https://jobicy.com/api/v2/remote-jobs?count=50&industry=dev"
    );
    return (data?.jobs || [])
      .filter((j) =>
        isTechJob(j.jobTitle, [
          ...(Array.isArray(j.jobIndustry) ? j.jobIndustry : [j.jobIndustry]),
        ])
      )
      .map(normalizeJobicy)
      .filter(Boolean);
  }

  async function fromArbeitnow() {
    const data = await fetchJSON("https://www.arbeitnow.com/api/job-board-api");
    return (data?.data || [])
      .filter((j) => j.remote)
      .filter((j) => isTechJob(j.title, j.tags))
      .slice(0, 30)
      .map(normalizeArbeitnow)
      .filter(Boolean);
  }

  async function fromHimalayas() {
    let data;
    try {
      data = await fetchJSON("/api/himalayas?limit=50");
    } catch {
      throw new Error("Himalayas unavailable (deploy on Vercel for proxy)");
    }
    return (data?.jobs || [])
      .filter((j) => isTechJob(j.title, j.categories))
      .slice(0, 40)
      .map(normalizeHimalayas)
      .filter(Boolean);
  }

  /* —— Single-job detail by id —— */
  function parseJobId(id) {
    const raw = String(id || "");
    const m = raw.match(/^(rok|jcy|arn|him|cur)-(.+)$/s);
    if (!m) return { source: null, key: raw };
    return { source: m[1], key: m[2] };
  }

  async function fetchRemoteOKById(remoteId) {
    const data = await fetchJSON("https://remoteok.com/api", {
      headers: { "User-Agent": "remotedevelopers/1.0" },
    });
    const row = (Array.isArray(data) ? data : []).find(
      (j) => j && String(j.id) === String(remoteId)
    );
    return row ? normalizeRemoteOK(row) : null;
  }

  async function fetchJobicyById(jobicyId) {
    // Broader fetch so the id is more likely present
    const data = await fetchJSON(
      "https://jobicy.com/api/v2/remote-jobs?count=100"
    );
    const row = (data?.jobs || []).find(
      (j) => String(j.id) === String(jobicyId)
    );
    return row ? normalizeJobicy(row) : null;
  }

  async function fetchArbeitnowById(slug) {
    const data = await fetchJSON("https://www.arbeitnow.com/api/job-board-api");
    const row = (data?.data || []).find((j) => j.slug === slug);
    return row ? normalizeArbeitnow(row) : null;
  }

  async function fetchHimalayasById(key) {
    // key is often the full application URL / guid
    const url = key.startsWith("http") ? key : null;
    let company = "";
    let jobSlug = "";
    if (url) {
      const m = url.match(/\/companies\/([^/]+)\/jobs\/([^/?#]+)/);
      if (m) {
        company = m[1];
        jobSlug = m[2];
      }
    }

    const params = new URLSearchParams();
    if (company) params.set("company", company);
    if (jobSlug) params.set("q", jobSlug.replace(/-/g, " "));
    params.set("limit", "20");

    let data;
    try {
      data = await fetchJSON(`/api/himalayas?mode=search&${params}`);
    } catch {
      data = await fetchJSON("/api/himalayas?limit=50");
    }

    const jobs = data?.jobs || [];
    const match =
      jobs.find(
        (j) =>
          j.guid === key ||
          j.applicationLink === key ||
          j.applicationLink === url ||
          (company &&
            j.companySlug === company &&
            (j.applicationLink || "").includes(`/jobs/${jobSlug}`))
      ) || jobs[0];

    return match ? normalizeHimalayas(match) : null;
  }

  /**
   * Re-fetch a single job with full description using its RD id.
   * @param {string} jobId e.g. rok-123, jcy-456, arn-slug, him-https://..., cur-001
   */
  async function fetchJobDetail(jobId) {
    const { source, key } = parseJobId(jobId);
    const existing = findJobById(jobId);

    if (source === "cur" || (!source && existing?.source === "curated")) {
      return existing || null;
    }

    let fresh = null;
    try {
      if (source === "rok") fresh = await fetchRemoteOKById(key);
      else if (source === "jcy") fresh = await fetchJobicyById(key);
      else if (source === "arn") fresh = await fetchArbeitnowById(key);
      else if (source === "him") fresh = await fetchHimalayasById(key);
    } catch (err) {
      console.warn("[RD] fetchJobDetail failed", jobId, err);
    }

    if (!fresh) return existing || null;

    // Preserve featured / curated flags if we already had the listing
    if (existing) {
      fresh.featured = existing.featured;
      if (existing.logo && !fresh.logo) fresh.logo = existing.logo;
    }

    // Update live list in memory
    const list = window.RD_JOBS || [];
    const idx = list.findIndex((j) => String(j.id) === String(fresh.id));
    if (idx >= 0) list[idx] = { ...list[idx], ...fresh };
    else list.unshift(fresh);
    window.RD_JOBS = list;

    return fresh;
  }

  function findJobById(id) {
    const key = String(id || "");
    const fromLive = (window.RD_JOBS || []).find((j) => String(j.id) === key);
    if (fromLive) return fromLive;
    try {
      const cached = JSON.parse(sessionStorage.getItem("rd-jobs-cache") || "[]");
      return cached.find((j) => String(j.id) === key) || null;
    } catch {
      return null;
    }
  }

  async function loadRemoteJobs() {
    const curated = Array.isArray(window.RD_JOBS) ? [...window.RD_JOBS] : [];
    window.RD_JOBS_CURATED = curated;

    const loaders = [
      { name: "Remote OK", fn: fromRemoteOK },
      { name: "Jobicy", fn: fromJobicy },
      { name: "Arbeitnow", fn: fromArbeitnow },
      { name: "Himalayas", fn: fromHimalayas },
    ];

    const settled = await Promise.allSettled(loaders.map((l) => l.fn()));
    const apiJobs = [];
    const status = {};

    settled.forEach((result, i) => {
      const name = loaders[i].name;
      if (result.status === "fulfilled") {
        status[name] = result.value.length;
        apiJobs.push(...result.value);
      } else {
        status[name] = 0;
        console.warn(`[RD] ${name} failed:`, result.reason);
      }
    });

    const seen = new Set(curated.map(dedupeKey));
    const merged = [...curated];
    for (const job of apiJobs) {
      const key = dedupeKey(job);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(job);
    }

    merged.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.postedAt) - new Date(a.postedAt);
    });

    window.RD_JOBS = merged;
    window.RD_API_STATUS = status;

    // Cache metadata only (full HTML descriptions are large — detail page re-fetches)
    try {
      sessionStorage.setItem(
        "rd-jobs-cache",
        JSON.stringify(
          merged.map((j) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            logo: j.logo,
            salary: j.salary,
            salaryMin: j.salaryMin,
            location: j.location,
            type: j.type,
            level: j.level,
            tags: j.tags,
            applyUrl: j.applyUrl,
            featured: j.featured,
            source: j.source,
            partnerName: j.partnerName,
            partnerUrl: j.partnerUrl,
            postedAt: j.postedAt,
            description: j.description,
          }))
        )
      );
    } catch {
      /* quota / private mode */
    }

    try {
      window.dispatchEvent?.(
        new CustomEvent("rd:jobs-loaded", {
          detail: { status, count: merged.length },
        })
      );
    } catch {
      /* non-browser */
    }
    return merged;
  }

  window.RDJobsAPI = {
    loadRemoteJobs,
    fetchJobDetail,
    findJobById,
    isTechJob,
  };
})();
