/**
 * Legacy /job.html?id=… → /jobs/<slug> redirect for old links.
 */
(function () {
  function getId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("id");
    if (fromQuery) return fromQuery;

    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    if (hash.startsWith("id=")) return decodeURIComponent(hash.slice(3));
    try {
      return decodeURIComponent(hash);
    } catch {
      return hash;
    }
  }

  function findJob(id) {
    return (window.RD_JOBS || []).find((j) => String(j.id) === String(id));
  }

  function showNotFound() {
    const el = document.getElementById("job-redirect-status");
    if (el) {
      el.textContent =
        "Job not found. This listing may have expired or the link is invalid.";
    }
    document.title = "Job not found — RemoteDevelopers.work";
  }

  const id = getId();
  if (!id) {
    showNotFound();
    return;
  }

  const job = findJob(id);
  if (job?.slug) {
    const target = `/jobs/${encodeURIComponent(job.slug)}`;
    window.location.replace(target);
    return;
  }

  showNotFound();
})();
