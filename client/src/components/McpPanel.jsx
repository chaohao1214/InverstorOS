import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Divider,
  TextField,
  Typography,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import { useState } from "react";
import { parsePdfAndUpsert, querySimilar } from "../feature/mcp/mcpThunks";
import {
  addContextSnippet,
  clearContextSnippets,
} from "../feature/mcp/mcpSlice";
const McpPanel = () => {
  const dispatch = useDispatch();
  const {
    isLoading,
    error,
    queryResults,
    contextSnippets,
    lastPdfPath,
    lastQueryText,
  } = useSelector((state) => state?.mcp);

  const [filePath, setFilePath] = useState(lastPdfPath || "");
  const [queryText, setQueryText] = useState(lastQueryText || "");
  const [topK, setTopK] = useState(4);

  const handleParse = () => {
    if (!filePath.trim()) return;
    dispatch(parsePdfAndUpsert(filePath.trim()));
  };
  const handleQuery = () => {
    if (!queryText.trim()) return;
    const requestedTopK = Math.max(1, Math.min(12, Number(topK) || 4));
    dispatch(querySimilar(queryText.trim(), requestedTopK));
  };
  return (
    <Paper
      elevation={0}
      sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        MCP Tools
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
        <TextField
          label="Server PDF file path (absolute or valid on server)"
          placeholder="/data/10K/AAPL_2024.pdf"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          size="small"
        />
        <Button variant="outlined" onClick={handleParse} disabled={isLoading}>
          Parse & Upsert
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Section: Vector Query */}
      <Box
        sx={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 1 }}
      >
        <TextField
          label="Semantic query"
          placeholder="AAPL revenue guidance 2024"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          size="small"
        />
        <TextField
          label="Top K"
          type="number"
          value={topK}
          onChange={(e) => setTopK(e.target.value)}
          size="small"
          inputProps={{ min: 1, max: 12 }}
        />
        <Button variant="contained" onClick={handleQuery} disabled={isLoading}>
          Search
        </Button>
      </Box>

      {error ? (
        <Typography color="error" sx={{ mt: 1 }}>
          {String(error)}
        </Typography>
      ) : null}

      {/* Results */}
      {queryResults.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Results {queryResults.length}
          </Typography>
          <Stack spacing={1}>
            {queryResults.map((row) => (
              <Box
                key={row.id}
                sx={{
                  p: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.default",
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {row.metadata?.source} — page {row.metadata?.page} — dist{" "}
                  {row.distance?.toFixed?.(4)}
                </Typography>{" "}
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}
                >
                  {row.text}
                </Typography>
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => dispatch(addContextSnippet(row))}
                  >
                    Add to Context
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Selected context */}
      {contextSnippets.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Context Snippets
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {contextSnippets.map((item) => (
              <Chip
                key={item.id}
                label={`${item.metadata?.source || "doc"}#${
                  item.metadata?.page || "-"
                }`}
                onDelete={() => dispatch(removeContextSnippet(item.id))}
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
          <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
            <Button
              size="small"
              onClick={() => dispatch(clearContextSnippets())}
            >
              Clear Context
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default McpPanel;
