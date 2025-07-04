import { Box } from "@mui/material";
import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { useAppState } from "../../state";
import { useTileIdeas, TileIdea } from "../../state";
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag(event.active);
    setActiveType(
      event.active.id.toString().startsWith("player-") ? "player" : null,
    );
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      setActiveType(null);

      const { active, over } = event;
      if (!over) return;

      const activeId = active.id.toString();
      const overId = over.id.toString();

      // Player dropped on team
      if (activeId.startsWith("player-") && overId.startsWith("team-")) {
        const playerIndex = event.active.data?.current?.playerIndex;
        const teamId = overId.replace("team-", "");

        if (typeof playerIndex === "number") {
          assignPlayerToTeam(playerIndex, teamId);
        }
        return;
      }

      // Player dropped on unassign area
      if (activeId.startsWith("player-") && overId === "unassign-players") {
        const playerIndex = event.active.data?.current?.playerIndex;
        if (typeof playerIndex === "number") {
          assignPlayerToTeam(playerIndex, null);
        }
        return;
      }

      // Player reordering within team
      if (
        activeId.startsWith("player-") &&
        overId.startsWith("player-") &&
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
    },
    [assignPlayerToTeam, reorderPlayersInTeam],
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}>
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
            alwaysCollapsed={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
