/**
 * Fetch partner APIs and normalize to RD job shape (Node).
 */
import {
  descFields,
  fetchJSON,
  fmtSalary,
  isTechJob,
  mapLevel,
  mapType,
  pickTags,
} from "./io.mjs";

export function normalizeRemoteOK(j) {
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

export function normalizeJobicy(j) {
  if (!j || !j.id || !j.jobTitle) return null;
  return {
    id: `jcy-${j.id}`,
    title: j.jobTitle,
    company: j.companyName || "Unknown",
    logo: j.companyLogo || null,
    salary: fmtSalary(
      j.salaryMin ?? j.annualSalaryMin,
      j.salaryMax ?? j.annualSalaryMax,
      j.salaryCurrency,
      j.salaryPeriod || "annual"
    ),
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

export function normalizeArbeitnow(j) {
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

export function normalizeHimalayas(j) {
  if (!j || !j.title) return null;
  return {
    id: `him-${j.guid || j.applicationLink}`,
    title: j.title,
    company: j.companyName || "Unknown",
    logo: j.companyLogo || null,
    salary: fmtSalary(j.minSalary, j.maxSalary, j.currency, j.salaryPeriod),
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

export async function fetchRemoteOK() {
  const data = await fetchJSON("https://remoteok.com/api");
  return (Array.isArray(data) ? data : [])
    .filter((j) => j && j.id && j.position)
    .filter((j) => isTechJob(j.position, j.tags))
    .slice(0, 60)
    .map(normalizeRemoteOK)
    .filter(Boolean);
}

export async function fetchJobicy() {
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

export async function fetchArbeitnow() {
  const data = await fetchJSON("https://www.arbeitnow.com/api/job-board-api");
  return (data?.data || [])
    .filter((j) => j.remote)
    .filter((j) => isTechJob(j.title, j.tags))
    .slice(0, 40)
    .map(normalizeArbeitnow)
    .filter(Boolean);
}

export async function fetchHimalayas() {
  const data = await fetchJSON(
    "https://himalayas.app/jobs/api?limit=50&offset=0"
  );
  return (data?.jobs || [])
    .filter((j) => isTechJob(j.title, j.categories))
    .slice(0, 40)
    .map(normalizeHimalayas)
    .filter(Boolean);
}

export async function fetchAllPartnerJobs() {
  const loaders = [
    { name: "Remote OK", fn: fetchRemoteOK },
    { name: "Jobicy", fn: fetchJobicy },
    { name: "Arbeitnow", fn: fetchArbeitnow },
    { name: "Himalayas", fn: fetchHimalayas },
  ];

  const settled = await Promise.allSettled(loaders.map((l) => l.fn()));
  const jobs = [];
  const status = {};

  settled.forEach((result, i) => {
    const name = loaders[i].name;
    if (result.status === "fulfilled") {
      status[name] = result.value.length;
      jobs.push(...result.value);
    } else {
      status[name] = 0;
      console.warn(`[sync] ${name} failed:`, result.reason?.message || result.reason);
    }
  });

  return { jobs, status };
}
