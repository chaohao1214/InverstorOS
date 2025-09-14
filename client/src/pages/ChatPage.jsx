import { Box, Container, Paper } from "@mui/material";
import TopBar from "../components/TopBar";
import MessageList from "../components/MessageList";
import Composer from "../components/Composer";
import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendPromtStream, stopStreaming } from "../feature/chat/chatThunks";
import { resetConversation } from "../feature/chat/chatSlice";
import McpPanel from "../components/McpPanel";
const ChatPage = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat?.messages);
  const loading = useSelector((state) => state.chat?.isStreaming);

  // Keep an AbortController for the active stream request
  const abortRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Clean up any in-flight stream when component unmounts
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const onSend = useCallback(
    (text) => dispatch(sendPromtStream(text)),
    [dispatch]
  );

  const onStop = useCallback(() => {
    dispatch(stopStreaming());
  }, [dispatch]);

  const onClear = useCallback(() => dispatch(resetConversation()), [dispatch]);
  return (
    <Box
      sx={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overscrollBehavior: "contain",
      }}
    >
      {/* Centered column with responsive max width */}
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          // Limit chat column width and center it
          "& > .chat-shell": {
            width: "100%",
            maxWidth: { xs: "100%", sm: 640, md: 820 },
            mx: "auto",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderLeft: { xs: "none", md: "1px solid" },
            borderRight: { xs: "none", md: "1px solid" },
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "hidden",
          },
        }}
      >
        <Paper elevation={0}>
          <TopBar onClear={onClear} />
          <MessageList messages={messages} bottomRef={bottomRef} />
          {/* <McpPanel /> */}
          <Composer onSend={onSend} loading={loading} onStop={onStop} />
        </Paper>
      </Container>
    </Box>
  );
};

export default ChatPage;
