import fetch from "node-fetch";

export async function financeQuote({ symbol }) {
  if (!symbol) return { ok: false, error: "symbol_required" };

  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) {
    return { ok: false, error: "ALPHAVANTAGE_API_KEY_missing" };
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
      symbol
    )}&apikey=${key}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`http_${r.status}`);
    const j = await r.json();
    const q = j?.["Global Quote"] || {};
    if (!q["05. price"]) {
      return { ok: false, error: "no_price_found", raw: j };
    }
    return {
      ok: true,
      data: {
        provider: "alphavantage",
        symbol: q["01. symbol"],
        price: parseFloat(q["05. price"]),
        open: parseFloat(q["02. open"]),
        high: parseFloat(q["03. high"]),
        low: parseFloat(q["04. low"]),
        volume: parseInt(q["06. volume"], 10),
      },
    };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}
