import express from "express";
import { handleChat } from "../services/llm.js";
import { sseData, sseDone, sseOpen } from "../lib/sse.js";
import { buildChatInputs, checkOllama, streamOllama } from "../lib/ollama.js";

const router = express.Router();
// Configs
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/chat";

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

// Streaming endpoint (SSE)
router.post("/stream", async (req, res) => {
  const {
    prompt,
    model = "mistral:latest",
    temperature = 0.7,
    history = [],
  } = req.body;

  // Open SSE channel
  sseOpen(res);

  // 1) Health check
  try {
    const ok = await checkOllama();
    if (!ok) {
      sseData(res, {
        error: 'Ollama not running on 127.0.0.1:11434. Run "ollama serve".',
      });
      return sseDone(res);
    }
  } catch (error) {
    sseData(res, { error: error.message || "Ollama health check failed" });
    return sseDone(res);
  }

  // 2) Build inputs
  const { messages } = buildChatInputs({ history, prompt });

  // 3) Stream tokens from upstream -> SSE
  const ac = new AbortController();
  res.on("close", () => {
    console.log("[/api/chat/stream] client closed; abort upstream");
    ac.abort();
  });

  let seen = false;
  try {
    for await (const token of streamOllama({
      url: OLLAMA_URL,
      model,
      messages,
      temperature,
      signal: ac.signal,
    })) {
      seen = true;
      sseData(res, { token });
    }
  } catch (error) {
    sseData(res, { error: error.message || "Upstream error" });
  } finally {
    if (!seen)
      sseData(res, {
        error: "No tokens yielded (check delta/content parsing)",
      });
    sseDone(res);
  }
});

export default router;
