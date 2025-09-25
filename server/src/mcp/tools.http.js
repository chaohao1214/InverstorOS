// tools.http.js
// Unified outbound HTTP utilities for MCP:
// 1) httpFetch: generic HTTP(S) with allow-list
// 2) webSearchViaHttp: fetch HTML pages via httpFetch + extract title/body with JSDOM

import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// -------- Allow-list helpers --------
function parseAllowList() {
  const raw = process.env.MCP_ALLOWED_HOSTS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function hostAllowed(targetHost, allowList) {
  if (!targetHost) return false;
  const h = targetHost.toLowerCase();
  for (const allowed of allowList) {
    if (h === allowed) return true;
    if (h.endsWith("." + allowed)) return true; // allow subdomains
  }
  return false;
}

// -------- 1) Generic HTTP with allow-list --------
export async function httpFetch({
  url,
  method = "GET",
  headers = {},
  body,
} = {}) {
  if (!url) return { ok: false, error: "url_required" };

  const u = new URL(url);
  const allowList = parseAllowList();
  if (allowList.length > 0 && !hostAllowed(u.hostname, allowList)) {
    return { ok: false, error: `blocked_by_allowlist: ${u.hostname}` };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: typeof body === "object" ? JSON.stringify(body) : body,
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const isText =
      /application\/json|text\/|application\/xml|application\/xhtml\+xml/i.test(
        contentType
      );

    const text = isText ? await res.text() : undefined;
    let json;
    if (/application\/json/i.test(contentType)) {
      try {
        json = JSON.parse(text ?? "");
      } catch (_) {}
    }

    return {
      ok: true,
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      text,
      json,
    };
  } catch (e) {
    const aborted = e?.name === "AbortError";
    return { ok: false, error: aborted ? "timeout" : String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

// -------- 2) HTML fetch + extraction via httpFetch --------
export async function webSearchViaHttp({ urls = [] } = {}) {
  const items = [];
  const MAX_LEN = 3000;

  for (const pageUrl of urls.slice(0, 3)) {
    // Set UA/accept headers to improve compatibility
    const res = await httpFetch({
      url: pageUrl,
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok || (res.status && res.status >= 400)) {
      // Silently skip blocked/failed URLs to keep the function robust.
      continue;
    }

    const html = res.text || "";
    if (!html) {
      items.push({ url: pageUrl, title: "", text: "No extractable content." });
      continue;
    }

    // Parse & extract
    const dom = new JSDOM(html);
    const { document } = dom.window;

    const title = (document.title || "").trim();

    const pickText = (el) =>
      (el?.textContent || "")
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();

    let text = "";
    const main = document.querySelector("main");
    const article = document.querySelector("article");

    if (main) text = pickText(main);
    if (!text && article) text = pickText(article);
    if (!text) {
      const ps = Array.from(document.querySelectorAll("p"))
        .map((p) => p.textContent?.trim())
        .filter(Boolean);
      if (ps.length) text = ps.join("\n\n");
    }
    if (!text) text = pickText(document.body);

    if (!title && !text) text = "No extractable content.";
    if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN) + "…";

    items.push({ url: pageUrl, title, text });
  }

  return { items };
}
