import { Box } from "@mui/material";
import { useState } from "react";
import {
  DndContext,
  rectIntersection,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { useAppState } from "../../state";
import { TileIdeasProvider, useTileIdeas, TileIdea } from "../../state";
import { PlayerCard } from "./Teams";
import Sidebar from "../sidebar/Sidebar";
import Viewspace from "./Viewspace";
import { BingoBoardTile } from "./BingoBoardTile";
import { getItemImgURL } from "../../utils/getItemImgURL";

export default function TeamsView() {
  const { state, assignPlayerToTeam, reorderPlayersInTeam } = useAppState();
  const { tileIdeas } = useTileIdeas();
  const [activeDrag, setActiveDrag] = useState<any>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveDrag(event.active);
    if (event.active.id.toString().startsWith("player-")) {
      setActiveType("player");
    } else {
      setActiveType(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    setActiveType(null);
    const { active, over } = event;
    if (!over) return;

    // Player dropped on team
    if (
      active.id.toString().startsWith("player-") &&
      over.id.toString().startsWith("team-")
    ) {
      const playerIndex = event.active.data?.current?.playerIndex;
      const teamIndex = Number(over.id.toString().replace("team-", ""));

      if (typeof playerIndex === "number") {
        const teamId = String(teamIndex);
        assignPlayerToTeam(playerIndex, teamId);
      }
    }

    // Player dropped on unassign area (sidebar players section)
    if (
      active.id.toString().startsWith("player-") &&
      over.id.toString() === "unassign-players"
    ) {
      const playerIndex = event.active.data?.current?.playerIndex;

      if (typeof playerIndex === "number") {
        assignPlayerToTeam(playerIndex, null);
      }
    }

    // Player reordering within team
    if (
      active.id.toString().startsWith("player-") &&
      over.id.toString().startsWith("player-") &&
      active.data?.current?.canReorder &&
      over.data?.current?.canReorder
    ) {
      const activeTeamIndex = active.data.current.teamIndex;
      const overTeamIndex = over.data.current.teamIndex;
      const activePositionInTeam = active.data.current.positionInTeam;
      const overPositionInTeam = over.data.current.positionInTeam;

      if (
        activeTeamIndex === overTeamIndex &&
        activePositionInTeam !== overPositionInTeam
      ) {
        reorderPlayersInTeam(
          String(activeTeamIndex),
          activePositionInTeam,
          overPositionInTeam,
        );
      }
    }
  };

  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}>
      <TileIdeasProvider>
        <Box sx={{ display: "flex" }}>
          <Sidebar tab="teams" />
          <Viewspace tab="teams" />
        </Box>
        <DragOverlay dropAnimation={null}>
          {activeType === "player" && activeDrag ? (
            <PlayerCard
              username={activeDrag.data?.current?.username || "Player"}
              combatLevel={activeDrag.data?.current?.combatLevel || null}
              isLoading={activeDrag.data?.current?.isLoading || false}
              hasError={activeDrag.data?.current?.hasError || false}
              stats={activeDrag.data?.current?.stats || null}
            />
          ) : null}
        </DragOverlay>
      </TileIdeasProvider>
    </DndContext>
  );
}
