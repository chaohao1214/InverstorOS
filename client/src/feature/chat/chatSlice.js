import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hi! I’m your InvestorOS assistant. How can I help?",
      createdAt: Date.now(),
    },
  ],
  isStreaming: false,
  error: null,
  abortController: null, // keep here; serializableCheck disabled in store
  model: "mistral:latest",
  temperature: 0.7,
  lastHeartbeatAt: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    appendMessage(state, action) {
      state.messages.push({
        ...action.payload,
        id: action.payload.id ?? crypto.randomUUID(),
        createdAt: action.payload.createdAt ?? Date.now(),
      });
    },
    startStreaming(state, action) {
      state.isStreaming = true;
      state.error = null;
      state.abortController = action.payload; // AbortController
    },
    receiveToken(state, action) {
      const token = action.payload;
      const last = state.messages[state.messages.length - 1];
      if (!last || last.role !== "assistant") {
        state.messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: token,
          createdAt: Date.now(),
        });
      } else {
        last.content += token;
      }
    },
    streamingDone(state) {
      state.isStreaming = false;
      state.abortController = null;
    },
    streamingError(state, action) {
      state.isStreaming = false;
      state.error = action.payload || {
        code: "GEN_FAIL",
        messages: "Unknown error",
      };
      state.abortController = null;
    },
    cancelStreaming(state) {
      try {
        state.abortController?.abort();
      } catch {}
      state.abortController = null;
      state.isStreaming = false;
    },
    updateHeartbeat(state) {
      state.lastHeartbeatAt = Date.now();
    },
    resetConversation(state) {
      state.messages = [];
      state.isStreaming = false;
      state.error = null;
      state.abortController = null;
    },
    setModel(state, action) {
      state.currentModel = action.payload;
    },
    setTemperature(state, action) {
      state.temperature = action.payload;
    },
    trimHistory(state, action) {
      const keep = action.payload ?? 30;
      if (state.messages.length > keep) {
        state.messages = state.messages.slice(-keep);
      }
    },
  },
});

export const {
  appendMessage,
  startStreaming,
  receiveToken,
  streamingDone,
  streamingError,
  cancelStreaming,
  updateHeartbeat,
  resetConversation,
  setModel,
  setTemperature,
  trimHistory,
} = chatSlice.actions;

export default chatSlice.reducer;
