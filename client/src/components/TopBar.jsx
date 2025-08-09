import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";

export default function TopBar({
  onClear,
  providerLabel = "Provider: server env",
}) {
  return (
    <AppBar position="static" elevation={0} color="default">
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          InvestorOS Chat
        </Typography>
        <Box sx={{ fontSize: 14, color: "text.secondary" }}>
          {providerLabel}
        </Box>
        <Button onClick={onClear} variant="outlined" size="small">
          Clear
        </Button>
      </Toolbar>
    </AppBar>
  );
}
