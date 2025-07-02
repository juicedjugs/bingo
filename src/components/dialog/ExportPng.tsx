import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Slider,
  TextField,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useAppState, useTileIdeas, TileIdea } from "../../state";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getItemImgURL } from "../../utils/getItemImgURL";

// Background options
const BACKGROUND_OPTIONS = [
  { value: "default", label: "Default (Dark)", preview: "#181818" },
  { value: "upload", label: "Upload Image" },
  { value: "url", label: "Image URL" },
];

// Letter styles for bingo (B-I-N-G-O)
const LETTER_STYLES = [
  { value: "classic", label: "Classic Bold" },
  { value: "modern", label: "Modern Sans" },
  { value: "medieval", label: "Medieval Style" },
  { value: "pixel", label: "Pixel Font" },
];

interface PngExportSettings {
  backgroundType: string;
  backgroundImageUrl: string;
  backgroundImageFile: File | null;
  letterStyle: string;
  showLabels: boolean;
  customLetters: string;
  exportScale: number;
}

const ExportPng = () => {
  const { state, setOpenPngExportDialog } = useAppState();
  const { tileIdeas } = useTileIdeas();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [settings, setSettings] = useState<PngExportSettings>({
    backgroundType: "default",
    backgroundImageUrl: "",
    backgroundImageFile: null,
    letterStyle: "classic",
    showLabels: true,
    customLetters: (() => {
      const base = "BINGO";
      return base.substring(0, state.dimension); // Don't exceed dimension
    })(),
    exportScale: 200,
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
      backgroundType: settings.backgroundType,
      letterStyle: settings.letterStyle,
      showLabels: settings.showLabels,
      customLetters: settings.customLetters,
      exportScale: settings.exportScale,
    });
  }, [
    state.bingoBoard,
    state.dimension,
    settings.backgroundType,
    settings.letterStyle,
    settings.showLabels,
    settings.customLetters,
    settings.exportScale,
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

    const { dimension } = state;
    const currentBoard = state.bingoBoard.map(
      ({ id }) =>
        tileIdeas.find((tile: TileIdea) => tile.id === id) || {
          id: "",
          items: [],
          description: "",
        },
    );

    // Use fixed preview scale (not affected by export scale)
    const previewScale = 100; // Fixed 100% scale for preview
    const baseTileSize = 150 * (previewScale / 100);
    const tileSize = baseTileSize;
    const spacing = 2; // Fixed spacing for preview
    const boardSize = dimension * tileSize + (dimension + 1) * spacing;

    const marginAreaSize = Math.max(80, tileSize * 0.6);
    const letterAreaHeight = settings.showLabels ? marginAreaSize : 0;
    const rowNumberAreaWidth = settings.showLabels ? marginAreaSize : 0;
    canvas.width = boardSize + rowNumberAreaWidth;
    canvas.height = boardSize + letterAreaHeight;

    // Handle background (simplified for preview)
    ctx.fillStyle =
      BACKGROUND_OPTIONS.find((opt) => opt.value === settings.backgroundType)
        ?.preview || "#181818";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw custom letters if enabled
    if (settings.showLabels) {
      // Pad letters with dashes if fewer than dimension
      let letters = settings.customLetters;
      while (letters.length < dimension) {
        letters += "-";
      }
      const numLetters = dimension; // Always use full dimension for spacing
      const letterWidth = boardSize / numLetters;

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Set font size proportional to letter area and board size
      let fontSize = Math.min(letterAreaHeight * 0.6, letterWidth * 0.4);
      let fontFamily = "Arial, sans-serif";
      switch (settings.letterStyle) {
        case "classic":
          fontFamily = "Arial Black, Arial, sans-serif";
          break;
        case "modern":
          fontFamily = "Helvetica, Arial, sans-serif";
          break;
        case "medieval":
          fontFamily = "serif";
          break;
        case "pixel":
          fontFamily = "monospace";
          fontSize = Math.min(letterAreaHeight * 0.5, letterWidth * 0.35);
          break;
      }

      ctx.font = `${fontSize}px ${fontFamily}`;

      // Center letters vertically in the letter area
      const letterY = letterAreaHeight / 2;

      // Letters are already spanning the full board width
      for (let i = 0; i < letters.length; i++) {
        const x = rowNumberAreaWidth + letterWidth * i + letterWidth / 2;
        ctx.fillText(letters[i], x, letterY);
      }
    }

    // Draw row numbers if enabled
    if (settings.showLabels) {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Use same font size and style calculation as letters
      const letterWidth = boardSize / dimension;
      let fontSize = Math.min(letterAreaHeight * 0.5, letterWidth * 0.35);
      let fontFamily = "Arial, sans-serif";
      switch (settings.letterStyle) {
        case "classic":
          fontFamily = "Arial Black, Arial, sans-serif";
          break;
        case "modern":
          fontFamily = "Helvetica, Arial, sans-serif";
          break;
        case "medieval":
          fontFamily = "serif";
          break;
        case "pixel":
          fontFamily = "monospace";
          fontSize = Math.min(letterAreaHeight * 0.4, letterWidth * 0.3);
          break;
      }
      ctx.font = `${fontSize}px ${fontFamily}`;

      for (let i = 0; i < dimension; i++) {
        const x = rowNumberAreaWidth / 2; // Center in the row number area
        const y = letterAreaHeight + spacing + (i + 0.5) * (tileSize + spacing);
        ctx.fillText((i + 1).toString(), x, y);
      }
    }

    const yOffset = letterAreaHeight;
    const xOffset = rowNumberAreaWidth;

    // Draw tiles (simplified - no async image loading for preview)
    for (let row = 0; row < dimension; row++) {
      for (let col = 0; col < dimension; col++) {
        const index = row * dimension + col;
        const tile = currentBoard[index];

        const x = xOffset + spacing + col * (tileSize + spacing);
        const y = yOffset + spacing + row * (tileSize + spacing);

        // Draw tile border
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, tileSize, tileSize);

        if (tile.description || tile.items.length > 0) {
          // Calculate text sizing (matching BingoBoardTile logic)
          let descFontSize = tileSize * 0.13;
          ctx.font = `${descFontSize}px Arial`;
          let lines = wrapText(
            tile.description,
            tileSize * 0.85,
            descFontSize,
            ctx,
          );

          // Reduce font size if too many lines
          while (
            lines.length * descFontSize > tileSize * 0.35 &&
            descFontSize > tileSize * 0.07
          ) {
            descFontSize *= 0.92;
            ctx.font = `${descFontSize}px Arial`;
            lines = wrapText(
              tile.description,
              tileSize * 0.85,
              descFontSize,
              ctx,
            );
          }

          // Draw placeholder for images
          if (tile.items.length > 0) {
            const imageSize = tileSize * 0.28;
            const imageSpacing =
              tile.items.length === 3 ? tileSize * 0.015 : tileSize * 0.04;
            const numImages = Math.min(tile.items.length, 3);
            const totalImagesWidth =
              numImages * imageSize + (numImages - 1) * imageSpacing;
            const imagesStartX = x + (tileSize - totalImagesWidth) / 2;

            const textBlockHeight = lines.length * descFontSize;
            const imagesBlockHeight = imageSize;
            const spacingBetweenImagesAndText = tileSize * 0.08;
            const totalContentHeight =
              imagesBlockHeight + spacingBetweenImagesAndText + textBlockHeight;
            const contentStartY = y + (tileSize - totalContentHeight) / 2;
            const imageY = contentStartY;
            const textYStart =
              contentStartY +
              imagesBlockHeight +
              spacingBetweenImagesAndText +
              descFontSize;

            // Draw actual images or placeholders
            for (let idx = 0; idx < numImages; idx++) {
              const item = tile.items[idx];
              const imgX = imagesStartX + idx * (imageSize + imageSpacing);

              // Try to load and draw the actual image
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                // Fill the area with board background instead of clearing to transparency
                const boardBgColor =
                  BACKGROUND_OPTIONS.find(
                    (opt) => opt.value === settings.backgroundType,
                  )?.preview || "#181818";
                ctx.fillStyle = boardBgColor;
                ctx.fillRect(imgX, imageY, imageSize, imageSize);

                // Calculate aspect ratio and center the image
                const imgAspect = img.naturalWidth / img.naturalHeight;
                let drawWidth = imageSize;
                let drawHeight = imageSize;
                let drawX = imgX;
                let drawY = imageY;

                if (imgAspect > 1) {
                  // Image is wider than tall
                  drawHeight = imageSize / imgAspect;
                  drawY = imageY + (imageSize - drawHeight) / 2;
                } else {
                  // Image is taller than wide or square
                  drawWidth = imageSize * imgAspect;
                  drawX = imgX + (imageSize - drawWidth) / 2;
                }

                // Add drop shadow effect
                ctx.shadowColor = "#000000";
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Draw image with preserved aspect ratio
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                // Reset shadow
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;

                // Update preview with the new image
                const dataUrl = canvas.toDataURL("image/png");
                setPreviewUrl(dataUrl);
              };
              img.onerror = () => {
                // Keep placeholder if image fails to load
              };

              // Draw placeholder with board background, then gray overlay
              const boardBgColor =
                BACKGROUND_OPTIONS.find(
                  (opt) => opt.value === settings.backgroundType,
                )?.preview || "#181818";
              ctx.fillStyle = boardBgColor;
              ctx.fillRect(imgX, imageY, imageSize, imageSize);

              // Add subtle placeholder indicator
              ctx.fillStyle = "#666";
              ctx.fillRect(imgX + 2, imageY + 2, imageSize - 4, imageSize - 4);

              // Start loading the image
              img.src = getItemImgURL(item);
            }

            // Draw description text
            if (tile.description && lines.length > 0) {
              ctx.fillStyle = "#ccc";
              ctx.textAlign = "center";
              ctx.textBaseline = "alphabetic";
              ctx.font = `${descFontSize}px Arial`;

              for (let i = 0; i < lines.length; i++) {
                const lineY = textYStart + i * (descFontSize * 1.1);
                ctx.fillText(lines[i], x + tileSize / 2, lineY);
              }
            }
          } else if (tile.description && lines.length > 0) {
            // Center text vertically if no images
            const textBlockHeight = lines.length * descFontSize;
            const textStartY =
              y + (tileSize - textBlockHeight) / 2 + descFontSize;

            ctx.fillStyle = "#ccc";
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            ctx.font = `${descFontSize}px Arial`;

            for (let i = 0; i < lines.length; i++) {
              const lineY = textStartY + i * (descFontSize * 1.1);
              ctx.fillText(lines[i], x + tileSize / 2, lineY);
            }
          }
        }
      }
    }

    // Update preview immediately (no async operations)
    const dataUrl = canvas.toDataURL("image/png");
    setPreviewUrl(dataUrl);
    setIsGeneratingPreview(false);
  }, [state.dimension, state.bingoBoard, settings, tileIdeas]);

  // Debounced preview generation
  useEffect(() => {
    if (!state.openPngExportDialog) return;

    setIsGeneratingPreview(true);
    const timeoutId = setTimeout(() => {
      generatePreview();
    }, 200);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.openPngExportDialog,
    state.dimension,
    boardContentHash, // Use stable hash instead of raw bingoBoard
    settings.showLabels,
    settings.customLetters,
    settings.letterStyle,
    settings.backgroundType,
    settings.backgroundImageFile?.name, // Only trigger on file change, not object change
  ]);

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

  const handleExport = async () => {
    if (!canvasRef.current) return;

    // Generate high-resolution version for export (scale 200, exportSize at max resolution)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { dimension } = state;
    const maxScale = 200; // Force maximum resolution for export

    // Use maximum export scale for final output
    const baseTileSize = 150 * (settings.exportScale / 100);
    const exportMultiplier = 2; // 2x for high quality
    const tileSize = baseTileSize * exportMultiplier;
    const spacing = 2 * exportMultiplier; // Fixed spacing
    const boardSize = dimension * tileSize + (dimension + 1) * spacing;

    const marginAreaSize = Math.max(160, tileSize * 0.6);
    const letterAreaHeight = settings.showLabels ? marginAreaSize : 0;
    const rowNumberAreaWidth = settings.showLabels ? marginAreaSize : 0;
    canvas.width = boardSize + rowNumberAreaWidth;
    canvas.height = boardSize + letterAreaHeight;

    // Handle background for export
    if (settings.backgroundType === "upload" && settings.backgroundImageFile) {
      // Load uploaded image as background for export
      const img = new Image();
      const reader = new FileReader();

      await new Promise((resolve) => {
        reader.onload = (e) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(void 0);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(settings.backgroundImageFile!);
      });
    } else {
      // Use solid color background
      ctx.fillStyle =
        BACKGROUND_OPTIONS.find((opt) => opt.value === settings.backgroundType)
          ?.preview || "#181818";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw custom letters if enabled (high res version)
    if (settings.showLabels) {
      // Pad letters with dashes if fewer than dimension
      let letters = settings.customLetters;
      while (letters.length < dimension) {
        letters += "-";
      }
      const numLetters = dimension; // Always use full dimension for spacing
      const letterWidth = boardSize / numLetters;

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Set font size proportional to letter area and board size
      let fontSize = Math.min(letterAreaHeight * 0.6, letterWidth * 0.4);
      let fontFamily = "Arial, sans-serif";
      switch (settings.letterStyle) {
        case "classic":
          fontFamily = "Arial Black, Arial, sans-serif";
          break;
        case "modern":
          fontFamily = "Helvetica, Arial, sans-serif";
          break;
        case "medieval":
          fontFamily = "serif";
          break;
        case "pixel":
          fontFamily = "monospace";
          fontSize = Math.min(letterAreaHeight * 0.5, letterWidth * 0.35);
          break;
      }

      ctx.font = `${fontSize}px ${fontFamily}`;
      const letterY = letterAreaHeight / 2;

      // Letters are already spanning the full board width
      for (let i = 0; i < letters.length; i++) {
        const x = rowNumberAreaWidth + letterWidth * i + letterWidth / 2;
        ctx.fillText(letters[i], x, letterY);
      }
    }

    // Draw row numbers if enabled (high res version)
    if (settings.showLabels) {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Use same font size and style calculation as letters
      const letterWidth = boardSize / dimension;
      let fontSize = Math.min(letterAreaHeight * 0.6, letterWidth * 0.4);
      let fontFamily = "Arial, sans-serif";
      switch (settings.letterStyle) {
        case "classic":
          fontFamily = "Arial Black, Arial, sans-serif";
          break;
        case "modern":
          fontFamily = "Helvetica, Arial, sans-serif";
          break;
        case "medieval":
          fontFamily = "serif";
          break;
        case "pixel":
          fontFamily = "monospace";
          fontSize = Math.min(letterAreaHeight * 0.5, letterWidth * 0.35);
          break;
      }
      ctx.font = `${fontSize}px ${fontFamily}`;

      for (let i = 0; i < dimension; i++) {
        const x = rowNumberAreaWidth / 2; // Center in the row number area
        const y = letterAreaHeight + spacing + (i + 0.5) * (tileSize + spacing);
        ctx.fillText((i + 1).toString(), x, y);
      }
    }

    const yOffset = letterAreaHeight;
    const xOffset = rowNumberAreaWidth;

    // Load all images at high resolution
    const imageMap = new Map<string, HTMLImageElement>();

    for (const tile of board) {
      for (const item of tile.items.slice(0, 3)) {
        if (!imageMap.has(item)) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = getItemImgURL(item);
          imageMap.set(item, img);
        }
      }
    }

    // Wait for images to load
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Draw tiles at high resolution
    for (let row = 0; row < dimension; row++) {
      for (let col = 0; col < dimension; col++) {
        const index = row * dimension + col;
        const tile = board[index];

        const x = xOffset + spacing + col * (tileSize + spacing);
        const y = yOffset + spacing + row * (tileSize + spacing);

        // Draw tile border
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2; // Thicker border for high res
        ctx.strokeRect(x, y, tileSize, tileSize);

        if (tile.description || tile.items.length > 0) {
          // High-res layout calculations
          const imageSize = tileSize * 0.28;
          const imageSpacing =
            tile.items.length === 3 ? tileSize * 0.015 : tileSize * 0.04;
          const numImages = Math.min(tile.items.length, 3);
          const totalImagesWidth =
            numImages * imageSize + (numImages - 1) * imageSpacing;
          const imagesStartX = x + (tileSize - totalImagesWidth) / 2;

          // High-res text sizing
          let descFontSize = tileSize * 0.13;
          ctx.font = `${descFontSize}px Arial`;
          let lines = wrapText(
            tile.description,
            tileSize * 0.85,
            descFontSize,
            ctx,
          );

          while (
            lines.length * descFontSize > tileSize * 0.35 &&
            descFontSize > tileSize * 0.07
          ) {
            descFontSize *= 0.92;
            ctx.font = `${descFontSize}px Arial`;
            lines = wrapText(
              tile.description,
              tileSize * 0.85,
              descFontSize,
              ctx,
            );
          }

          // Vertical centering
          const textBlockHeight = lines.length * descFontSize;
          const imagesBlockHeight = tile.items.length === 0 ? 0 : imageSize;
          const spacingBetweenImagesAndText =
            tile.items.length === 0 ? 0 : tileSize * 0.08;
          const totalContentHeight =
            imagesBlockHeight + spacingBetweenImagesAndText + textBlockHeight;
          const contentStartY = y + (tileSize - totalContentHeight) / 2;
          const imageY = contentStartY;
          const textYStart =
            contentStartY +
            imagesBlockHeight +
            spacingBetweenImagesAndText +
            descFontSize;

          // Draw high-res images
          for (let idx = 0; idx < Math.min(tile.items.length, 3); idx++) {
            const item = tile.items[idx];
            const img = imageMap.get(item);
            if (img && img.complete && img.naturalWidth > 0) {
              const imgX = imagesStartX + idx * (imageSize + imageSpacing);

              // Calculate aspect ratio and center the image
              const imgAspect = img.naturalWidth / img.naturalHeight;
              let drawWidth = imageSize;
              let drawHeight = imageSize;
              let drawX = imgX;
              let drawY = imageY;

              if (imgAspect > 1) {
                // Image is wider than tall
                drawHeight = imageSize / imgAspect;
                drawY = imageY + (imageSize - drawHeight) / 2;
              } else {
                // Image is taller than wide or square
                drawWidth = imageSize * imgAspect;
                drawX = imgX + (imageSize - drawWidth) / 2;
              }

              ctx.shadowColor = "#000000";
              ctx.shadowBlur = 4; // Higher blur for high res
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              // Draw image with preserved aspect ratio
              ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
            }
          }

          // Draw high-res text
          if (tile.description && lines.length > 0) {
            ctx.fillStyle = "#ccc";
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            ctx.font = `${descFontSize}px Arial`;

            for (let i = 0; i < lines.length; i++) {
              const lineY = textYStart + i * (descFontSize * 1.1);
              ctx.fillText(lines[i], x + tileSize / 2, lineY);
            }
          }
        }
      }
    }

    // Export the high-resolution version
    const highResDataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `bingo-board-${Date.now()}.png`;
    link.href = highResDataUrl;
    link.click();

    // Regenerate preview at normal resolution
    generatePreview();

    handleClose();
  };

  const updateSetting = (key: keyof PngExportSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={state.openPngExportDialog} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        Export Bingo Board as PNG
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ display: "flex", gap: 4 }}>
          {/* Preview Section */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Preview
            </Typography>
            <Box
              sx={{
                border: "1px solid #ccc",
                borderRadius: 1,
                p: 2,
                backgroundColor: "#181818",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 400,
              }}>
              {isGeneratingPreview ? (
                <Typography color="text.secondary">
                  Generating preview...
                </Typography>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Board Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Typography color="text.secondary">
                  Click refresh to generate preview
                </Typography>
              )}
            </Box>
          </Box>

          {/* Settings Section */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Export Settings
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Background Type */}
              <FormControl fullWidth>
                <InputLabel>Background</InputLabel>
                <Select
                  value={settings.backgroundType}
                  label="Background"
                  onChange={(e) =>
                    updateSetting("backgroundType", e.target.value)
                  }>
                  {BACKGROUND_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: option.preview,
                            border: "1px solid #ccc",
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Background Image Upload */}
              {settings.backgroundType === "upload" && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Upload Background Image
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      updateSetting("backgroundImageFile", file);
                    }}
                    style={{ width: "100%" }}
                  />
                  {settings.backgroundImageFile && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}>
                      Selected: {settings.backgroundImageFile.name}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Letter Style */}
              <FormControl fullWidth>
                <InputLabel>Letter Style (B-I-N-G-O)</InputLabel>
                <Select
                  value={settings.letterStyle}
                  label="Letter Style (B-I-N-G-O)"
                  onChange={(e) =>
                    updateSetting("letterStyle", e.target.value)
                  }>
                  {LETTER_STYLES.map((style) => (
                    <MenuItem key={style.value} value={style.value}>
                      {style.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Show Labels Toggle */}
              <Box>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={settings.showLabels}
                    onChange={(e) =>
                      updateSetting("showLabels", e.target.checked)
                    }
                  />
                  <Typography>Show letters and row numbers</Typography>
                </label>
              </Box>

              {/* Custom Letters Input */}
              {settings.showLabels && (
                <TextField
                  fullWidth
                  label={`Letters (up to ${state.dimension} characters)`}
                  value={settings.customLetters}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= state.dimension) {
                      updateSetting("customLetters", value);
                    }
                  }}
                  inputProps={{ maxLength: state.dimension }}
                  error={false}
                  helperText={`${settings.customLetters.length}/${state.dimension} characters`}
                />
              )}

              {/* Export Scale */}
              <Box>
                {(() => {
                  const { dimension } = state;
                  const baseTileSize = 150 * (settings.exportScale / 100);
                  const exportMultiplier = 2; // 2x for high quality
                  const tileSize = baseTileSize * exportMultiplier;
                  const spacing = 2 * exportMultiplier;
                  const boardSize =
                    dimension * tileSize + (dimension + 1) * spacing;
                  const marginAreaSize = Math.max(160, tileSize * 0.6);
                  const letterAreaHeight = settings.showLabels
                    ? marginAreaSize
                    : 0;
                  const rowNumberAreaWidth = settings.showLabels
                    ? marginAreaSize
                    : 0;
                  const totalWidth = Math.round(boardSize + rowNumberAreaWidth);
                  const totalHeight = Math.round(boardSize + letterAreaHeight);

                  return (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Dimensions: {totalWidth} × {totalHeight} pixels
                      </Typography>
                    </>
                  );
                })()}
                <Slider
                  value={settings.exportScale}
                  onChange={(e, value) => updateSetting("exportScale", value)}
                  min={50}
                  max={300}
                  step={10}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 100, label: "Normal" },
                    { value: 200, label: "2x" },
                    { value: 300, label: "3x" },
                  ]}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </DialogContent>
      <DialogActions sx={{ p: 4, py: 2 }}>
        <Button variant="contained" color="error" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExport}
          disabled={!previewUrl}
          startIcon={<Icon icon="mdi:download" width={20} height={20} />}>
          Export PNG
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportPng;
