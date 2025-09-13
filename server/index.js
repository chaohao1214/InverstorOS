import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./src/routes/chat.js";
import { mcpRouter } from "./src/mcp/mcpRouter.js";
import { uploadRouter } from "./src/routes/upload.js";
import { filesRouter } from "./src/routes/files.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

//routes
app.use("/api/chat", chatRoutes);
app.use("/mcp", mcpRouter);
app.use("/upload", uploadRouter);
app.use("/files", filesRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
