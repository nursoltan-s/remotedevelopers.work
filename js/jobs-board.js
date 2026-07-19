/**
 * Jobs board: search, role/experience radios, salary, tags, pagination.
 */
(function () {
  const PAGE_SIZE = 9;

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
    role: "",
    level: "",
    location: "",
    tags: new Set(),
    page: 1,
    sourceFilter: "all",
  };

  function allJobs() {
    return window.RD_JOBS || [];
  }

  function matchesRole(job, role) {
    if (!role) return true;
    const keywords = ROLE_KEYWORDS[role] || [role.toLowerCase()];
    const hay = [job.title, ...(job.tags || []), job.level]
      .join(" ")
      .toLowerCase();
    return keywords.some((k) => hay.includes(k));
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

    // Exclude only when we know salary is below the filter; keep unknown salaries
    if (
      state.salaryMin > 40000 &&
      job.salaryMin &&
      job.salaryMin < state.salaryMin
    ) {
      return false;
    }

    if (!matchesRole(job, state.role)) return false;

    if (state.level) {
      const jobLevel = String(job.level || "").toLowerCase();
      if (!jobLevel.includes(state.level.toLowerCase())) return false;
    }

    if (!matchesLocation(job, state.location)) return false;

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

  function setFiltering(on) {
    document.getElementById("job-results")?.classList.toggle("is-filtering", on);
  }

  function render() {
    setFiltering(true);
    requestAnimationFrame(() => {
      const list = filtered();
      const featuredEl = document.getElementById("featured-jobs");
      const resultsEl = document.getElementById("job-results");
      const countEls = document.querySelectorAll("[data-results-count]");
      const paginationEl = document.getElementById("pagination");
      const emptyEl = document.getElementById("empty-state");
      const partnerEl = document.getElementById("partner-jobs");

      const featured = list.filter((j) => j.featured);

      if (featuredEl) {
        if (
          featured.length &&
          state.sourceFilter !== "partner" &&
          state.page === 1
        ) {
          featuredEl.classList.remove("hidden");
          featuredEl.querySelector("[data-featured-list]").innerHTML = featured
            .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
            .join("");
        } else {
          featuredEl.classList.add("hidden");
        }
      }

      const pageItems =
        state.sourceFilter === "partner"
          ? list
          : list.filter((j) => !j.featured);

      const totalPages = Math.max(1, Math.ceil(pageItems.length / PAGE_SIZE));
      if (state.page > totalPages) state.page = totalPages;

      const start = (state.page - 1) * PAGE_SIZE;
      const pageSlice = pageItems.slice(start, start + PAGE_SIZE);

      const countText = `${list.length} job${list.length === 1 ? "" : "s"}`;
      countEls.forEach((el) => {
        el.textContent = countText;
      });

      if (resultsEl) {
        if (pageSlice.length === 0 && featured.length === 0) {
          resultsEl.innerHTML = "";
          emptyEl?.classList.remove("hidden");
        } else {
          emptyEl?.classList.add("hidden");
          resultsEl.innerHTML = pageSlice
            .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
            .join("");
        }
      }

      if (paginationEl) {
        if (pageItems.length <= PAGE_SIZE) {
          paginationEl.innerHTML = "";
        } else {
          let html = `<div class="flex flex-wrap items-center justify-center gap-2 mt-8">`;
          html += `<button type="button" class="btn-secondary py-2 px-3 text-sm" data-page="prev" ${
            state.page <= 1 ? "disabled" : ""
          }>Previous</button>`;
          for (let i = 1; i <= totalPages; i++) {
            const active =
              i === state.page
                ? "!border-[var(--rd-primary)] bg-blue-500/15 text-[var(--rd-primary)]"
                : "";
            html += `<button type="button" class="btn-secondary py-2 px-3 text-sm ${active}" data-page="${i}">${i}</button>`;
          }
          html += `<button type="button" class="btn-secondary py-2 px-3 text-sm" data-page="next" ${
            state.page >= totalPages ? "disabled" : ""
          }>Next</button></div>`;
          paginationEl.innerHTML = html;
        }
      }

      if (partnerEl) {
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

  function syncRadioGroup(selector, value, attr) {
    document.querySelectorAll(selector).forEach((btn) => {
      const v = btn.getAttribute(attr) || "";
      btn.setAttribute("aria-checked", String(v === value));
    });
  }

  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("q")) {
      state.search = params.get("q") || "";
      const search = document.getElementById("filter-search");
      if (search) search.value = state.search;
    }
    if (params.has("role")) {
      state.role = params.get("role") || "";
      syncRadioGroup("[data-filter-role]", state.role, "data-filter-role");
    }
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
    if (params.has("tag")) {
      state.tags.add(params.get("tag"));
    }
  }

  function bindFilters() {
    const search = document.getElementById("filter-search");
    const salary = document.getElementById("filter-salary");
    const salaryLabel = document.getElementById("salary-label");

    search?.addEventListener("input", (e) => {
      state.search = e.target.value;
      state.page = 1;
      render();
    });

    salary?.addEventListener("input", (e) => {
      state.salaryMin = Number(e.target.value) || 40000;
      if (salaryLabel) {
        salaryLabel.textContent = `$${Math.round(state.salaryMin / 1000)}k+`;
      }
      state.page = 1;
      render();
    });

    document.querySelectorAll("[data-filter-role]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.role = btn.getAttribute("data-filter-role") || "";
        syncRadioGroup("[data-filter-role]", state.role, "data-filter-role");
        state.page = 1;
        render();
      });
    });

    document.querySelectorAll("[data-filter-level-radio]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.level = btn.getAttribute("data-filter-level-radio") || "";
        syncRadioGroup(
          "[data-filter-level-radio]",
          state.level,
          "data-filter-level-radio",
        );
        state.page = 1;
        render();
      });
    });

    document.querySelectorAll("[data-source-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sourceFilter = btn.getAttribute("data-source-filter");
        document.querySelectorAll("[data-source-filter]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        state.page = 1;
        render();
      });
    });

    document.getElementById("clear-filters")?.addEventListener("click", () => {
      state.search = "";
      state.salaryMin = 40000;
      state.role = "";
      state.level = "";
      state.location = "";
      state.tags.clear();
      state.sourceFilter = "all";
      state.page = 1;
      if (search) search.value = "";
      if (salary) salary.value = "40000";
      if (salaryLabel) salaryLabel.textContent = "$40k+";
      syncRadioGroup("[data-filter-role]", "", "data-filter-role");
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

    document.getElementById("pagination")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      const val = btn.getAttribute("data-page");
      const list = filtered().filter(
        (j) => state.sourceFilter === "partner" || !j.featured,
      );
      const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (val === "prev") state.page = Math.max(1, state.page - 1);
      else if (val === "next")
        state.page = Math.min(totalPages, state.page + 1);
      else state.page = Number(val);
      render();
      document
        .getElementById("job-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        state.page = 1;
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
    renderTagFilters();
    bindFilters();
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
