import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "../feature/chat/chatSlice";
export const store = configureStore({
  reducer: {
    chat: chatReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});
