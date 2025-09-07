import { Box, Paper, Typography, Stack } from "@mui/material";

/**
 * MessageList
 * - Fills remaining vertical space (flex:1) and scrolls independently.
 * - Left/right bubble alignment by role.
 * - Renders an invisible bottom sentinel for auto-scroll.
 */
export default function MessageList({ messages, bottomRef }) {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        px: { xs: 1.5, sm: 2 },
        py: 2,
      }}
    >
      <Stack spacing={1.25}>
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <Box
              key={idx}
              sx={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  px: 1.5,
                  py: 1,
                  maxWidth: "min(90%, 680px)",
                  bgcolor: isUser ? "primary.light" : "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, display: "block", mb: 0.25 }}
                >
                  {isUser ? "You" : "Assistant"}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {m.content} {m.context}
                </Typography>
              </Paper>
            </Box>
          );
        })}
        <div ref={bottomRef} />
      </Stack>
    </Box>
  );
}
