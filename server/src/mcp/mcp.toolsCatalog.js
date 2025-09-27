// --- 1) MCP Server meta ---
export const MCP_VERSION = "0.1.0";
export const SERVER_NAME = "node-mcp-http";

// --- 2) Tool catalog (discovery) ---
// JSON-Schema kept minimal to stay lightweight; you can refine later.
export const toolsCatalog = [
  {
    name: "finance.quote",
    description:
      "Fetch a real-time/near-real-time quote for an equity/ETF/crypto symbol.",
    timeout_ms: 8000,
    parameters: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Ticker symbol, e.g., AAPL or BTC-USD",
        },
      },
      required: ["symbol"],
    },
  },

  {
    name: "http.fetch",
    description: "HTTP(S) fetch with host allow-list.",
    timeout_ms: 10000,
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Full URL (must be in allow list)",
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          default: "GET",
        },
        headers: { type: "object", additionalProperties: { type: "string" } },
        body: { oneOf: [{ type: "string" }, { type: "object" }] },
      },
      required: ["url"],
    },
  },
  {
    name: "pdf.parse",
    description:
      "Parse a local PDF into plain text; optionally split per page.",
    timeout_ms: 15000,
    parameters: {
      type: "object",
      properties: {
        filePath: { type: "string" },
        splitByPages: { type: "boolean", default: true },
      },
      required: ["filePath"],
    },
  },
  {
    name: "vector.add",
    description:
      "Upsert documents (and/or embeddings) into a Chroma collection.",
    timeout_ms: 10000,
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string" },
        ids: { type: "array", items: { type: "string" } },
        documents: { type: "array", items: { type: "string" } },
        metadatas: { type: "array", items: { type: "object" } },
        embeddings: {
          type: "array",
          items: { type: "array", items: { type: "number" } },
        }, // optional
      },
      required: ["documents"],
    },
  },
  {
    name: "vector.query",
    description:
      "Semantic query in a Chroma collection (requires embeddings server-side or client-provided).",
    timeout_ms: 10000,
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string" },
        queryTexts: { type: "array", items: { type: "string" } },
        nResults: { type: "number", default: 5 },
        where: { type: "object" },
      },
      required: ["collection", "queryTexts"],
    },
  },
  {
    name: "web.search",
    description: "Fetch and extract main content from up to 3 webpages.",
    timeout_ms: 10000,
    parameters: {
      type: "object",
      properties: {
        urls: { type: "array", maxItems: 3, items: { type: "string" } },
      },
      required: ["urls"],
    },
  },
];
