// Minimal SSE helpers used by routes

export function sseOpen(res) {
  // Standard SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  // Send an initial comment to establish the stream
  res.write(": ping\n\n");
  res.flush?.();
}

export function sseData(res, obj) {
  // Write one SSE data frame
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
  res.flush?.();
}

export function sseDone(res) {
  // Signal end of stream
  res.write("event: done\ndata: [DONE]\n\n");
  res.end();
}
