import { Box, Typography } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { useAppState, useTileIdeas, TileIdea } from "../../state";
import { BingoBoardTile } from "./BingoBoardTile";
import { useState } from "react";
import React from "react";
import { BingoBoardHoverContext } from "./BingoBoardHoverContext";

interface SortableBingoBoardTileProps {
  id: string;
  description: string;
  items: string[];
  scale: number;
  index: number;
  row: number;
  col: number;
  dimension: number;
  tileIndex: number;
  tileIdeaId: string | null;
}

function SortableBingoBoardTile({
  id,
  description,
  items,
  scale,
  row,
  col,
  dimension,
  tileIndex,
  tileIdeaId,
}: SortableBingoBoardTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition: isDragging ? "none" : transition || "transform 150ms ease",
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 1,
        transformOrigin: "center center",
      }}>
      <BingoBoardTile
        id={id}
        description={description}
        items={items}
        scale={scale}
        row={row}
        col={col}
        dimension={dimension}
        tileIndex={tileIndex}
        dragListeners={listeners}
        dragAttributes={attributes}
        tileIdeaId={tileIdeaId}
      />
    </div>
  );
}

interface BingoTimeSummaryProps {
  dimension: number;
  board: TileIdea[];
  scale: number;
  children: React.ReactNode;
}

function BingoTimeSummary({
  dimension,
  board,
  scale,
  children,
}: BingoTimeSummaryProps) {
  const { state } = useAppState();
  const tileSize = 150 * (scale / 100);

  // Calculate time summaries
  const getTimeForTile = (index: number) => {
    const tile = board[index];
    // Only count tiles that have actual content (description or items)
    if (
      !tile ||
      (!tile.description && (!tile.items || tile.items.length === 0))
    ) {
      return 0; // Empty tiles don't contribute time
    }
    return tile.timeToComplete || 1; // Default to 1 hour if no time specified
  };

  // Row totals
  const rowTotals = Array.from({ length: dimension }, (_, row) => {
    let total = 0;
    for (let col = 0; col < dimension; col++) {
      total += getTimeForTile(row * dimension + col);
    }
    return total;
  });

  // Column totals
  const colTotals = Array.from({ length: dimension }, (_, col) => {
    let total = 0;
    for (let row = 0; row < dimension; row++) {
      total += getTimeForTile(row * dimension + col);
    }
    return total;
  });

  // Diagonal totals
  let mainDiagTotal = 0;
  let antiDiagTotal = 0;
  for (let i = 0; i < dimension; i++) {
    mainDiagTotal += getTimeForTile(i * dimension + i); // Top-left to bottom-right
    antiDiagTotal += getTimeForTile(i * dimension + (dimension - 1 - i)); // Top-right to bottom-left
  }

  const formatTime = (hours: number) => {
    if (hours === 0) return "";
    if (hours < 1) return `${(hours * 60).toFixed(0)}m`;
    if (hours % 1 === 0) return `${hours}h`;
    return `${hours}h`;
  };

  // Don't show time summaries if showTimeIndicators is false
  if (!state.showTimeIndicators) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: "relative", display: "inline-block" }}>
      {children}
      {/* Row totals - right side */}
      <Box
        sx={{
          position: "absolute",
          right: -60,
          top: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}>
        {rowTotals.map((total, index) => (
          <Box
            key={`row-${index}`}
            sx={{
              height: tileSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 50,
            }}>
            <Typography
              variant="caption"
              sx={{
                color: "#888",
                fontWeight: "bold",
                fontSize: Math.max(10, tileSize * 0.06),
              }}>
              {formatTime(total)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Column totals - bottom */}
      <Box
        sx={{
          position: "absolute",
          bottom: -40,
          left: 0,
          display: "flex",
          width: "100%",
        }}>
        {colTotals.map((total, index) => (
          <Box
            key={`col-${index}`}
            sx={{
              width: tileSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 30,
            }}>
            <Typography
              variant="caption"
              sx={{
                color: "#888",
                fontWeight: "bold",
                fontSize: Math.max(10, tileSize * 0.06),
              }}>
              {formatTime(total)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Diagonal totals - corners */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -60,
          minWidth: 50,
          minHeight: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Typography
          variant="caption"
          sx={{
            color: "#888",
            fontWeight: "bold",
            fontSize: Math.max(10, tileSize * 0.06),
          }}>
          {formatTime(mainDiagTotal)}
        </Typography>
      </Box>

      <Box
        sx={{
          position: "absolute",
          bottom: -40,
          right: -60,
          minWidth: 50,
          minHeight: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Typography
          variant="caption"
          sx={{
            color: "#888",
            fontWeight: "bold",
            fontSize: Math.max(10, tileSize * 0.06),
          }}>
          {formatTime(antiDiagTotal)}
        </Typography>
      </Box>
    </Box>
  );
}

export const BingoBoard = () => {
  const { state } = useAppState();
  const { tileIdeas } = useTileIdeas();
  const dimension = state.dimension;
  const board = state.bingoBoard.map(
    ({ id }) =>
      tileIdeas.find((tile: TileIdea) => tile.id === id) || {
        id: "",
        items: [],
        description: "",
      },
  );
  const [hoveredTileIndex, setHoveredTileIndex] = useState<number | null>(null);

  return (
    <BingoBoardHoverContext.Provider
      value={{ hoveredTileIndex, setHoveredTileIndex }}>
      <BingoTimeSummary dimension={dimension} board={board} scale={state.scale}>
        <Box
          sx={{
            backgroundColor: "#181818",
            border: "1px solid #000",
            display: "inline-grid",
            boxSizing: "border-box",
            gridTemplateColumns: `repeat(${dimension}, 1fr)`,
            gridTemplateRows: `repeat(${dimension}, 1fr)`,
          }}>
          {board.map((tile, index) => {
            const row = Math.floor(index / dimension);
            const col = index % dimension;
            return (
              <SortableBingoBoardTile
                key={index}
                id={`bingo-${index}`}
                description={tile.description}
                items={tile.items}
                scale={state.scale}
                index={index}
                row={row}
                col={col}
                dimension={dimension}
                tileIndex={index}
                tileIdeaId={tile.id}
              />
            );
          })}
        </Box>
      </BingoTimeSummary>
    </BingoBoardHoverContext.Provider>
  );
};
