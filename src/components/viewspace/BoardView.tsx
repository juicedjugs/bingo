import { Box } from "@mui/material";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { useAppState } from "../../state";
import { useTileIdeas, TileIdea } from "../../state";
import Sidebar from "../sidebar/Sidebar";
import Viewspace from "./Viewspace";
import { BingoBoardTile } from "./BingoBoardTile";
import { getItemImgURL } from "../../utils/getItemImgURL";

export default function BoardView() {
  const {
    state,
    reorderBingoBoard,
    assignTileIdeaToBingoTile,
    clearBingoTile,
  } = useAppState();
  const { tileIdeas } = useTileIdeas();
  const [activeDrag, setActiveDrag] = useState<any>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTileIdea, setActiveTileIdea] = useState<any>(null);
  const [activeBingoTile, setActiveBingoTile] = useState<any>(null);

  const handleDragStart = (event: any) => {
    setActiveDrag(event.active);
    if (event.active.id.toString().startsWith("tile-idea-")) {
      setActiveType("tile-idea");
      setActiveTileIdea(event.active.data?.current?.tileIdea);
      setActiveBingoTile(null);
    } else if (event.active.id.toString().startsWith("bingo-")) {
      setActiveType("bingo-tile");
      const idx = Number(event.active.id.toString().replace("bingo-", ""));
      const bingoTile = state.bingoBoard[idx];
      const tileIdea = tileIdeas.find((t: TileIdea) => t.id === bingoTile.id);
      setActiveBingoTile(
        tileIdea
          ? { ...tileIdea, scale: state.scale, id: bingoTile.id }
          : { id: "", description: "", items: [], scale: state.scale },
      );
      setActiveTileIdea(null);
    } else {
      setActiveType(null);
      setActiveTileIdea(null);
      setActiveBingoTile(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    setActiveType(null);
    setActiveTileIdea(null);
    setActiveBingoTile(null);
    const { active, over } = event;
    if (!over) return;

    // Tile idea dropped on bingo tile
    if (
      active.id.toString().startsWith("tile-idea-") &&
      over.id.toString().startsWith("bingo-")
    ) {
      const tileIndex = Number(over.id.toString().replace("bingo-", ""));
      const tileIdea = event.active.data?.current?.tileIdea;
      if (tileIdea?.id) {
        assignTileIdeaToBingoTile(tileIndex, tileIdea.id);
      }
    }

    // Bingo tile swapping (only swap if different positions)
    if (
      active.id.toString().startsWith("bingo-") &&
      over.id.toString().startsWith("bingo-")
    ) {
      const fromIndex = Number(active.id.toString().replace("bingo-", ""));
      const toIndex = Number(over.id.toString().replace("bingo-", ""));
      if (fromIndex !== toIndex) {
        reorderBingoBoard(fromIndex, toIndex);
      }
    }

    // Bingo tile dropped on unassign area (tile ideas list)
    if (
      active.id.toString().startsWith("bingo-") &&
      over.id.toString() === "unassign-tile-ideas"
    ) {
      const tileIndex = Number(active.id.toString().replace("bingo-", ""));
      // Clear the bingo tile (unassign it)
      clearBingoTile(tileIndex);
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}>
      <Box sx={{ display: "flex" }}>
        <Sidebar tab="board" />
        <Viewspace tab="board" />
      </Box>
      <DragOverlay dropAnimation={null}>
        {activeType === "tile-idea" && activeTileIdea ? (
          <Box
            sx={{
              background: "#222",
              color: "#fff",
              borderRadius: 2,
              boxShadow: 3,
              p: 2,
              minWidth: 120,
              minHeight: 60,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.95,
            }}>
            <Box>{activeTileIdea.description}</Box>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              {activeTileIdea.items?.slice(0, 3).map((item: string) => (
                <img
                  key={item}
                  src={getItemImgURL(item)}
                  alt={item}
                  height={28}
                  width={28}
                  style={{ filter: "drop-shadow(0 0 2px #000000)" }}
                />
              ))}
            </Box>
          </Box>
        ) : null}
        {activeType === "bingo-tile" && activeBingoTile ? (
          <BingoBoardTile
            id={activeBingoTile.id}
            description={activeBingoTile.description}
            items={activeBingoTile.items}
            scale={activeBingoTile.scale}
            row={0}
            col={0}
            dimension={1}
            forceAllBorders={true}
            tileIndex={0}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
