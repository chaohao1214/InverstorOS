import express from "express";
import path from "node:path";
import fs from "node:fs/promises";

export const filesRouter = express.Router();
const filesRoot = process.env.FILES_ROOT || "/data";

filesRouter.get("/", async (req, res) => {
  const requested = String(req.query.path || "");
  const abs = path.resolve(
    filesRoot,
    "." + path.sep + requested.replace(/^\/+/, "")
  );
  if (!abs.startsWith(path.resolve(filesRoot)))
    return res.status(403).send("Forbidden");
  try {
    await fs.access(abs);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.sendFile(abs);
  } catch (error) {
    res.status(404).send("Not found");
  }
});
