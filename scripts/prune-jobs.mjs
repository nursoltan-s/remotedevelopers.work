#!/usr/bin/env node
/**
 * Remove static jobs older than 1 year (based on postedAt).
 *
 * Usage:
 *   node scripts/prune-jobs.mjs
 *   npm run prune-jobs
 *
 * Console logs how many jobs were removed.
 */
import { loadJobs, saveJobs } from "./lib/io.mjs";
import { generateJobPages } from "./generate-job-pages.mjs";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function postedTime(job) {
  const t = Date.parse(job.postedAt || "");
  return Number.isFinite(t) ? t : null;
}

function main() {
  const now = Date.now();
  const cutoff = now - ONE_YEAR_MS;
  const cutoffIso = new Date(cutoff).toISOString();

  console.log("[prune] Loading existing static jobs…");
  const existing = loadJobs();
  console.log(`[prune] Existing jobs: ${existing.length}`);
  console.log(`[prune] Removing jobs posted before ${cutoffIso}`);

  const kept = [];
  const removed = [];

  for (const job of existing) {
    const t = postedTime(job);
    // Keep jobs with missing/invalid dates (manual curated may need review)
    if (t == null) {
      kept.push(job);
      continue;
    }
    if (t < cutoff) removed.push(job);
    else kept.push(job);
  }

  saveJobs(kept);

  console.log(`[prune] Jobs removed: ${removed.length}`);
  if (removed.length) {
    console.log("[prune] Removed samples:");
    removed.slice(0, 10).forEach((j) => {
      console.log(
        `  - ${j.id} | ${j.title} @ ${j.company} (posted ${j.postedAt})`
      );
    });
    if (removed.length > 10) console.log(`  … and ${removed.length - 10} more`);
  }
  console.log(`[prune] Jobs remaining: ${kept.length}`);
  console.log("[prune] Updated data/jobs.json and js/jobs-data.js");

  const pages = generateJobPages();
  console.log(
    `[prune] Regenerated ${pages.count} static job pages (removed ${pages.removed} stale HTML)`,
  );
}

try {
  main();
} catch (err) {
  console.error("[prune] Failed:", err);
  process.exit(1);
}
