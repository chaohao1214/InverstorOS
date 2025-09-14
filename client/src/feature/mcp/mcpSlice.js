import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  error: null,
  queryResults: [],
  // Selected context snippets to inject into next chat turn
  contextSnippets: [],
  // Last operations
  lastPdfPath: "",
  lastQueryText: "",
  focusedSnippetId: null,
};

const mcpSlice = createSlice({
  name: "mcp",
  initialState,
  reducers: {
    mcpStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    mcpFailure(state, action) {
      state.isLoading = false;
      state.error = action.payload || "Unknown MCP error";
    },
    mcpSuccess(state) {
      state.isLoading = false;
      state.error = null;
    },
    setLastPdfPath(state, action) {
      state.lastPdfPath = action.payload || "";
    },
    setLastQueryText(state, action) {
      state.lastQueryText = action.payload || "";
    },
    setQueryResults(state, action) {
      const items = (action.payload || []).map((row) => ({
        id: row.id,
        text: row.text,
        metadata: row.metadata || {},
        distance: row.distance,
      }));
      state.queryResults = items;
    },
    setFocusedSnippetId(state, action) {
      state.focusedSnippetId = action.payload || null;
    },
    addContextSnippet(state, action) {
      const item = action.payload;
      const exists = state.contextSnippets.some((x) => x.id === item.id);
      if (!exists) state.contextSnippets.push(item);
    },
    removeContextSnippet(state, action) {
      const id = action.payload;
      state.contextSnippets = state.contextSnippets.filter((x) => x.id !== id);
    },
    clearContextSnippets(state) {
      state.contextSnippets = [];
    },
  },
});

export const {
  mcpStart,
  mcpFailure,
  mcpSuccess,
  setLastPdfPath,
  setLastQueryText,
  setQueryResults,
  setFocusedSnippetId,
  addContextSnippet,
  removeContextSnippet,
  clearContextSnippets,
} = mcpSlice.actions;

export default mcpSlice.reducer;
