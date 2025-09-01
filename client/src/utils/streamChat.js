export async function streamChat({
  prompt,
  model,
  temperature,
  onToken,
  onStart, // optional
  onDone, // optional
  signal, // AbortSignal
}) {
  // POST to SSE endpoint and incrementally parse "data:" lines.
  const resp = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, temperature }),
    signal,
  });

  if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  onStart?.();

  const processLine = (raw) => {
    // Trim only CR; keep leading space in tokens intact
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    if (!line) return;
    if (line[0] === ":") return; // comment / heartbeat (e.g., ": ping")
    if (line.startsWith("events:")) {
      if (line.includes("done")) onDone?.();
      return;
    }
    if (!line.startsWith("data:")) return;
    const payloadRaw = line.slice(5).trimStart();
    if (!payloadRaw) return;

    let payload;
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      return;
    }

    if (payload.error) {
      // surface server-side error immediately
      throw new Error(payload.error);
    }
    if (typeof payload.token === "string") {
      onToken?.(payload.token);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    if (value) {
      buffer += decoder.decode(value, { stream: true });
      let idx;

      while ((idx = buffer.indexOf("\n")) >= 0) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        processLine(raw);
      }
    }
    if (done) {
      // Flush trailing decoder buffer (multi-byte safety)
      const tail = decoder.decode();
      if (tail) buffer += tail;
      if (buffer) processLine(buffer);
      onDone?.();
      break;
    }
  }
}
