/**
 * Jobs board: search, multi-role, experience, salary, tags, date range, infinite scroll.
 */
(function () {
  const PAGE_SIZE = 9;

  const ROLE_OPTIONS = [
    "Frontend",
    "Backend",
    "Full Stack",
    "DevOps",
    "AI",
    "Data",
  ];

  const ROLE_KEYWORDS = {
    Frontend: ["frontend", "front-end", "front end", "react", "vue", "angular", "ui engineer"],
    Backend: ["backend", "back-end", "back end", "api", "server"],
    "Full Stack": ["full stack", "full-stack", "fullstack"],
    DevOps: ["devops", "sre", "platform", "infrastructure", "kubernetes"],
    AI: ["ai", "ml", "machine learning", "llm", "deep learning"],
    Data: ["data engineer", "data scientist", "analytics", "etl"],
  };

  const state = {
    search: "",
    salaryMin: 40000,
    roles: new Set(),
    level: "",
    location: "",
    tags: new Set(),
    dateFrom: "",
    dateTo: "",
    loadedCount: PAGE_SIZE,
    sourceFilter: "all",
  };

  let scrollObserver = null;
  let renderedCount = 0;

  function allJobs() {
    return window.RD_JOBS || [];
  }

  function matchesSingleRole(job, role) {
    const keywords = ROLE_KEYWORDS[role] || [role.toLowerCase()];
    const hay = [job.title, ...(job.tags || []), job.level]
      .join(" ")
      .toLowerCase();
    return keywords.some((k) => hay.includes(k));
  }

  function matchesRoles(job) {
    if (!state.roles.size) return true;
    for (const role of state.roles) {
      if (matchesSingleRole(job, role)) return true;
    }
    return false;
  }

  function matchesLocation(job, location) {
    if (!location) return true;
    const hay = [job.location, job.title, job.company, ...(job.tags || [])]
      .join(" ")
      .toLowerCase();
    const map = {
      USA: ["usa", "united states", "us ", " america"],
      Europe: ["europe", "eu ", "emea", "germany", "france", "netherlands", "spain"],
      Canada: ["canada"],
      UK: ["uk", "united kingdom", "london", "britain"],
      Asia: ["asia", "india", "singapore", "japan", "korea"],
      LATAM: ["latam", "latin", "brazil", "mexico", "argentina"],
      Australia: ["australia", "nz", "new zealand"],
    };
    const keys = map[location] || [location.toLowerCase()];
    return keys.some((k) => hay.includes(k.trim()));
  }

  function matchesDateRange(job) {
    if (!state.dateFrom && !state.dateTo) return true;
    const posted = new Date(job.postedAt).getTime();
    if (Number.isNaN(posted)) return false;
    if (state.dateFrom) {
      const from = new Date(state.dateFrom);
      from.setHours(0, 0, 0, 0);
      if (posted < from.getTime()) return false;
    }
    if (state.dateTo) {
      const to = new Date(state.dateTo);
      to.setHours(23, 59, 59, 999);
      if (posted > to.getTime()) return false;
    }
    return true;
  }

  function matches(job) {
    const q = state.search.trim().toLowerCase();
    if (q) {
      const hay = [
        job.title,
        job.company,
        ...(job.tags || []),
        job.level,
        job.type,
        job.location,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (
      state.salaryMin > 40000 &&
      job.salaryMin &&
      job.salaryMin < state.salaryMin
    ) {
      return false;
    }

    if (!matchesRoles(job)) return false;

    if (state.level) {
      const jobLevel = String(job.level || "").toLowerCase();
      if (!jobLevel.includes(state.level.toLowerCase())) return false;
    }

    if (!matchesLocation(job, state.location)) return false;

    if (!matchesDateRange(job)) return false;

    if (state.tags.size) {
      const jobTags = new Set(
        (job.tags || []).map((t) => String(t).toLowerCase()),
      );
      for (const t of state.tags) {
        if (!jobTags.has(String(t).toLowerCase())) return false;
      }
    }

    if (state.sourceFilter === "curated" && job.source !== "curated") {
      return false;
    }
    if (state.sourceFilter === "partner" && job.source !== "partner") {
      return false;
    }

    return true;
  }

  function filtered() {
    return allJobs()
      .filter(matches)
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return new Date(b.postedAt) - new Date(a.postedAt);
      });
  }

  function pageItems(list) {
    return state.sourceFilter === "partner"
      ? list
      : list.filter((j) => !j.featured);
  }

  function setFiltering(on) {
    document.getElementById("job-results")?.classList.toggle("is-filtering", on);
  }

  function resetPagination() {
    state.loadedCount = PAGE_SIZE;
    renderedCount = 0;
  }

  function updateScrollSentinel(hasMore) {
    const sentinel = document.getElementById("scroll-sentinel");
    const loadingEl = document.getElementById("scroll-loading");
    if (sentinel) {
      sentinel.classList.toggle("hidden", !hasMore);
      if (hasMore && scrollObserver) scrollObserver.observe(sentinel);
      else if (scrollObserver) scrollObserver.unobserve(sentinel);
    }
    loadingEl?.classList.add("hidden");
  }

  function render({ reset = true } = {}) {
    setFiltering(true);
    requestAnimationFrame(() => {
      const list = filtered();
      const featuredEl = document.getElementById("featured-jobs");
      const resultsEl = document.getElementById("job-results");
      const countEls = document.querySelectorAll("[data-results-count]");
      const emptyEl = document.getElementById("empty-state");
      const partnerEl = document.getElementById("partner-jobs");

      const featured = list.filter((j) => j.featured);

      if (featuredEl) {
        if (featured.length && state.sourceFilter !== "partner" && reset) {
          featuredEl.classList.remove("hidden");
          featuredEl.querySelector("[data-featured-list]").innerHTML = featured
            .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
            .join("");
        } else if (reset) {
          featuredEl.classList.add("hidden");
        }
      }

      const items = pageItems(list);
      const visible = items.slice(0, state.loadedCount);
      const hasMore = visible.length < items.length;

      const countText = `${list.length} job${list.length === 1 ? "" : "s"}`;
      countEls.forEach((el) => {
        el.textContent = countText;
      });

      if (resultsEl) {
        if (items.length === 0 && featured.length === 0) {
          resultsEl.innerHTML = "";
          renderedCount = 0;
          emptyEl?.classList.remove("hidden");
        } else {
          emptyEl?.classList.add("hidden");
          if (reset) {
            resultsEl.innerHTML = visible
              .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
              .join("");
            renderedCount = visible.length;
          } else {
            const newItems = visible.slice(renderedCount);
            resultsEl.insertAdjacentHTML(
              "beforeend",
              newItems
                .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
                .join(""),
            );
            renderedCount = visible.length;
          }
        }
      }

      updateScrollSentinel(hasMore);

      if (partnerEl && reset) {
        const partners = allJobs()
          .filter((j) => j.source === "partner")
          .slice(0, 6);
        partnerEl.innerHTML = partners
          .map((j) => window.RDJobs.jobCardHTML(j, { showFeatured: false }))
          .join("");
      }

      setFiltering(false);
    });
  }

  function loadMore() {
    const items = pageItems(filtered());
    if (state.loadedCount >= items.length) return;
    const loadingEl = document.getElementById("scroll-loading");
    loadingEl?.classList.remove("hidden");
    state.loadedCount += PAGE_SIZE;
    render({ reset: false });
  }

  function bindInfiniteScroll() {
    const sentinel = document.getElementById("scroll-sentinel");
    if (!sentinel) return;

    scrollObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "240px", threshold: 0 },
    );

    scrollObserver.observe(sentinel);
  }

  function syncChipGroup(selector, selectedSet, attr) {
    document.querySelectorAll(selector).forEach((btn) => {
      const v = btn.getAttribute(attr) || "";
      btn.setAttribute("aria-pressed", String(selectedSet.has(v)));
    });
  }

  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("q")) {
      state.search = params.get("q") || "";
      const search = document.getElementById("filter-search");
      if (search) search.value = state.search;
    }
    const roleParam = params.getAll("role");
    if (roleParam.length) {
      roleParam.forEach((r) => {
        if (r) state.roles.add(r);
      });
    } else if (params.has("role")) {
      const r = params.get("role");
      if (r) state.roles.add(r);
    }
    syncChipGroup("[data-filter-role]", state.roles, "data-filter-role");

    if (params.has("level")) {
      state.level = params.get("level") || "";
      syncRadioGroup(
        "[data-filter-level-radio]",
        state.level,
        "data-filter-level-radio",
      );
    }
    if (params.has("location")) {
      state.location = params.get("location") || "";
    }
    if (params.has("salary")) {
      state.salaryMin = Number(params.get("salary")) || 40000;
      const salary = document.getElementById("filter-salary");
      const salaryLabel = document.getElementById("salary-label");
      if (salary) salary.value = String(state.salaryMin);
      if (salaryLabel) {
        salaryLabel.textContent = `$${Math.round(state.salaryMin / 1000)}k+`;
      }
    }
    params.getAll("tag").forEach((t) => {
      if (t) state.tags.add(t);
    });
    if (params.has("from")) {
      state.dateFrom = params.get("from") || "";
      const fromEl = document.getElementById("filter-date-from");
      if (fromEl) fromEl.value = state.dateFrom;
    }
    if (params.has("to")) {
      state.dateTo = params.get("to") || "";
      const toEl = document.getElementById("filter-date-to");
      if (toEl) toEl.value = state.dateTo;
    }
  }

  function syncRadioGroup(selector, value, attr) {
    document.querySelectorAll(selector).forEach((btn) => {
      const v = btn.getAttribute(attr) || "";
      btn.setAttribute("aria-checked", String(v === value));
    });
  }

  function bindFilters() {
    const search = document.getElementById("filter-search");
    const salary = document.getElementById("filter-salary");
    const salaryLabel = document.getElementById("salary-label");
    const dateFrom = document.getElementById("filter-date-from");
    const dateTo = document.getElementById("filter-date-to");

    search?.addEventListener("input", (e) => {
      state.search = e.target.value;
      resetPagination();
      render();
    });

    salary?.addEventListener("input", (e) => {
      state.salaryMin = Number(e.target.value) || 40000;
      if (salaryLabel) {
        salaryLabel.textContent = `$${Math.round(state.salaryMin / 1000)}k+`;
      }
      resetPagination();
      render();
    });

    dateFrom?.addEventListener("change", (e) => {
      state.dateFrom = e.target.value;
      resetPagination();
      render();
    });

    dateTo?.addEventListener("change", (e) => {
      state.dateTo = e.target.value;
      resetPagination();
      render();
    });

    document.querySelectorAll("[data-filter-level-radio]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.level = btn.getAttribute("data-filter-level-radio") || "";
        syncRadioGroup(
          "[data-filter-level-radio]",
          state.level,
          "data-filter-level-radio",
        );
        resetPagination();
        render();
      });
    });

    document.querySelectorAll("[data-source-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sourceFilter = btn.getAttribute("data-source-filter");
        document.querySelectorAll("[data-source-filter]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        resetPagination();
        render();
      });
    });

    document.getElementById("clear-filters")?.addEventListener("click", () => {
      state.search = "";
      state.salaryMin = 40000;
      state.roles.clear();
      state.level = "";
      state.location = "";
      state.tags.clear();
      state.dateFrom = "";
      state.dateTo = "";
      state.sourceFilter = "all";
      resetPagination();
      if (search) search.value = "";
      if (salary) salary.value = "40000";
      if (salaryLabel) salaryLabel.textContent = "$40k+";
      if (dateFrom) dateFrom.value = "";
      if (dateTo) dateTo.value = "";
      syncChipGroup("[data-filter-role]", state.roles, "data-filter-role");
      syncRadioGroup("[data-filter-level-radio]", "", "data-filter-level-radio");
      document.querySelectorAll("[data-filter-tag]").forEach((el) => {
        el.setAttribute("aria-pressed", "false");
      });
      document.querySelectorAll("[data-source-filter]").forEach((el) => {
        el.setAttribute(
          "aria-pressed",
          String(el.getAttribute("data-source-filter") === "all"),
        );
      });
      render();
    });

    const drawer = document.getElementById("filter-sidebar");
    const overlay = document.getElementById("filter-overlay");
    document.getElementById("open-filters")?.addEventListener("click", () => {
      drawer?.classList.add("open");
      overlay?.classList.add("open");
    });
    const close = () => {
      drawer?.classList.remove("open");
      overlay?.classList.remove("open");
    };
    document.getElementById("close-filters")?.addEventListener("click", close);
    overlay?.addEventListener("click", close);
  }

  function renderRoleFilters() {
    const el = document.getElementById("role-filters");
    if (!el) return;
    el.innerHTML = ROLE_OPTIONS.map(
      (role) =>
        `<button type="button" class="tag-chip cursor-pointer" data-filter-role="${window.RDJobs.escapeAttr(role)}" aria-pressed="${state.roles.has(role) ? "true" : "false"}">${window.RDJobs.escapeHtml(role)}</button>`,
    ).join("");
    el.querySelectorAll("[data-filter-role]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-filter-role");
        if (state.roles.has(val)) state.roles.delete(val);
        else state.roles.add(val);
        btn.setAttribute("aria-pressed", String(state.roles.has(val)));
        resetPagination();
        render();
      });
    });
  }

  function renderTagFilters() {
    const el = document.getElementById("tag-filters");
    if (!el) return;
    const tags = window.RD_TECH_TAGS || [];
    el.innerHTML = tags
      .map(
        (t) =>
          `<button type="button" class="tag-chip cursor-pointer" data-filter-tag="${window.RDJobs.escapeAttr(
            t,
          )}" aria-pressed="${state.tags.has(t) ? "true" : "false"}">${window.RDJobs.escapeHtml(t)}</button>`,
      )
      .join("");

    el.querySelectorAll("[data-filter-tag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-filter-tag");
        if (state.tags.has(val)) state.tags.delete(val);
        else state.tags.add(val);
        btn.setAttribute("aria-pressed", String(state.tags.has(val)));
        resetPagination();
        render();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!document.getElementById("job-results")) return;

    const loading = document.getElementById("jobs-loading");
    const resultsEl = document.getElementById("job-results");
    loading?.classList.remove("hidden");
    if (resultsEl && window.RDUI?.skeletonCards) {
      resultsEl.innerHTML = window.RDUI.skeletonCards(4);
    }

    applyUrlParams();
    renderRoleFilters();
    renderTagFilters();
    bindFilters();
    bindInfiniteScroll();
    render();

    try {
      if (window.RDJobsAPI?.loadRemoteJobs) {
        await window.RDJobsAPI.loadRemoteJobs();
      }
    } catch (err) {
      console.warn("[RD] API load failed", err);
    } finally {
      loading?.classList.add("hidden");
    }

    render();
    updateAttribution();
    window.RDJobs.injectSchema(
      (window.RD_JOBS || []).filter((j) => j.featured),
    );
  });

  function updateAttribution() {
    const el = document.getElementById("api-attribution");
    if (!el) return;
    const status = window.RD_API_STATUS || {};
    const parts = [
      ["Himalayas", "https://himalayas.app", status["Himalayas"]],
      ["Remote OK", "https://remoteok.com", status["Remote OK"]],
      ["Jobicy", "https://jobicy.com", status["Jobicy"]],
      ["Arbeitnow", "https://www.arbeitnow.com", status["Arbeitnow"]],
    ]
      .filter(([, , n]) => n > 0)
      .map(
        ([name, url, n]) =>
          `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[var(--rd-primary)] hover:underline">${name}</a> (${n})`,
      );
    if (!parts.length) {
      el.innerHTML =
        "Live feeds unavailable right now — showing curated sample jobs. Some jobs are syndicated from partner boards.";
      return;
    }
    el.innerHTML = `Live listings from ${parts.join(
      ", ",
    )}. Some jobs are syndicated from partner boards — please visit the original board when applying.`;
  }
})();
