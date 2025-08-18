import { Box, Button, CircularProgress, TextField } from "@mui/material";
import { useState } from "react";

export default function Composer({ onSend, loading }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmedMessage = text.trim();
    if (!trimmedMessage || loading) return;
    onSend(trimmedMessage);
    setText("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  };
  return (
    <Box
      sx={{
        p: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        display: "flex",
        gap: 1,
      }}
    >
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={6}
        placeholder="Ask anything about finance news, 10-K, or strategies... (Cmd/Ctrl + Enter to send)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <Button
        onClick={handleSend}
        variant="contained"
        disabled={loading || !text.trim()}
      >
        {loading ? <CircularProgress size={22} /> : "Send"}
      </Button>
    </Box>
  );
}
