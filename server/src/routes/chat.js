import express from "express";
import { handleChat } from "../services/llm.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await handleChat(prompt);
    res.json({ response: result });
  } catch (error) {
    console.error("[Chat Error]", err.message);
    res.status(500).json({ error: "LLM service failed" });
  }
});

export default router;
