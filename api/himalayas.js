/**
 * Vercel serverless proxy for Himalayas (no browser CORS).
 * GET /api/himalayas?limit=40
 * GET /api/himalayas?mode=search&company=slug&q=keyword
 */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const q = req.query || {};
  const mode = String(q.mode || "browse");

  try {
    let upstreamUrl;
    if (mode === "search") {
      const params = new URLSearchParams();
      if (q.q) params.set("q", String(q.q));
      if (q.company) params.set("company", String(q.company));
      if (q.page) params.set("page", String(q.page));
      if (q.sort) params.set("sort", String(q.sort));
      else params.set("sort", "recent");
      upstreamUrl = `https://himalayas.app/jobs/api/search?${params}`;
    } else {
      const limit = Math.min(100, Math.max(1, Number(q.limit) || 40));
      const offset = Math.max(0, Number(q.offset) || 0);
      upstreamUrl = `https://himalayas.app/jobs/api?limit=${limit}&offset=${offset}`;
    }

    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: String(err?.message || err) });
  }
};
