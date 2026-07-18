/**
 * Post a Job — Send email + Pay $5 (Gumroad) as separate actions.
 */
(function () {
  const POST_EMAIL = "nursoltan.s@gmail.com";
  const GUMROAD_URL =
    window.RD_GUMROAD_URL ||
    "https://sgonzales.gumroad.com/l/remotedevelopers?wanted=true";

  const TECH = [
    "React",
    "TypeScript",
    "Next.js",
    "Node.js",
    "Python",
    "Go",
    "Rust",
    "AWS",
    "Kubernetes",
    "GraphQL",
    "PostgreSQL",
    "Vue",
    "Swift",
    "Kotlin",
    "Figma",
    "Terraform",
    "Docker",
    "ML",
    "Security",
    "Java",
    "Ruby",
  ];

  function val(id) {
    return document.getElementById(id)?.value.trim() || "";
  }

  function buildMailto() {
    const title = val("job-title");
    const company = val("company-name");
    const subject = encodeURIComponent(
      `Job post ($5 Gumroad): ${title} at ${company}`
    );

    const body = encodeURIComponent(
      [
        "New job listing for RemoteDevelopers.work",
        "Payment: Gumroad $5 (https://sgonzales.gumroad.com/l/remotedevelopers)",
        "",
        `Job Title: ${title}`,
        `Company: ${company}`,
        `Logo URL: ${val("logo-url") || "(none)"}`,
        `Salary Range: ${val("salary-range") || "(not specified)"}`,
        `Apply URL: ${val("apply-url")}`,
        `Tech Stack: ${val("tech-tags-value") || "(none)"}`,
        "",
        "Description:",
        val("job-description"),
        "",
        "Requirements:",
        val("requirements"),
        "",
        "How to Apply:",
        val("how-to-apply") || "(see Apply URL)",
      ].join("\n")
    );

    return `mailto:${POST_EMAIL}?subject=${subject}&body=${body}`;
  }

  function validateForm() {
    const required = [
      "job-title",
      "company-name",
      "job-description",
      "requirements",
      "apply-url",
    ];
    let ok = true;
    required.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      const empty = !input.value.trim();
      input.classList.toggle("ring-2", empty);
      input.classList.toggle("ring-red-400", empty);
      if (empty) ok = false;
    });

    const applyUrl = document.getElementById("apply-url");
    if (applyUrl?.value && !/^https?:\/\//i.test(applyUrl.value.trim())) {
      applyUrl.classList.add("ring-2", "ring-red-400");
      ok = false;
    }

    if (!ok) {
      document.querySelector(".ring-red-400")?.focus();
    }
    return ok;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("post-job-form");
    if (!form) return;

    const tagsEl = document.getElementById("tech-tags");
    const selected = new Set();

    if (tagsEl) {
      tagsEl.innerHTML = TECH.map(
        (t) =>
          `<button type="button" class="tag-chip cursor-pointer" data-tag="${t}" aria-pressed="false">${t}</button>`
      ).join("");

      tagsEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-tag]");
        if (!btn) return;
        const tag = btn.getAttribute("data-tag");
        if (selected.has(tag)) {
          selected.delete(tag);
          btn.setAttribute("aria-pressed", "false");
        } else {
          selected.add(tag);
          btn.setAttribute("aria-pressed", "true");
        }
        document.getElementById("tech-tags-value").value = [...selected].join(
          ","
        );
      });
    }

    const payBtn = document.getElementById("btn-pay-gumroad");
    if (payBtn) payBtn.href = GUMROAD_URL;

    document.getElementById("btn-send-email")?.addEventListener("click", () => {
      if (!validateForm()) return;
      window.location.href = buildMailto();
    });

    // Prevent accidental form submit; pay link validates first
    form.addEventListener("submit", (e) => e.preventDefault());

    payBtn?.addEventListener("click", (e) => {
      if (!validateForm()) {
        e.preventDefault();
      }
    });
  });
})();
