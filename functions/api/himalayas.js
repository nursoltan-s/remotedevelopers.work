/**
 * Cloudflare Pages Function — Himalayas CORS proxy.
 * GET /api/himalayas?limit=40
 * GET /api/himalayas?mode=search&company=slug&q=keyword
 */
export async function onRequest(context) {
  const { request } = context;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "browse";

  try {
    let upstreamUrl;
    if (mode === "search") {
      const params = new URLSearchParams();
      const q = url.searchParams.get("q");
      const company = url.searchParams.get("company");
      const page = url.searchParams.get("page");
      const sort = url.searchParams.get("sort");
      if (q) params.set("q", q);
      if (company) params.set("company", company);
      if (page) params.set("page", page);
      params.set("sort", sort || "recent");
      upstreamUrl = `https://himalayas.app/jobs/api/search?${params}`;
    } else {
      const limit = Math.min(
        100,
        Math.max(1, Number(url.searchParams.get("limit")) || 40)
      );
      const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
      upstreamUrl = `https://himalayas.app/jobs/api?limit=${limit}&offset=${offset}`;
    }

    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: "Upstream error" }), {
        status: upstream.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
}
