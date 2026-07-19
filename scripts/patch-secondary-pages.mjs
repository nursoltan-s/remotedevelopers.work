/**
 * Patch secondary HTML pages with new fonts, dark-default FOUC, chrome placeholders.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const HEAD_FONTS_OLD =
  /<link\s+rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>[\s\S]*?family=Sora[^>]*>/;
const HEAD_FONTS_NEW = `<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/400.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/500.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/600.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.2.5/700.css" rel="stylesheet" />`;

const FOUC_OLD =
  /<script>\s*try \{\s*if \(localStorage\.getItem\("rd-theme"\) !== "dark"\)[\s\S]*?<\/script>/;
const FOUC_NEW = `<script>
      try {
        if (localStorage.getItem("rd-theme") === "light")
          document.documentElement.classList.add("light");
      } catch (e) {}
    </script>`;

const TW_OLD = /tailwind\.config = \{[\s\S]*?\};\s*<\/script>/;
const TW_NEW = `tailwind.config = {
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
    </script>`;

const HEADER_RE = /<header class="nav-glass[\s\S]*?<\/header>/;
const FOOTER_RE = /<footer class="border-t[\s\S]*?<\/footer>/;

function patchFile(rel, active) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.log("skip missing", rel);
    return;
  }
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  if (HEAD_FONTS_OLD.test(html)) html = html.replace(HEAD_FONTS_OLD, HEAD_FONTS_NEW);
  if (FOUC_OLD.test(html)) html = html.replace(FOUC_OLD, FOUC_NEW);
  if (TW_OLD.test(html)) html = html.replace(TW_OLD, TW_NEW);

  if (HEADER_RE.test(html)) {
    html = html.replace(
      HEADER_RE,
      `<div data-rd-header="${active}"></div>\n    <script src="/js/chrome.js"></script>`,
    );
  }

  if (FOOTER_RE.test(html)) {
    html = html.replace(
      FOOTER_RE,
      `<div data-rd-footer></div>\n    <script>window.RDChrome && window.RDChrome.mount();</script>`,
    );
  }

  if (!html.includes("/js/ui.js") && html.includes('/script src="/js/theme.js"')) {
    html = html.replace(
      '<script src="/js/theme.js"></script>',
      '<script src="/js/theme.js"></script>\n    <script src="/js/ui.js"></script>',
    );
  } else if (!html.includes("/js/ui.js") && html.includes('src="/js/theme.js"')) {
    html = html.replace(
      '<script src="/js/theme.js"></script>',
      '<script src="/js/theme.js"></script>\n    <script src="/js/ui.js"></script>',
    );
  }

  html = html.replace(
    /\s*<script\s+defer\s+src="https:\/\/cdn\.jsdelivr\.net\/npm\/alpinejs@3\.x\.x\/dist\/cdn\.min\.js"\s*><\/script>/g,
    "",
  );

  // Skip-to-content with old teal focus
  html = html.replace(
    /focus:bg-accent-teal/g,
    "focus:bg-[var(--rd-primary)]",
  );

  if (html !== before) {
    fs.writeFileSync(file, html);
    console.log("patched", rel);
  } else {
    console.log("unchanged", rel);
  }
}

const pages = [
  ["about.html", ""],
  ["companies.html", "companies"],
  ["blog.html", "guides"],
  ["post-job.html", ""],
  ["privacy.html", ""],
  ["terms.html", ""],
  ["job.html", "jobs"],
];

for (const [f, a] of pages) patchFile(f, a);

for (const f of fs.readdirSync(path.join(root, "blog"))) {
  if (f.endsWith(".html")) patchFile(path.join("blog", f), "guides");
}
