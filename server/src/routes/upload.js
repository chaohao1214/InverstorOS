import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";

export const uploadRouter = express.Router();

const filesRoot = path.resolve(
  process.env.FILES_ROOT || path.join(process.cwd(), "data")
);
await fs.mkdir(filesRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, filesRoot),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({ storage });

uploadRouter.post("/", upload.array("files"), (req, res) => {
  const savedPath = req.files.path;
  const relativePath = "/" + path.relative(filesRoot, savedPath);
  res.json({ ok: true, filePath: relativePath });
});
