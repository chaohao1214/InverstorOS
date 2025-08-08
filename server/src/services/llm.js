import dotenv from "dotenv";
import { axiosPost } from "../utils/request.js";
dotenv.config();

const provider = process.env.LLM_PROVIDER || "deepseek";

export async function handleChat(prompt) {
  switch (provider) {
    case "deepseek":
      return await callDeepSeek(prompt);
    case "gemini":
      return await callGemini(prompt);
    case "openrouter":
      return await callOpenRouter(prompt);
    case "ollama":
      return await callOllama(prompt);
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
  }
}

async function callDeepSeek(prompt) {
  const url = "https://api.deepseek.com/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  };

  const body = {
    model: "deepseek-chat",
    message: [{ role: "user", content: prompt }],
  };

  const res = await axiosPost(url, body, headers);
  return res.choices?.[0]?.message?.content || "(No response)";
}

// ✅ Gemini Pro (Google Cloud)
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const res = await axiosPost(url, body);
  return res.candidates?.[0]?.content?.parts?.[0]?.text || "(No response)";
}

async function callOpenRouter(prompt) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://investoros.chat",
    "X-Title": "InvestorOS",
  };

  const body = {
    model: "mistral-7b",
    messages: [{ role: "user", content: prompt }],
  };

  const res = await axiosPost(url, body, headers);
  return res.choices?.[0]?.message?.content || "(No response)";
}

async function callOllama(prompt) {
  const url = "http://localhost:11434/api/generate";
  const body = {
    model: "llama2", // 或 mistral / qwen
    prompt,
    stream: false,
  };

  const res = await axiosPost(url, body);
  return res.response || "(No response)";
}
