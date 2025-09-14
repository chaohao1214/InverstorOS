import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { useRef } from "react";
import AddIcon from "@mui/icons-material/Add";
import { parsePdfAndUpsert } from "../feature/mcp/mcpThunks";

export default function Composer({ onSend, onStop, loading }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [text, setText] = useState("");

  const uploadFile = async (file) => {
    const form = new FormData();
    form.append("file", file);
    const resp = await fetch("/upload", { method: "POST", body: form });
    const json = await resp.json();
    if (!json?.ok) throw new Error("Upload failed");
    await dispatch(parsePdfAndUpsert(json.filePath));
  };

  const onDrop = async (e) => {
    e.preventDefault();
    if (loading) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      await uploadFile(file);
    }
  };

  const onPaste = async (e) => {
    const file = [...e.clipboardData.files]?.[0];
    if (file && file.type === "application/pdf") {
      e.preventDefault();
      await uploadFile(file);
    }
  };

  // Open file picker for PDF selection
  const handlePickFile = () => fileInputRef.current?.click();

  // Called when the hidden file input changes
  const handleFileChange = async (changeEvent) => {
    const selectedFile = changeEvent.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      await uploadFile(selectedFile);
      // reset the input so the same file can be selected again if needed
      changeEvent.target.value = "";
    }
  };
  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setText("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      onDragOver={(dragEvent) => dragEvent.preventDefault()}
      onDrop={onDrop}
      onPaste={onPaste}
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
        onKeyDown={onKeyDown}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handlePickFile}
                  disabled={loading}
                >
                  <AddIcon />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Stop generating */}
      <Button
        variant="outlined"
        disabled={!loading}
        onClick={onStop}
        sx={{ alignSelf: "stretch", minWidth: 80 }}
      >
        Stop
      </Button>
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
