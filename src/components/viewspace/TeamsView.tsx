import { Box } from "@mui/material";
import { useState, useCallback, useRef, useEffect } from "react";
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
  const [dragMode, setDragMode] = useState<"insert" | "swap" | null>(null);
  const [dragTarget, setDragTarget] = useState<{
    teamId: string;
    playerIndex?: number;
  } | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag(event.active);
    setActiveType(
      event.active.id.toString().startsWith("player-") ? "player" : null,
    );
    setDragMode(null);
    setDragTarget(null);
  }, []);

  // Track mouse movement during drag
  useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (event: MouseEvent) => {
      // Check what element the cursor is over
      const elementUnderCursor = document.elementFromPoint(
        event.clientX,
        event.clientY,
      );

      if (!elementUnderCursor) {
        setDragMode(null);
        setDragTarget(null);
        return;
      }

      // Check if cursor is over a team area FIRST
      const teamArea = elementUnderCursor.closest("[data-team-area]");
      if (teamArea) {
        const teamId = teamArea.getAttribute("data-team-id");
        if (teamId) {
          // Now check if we're specifically over a player card within this team
          const playerCard = elementUnderCursor.closest("[data-player-card]");
          if (playerCard) {
            const playerIndex = playerCard.getAttribute("data-player-index");
            const playerTeamId = playerCard.getAttribute("data-team-id");
            if (playerIndex && playerTeamId && playerTeamId === teamId) {
              setDragMode("swap");
              setDragTarget({ teamId, playerIndex: parseInt(playerIndex) });
              return;
            }
          }

          // Not over a player card, so it's an insert
          setDragMode("insert");
          setDragTarget({ teamId });
          return;
        }
      }

      // Not over any valid drop target
      setDragMode(null);
      setDragTarget(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [activeDrag]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      setActiveType(null);
      setDragMode(null);
      setDragTarget(null);

      const { active, over } = event;
      if (!over) return;

      const activeId = active.id.toString();
      const overId = over.id.toString();

      // Player dropped on team
      if (activeId.startsWith("player-") && overId.startsWith("team-")) {
        const playerIndex = event.active.data?.current?.playerIndex;
        const teamIndex = Number(overId.replace("team-", ""));

        if (typeof playerIndex === "number") {
          assignPlayerToTeam(playerIndex, String(teamIndex));
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
        <Viewspace tab="teams" dragMode={dragMode} dragTarget={dragTarget} />
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
