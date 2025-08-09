import { Box, Paper, Typography } from "@mui/material";

export default function MessageList({ messages }) {
  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
      {messages.map((m, idx) => (
        <Paper
          key={idx}
          sx={{
            p: 1.5,
            mb: 1.5,
            bgcolor: m.role === "user" ? "primary.light" : "background.paper",
          }}
        >
          <Typography ariant="caption" sx={{ opacity: 0.7 }}>
            {m.role === "user" ? "You" : "Assistant"}
          </Typography>{" "}
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {m.content}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
