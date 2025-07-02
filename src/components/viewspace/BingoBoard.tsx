import { Box } from "@mui/material";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useAppState, useTileIdeas, TileIdea } from "../../state";
import { BingoBoardTile } from "./BingoBoardTile";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
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
        transition,
        opacity: isDragging ? 0.5 : 1,
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
      <SortableContext
        items={state.bingoBoard.map((_, i) => `bingo-${i}`)}
        strategy={rectSortingStrategy}>
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
      </SortableContext>
    </BingoBoardHoverContext.Provider>
  );
};
