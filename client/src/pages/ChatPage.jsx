import { Paper } from "@mui/material";
import TopBar from "../components/TopBar";
import { useState } from "react";
import MessageList from "../components/MessageList";
import Composer from "../components/Composer";
import { apiPost } from "../utils/apiCall";
const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I’m your InvestorOS assistant. How can I help?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendPromt = async (prompt) => {
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setLoading(true);
    try {
      console.log("[send] prompt:", prompt);
      const res = await apiPost("/api/chat", { prompt });
      console.log("[recv] res:", res);
      const answer = res?.response || "(No response)";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const clearAll = () => setMessages([]);
  return (
    <Paper
      elevation={0}
      sx={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <TopBar onClear={clearAll} />
      <MessageList messages={messages} />
      <Composer onSend={sendPromt} loading={loading} />
    </Paper>
  );
};

export default ChatPage;
