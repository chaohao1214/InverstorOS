import express from "express";
import { httpFetch, webSearchViaHttp } from "./tools.http.js";
import { pdfParsePath } from "./tools.pdf.js";
import { vecQuery, vecUpsert } from "./tools.vector.js";
import { financeQuote } from "./tools.finance.js";

export const mcpRouter = express.Router();

function error(code, message, details) {
  return { ok: false, error: { code, message, details } };
}

function ok(data) {
  return { ok: true, data };
}

// --- 1) MCP Server meta ---
const MCP_VERSION = "0.1.0";
const SERVER_NAME = "node-mcp-http";

// --- 2) Tool catalog (discovery) ---
// JSON-Schema kept minimal to stay lightweight; you can refine later.
const toolsCatalog = [
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
    },
    required: ["urls"],
  },
];

// --- 3) Very small validator (only checks required keys to keep file small)
function validateParams(schema, args) {
  if (!schema.required) return null;
  for (const key of schema.required) {
    if (!(key in (args || {}))) {
      return `Missing required parameter: "${key}"`;
    }
  }
  return null;
}

// --- 4) Tool dispatcher ---

async function dispatch(tool, args) {
  switch (tool) {
    case "finance.quote":
      return await financeQuote(args); // {symbol}
    case "http.fetch":
      return await httpFetch(args); // {url, method, headers, body}
    case "pdf.parse":
      return await pdfParsePath(args); // {filePath, splitByPages}
    case "vector.add":
      return await vecUpsert(args); // {documents: [{id,text,metadata?}]}
    case "vector.query":
      return await vecQuery(args); // {queryText, topK?}
    case "web.search":
      return await webSearchViaHttp(args); // {urls}
    default:
      throw { code: "UNKNOWN_TOOL", message: `No such tool: ${tool}` };
  }
}

// --- 5) Routes ---
mcpRouter.get("/health", (_req, res) => {
  res.json(ok({ name: SERVER_NAME, version: MCP_VERSION, now: Date.now() }));
});

mcpRouter.get("/tools", (_req, res) => {
  res.json(ok({ version: MCP_VERSION, tools: toolsCatalog }));
});

// Unified call
mcpRouter.post("/call", async (req, res) => {
  try {
    const { tool, arguments: args = {} } = req.body || {};

    if (!tool || typeof tool !== "string") {
      return res
        .status(400)
        .json(error("BAD_REQUEST", "Field 'tool' (string) is required."));
    }

    const spec = toolsCatalog.find((t) => t.name === tool);
    if (!spec) {
      return res
        .status(404)
        .json(error("UNKNOWN_TOOL", `Tool '${tool}' not found.`));
    }

    const validate = validateParams(spec.parameters, args);
    if (validate) {
      return res.status(400).json(
        error("BAD_ARGUMENTS", validate, {
          required: spec.parameters.required,
        })
      );
    }

    // Optional: timeout guard (lightweight)
    const timeoutMs = spec.timeout_ms ?? 10000;
    const resp = await Promise.race([
      dispatch(tool, args),
      new Promise((_, rej) =>
        setTimeout(
          () => rej({ code: "TIMEOUT", message: `Tool '${tool}' timed out` }),
          timeoutMs
        )
      ),
    ]);

    return res.json(ok({ tool, result: resp }));
  } catch (e) {
    const code = e.code || "Internal";
    const message = e.message || String(e);
    return res
      .status(code === "UNKNOWN_TOOL" ? 404 : 500)
      .json(error(code, message));
  }
});
