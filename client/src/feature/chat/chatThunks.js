import { streamChat } from "../../utils/streamChat";
import { fetchQuote, fetchWebSummaries } from "../mcp/mcpThunks";
import {
  appendMessage,
  cancelStreaming,
  receiveToken,
  startStreaming,
  streamingDone,
  streamingError,
  trimHistory,
} from "./chatSlice";

/**
 * Build a one-shot "system context" string from MCP snippets.
 * It stays on the client side; we prepend it into prompt for the backend that only accepts {prompt}.
 */

function buildSystemContextFromSnippets(snippets = []) {
  if (!Array.isArray(snippets) || snippets.length === 0) return null;
  const lines = snippets.map((snip, idx) => {
    const src = snip?.metadata?.source || "document";
    const page = snip?.metadata?.page != null ? `p.${snip.metadata.page}` : "";
    return `[${idx + 1}] ${snip.text}\n- source: ${src}${page}`;
  });

  return [
    "You are a financial analyst.",
    "Use ONLY the following context when relevant. Cite with [index] like [1], [2] etc.",
    "<<CONTEXT>>",
    lines.join("\n\n"),
    "<</CONTEXT>>",
  ].join("\n");
}

/**
 * Merge multiple context blocks into one.
 */
function mergeContextBlocks(...blocks) {
  const nonEmpty = blocks.filter(Boolean);
  return nonEmpty.length ? nonEmpty.join("\n\n---\n\n") : null;
}

/**
 * Merge the system context block and the user question into a single prompt string.
 * Keeps backend unchanged (still {prompt, model, temperature}).
 */
function buildAugmentedPrompt(userText, contextBlock) {
  if (!contextBlock) return userText;
  return `${contextBlock}\n\nUSER QUESTION:\n${userText}`;
}

/**
 * Optionally build a market-quote context if the user asks for today's price.
 * Very light heuristic to avoid aggressive browsing.
 */
async function maybeBuildQuoteContext(userText) {
  const symbolMatch = userText.match(/\b([A-Z]{1,5})(?:\.[A-Z])?\b/);
  const wantsPrice = /(股价|价格|price|today)/i.test(userText);
  if (!symbolMatch || !wantsPrice) return null;

  try {
    const quote = await fetchQuote(symbolMatch[1]);
    if (!quote || typeof quote.price !== "number") return null;

    return `Market data [${quote.symbol}]: ${quote.price} (open=${quote.open}, high=${quote.high}, low=${quote.low}, tradingDay=${quote.latestTradingDay})`;
  } catch {
    return null;
  }
}

/**
 * Optionally build a web context if the user explicitly asks to browse.
 * Protocol: user types e.g. "web: https://a.com https://b.com" or "搜索: https://...".
 * We only accept explicit URLs for safety. Later you can expand to real search APIs.
 */
async function maybeBuildWebContext(userText) {
  const explicit =
    userText.match(/^web:\s*(.+)$/i) ||
    userText.match(/^(?:搜索|search)[:：]\s*(.+)$/i);
  if (!explicit) return null;

  const tail = explicit[1];
  const tokens = tail.split(/\s+/).filter(Boolean);
  const urls = tokens.filter((text) => /^http?:\/\//i.test(text)).slice(0, 3);
  if (urls.length === 0) return null;

  try {
    const items = await fetchWebSummaries(urls);
    if (!Array.isArray(items) || items.length === 0) return null;
    const lines = items.map(
      (it, idx) =>
        `[W${idx + 1}] ${it.url}\n${String(it.text || "").slice(0, 600)}`
    );
    return `Web findings (external context):\n${lines.join("\n\n")}`;
  } catch {
    return null;
  }
}

export const sendPromtStream = (promptText) => async (dispatch, getState) => {
  const userText = (promptText || "").trim();
  if (!userText) return;

  const state = getState();
  const { chat, mcp } = state;
  // 1) Show user's message immediately (fix: use "content", not "context")
  dispatch(appendMessage({ role: "user", content: userText }));

  // 2) Build one-shot system context from MCP selected snippets (if any)
  const contextBlock = buildSystemContextFromSnippets(
    mcp?.contextSnippets || []
  );
  // NEW: Optional tool-driven contexts (market quote / web URLs)
  const quoteContext = await maybeBuildQuoteContext(userText);
  const webContext = await maybeBuildWebContext(userText);

  //merge all context blocks
  const mergedContext = mergeContextBlocks(
    contextBlock,
    quoteContext,
    webContext
  );

  const augmentedPrompt = buildAugmentedPrompt(userText, mergedContext);
  // 3) Ensure only one active stream
  dispatch(cancelStreaming());

  const ac = new AbortController();
  dispatch(startStreaming(ac));
  dispatch(trimHistory(30)); // keep last 30 messages by default

  // 4)create an empty assistant message holder (so tokens can append)
  dispatch(appendMessage({ role: "assistant", content: "" }));

  try {
    await streamChat({
      prompt: augmentedPrompt,
      model: chat.currentModel || "mistral:latest",
      temperature: chat.temperature ?? 0.7,
      signal: ac.signal,
      onStart: () => {},
      onToken: (token) => {
        dispatch(receiveToken(token));
      },
      onDone: () => {
        dispatch(streamingDone());
      },
    });
  } catch (error) {
    dispatch(
      streamingError({
        code: "NETWORK",
        message: String(error?.message || error),
      })
    );
  }
};

export const stopStreaming = () => (dispatch) => {
  dispatch(cancelStreaming());
};
