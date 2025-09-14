import {
  mcpFailure,
  mcpStart,
  mcpSuccess,
  setLastPdfPath,
  setLastQueryText,
  setQueryResults,
} from "./mcpSlice";

// post mcp helper
async function postMcp(name, args) {
  const resp = await fetch("/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, args }),
  });
  if (!resp.ok) throw new Error(`MCP HTTP ${resp.status}`);
  const json = await resp.json();
  if (!json.ok) throw new Error(json.error || "MCP error");
  return json.data;
}

/**
 * Parse a local PDF path on server and upsert into Chroma.
 * @param {string} filePath - absolute/valid path on server
 */

export const parsePdfAndUpsert = (filePath) => async (dispatch) => {
  if (!filePath || typeof filePath !== "string") return;
  dispatch(mcpStart());
  try {
    dispatch(setLastPdfPath(filePath));

    // 1) parse pdf to pages
    const parsed = await postMcp("pdf.parse", { filePath, splitByPages: true });
    const pages = parsed.pages || [];

    // 2) build docs and upsert
    const documents = pages.map((page) => ({
      id: `${filePath}#p${page.page}`,
      text: page.text,
      metadata: { source: filePath, page: page.page },
    }));

    if (documents.length > 0) {
      await postMcp("vec.upsert", { documents });
    }
    dispatch(mcpSuccess());
    return { pagesCount: documents.length };
  } catch (error) {
    dispatch(mcpFailure(error?.message || error));
  }
};

/**
 * Query vector store by text.
 * @param {string} queryText
 * @param {number} topK
 */

export const querySimilar =
  (queryText, topK = 4) =>
  async (dispatch) => {
    if (!queryText || typeof queryText !== "string") return;
    dispatch(mcpStart());
    try {
      dispatch(setLastQueryText(queryText));
      const data = await postMcp("vec.query", { queryText, topK });

      // Normalize result rows
      const rows = (data.ids || []).map((id, idx) => ({
        id,
        text: (data.documents || [])[idx] || "",
        metadata: (data.metadatas || [])[idx] || {},
        distance: (data.distances || [])[idx],
      }));

      dispatch(setQueryResults(rows));
      dispatch(mcpSuccess());
    } catch (error) {
      dispatch(mcpFailure(error?.message || error));
    }
  };

/**
 * Fetch market quote via MCP tool "finance.quote".
 * @param {string} symbol - Ticker symbol, e.g. "AAPL"
 * @returns {Promise<{symbol:string, price:number, currency:string, exchange:string, ts:number}>}
 */

export async function fetchQuote(symbol) {
  if (!symbol || typeof symbol !== "string") throw new Error("symbol required");
  return await postMcp("finance.quote", { symbol });
}

/**
 * Fetch web summaries via MCP tool "web.search".
 * @param {string[]} urlList - Explicit URLs to fetch and summarize
 * @returns {Promise<Array<{url:string, text:string}>>}
 */

export async function fetchWebSummaries(urlList) {
  const data = await postMcp("web.search", {
    urls: Array.isArray(urlList) ? urlList : [],
  });
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map((item) => ({ url: item.url, text: item.text || "" }));
}
