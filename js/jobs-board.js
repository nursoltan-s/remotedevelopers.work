/**
 * Jobs board: search, filters, pagination.
 */
(function () {
  const PAGE_SIZE = 9;

  const state = {
    search: "",
    salaryMin: 0,
    types: new Set(),
    levels: new Set(),
    tags: new Set(),
    page: 1,
    sourceFilter: "all", // all | curated | partner
  };

  function allJobs() {
    return window.RD_JOBS || [];
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
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (state.salaryMin > 0 && (job.salaryMin || 0) < state.salaryMin) {
      return false;
    }

    if (state.types.size && !state.types.has(job.type)) return false;
    if (state.levels.size && !state.levels.has(job.level)) return false;

    if (state.tags.size) {
      const jobTags = new Set(job.tags || []);
      for (const t of state.tags) {
        if (!jobTags.has(t)) return false;
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

  function render() {
    const list = filtered();
    const featuredEl = document.getElementById("featured-jobs");
    const resultsEl = document.getElementById("job-results");
    const countEls = document.querySelectorAll("[data-results-count]");
    const paginationEl = document.getElementById("pagination");
    const emptyEl = document.getElementById("empty-state");
    const partnerEl = document.getElementById("partner-jobs");

    const featured = list.filter((j) => j.featured);

    // Featured section (only on "all" or curated, when featured exist)
    if (featuredEl) {
      if (featured.length && state.sourceFilter !== "partner" && state.page === 1) {
        featuredEl.classList.remove("hidden");
        featuredEl.querySelector("[data-featured-list]").innerHTML = featured
          .map((j) => window.RDJobs.jobCardHTML(j, { animate: true }))
          .join("");
      } else {
        featuredEl.classList.add("hidden");
      }
    }

    // Main pagination over non-featured when showing all/curated; all matches when partner
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
              ? "border-teal-400 bg-teal-500/15 text-teal-300"
              : "";
          html += `<button type="button" class="btn-secondary py-2 px-3 text-sm ${active}" data-page="${i}">${i}</button>`;
        }
        html += `<button type="button" class="btn-secondary py-2 px-3 text-sm" data-page="next" ${
          state.page >= totalPages ? "disabled" : ""
        }>Next</button></div>`;
        paginationEl.innerHTML = html;
      }
    }

    // Partner spotlight section
    if (partnerEl) {
      const partners = allJobs()
        .filter((j) => j.source === "partner")
        .slice(0, 6);
      partnerEl.innerHTML = partners
        .map((j) => window.RDJobs.jobCardHTML(j, { showFeatured: false }))
        .join("");
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
      state.salaryMin = Number(e.target.value) || 0;
      if (salaryLabel) {
        salaryLabel.textContent =
          state.salaryMin === 0
            ? "Any"
            : `$${Math.round(state.salaryMin / 1000)}k+`;
      }
      state.page = 1;
      render();
    });

    document.querySelectorAll("[data-filter-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-filter-type");
        if (state.types.has(val)) state.types.delete(val);
        else state.types.add(val);
        btn.setAttribute("aria-pressed", String(state.types.has(val)));
        state.page = 1;
        render();
      });
    });

    document.querySelectorAll("[data-filter-level]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-filter-level");
        if (state.levels.has(val)) state.levels.delete(val);
        else state.levels.add(val);
        btn.setAttribute("aria-pressed", String(state.levels.has(val)));
        state.page = 1;
        render();
      });
    });

    document.querySelectorAll("[data-filter-tag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-filter-tag");
        if (state.tags.has(val)) state.tags.delete(val);
        else state.tags.add(val);
        btn.setAttribute("aria-pressed", String(state.tags.has(val)));
        state.page = 1;
        render();
      });
    });

    document.querySelectorAll("[data-source-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sourceFilter = btn.getAttribute("data-source-filter");
        document.querySelectorAll("[data-source-filter]").forEach((b) => {
          b.setAttribute(
            "aria-pressed",
            String(b === btn)
          );
        });
        state.page = 1;
        render();
      });
    });

    document.getElementById("clear-filters")?.addEventListener("click", () => {
      state.search = "";
      state.salaryMin = 0;
      state.types.clear();
      state.levels.clear();
      state.tags.clear();
      state.sourceFilter = "all";
      state.page = 1;
      if (search) search.value = "";
      if (salary) salary.value = "0";
      if (salaryLabel) salaryLabel.textContent = "Any";
      document
        .querySelectorAll("[aria-pressed]")
        .forEach((el) => {
          if (el.hasAttribute("data-source-filter")) {
            el.setAttribute(
              "aria-pressed",
              String(el.getAttribute("data-source-filter") === "all")
            );
          } else {
            el.setAttribute("aria-pressed", "false");
          }
        });
      render();
    });

    document.getElementById("pagination")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      const val = btn.getAttribute("data-page");
      const list = filtered().filter(
        (j) => state.sourceFilter === "partner" || !j.featured
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

    // Mobile filter drawer
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
            t
          )}" aria-pressed="false">${window.RDJobs.escapeHtml(t)}</button>`
      )
      .join("");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!document.getElementById("job-results")) return;

    const loading = document.getElementById("jobs-loading");
    loading?.classList.remove("hidden");

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
      (window.RD_JOBS || []).filter((j) => j.featured)
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
          `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-accent-teal hover:underline">${name}</a> (${n})`
      );
    if (!parts.length) {
      el.innerHTML =
        "Live feeds unavailable right now — showing curated sample jobs. Some jobs are syndicated from partner boards.";
      return;
    }
    el.innerHTML = `Live listings from ${parts.join(
      ", "
    )}. Some jobs are syndicated from partner boards — please visit the original board when applying.`;
  }
})();
