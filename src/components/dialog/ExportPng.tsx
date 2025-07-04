import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Slider,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useAppState, useTileIdeas, TileIdea } from "../../state";
import { PngExportSettings, BingoTile } from "./types";
import { LETTER_STYLES, DEFAULT_SETTINGS } from "./constants";
import { calculateRenderConfig, renderBoard } from "./canvas-renderer";
import ColorControl from "./ui-controls/ColorControl";
import SliderControl from "./ui-controls/SliderControl";

const ExportPng = () => {
  const { state, setOpenPngExportDialog } = useAppState();
  const { tileIdeas } = useTileIdeas();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [settings, setSettings] = useState<PngExportSettings>({
    ...DEFAULT_SETTINGS,
    customLetters: (() => {
      const base = "BINGO";
      return base.substring(0, state.dimension); // Don't exceed dimension
    })(),
  });

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Initialize custom letters when dimension changes (only if letters are empty)
  useEffect(() => {
    const currentLetters = settings.customLetters;
    const dimension = state.dimension;

    // Only auto-fill if letters are completely empty
    if (currentLetters.length === 0) {
      const base = "BINGO";
      let newLetters = "";
      for (let i = 0; i < dimension; i++) {
        newLetters += base[i % base.length];
      }
      setSettings((prev) => ({ ...prev, customLetters: newLetters }));
    }
  }, [state.dimension]); // Remove settings.customLetters from dependencies to prevent interference

  // Create stable board content hash to prevent unnecessary re-renders
  const boardContentHash = useMemo(() => {
    return JSON.stringify({
      board: state.bingoBoard,
      dimension: state.dimension,
      backgroundColor: settings.backgroundColor,
      tileColor: settings.tileColor,
      textStrokeColor: settings.textStrokeColor,
      backgroundImageFile: settings.backgroundImageFile?.name,
      letterStyle: settings.letterStyle,
      showLabels: settings.showLabels,
      customLetters: settings.customLetters,
      glassBlur: settings.glassBlur,
      borderThickness: settings.borderThickness,
      borderColor: settings.borderColor,
    });
  }, [
    state.bingoBoard,
    state.dimension,
    settings.backgroundColor,
    settings.tileColor,
    settings.textStrokeColor,
    settings.backgroundImageFile?.name,
    settings.letterStyle,
    settings.showLabels,
    settings.customLetters,
    settings.glassBlur,
    settings.borderThickness,
    settings.borderColor,
  ]);

  // Get the current board data
  const board = state.bingoBoard.map(
    ({ id }) =>
      tileIdeas.find((tile: TileIdea) => tile.id === id) || {
        id: "",
        items: [],
        description: "",
      },
  );

  // Helper function to wrap text (matching BingoBoardTile logic)
  const wrapText = (
    text: string,
    maxWidth: number,
    fontSize: number,
    ctx: CanvasRenderingContext2D,
  ) => {
    if (!text) return [];
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const generatePreview = useCallback(async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsGeneratingPreview(true);

    try {
      // Convert tile ideas to bingo tiles format
      const board: BingoTile[] = state.bingoBoard.map(({ id }) => {
        const tileIdea = tileIdeas.find((tile: TileIdea) => tile.id === id);
        return {
          id: id || "",
          description: tileIdea?.description || "",
          items: tileIdea?.items || [],
        };
      });

      // Use preview settings (not affected by export scale)
      const previewSettings = { ...settings, exportScale: 100 };
      const config = calculateRenderConfig(
        state.dimension,
        previewSettings,
        false,
      );
      await renderBoard(canvas, ctx, board, config, previewSettings, false);

      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [state.dimension, state.bingoBoard, settings, tileIdeas]);

  // Debounced preview generation
  useEffect(() => {
    if (!state.openPngExportDialog) return;

    setIsGeneratingPreview(true);
    const timeoutId = setTimeout(() => {
      generatePreview();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [state.openPngExportDialog, boardContentHash, generatePreview]);

  // Clear preview when dialog closes
  useEffect(() => {
    if (!state.openPngExportDialog) {
      setPreviewUrl("");
      setIsGeneratingPreview(false);
    }
  }, [state.openPngExportDialog]);

  const handleClose = () => {
    setOpenPngExportDialog(false);
    setPreviewUrl("");
  };

  const handleExport = async (targetSize: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // Convert tile ideas to bingo tiles format
      const board: BingoTile[] = state.bingoBoard.map(({ id }) => {
        const tileIdea = tileIdeas.find((tile: TileIdea) => tile.id === id);
        return {
          id: id || "",
          description: tileIdea?.description || "",
          items: tileIdea?.items || [],
        };
      });

      // Calculate the scale needed to achieve target size
      // Base calculation: with default settings, what would the canvas size be?
      const baseSettings = { ...settings, exportScale: 100 };
      const baseConfig = calculateRenderConfig(
        state.dimension,
        baseSettings,
        true,
      );
      const baseTotalSize = Math.max(
        baseConfig.boardSize +
          baseConfig.rowNumberAreaWidth +
          baseConfig.extraPaddingWidth,
        baseConfig.boardSize +
          baseConfig.letterAreaHeight +
          baseConfig.extraPaddingHeight,
      );

      // Calculate scale to achieve target size
      const scaleToTarget = (targetSize / baseTotalSize) * 100;
      const exportSettings = { ...settings, exportScale: scaleToTarget };

      const config = calculateRenderConfig(
        state.dimension,
        exportSettings,
        true,
      );
      await renderBoard(canvas, ctx, board, config, exportSettings, true);

      // Export the high-resolution version
      const highResDataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `bingo-board-${targetSize}x${targetSize}-${Date.now()}.png`;
      link.href = highResDataUrl;
      link.click();
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const updateSetting = (key: keyof PngExportSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!state.openPngExportDialog) return null;

  return (
    <Dialog
      open={state.openPngExportDialog}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: "90vh", maxHeight: "800px" } }}>
      <DialogTitle>Export PNG</DialogTitle>
      <DialogContent sx={{ p: 0, display: "flex", height: "100%" }}>
        <Box sx={{ display: "flex", width: "100%", height: "100%" }}>
          {/* Preview Area - 2/3 width */}
          <Box
            sx={{
              flex: "0 0 66.66%",
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRight: "1px solid #ffffff33",
            }}>
            {isGeneratingPreview ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={24} />
                <Typography>Generating preview...</Typography>
              </Box>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Board Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                }}
              />
            ) : (
              <Typography color="text.secondary">
                Preview will appear here...
              </Typography>
            )}
          </Box>

          {/* Settings Panel - 1/3 width */}
          <Box
            sx={{
              flex: "0 0 33.33%",
              p: 3,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}>
            <ColorControl
              label="Background Color"
              value={settings.backgroundColor}
              onChange={(value) => updateSetting("backgroundColor", value)}
            />

            <ColorControl
              label="Text Color"
              value={settings.tileColor}
              onChange={(value) => updateSetting("tileColor", value)}
            />

            <ColorControl
              label="Text Stroke"
              value={settings.textStrokeColor}
              onChange={(value) => updateSetting("textStrokeColor", value)}
            />

            {/* Background Image Upload */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Background Image
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  updateSetting("backgroundImageFile", file);
                }}
                style={{ width: "100%", fontSize: "14px" }}
              />
              {settings.backgroundImageFile && (
                <Box sx={{ mt: 0.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}>
                    {settings.backgroundImageFile.name}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => updateSetting("backgroundImageFile", null)}
                    sx={{ mt: 0.5, fontSize: "12px" }}>
                    Remove
                  </Button>
                </Box>
              )}
            </Box>

            <SliderControl
              label="Glass Blur"
              value={settings.glassBlur}
              onChange={(value) => updateSetting("glassBlur", value)}
              min={0}
              max={20}
              step={1}
              unit="px"
              marks={[
                { value: 0, label: "0" },
                { value: 10, label: "10" },
                { value: 20, label: "20" },
              ]}
            />

            <ColorControl
              label="Border Color"
              value={settings.borderColor}
              onChange={(value) => updateSetting("borderColor", value)}
            />

            <SliderControl
              label="Border Thickness"
              value={settings.borderThickness}
              onChange={(value) => updateSetting("borderThickness", value)}
              min={0}
              max={8}
              step={1}
              unit="px"
              marks={[
                { value: 0, label: "0" },
                { value: 2, label: "2" },
                { value: 4, label: "4" },
                { value: 8, label: "8" },
              ]}
            />

            {/* Letter Style */}
            <FormControl fullWidth size="small">
              <InputLabel>Letter Style</InputLabel>
              <Select
                value={settings.letterStyle}
                label="Letter Style"
                onChange={(e) => updateSetting("letterStyle", e.target.value)}>
                {LETTER_STYLES.map((style) => (
                  <MenuItem key={style.value} value={style.value}>
                    {style.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Show Labels Toggle */}
            <Box>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={settings.showLabels}
                  onChange={(e) =>
                    updateSetting("showLabels", e.target.checked)
                  }
                />
                <Typography variant="body2">Show labels</Typography>
              </label>
            </Box>

            {/* Custom Letters Input */}
            {settings.showLabels && (
              <TextField
                fullWidth
                size="small"
                label={`Letters (max ${state.dimension})`}
                value={settings.customLetters}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (value.length <= state.dimension) {
                    updateSetting("customLetters", value);
                  }
                }}
                inputProps={{ maxLength: state.dimension }}
                helperText={`${settings.customLetters.length}/${state.dimension}`}
              />
            )}
          </Box>
        </Box>

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </DialogContent>
      <DialogActions sx={{ p: 3, py: 2, justifyContent: "space-between" }}>
        <Button variant="contained" color="error" onClick={handleClose}>
          Cancel
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleExport(2048)}
            disabled={!previewUrl}
            startIcon={<Icon icon="mdi:download" width={16} height={16} />}>
            Download
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ExportPng;
