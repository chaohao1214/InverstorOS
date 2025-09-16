import express from "express";
import { httpFetch } from "./tools.http.js";
import { pdfParsePath } from "./tools.pdf.js";
import { vecQuery, vecUpsert } from "./tools.vector.js";
import { financeQuote } from "./tools.finance.js";
import { webSearch } from "./tools.web.js";

export const mcpRouter = express.Router();

//helper: promise timeout
function withTimeout(promise, ms, label = "tool") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}`)), ms)
    ),
  ]);
}

mcpRouter.post("/", async (req, res) => {
  const { name, args = {} } = req.body || {};

  if (!name) {
    return res.status(400).json({ ok: false, error: "Missing 'name' field" });
  }

  console.log("[/mcp] name=", name, "argsKeys=", Object.keys(args || {}));
  try {
    let data;
    switch (name) {
      case "http.fetch":
        data = await httpFetch(args);
        break;
      case "pdf.parse":
        data = await pdfParsePath(args);
        break;
      case "vec.upsert":
        data = await vecUpsert(args);
        break;
      case "vec.query":
        data = await vecQuery(args);
        break;
      case "finance.quote":
        data = await withTimeout(financeQuote(args), 8000, "finance.quote");
        break;
      case "web.search":
        data = await withTimeout(webSearch(args), 10000, "web.search");
        break;
      default:
        return res
          .status(400)
          .json({ ok: false, error: `Unknown tool: ${name}` });
    }
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
});
