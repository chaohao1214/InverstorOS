// Functions to call Ollama and iterate NDJSON chunks

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

export async function checkOllama() {
  // Quick health check
  const res = await fetch(`${OLLAMA_HOST}/api/version`);
  return res.ok;
}

/**
 * Stream tokens from Ollama as an async iterator of strings.
 * - Endpoint: /api/chat  (we pass messages and stream=true)
 * - Robust NDJSON parsing with buffering and final flush.
 * - Token extraction: evt.delta.content → evt.message.content (diff/full) → evt.response
 *
 * Params:
 *   url:        string   full URL, e.g. "http://127.0.0.1:11434/api/chat"
 *   model:      string
 *   messages:   Array<{role, content}>
 *   temperature:number   default 0.7
 *   signal?:    AbortSignal  (optional; lets caller cancel upstream fetch)
 */
export async function* streamOllama({
  url,
  model,
  messages,
  temperature = 0.7,
  signal, // optional; safe even if caller doesn't pass
}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: { temperature },
    }),
    signal, // pass abort signal if provided
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let emitted = "";

  const processLine = (lineRaw) => {
    const line = lineRaw.trim();
    if (!line) return;

    let evt;
    try {
      evt = JSON.parse(line);
    } catch (e) {
      console.log("[ollama][parse-error]", e?.message, "raw:", lineRaw);
      return;
    }

    if (evt.done) {
      console.log("[ollama] got done:true");
      return;
    }

    let tok;

    // 1) Preferred incremental shape
    if (typeof evt?.delta?.content === "string") {
      tok = evt.delta.content;
    }
    // 2) Some models stream message.content; could be full-so-far or single-token
    else if (typeof evt?.message?.content === "string") {
      const full = evt.message.content;
      const delta =
        emitted.length > 0 && full.startsWith(emitted)
          ? full.slice(emitted.length)
          : full;
      tok = delta;
    }
    // 3) /api/generate style (not used here, but keep compatibility)
    else if (typeof evt?.response === "string") {
      tok = evt.response;
    }

    if (tok !== undefined) {
      emitted += tok; // keep in sync for future diffs
      return tok; // DO NOT trim; first token can be a space
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    console.log(
      "[ollama][chunk]",
      value ? value.length : 0,
      "bytes",
      "done:",
      done
    );

    if (value) {
      buf += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const raw = buf.slice(0, idx);
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
        buf = buf.slice(idx + 1);

        const tok = processLine(line);
        if (tok !== undefined) {
          console.log("[ollama][yield]", JSON.stringify(tok));
          yield tok;
        }
      }
    }

    if (done) {
      const tail = decoder.decode();
      if (tail) buf += tail;

      if (buf.length > 0) {
        const tok = processLine(buf);
        if (tok !== undefined) yield tok;
        buf = "";
      }
      break;
    }
  }
}

/**
 * Build messages from (history + prompt).
 * History items should be { role: "user"|"assistant"|"system", content: string }.
 */
export function buildChatInputs({ history = [], prompt }) {
  const messages = []
    .concat(history || [])
    .filter((m) => m && m.role && m.content)
    .map((m) => ({ role: m.role, content: m.content }));
  messages.push({ role: "user", content: String(prompt ?? "") });

  // Kept for compatibility; not used by streamOllama
  const promptFromMessages =
    messages.map((m) => `${m.role}: ${m.content}`).join("\n") + "\nassistant:";

  return { messages, promptFromMessages };
}
