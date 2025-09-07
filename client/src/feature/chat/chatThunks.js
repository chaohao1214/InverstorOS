import { streamChat } from "../../utils/streamChat";
import {
  appendMessage,
  cancelStreaming,
  receiveToken,
  startStreaming,
  streamingDone,
  streamingError,
  trimHistory,
} from "./chatSlice";

export const sendPromtStream = (promptText) => async (dispatch, getState) => {
  const text = (promptText || "").trim();
  if (!text) return;

  // push user message
  dispatch(appendMessage({ role: "user", context: text }));

  // ensure only one active stream
  dispatch(cancelStreaming());

  const ac = new AbortController();
  dispatch(startStreaming(ac));
  dispatch(trimHistory(30)); // keep last 30 messages by default

  // create an empty assistant message holder (so tokens can append)
  dispatch(appendMessage({ role: "assistant", content: "" }));

  const { chat } = getState();
  try {
    await streamChat({
      prompt: text,
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
        messages: String(error?.message || error),
      })
    );
  }
};

export const stopStreaming = () => (dispatch) => {
  dispatch(cancelStreaming());
};
