import http from "node:http";
import https from "node:https";

const PORT = 18791;
const MAX_BODY = 10 * 1024 * 1024; // 10MB
const RATE_WINDOW = 10000; // 10s
const RATE_LIMIT = 20;
const rateLog = [];

function checkRate() {
  const now = Date.now();
  while (rateLog.length > 0 && rateLog[0] < now - RATE_WINDOW) {
    rateLog.shift();
  }
  if (rateLog.length >= RATE_LIMIT) {
    return false;
  }
  rateLog.push(now);
  return true;
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

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

  if (!checkRate()) {
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Rate limit exceeded, try again in a few seconds" }));
    return;
  }

  let parsed;
  try {
    parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid request URL" }));
    return;
  }
  const targetUrl = parsed.searchParams.get("url");
  const apiKey = parsed.searchParams.get("key");

  if (!targetUrl) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing ?url= parameter" }));
    return;
  }

  function fetchFollowRedirects(href, hdrs, maxRedirects, cb) {
    let target;
    try {
      target = new URL(href);
    } catch {
      return cb(new Error("Invalid target URL: " + href));
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return cb(new Error("Unsupported protocol: " + target.protocol));
    }
    const mod = target.protocol === "https:" ? https : http;
    const r = mod.get(target.href, { headers: hdrs }, (proxyRes) => {
      if (
        [301, 302, 303, 307, 308].includes(proxyRes.statusCode) &&
        proxyRes.headers.location &&
        maxRedirects > 0
      ) {
        const next = new URL(proxyRes.headers.location, target).href;
        proxyRes.resume();
        fetchFollowRedirects(next, hdrs, maxRedirects - 1, cb);
        return;
      }
      let body = "",
        size = 0;
      proxyRes.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_BODY) {
          r.destroy();
          cb(new Error("Response too large (>10MB)"));
          return;
        }
        body += chunk;
      });
      proxyRes.on("end", () => cb(null, proxyRes.statusCode, body));
    });
    r.on("error", (e) => cb(e));
    r.setTimeout(15000, () => {
      r.destroy();
      cb(new Error("Request timed out (15s)"));
    });
  }

  try {
    const headers = { Accept: "application/json" };
    if (apiKey) {
      headers["Authorization"] = "Bearer " + apiKey;
    }

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
