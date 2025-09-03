import { Box, Container, Paper } from "@mui/material";
import TopBar from "../components/TopBar";
import MessageList from "../components/MessageList";
import Composer from "../components/Composer";
import { apiPost } from "../utils/apiCall";
import { useState, useRef, useEffect, useCallback } from "react";
import { streamChat } from "../utils/streamChat";
const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I’m your InvestorOS assistant. How can I help?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // Model options (wire these to a settings panel or dropdown later)
  const [model, setModel] = useState("mistral:latest");
  const [temperature, setTemperature] = useState(0.7);

  // Keep an AbortController for the active stream request
  const abortRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Clean up any in-flight stream when component unmounts
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  /** Append a new message */
  const appendMessage = useCallback((message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  /** Replace last assistant message */
  const replaceLastAssistant = useCallback((content) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.role === "assistant") {
        next[next.length - 1] = { role: "assistant", content };
      } else {
        next.push({ role: "assistant", content });
      }
      return next;
    });
  }, []);

  /** Non-streaming send (uses axiosPost) — keep for fallback or comparison */
  const sendPrompt = async (promptText) => {
    appendMessage({ role: "user", content: promptText });
    setLoading(true);
    try {
      const result = await apiPost("/api/chat", {
        prompt: promptText,
        model,
        temperature,
      });
      appendMessage({
        role: "assistant",
        content: result?.response || " (No response)",
      });
    } catch (error) {
      appendMessage({ role: "assistant", content: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  /** Streaming send (uses fetch + ReadableStream) */
  const sendPromptStream = useCallback(
    async (promptText) => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      // Optimistic UI updates
      appendMessage({ role: "user", content: promptText });
      appendMessage({ role: "assistant", content: "" });

      const controller = new AbortController();
      abortRef.current = controller;
      let assembled = "";
      setLoading(true);

      try {
        await streamChat({
          prompt: promptText,
          model,
          temperature,
          signal: controller.signal,
          onToken: (t) => {
            assembled += t;
            replaceLastAssistant(assembled);
          },
          onStart: () => {},
          onDone: () => {
            // If upstream sent nothing, show a friendly placeholder
            if (!assembled) replaceLastAssistant("(No response)");
          },
        });
      } catch (error) {
        replaceLastAssistant(`Error: ${error.message}`);
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [appendMessage, replaceLastAssistant, model, temperature]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);
  const clearAll = useCallback(() => setMessages([]), []);

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
          <TopBar onClear={clearAll} />
          <MessageList messages={messages} />
          <Composer
            onSend={sendPromptStream}
            loading={loading}
            // onStop={handleStop}
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default ChatPage;
