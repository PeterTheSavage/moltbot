import http from "node:http";
import https from "node:https";
import url from "node:url";

const PORT = 18791;

const server = http.createServer((req, res) => {
  // CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
    return;
  }

  const parsed = url.parse(req.url, true);
  const targetUrl = parsed.query.url;
  const apiKey = parsed.query.key;

  if (!targetUrl) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing ?url= parameter" }));
    return;
  }

  function fetchFollowRedirects(href, hdrs, maxRedirects, cb) {
    const target = new URL(href);
    const mod = target.protocol === "https:" ? https : http;
    const r = mod.get(target.href, { headers: hdrs }, (proxyRes) => {
      if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location && maxRedirects > 0) {
        const next = new URL(proxyRes.headers.location, target).href;
        proxyRes.resume();
        fetchFollowRedirects(next, hdrs, maxRedirects - 1, cb);
        return;
      }
      let body = "";
      proxyRes.on("data", (chunk) => { body += chunk; });
      proxyRes.on("end", () => cb(null, proxyRes.statusCode, body));
    });
    r.on("error", (e) => cb(e));
    r.setTimeout(15000, () => { r.destroy(); cb(new Error("timeout")); });
  }

  try {
    const headers = { "Accept": "application/json" };
    if (apiKey) headers["Authorization"] = "Bearer " + apiKey;

    fetchFollowRedirects(targetUrl, headers, 5, (err, status, body) => {
      if (err) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Proxy fetch failed: " + err.message }));
        return;
      }
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(body);
    });
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid URL: " + e.message }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Discover proxy listening on http://0.0.0.0:" + PORT);
});
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log("Port " + PORT + " already in use, proxy may already be running");
    process.exit(0);
  }
  console.error("Proxy server error:", e);
});
