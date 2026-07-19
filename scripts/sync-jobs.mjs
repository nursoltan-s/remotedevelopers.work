#!/usr/bin/env node
/**
 * Sync partner API jobs into the static site.
 *
 * Usage:
 *   node scripts/sync-jobs.mjs
 *   npm run sync-jobs
 *
 * Reads data/jobs.json, fetches Remote OK / Jobicy / Arbeitnow / Himalayas,
 * appends jobs that are not already present (by id or title+company),
 * writes data/jobs.json + regenerates js/jobs-data.js.
 *
 * Console logs how many new jobs were created.
 */
import { dedupeKey, jobKey, loadJobs, saveJobs } from "./lib/io.mjs";
import { fetchAllPartnerJobs } from "./lib/fetch-partners.mjs";
import { generateJobPages } from "./generate-job-pages.mjs";

async function main() {
  console.log("[sync] Loading existing static jobs…");
  const existing = loadJobs();
  const byId = new Set(existing.map(jobKey));
  const byDedupe = new Set(existing.map(dedupeKey));

  console.log(`[sync] Existing jobs: ${existing.length}`);
  console.log("[sync] Fetching partner APIs…");

  const { jobs: incoming, status } = await fetchAllPartnerJobs();
  console.log("[sync] API status:", status);
  console.log(`[sync] Fetched ${incoming.length} partner jobs (pre-dedupe)`);

  const added = [];
  for (const job of incoming) {
    if (!job?.id || !job?.title) continue;
    if (byId.has(jobKey(job))) continue;
    if (byDedupe.has(dedupeKey(job))) continue;
    byId.add(jobKey(job));
    byDedupe.add(dedupeKey(job));
    added.push(job);
  }

  const merged = [...existing, ...added].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.postedAt || 0) - new Date(a.postedAt || 0);
  });

  saveJobs(merged);

  console.log(`[sync] New jobs created: ${added.length}`);
  if (added.length) {
    console.log("[sync] Sample new jobs:");
    added.slice(0, 8).forEach((j) => {
      console.log(`  + ${j.id} | ${j.title} @ ${j.company} (${j.partnerName || j.source})`);
    });
    if (added.length > 8) console.log(`  … and ${added.length - 8} more`);
  }
  console.log(`[sync] Total jobs on site: ${merged.length}`);
  console.log("[sync] Updated data/jobs.json and js/jobs-data.js");

  const pages = generateJobPages();
  console.log(
    `[sync] Generated ${pages.count} static job pages (sitemap: ${pages.sitemapCount} urls)`,
  );
}

main().catch((err) => {
  console.error("[sync] Failed:", err);
  process.exit(1);
});
