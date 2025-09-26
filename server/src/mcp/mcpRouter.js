import express from "express";
import { httpFetch, webSearchViaHttp } from "./tools.http.js";
import { pdfParsePath } from "./tools.pdf.js";
import { vecQuery, vecUpsert } from "./tools.vector.js";
import { financeQuote } from "./tools.finance.js";
import { MCP_VERSION, SERVER_NAME, toolsCatalog } from "./mcp.toolsCatalog.js";

export const mcpRouter = express.Router();

function error(code, message, details) {
  return { ok: false, error: { code, message, details } };
}

function ok(data) {
  return { ok: true, data };
}

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
