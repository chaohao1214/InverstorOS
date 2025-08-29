import express from "express";
import { handleChat } from "../services/llm.js";
import { sseData, sseDone, sseOpen } from "../lib/sse.js";
import { buildChatInputs, checkOllama, streamOllama } from "../lib/ollama.js";

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

// Streaming endpoint (SSE)
router.post("stream", async (req, res) => {
  const {
    prompt,
    model = "mistral:instruct",
    temperature = 0.7,
    history = [],
  } = req.body;
  console.log("[/api/chat/stream] model:", model);

  sseOpen(res);

  // Abort on client disconnect
  let closed = false;
  req.on("close", () => {
    closed = true;
  });

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
  const { messages, promptFromMessages } = buildChatInputs({ history, prompt });

  // 3) Stream upstream -> SSE
  let seen = false;
  try {
    for await (const token of streamOllama({
      model,
      messages,
      promptFromMessages,
      temperature,
    })) {
      if (closed) break;
      seen = true;
      sseData(res, { token });
    }
  } catch (error) {
    sseData(res, { error: error.message || "Upstream error" });
  }

  // 4) End
  if (!seen) sseData(res, { error: "Empty response from upstream" });
  sseDone(res);
});

export default router;
