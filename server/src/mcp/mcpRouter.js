import express from "express";
import { httpFetch } from "./tools.http.js";
import { pdfParsePath } from "./tools.pdf.js";
import { vecQuery, vecUpsert } from "./tools.vector.js";
import { financeQuote } from "./tools.finance.js";
import { webSearch } from "./tools.web.js";

export const mcpRouter = express.Router();

mcpRouter.post("/", async (req, res) => {
  const { name, args = {} } = req.body || {};
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
        data = await financeQuote(args);
        break;
      case "web.search":
        data = await webSearch(args);
        break;
      default:
        return res
          .status(400)
          .json({ ok: false, error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
});
