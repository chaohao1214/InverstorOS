import fetch from "node-fetch";

export async function financeQuote({ symbol }) {
  const normalizedSymbol = String(symbol || "")
    .trim()
    .toUpperCase();
  if (!normalizedSymbol) {
    return { ok: false, error: "symbol_required" };
  }

  const alphaVantageApiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!alphaVantageApiKey) {
    return { ok: false, error: "ALPHAVANTAGE_API_KEY_missing" };
  }

  try {
    const requestUrl =
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE` +
      `&symbol=${encodeURIComponent(normalizedSymbol)}` +
      `&apikey=${alphaVantageApiKey}`;

    const httpResponse = await fetch(requestUrl);
    if (!httpResponse.ok) {
      return { ok: false, error: `http_${httpResponse.status}` };
    }

    const payloadJson = await httpResponse.json();

    // 处理 Alpha Vantage 特有的错误字段
    if (payloadJson?.Note) {
      return { ok: false, error: "rate_limit", raw: payloadJson.Note };
    }
    if (payloadJson?.["Error Message"]) {
      return {
        ok: false,
        error: "bad_symbol",
        raw: payloadJson["Error Message"],
      };
    }

    const globalQuote = payloadJson?.["Global Quote"] || {};
    const priceString = globalQuote["05. price"];
    if (!priceString) {
      return { ok: false, error: "no_price_found", raw: payloadJson };
    }

    const result = {
      provider: "alphavantage",
      symbol: globalQuote["01. symbol"] || normalizedSymbol,
      price: parseFloat(globalQuote["05. price"]),
      open: parseFloat(globalQuote["02. open"]),
      high: parseFloat(globalQuote["03. high"]),
      low: parseFloat(globalQuote["04. low"]),
      volume: parseInt(globalQuote["06. volume"], 10),
      latestTradingDay: globalQuote["07. latest trading day"] || null,
    };

    return { ok: true, data: result };
  } catch (caughtError) {
    return { ok: false, error: String(caughtError?.message || caughtError) };
  }
}
