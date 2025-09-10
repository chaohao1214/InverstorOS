import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./src/routes/chat.js";
import { mcpRouter } from "./src/mcp/mcpRouter.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

//routes
app.use("/api/chat", chatRoutes);
app.use("/mcp", mcpRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
