#!/usr/bin/env node
/** Refresh sitemap.xml + robots.txt from on-disk HTML. */
import { writeSitemap } from "./lib/write-sitemap.mjs";

const n = writeSitemap();
console.log(`Wrote sitemap.xml (${n} urls) + robots.txt`);
