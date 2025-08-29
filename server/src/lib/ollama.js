// Functions to call Ollama and iterate NDJSON chunks

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

export async function checkOllama() {
  // Quick health check
  const res = await fetch(`${OLLAMA_HOST}/api/version`);
  return res.ok;
}

/**
 * Stream tokens from Ollama as an async iterator of strings.
 * - Chooses /api/chat vs /api/generate by model prefix.
 * - Normalizes delta from {message.content} or {response} or {delta.content}.
 */

export async function* streamOllama({
  model,
  messages,
  promptFromMessages,
  temperature = 0.7,
}) {
  const isGPTOss = /^gpt-oss/i.test(model);
  const url = isGPTOss
    ? `${OLLAMA_HOST}/api/generate`
    : `${OLLAMA_HOST}/api/chat`;

  const body = isGPTOss
    ? {
        model,
        prompt: promptFromMessages,
        stream: true,
        options: { temperature },
      }
    : { model, messages, stream: true, options: { temperature } };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const txt = await resp.text().catch(() => "");
    throw new Error(txt || `Upstream HTTP ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      let tok = "";
      try {
        const evt = JSON.parse(line);
        if (evt?.error) throw new Error(String(evt.error));

        // Normalize token field; hide any 'thinking'
        if (evt?.messages?.content) tok = evt.messages.content; // /api/chat
        else if (typeof evt?.response === "string")
          tok = evt.response; // /api/generate
        else if (evt?.delta?.content) tok = evt.delta.content; // delta

        if (tok) yield tok;
        if (evt?.done) return; // upstream finished
      } catch {}
    }
  }
}

/**
 * Utility to build messages + promptFromMessages from (history + prompt)
 */
export function buildChatInputs({ history = [], prompt }) {
  const messages = []
    .concat(history || [])
    .filter((m) => m && m.role && m.content)
    .map((m) => ({ role: m.role, content: m.content }));
  messages.push({ role: "user", content: String(prompt ?? "") });

  const promptFromMessages =
    messages.map((m) => `${m.role}: ${m.content}`).join("\n") + "\nassistant:";

  return { messages, promptFromMessages };
}
