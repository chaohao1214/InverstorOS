const ALLOW = String(process.env.MCP_ALLOWED_HOSTS || "")
  .split(",")
  .map((string) => string.trim())
  .filter(Boolean);

function isAllowed(urlStr) {
  try {
    const url = new URL(urlStr);
    return ALLOW.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export async function httpFetch({ url, method = "GET", headers = {}, body }) {
  if (!isAllowed(url)) {
    throw new Error(`http.fetch blocked by whitelist: ${url}`);
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : undefined,
  });
  const text = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    headers: Object.fromEntries(res.headers),
    text,
  };
}
