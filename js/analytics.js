/**
 * Load Cloudflare Web Analytics when RD_CF_ANALYTICS_TOKEN is set.
 * @see https://developers.cloudflare.com/analytics/web-analytics/
 */
(function () {
  var token = window.RD_CF_ANALYTICS_TOKEN;
  if (!token || typeof token !== "string" || !token.trim()) return;

  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: token.trim() }));
  document.body.appendChild(s);
})();
