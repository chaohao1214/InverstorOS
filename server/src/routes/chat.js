import express from "express";
import { handleChat } from "../services/llm.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt } = req.body;
  console.log("[/api/chat] prompt:", prompt);
  try {
    const result = await handleChat(prompt);
    res.json({ response: result });
  } catch (error) {
    console.error("[Chat Error]", error.message);
    res.status(500).json({ error: error.message || "LLM service failed" });
  }
});

export default router;
