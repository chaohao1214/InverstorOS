import { Box, Button, CircularProgress, TextField } from "@mui/material";
import { useState } from "react";

export default function Composer({ onSend, onStop, loading }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setText("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderTop: "1px solid",
        borderColor: "divider",
        display: "flex",
        gap: 1,
        alignItems: "flex-end",
        bgcolor: "background.paper",
      }}
    >
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={8}
        placeholder="Ask anything about finance news, 10-K, or strategies... (Cmd/Ctrl + Enter to send)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" && (e.metaKey || e.ctrlKey) ? send() : null
        }
        inputProps={{ "aria-label": "Message composer" }}
      />
      {/* Stop generating */}
      {/* <Button
        variant="outlined"
        disabled={!loading}
        onClick={onStop}
        sx={{ alignSelf: "stretch", minWidth: 80 }}
      >
        Stop
      </Button> */}
      <Button
        onClick={handleSend}
        variant="contained"
        disabled={loading || !text.trim()}
        sx={{ alignSelf: "stretch", minWidth: { xs: 80, sm: 100 } }}
      >
        {loading ? <CircularProgress size={22} /> : "Send"}
      </Button>
    </Box>
  );
}
