import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "../feature/chat/chatSlice";
import mcpReducer from "../feature/mcp/mcpSlice";
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    mcp: mcpReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});
