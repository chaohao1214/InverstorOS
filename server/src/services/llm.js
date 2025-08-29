import dotenv from "dotenv";
import { axiosPost } from "../utils/request.js";
dotenv.config();

const provider = process.env.LLM_PROVIDER;

export async function handleChat(prompt, history = [], options = {}) {
  console.log("[llm] provider:", provider);
  switch (provider) {
    case "deepseek":
      return callDeepSeek(prompt, history, options);
    case "gemini":
      return callGemini(prompt, history, options);
    case "openrouter":
      return callOpenRouter(prompt, history, options);
    case "ollama":
      return callOllama(prompt, history, options);
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
  }
}

/* ----------------------------- DeepSeek (OpenAI-compatible) ----------------------------- */
async function callDeepSeek(prompt, history = [], options = {}) {
  const url = "https://api.deepseek.com/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  };
  console.log("[llm] call: deepseek", url);
  // Map simple history to OpenAI-style messages
  const messages = [
    ...mapHistoryToMessages(history),
    { role: "user", content: prompt },
  ];

  const body = {
    model: "deepseek-chat",
    messages, // <-- MUST be plural "messages"
    temperature: options.temperature ?? 0.7,
    stream: false,
  };

  const res = await axiosPost(url, body, headers);
  return res?.choices?.[0]?.message?.content || "(No response)";
}

/* ------------------------------------ Gemini (REST) ------------------------------------ */
async function callGemini(prompt, history = [], options = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  // Gemini uses "contents/parts" instead of "messages"
  const contents = [
    ...mapHistoryToGemini(history),
    { parts: [{ text: prompt }] },
  ];

  const body = {
    contents,
    generationConfig: { temperature: options.temperature ?? 0.7 },
  };
  const res = await axiosPost(url, body);
  return res?.candidates?.[0]?.content?.parts?.[0]?.text || "(No response)";
}

/* ------------------------------- OpenRouter (OpenAI-compatible) ------------------------------- */
async function callOpenRouter(prompt, history = [], options = {}) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "InvestorOS",
  };

  const body = {
    model: options.model || "openrouter/mistral-7b-instruct:free",
    messages: [
      ...mapHistoryToMessages(history),
      { role: "user", content: prompt },
    ],
    temperature: options.temperature ?? 0.7,
    stream: false,
  };
  const res = await axiosPost(url, body, headers);
  return res?.choices?.[0]?.message?.content || "(No response)";
}

/* -------------------------------------- Ollama (local) -------------------------------------- */
async function callOllama(prompt, history = [], options = {}) {
  const url = "http://localhost:11434/api/chat";

  const messages = [
    ...history
      .filter((message) => message?.role && message?.content)
      .map((message) => ({ role: message.role, content: message.content })),
    { role: "user", content: prompt },
  ];

  const body = {
    model: options.model || "gpt-oss:20b",
    messages,
    stream: false,
    options: { temperature: options.temperature ?? 0.7 },
  };

  const res = await axiosPost(url, body);
  return res?.message?.content || "(No response)";
}

/* ----------------------------------- Helpers / Mappers ----------------------------------- */
// Convert [{role:'user'|'assistant', content:'...'}] -> OpenAI messages (already the same)
function mapHistoryToMessages(history = []) {
  return history
    .filter((message) => message?.role && message?.content)
    .map((msg) => ({ role: msg.role, content: msg.content }));
}

// Convert history to Gemini "contents"
function mapHistoryToGemini(history = []) {
  return history
    .filter((message) => message?.role && message?.content)
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
}
