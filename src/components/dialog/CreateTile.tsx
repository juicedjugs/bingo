import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextareaAutosize,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useAppState, useTileIdeas, TileIdea } from "../../state";
import { useState, useEffect } from "react";
import { getItemImgURL } from "../../utils/getItemImgURL";
import { nanoid } from "nanoid";

// Preview component that mimics BingoBoardTile rendering
const TilePreview = ({
  description,
  items,
  timeToComplete,
}: {
  description: string;
  items: string[];
  timeToComplete: number | "";
}) => {
  const { state } = useAppState();
  const size = 150;

  // Helper to wrap text into lines that fit the tile width
  function wrapText(
    text: string,
    maxWidth: number,
    fontSize: number,
    fontFamily = "inherit",
  ) {
    if (!text) return [];
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0] || "";

    // Create a temporary SVG text element to measure text width
    if (typeof window !== "undefined") {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const textElem = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      textElem.setAttribute("font-size", fontSize.toString());
      textElem.setAttribute("font-family", fontFamily);
      svg.appendChild(textElem);
      document.body.appendChild(svg);

      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + " " + words[i];
        textElem.textContent = testLine;
        const width = textElem.getBBox().width;
        if (width > maxWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
      document.body.removeChild(svg);
    } else {
      // SSR fallback: just break every 6 words
      for (let i = 1; i < words.length; i++) {
        if (i % 6 === 0) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine += " " + words[i];
        }
      }
      lines.push(currentLine);
    }
    return lines;
  }

  // Filter out empty items for accurate layout calculation
  const validItems = items.filter((item) => item.trim().length > 0);

  // Layout: images in a row at the top, description text below
  const imageSize = size * 0.28;
  const imageSpacing = validItems.length === 3 ? size * 0.015 : size * 0.04;
  const numImages = Math.min(validItems.length, 3);
  const totalImagesWidth =
    numImages * imageSize + (numImages - 1) * imageSpacing;
  const imagesStartX = (size - totalImagesWidth) / 2;

  // Try to fit text: reduce font size if too many lines
  let descFontSize = size * 0.13;
  let lines = wrapText(description, size * 0.85, descFontSize);
  while (
    lines.length * descFontSize > size * 0.35 &&
    descFontSize > size * 0.07
  ) {
    descFontSize *= 0.92;
    lines = wrapText(description, size * 0.85, descFontSize);
  }

  // Vertical centering logic
  const textBlockHeight = lines.length * descFontSize;
  const imagesBlockHeight = validItems.length === 0 ? 0 : imageSize;
  const spacingBetweenImagesAndText = validItems.length === 0 ? 0 : size * 0.08;
  const totalContentHeight =
    imagesBlockHeight + spacingBetweenImagesAndText + textBlockHeight;
  const contentStartY = (size - totalContentHeight) / 2;
  const imageY = contentStartY;
  const textYStart =
    contentStartY +
    imagesBlockHeight +
    spacingBetweenImagesAndText +
    descFontSize;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mb: 3,
        p: 2,
        border: "1px solid #333",
        borderRadius: 1,
        backgroundColor: "#1a1a1a",
      }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: "#888" }}>
        Tile Preview
      </Typography>
      <Box
        sx={{
          border: "1px solid #000",
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#181818",
          position: "relative",
        }}>
        <svg width={size} height={size} style={{ display: "block" }}>
          {/* Item images */}
          {validItems.slice(0, 3).map((item, idx) => {
            const itemName = item.trim();
            return (
              <image
                key={`${itemName}-${idx}`}
                href={getItemImgURL(itemName)}
                x={imagesStartX + idx * (imageSize + imageSpacing)}
                y={imageY}
                width={imageSize}
                height={imageSize}
                style={{ filter: "drop-shadow(0 0 2px #000000)" }}
              />
            );
          })}

          {/* Description text */}
          {description && (
            <text
              x={size / 2}
              y={textYStart}
              textAnchor="middle"
              fontSize={descFontSize}
              fill="#ccc"
              fontFamily="inherit"
              style={{ pointerEvents: "none", userSelect: "none" }}>
              {lines.map((line, i) => (
                <tspan
                  x={size / 2}
                  dy={i === 0 ? 0 : descFontSize * 1.1}
                  key={i}>
                  {line}
                </tspan>
              ))}
            </text>
          )}

          {/* Time indicator badge */}
          {state.showTimeIndicators && timeToComplete !== "" && (
            <g>
              <rect
                x={4}
                y={size - 24}
                width={Math.max(32, timeToComplete.toString().length * 8 + 16)}
                height={16}
                rx={8}
                fill="hsla(120, 100.00%, 76.70%, 0.00)"
                stroke="rgba(255, 255, 255, 00)"
                strokeWidth="1"
              />
              <text
                x={
                  4 +
                  Math.max(32, timeToComplete.toString().length * 8 + 16) / 2
                }
                y={size - 12}
                textAnchor="middle"
                dominantBaseline="top"
                fontSize={10}
                fill="#a0a0a0"
                fontFamily="inherit"
                fontWeight="bold"
                style={{ pointerEvents: "none", userSelect: "none" }}>
                {timeToComplete}h
              </text>
            </g>
          )}
        </svg>
      </Box>
    </Box>
  );
};

const CreateTileIdea = () => {
  const {
    state,
    setOpenCreateTileDialog,
    setEditingTileId,
    assignTileIdeaToBingoTile,
    setCreatingForBoardIndex,
  } = useAppState();
  const { tileIdeas, addTileIdea, updateTileIdea } = useTileIdeas();
  const [itemDescription, setItemDescription] = useState("");
  const [timeToComplete, setTimeToComplete] = useState<number | "">("");
  const [items, setItems] = useState([
    { name: "", previewImgURL: null as string | null },
  ]);

  // Check if we're editing an existing tile
  const editingTile = state.editingTileId
    ? tileIdeas.find((tile: TileIdea) => tile.id === state.editingTileId)
    : null;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingTile) {
      setItemDescription(editingTile.description);
      setTimeToComplete(editingTile.timeToComplete ?? "");
      setItems(
        editingTile.items.length > 0
          ? editingTile.items.map((item: string) => ({
              name: item,
              previewImgURL: getItemImgURL(item),
            }))
          : [{ name: "", previewImgURL: null }],
      );
    } else {
      // Reset form when creating new tile
      setItemDescription("");
      setTimeToComplete("");
      setItems([{ name: "", previewImgURL: null }]);
    }
  }, [editingTile]);

  const handleClose = () => {
    setOpenCreateTileDialog(false);
    setEditingTileId(null);
    setCreatingForBoardIndex(null);
    setItemDescription("");
    setTimeToComplete("");
    setItems([{ name: "", previewImgURL: null }]);
  };

  const handleSave = () => {
    const desc = itemDescription.trim();
    if (!desc) return;
    const validItems = items
      .map((item) => item.name.trim())
      .filter((name) => name.length > 0);

    const tileData = {
      items: validItems,
      description: desc,
      ...(timeToComplete !== "" && { timeToComplete: Number(timeToComplete) }),
    };

    if (editingTile) {
      // Update existing tile
      updateTileIdea({
        id: editingTile.id,
        ...tileData,
      });
    } else {
      // Create new tile
      const newTileId = nanoid();
      addTileIdea({
        id: newTileId,
        ...tileData,
      });

      // If we're creating for a specific board position, assign it
      if (state.creatingForBoardIndex !== null) {
        assignTileIdeaToBingoTile(state.creatingForBoardIndex, newTileId);
      }
    }

    handleClose();
  };

  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [
      newItems[index],
      newItems[index - 1],
    ];
    setItems(newItems);
  };

  const moveItemDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [
      newItems[index + 1],
      newItems[index],
    ];
    setItems(newItems);
  };

  return (
    <Dialog open={state.openCreateTileDialog}>
      <DialogTitle sx={{ textAlign: "center" }}>
        {editingTile ? "Edit Tile" : "Create Tile Idea"}
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        <TilePreview
          description={itemDescription}
          items={items.map((item) => item.name)}
          timeToComplete={timeToComplete}
        />
        <TextareaAutosize
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="Enter tile objective..."
          style={{
            fontFamily: "var(--font-family)",
            padding: 12,
            fontSize: 15,
            width: "100%",
            minHeight: 100,
            boxSizing: "border-box",
          }}
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Time to Complete (hours) - Optional
          </Typography>
          <TextField
            type="number"
            size="small"
            fullWidth
            placeholder="e.g., 2.5"
            value={timeToComplete === "" ? "" : timeToComplete}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setTimeToComplete("");
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  setTimeToComplete(numValue);
                }
              }
            }}
            inputProps={{
              min: 0,
              step: 0.5,
            }}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ my: 2 }}>
            Items
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map((item, idx) => (
              <Box
                key={idx}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  label="Item Name"
                  size="small"
                  placeholder="Rune Hasta"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].name = e.target.value;
                    setItems(newItems);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const newItems = [...items];
                      newItems[idx].previewImgURL = getItemImgURL(
                        item.name.trim(),
                      );
                      setItems(newItems);
                    }
                  }}
                  onBlur={() => {
                    if (item.name.trim()) {
                      const newItems = [...items];
                      newItems[idx].previewImgURL = getItemImgURL(
                        item.name.trim(),
                      );
                      setItems(newItems);
                    } else {
                      const newItems = [...items];
                      newItems[idx].previewImgURL = null;
                      setItems(newItems);
                    }
                  }}
                />
                <Box
                  sx={{
                    border: "1px solid #ffffff30",
                    width: 40,
                    height: 40,
                    padding: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 1,
                  }}>
                  {item.previewImgURL && (
                    <img
                      src={item.previewImgURL}
                      alt={item.name}
                      style={{
                        maxWidth: 32,
                        maxHeight: 32,
                        filter: "drop-shadow(0 0 2px #00000040)",
                      }}
                    />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setItems((items) => items.filter((_, i) => i !== idx));
                  }}
                  sx={{ minWidth: 0, ml: 1, py: 1, px: 1 }}>
                  <Icon icon="mdi:trash" width={20} height={20} />
                </Button>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => moveItemUp(idx)}
                    disabled={idx === 0}
                    sx={{ minWidth: 0, px: 1, py: 0 }}>
                    <Icon icon="mdi:chevron-up" width={16} height={16} />
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => moveItemDown(idx)}
                    disabled={idx === items.length - 1}
                    sx={{ minWidth: 0, px: 1, py: 0 }}>
                    <Icon icon="mdi:chevron-down" width={16} height={16} />
                  </Button>
                </Box>
              </Box>
            ))}
            <Button
              onClick={() =>
                setItems([...items, { name: "", previewImgURL: null }])
              }
              sx={{ alignSelf: "center", mt: 1 }}
              variant="outlined"
              startIcon={<Icon icon="mdi:plus" width={20} height={20} />}>
              Add Item
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 4, py: 2 }}>
        <Button variant="contained" color="error" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!itemDescription.trim()}>
          {editingTile ? "Save Changes" : "Add Tile"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTileIdea;
