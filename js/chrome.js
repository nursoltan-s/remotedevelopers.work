/**
 * Shared header + footer injection for consistent chrome across pages.
 * Place <div data-rd-header="activeKey"></div> and <div data-rd-footer></div>.
 */
(function () {
  const LINKS = [
    { key: "jobs", href: "/jobs.html", label: "Jobs" },
    { key: "companies", href: "/companies.html", label: "Companies" },
    { key: "guides", href: "/guides.html", label: "Remote Guides" },
    { key: "salary", href: "/salary.html", label: "Salary" },
    { key: "signin", href: "/sign-in.html", label: "Sign In" },
  ];

  function themeToggleHTML() {
    return `
      <button type="button" data-theme-toggle class="btn-secondary !p-2.5" aria-label="Toggle dark and light mode">
        <svg class="theme-icon-moon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
        <svg class="theme-icon-sun h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0l-1.414 1.414M7.05 16.95l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      </button>`;
  }

  function navLinksHTML(active, mobile) {
    return LINKS.map((l) => {
      const isActive = l.key === active;
      if (mobile) {
        const cls = isActive
          ? "px-3 py-2.5 text-sm font-medium rounded-lg bg-blue-500/10 text-[var(--rd-primary)]"
          : "px-3 py-2.5 text-sm font-medium text-muted";
        return `<a href="${l.href}" class="${cls}">${l.label}</a>`;
      }
      const cls = isActive ? "nav-link active" : "nav-link";
      return `<a href="${l.href}" class="${cls}">${l.label}</a>`;
    }).join("");
  }

  function headerHTML(active) {
    return `
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-[var(--rd-primary)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">Skip to content</a>
    <header class="nav-glass sticky top-0 z-50">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="flex h-16 items-center justify-between gap-4">
          <a href="/" class="flex items-center shrink-0 group">
            <img src="/assets/logo-nav.png" alt="remotedevelopers.work" class="h-8 sm:h-9 w-auto" width="183" height="40" />
          </a>
          <nav class="hidden lg:flex items-center gap-0.5" aria-label="Primary">
            ${navLinksHTML(active, false)}
          </nav>
          <div class="flex items-center gap-2">
            ${themeToggleHTML()}
            <a href="/post-job.html" class="btn-primary !py-2 !px-4 text-sm hidden sm:inline-flex">Post a Job</a>
            <button type="button" class="btn-secondary !p-2.5 lg:hidden" data-mobile-menu aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>
        <nav id="mobile-nav" data-mobile-nav class="hidden lg:hidden pb-4 border-t border-[var(--rd-border)] pt-3" aria-label="Mobile">
          <div class="flex flex-col gap-1">
            ${navLinksHTML(active, true)}
            <a href="/post-job.html" class="px-3 py-2.5 text-sm font-medium text-muted">Post a Job</a>
          </div>
        </nav>
      </div>
    </header>`;
  }

  function footerHTML() {
    return `
    <footer class="border-t border-[var(--rd-border)] mt-8">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div class="lg:col-span-2">
            <p class="font-display font-semibold mb-2">remotedevelopers</p>
            <p class="text-muted text-sm leading-relaxed max-w-sm">
              Curated. Remote-only. Developer-first. The best place for remote developer jobs.
            </p>
            <form class="mt-5 flex gap-2 max-w-sm" action="mailto:hello@remotedevelopers.work" method="get" enctype="text/plain">
              <label class="sr-only" for="footer-email">Email</label>
              <input id="footer-email" name="subject" type="email" required placeholder="you@email.com" class="form-input !py-2.5 text-sm flex-1" />
              <input type="hidden" name="body" value="Please add me to the weekly remote jobs digest." />
              <button type="submit" class="btn-primary !py-2.5 !px-4 text-sm shrink-0">Subscribe</button>
            </form>
          </div>
          <div>
            <p class="font-semibold text-sm mb-3">Explore</p>
            <ul class="space-y-2 text-sm text-muted">
              <li><a href="/jobs.html" class="hover:text-[var(--rd-primary)]">Jobs</a></li>
              <li><a href="/companies.html" class="hover:text-[var(--rd-primary)]">Companies</a></li>
              <li><a href="/guides.html" class="hover:text-[var(--rd-primary)]">Guides</a></li>
              <li><a href="/salary.html" class="hover:text-[var(--rd-primary)]">Salary</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-sm mb-3">Company</p>
            <ul class="space-y-2 text-sm text-muted">
              <li><a href="/about.html" class="hover:text-[var(--rd-primary)]">About</a></li>
              <li><a href="/contact.html" class="hover:text-[var(--rd-primary)]">Contact</a></li>
              <li><a href="/post-job.html" class="hover:text-[var(--rd-primary)]">Post a Job</a></li>
              <li><a href="/privacy.html" class="hover:text-[var(--rd-primary)]">Privacy</a></li>
              <li><a href="/terms.html" class="hover:text-[var(--rd-primary)]">Terms</a></li>
            </ul>
          </div>
          <div>
            <p class="font-semibold text-sm mb-3">Connect</p>
            <ul class="space-y-2 text-sm text-muted">
              <li><a href="/feed.xml" class="hover:text-[var(--rd-primary)]">RSS</a></li>
              <li><a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--rd-primary)]">Twitter</a></li>
              <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--rd-primary)]">GitHub</a></li>
            </ul>
          </div>
        </div>
        <p class="text-muted text-xs leading-relaxed max-w-3xl mb-4">
          Job posts are manually reviewed. Some listings are syndicated from partner boards. Remote-only — no hybrid or on-site noise.
        </p>
        <p class="text-muted text-sm">© 2026 remotedevelopers. All rights reserved.</p>
      </div>
    </footer>`;
  }

  function mount() {
    document.querySelectorAll("[data-rd-header]").forEach((el) => {
      const active = el.getAttribute("data-rd-header") || "";
      el.outerHTML = headerHTML(active);
    });
    document.querySelectorAll("[data-rd-footer]").forEach((el) => {
      el.outerHTML = footerHTML();
    });
  }

  mount();
  window.RDChrome = { mount, headerHTML, footerHTML };
})();
