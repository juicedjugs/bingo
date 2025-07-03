import { Box } from "@mui/material";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { getItemImgURL } from "../../utils/getItemImgURL";
import { useAppState, useTileIdeas } from "../../state";

interface BingoBoardTileProps {
  id: string;
  description: string;
  items: string[];
  scale: number;
  row: number;
  col: number;
  dimension: number;
  forceAllBorders?: boolean;
  tileIndex: number;
  dragListeners?: any;
  dragAttributes?: any;
  tileIdeaId?: string | null;
}

export const BingoBoardTile = ({
  id,
  items,
  description,
  scale,
  row,
  col,
  dimension,
  forceAllBorders = false,
  tileIndex,
  dragListeners,
  dragAttributes,
  tileIdeaId,
}: BingoBoardTileProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { active } = useDndContext();
  const {
    state,
    setOpenCreateTileDialog,
    setEditingTileId,
    clearBingoTile,
    setCreatingForBoardIndex,
  } = useAppState();
  const { tileIdeas } = useTileIdeas();
  const [isHovered, setIsHovered] = useState(false);
  const [isOverIcons, setIsOverIcons] = useState(false);

  const isTileIdeaOver =
    isOver && active?.id?.toString().startsWith("tile-idea-");
  const isBingoTileOver =
    isOver && active?.id?.toString().startsWith("bingo-") && active.id !== id;
  const size = 150 * (scale / 100);

  // Get the tile idea to access timeToComplete
  const tileIdea = tileIdeaId
    ? tileIdeas.find((tile: any) => tile.id === tileIdeaId)
    : null;

  // Layout: images in a row at the top, description text below
  const imageSize = size * 0.28; // up to 3 images, with some padding
  const imageSpacing = items.length === 3 ? size * 0.015 : size * 0.04;
  const numImages = Math.min(items.length, 3);
  const totalImagesWidth =
    numImages * imageSize + (numImages - 1) * imageSpacing;
  const imagesStartX = (size - totalImagesWidth) / 2;

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

  // --- Vertical centering logic ---
  const textBlockHeight = lines.length * descFontSize;
  const imagesBlockHeight = items.length === 0 ? 0 : imageSize;
  const spacingBetweenImagesAndText = items.length === 0 ? 0 : size * 0.08;
  const totalContentHeight =
    imagesBlockHeight + spacingBetweenImagesAndText + textBlockHeight;
  const contentStartY = (size - totalContentHeight) / 2;
  const imageY = contentStartY;
  const textYStart =
    contentStartY +
    imagesBlockHeight +
    spacingBetweenImagesAndText +
    descFontSize; // baseline for first line
  // --- End vertical centering logic ---

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tileIdeaId) {
      setEditingTileId(tileIdeaId);
      setCreatingForBoardIndex(null);
      setOpenCreateTileDialog(true);
    } else {
      // For empty tiles, open create dialog normally
      setEditingTileId(null);
      setCreatingForBoardIndex(tileIndex);
      setOpenCreateTileDialog(true);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearBingoTile(tileIndex);
  };

  // Only apply drag listeners if not over icons
  const effectiveDragListeners = isOverIcons ? {} : dragListeners;
  const effectiveDragAttributes = isOverIcons ? {} : dragAttributes;

  return (
    <Box
      ref={setNodeRef as unknown as (el: HTMLDivElement | null) => void}
      data-droppable={isTileIdeaOver ? "true" : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsOverIcons(false);
      }}
      {...effectiveDragAttributes}
      {...effectiveDragListeners}
      sx={{
        border: "1px solid #000",
        cursor: "grab",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        position: "relative",
      }}>
      {/* Hover icons - positioned outside drag area */}
      {isHovered && (
        <Box
          onMouseEnter={() => setIsOverIcons(true)}
          onMouseLeave={() => setIsOverIcons(false)}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            display: "flex",
            gap: 1,
            zIndex: 10,
          }}>
          <Box
            onClick={handleEditClick}
            sx={{
              width: 24,
              height: 24,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.9)",
              },
            }}>
            <Icon
              icon={tileIdeaId ? "mdi:pencil" : "mdi:plus"}
              width={16}
              height={16}
              color="#fff"
            />
          </Box>
          {tileIdeaId && (
            <Box
              onClick={handleDeleteClick}
              sx={{
                width: 24,
                height: 24,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(255, 0, 0, 0.8)",
                },
              }}>
              <Icon icon="mdi:trash" width={16} height={16} color="#fff" />
            </Box>
          )}
        </Box>
      )}

      {/* SVG content - this is the drag area */}
      <svg width={size} height={size} style={{ display: "block" }}>
        {/* Green highlight for tile idea drop */}
        {isTileIdeaOver && (
          <rect x={0} y={0} width={size} height={size} fill="#00c85322" />
        )}
        {/* Green highlight for bingo tile swap */}
        {isBingoTileOver && (
          <rect
            x={0}
            y={0}
            width={size}
            height={size}
            fill="#00c85322"
            stroke="#00c853"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
        {/* Item images */}
        {items.slice(0, 3).map((item, idx) => (
          <image
            key={item}
            href={getItemImgURL(item)}
            x={imagesStartX + idx * (imageSize + imageSpacing)}
            y={imageY}
            width={imageSize}
            height={imageSize}
            style={{ filter: "drop-shadow(0 0 2px #000000)" }}
          />
        ))}
        {/* Description text */}
        <text
          x={size / 2}
          y={textYStart}
          textAnchor="middle"
          fontSize={descFontSize}
          fill="#ccc"
          fontFamily="inherit"
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {lines.map((line, i) => (
            <tspan x={size / 2} dy={i === 0 ? 0 : descFontSize * 1.1} key={i}>
              {line}
            </tspan>
          ))}
        </text>
        {/* Time indicator badge */}
        {state.showTimeIndicators && tileIdea?.timeToComplete && (
          <g>
            <rect
              x={4}
              y={size - 24}
              width={Math.max(
                32,
                tileIdea.timeToComplete.toString().length * 8 + 16,
              )}
              height={16}
              rx={8}
              fill="hsla(120, 100.00%, 76.70%, 0.00)"
              stroke="rgba(255, 255, 255, 00)"
              strokeWidth="1"
            />
            <text
              x={
                4 +
                Math.max(
                  32,
                  tileIdea.timeToComplete.toString().length * 8 + 16,
                ) /
                  2
              }
              y={size - 12}
              textAnchor="middle"
              dominantBaseline="top"
              fontSize={10}
              fill="#a0a0a0"
              fontFamily="inherit"
              fontWeight="bold"
              style={{ pointerEvents: "none", userSelect: "none" }}>
              {tileIdea.timeToComplete}h
            </text>
          </g>
        )}
      </svg>
    </Box>
  );
};
