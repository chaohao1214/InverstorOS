export async function financeQuote({ symbol }) {
  if (!/^[A-Z.\-]{1,10}$/.test(symbol)) throw new Error("Bad symbol");
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=1d&interval=1m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YF ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta;
  const lastClose = meta?.previousClose;
  const regularMarketPrice = meta?.regularMarketPrice;
  const currency = meta?.currency || "USD";
  return {
    symbol,
    price: regularMarketPrice ?? lastClose,
    currency,
    exchange: meta?.exchangeName,
    ts: Date.now(),
  };
}
