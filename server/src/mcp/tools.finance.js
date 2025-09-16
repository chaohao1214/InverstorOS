export async function financeQuote({ symbol }) {
  if (!/^[A-Z.\-]{1,10}$/.test(symbol)) throw new Error("Bad symbol");
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=1d&interval=1m`;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const json = await res.json();
    const r = json?.chart?.result?.[0];
    const meta = r?.meta || {};
    return {
      symbol,
      price: meta.regularMarketPrice ?? meta.previousClose,
      currency: meta.currency || "USD",
      exchange: meta.exchangeName || "",
      ts: Date.now(),
    };
  } catch (e) {
    // e.name === 'AbortError' -> timeout
    throw new Error(e.name === "AbortError" ? "timeout" : e.message);
  } finally {
    clearTimeout(t);
  }
}
