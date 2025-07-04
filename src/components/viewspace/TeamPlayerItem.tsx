import React, { useState, useEffect, memo, useMemo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import getUserStats, {
  computeCombatLevel,
  UserStats,
} from "../../utils/getUserStats";
import PlayerCard from "./PlayerCard";
import { Player } from "./types";
import { useAppState } from "../../state";

export interface TeamPlayerItemProps {
  player: Player;
  index: number;
  teamIndex: number;
  positionInTeam: number;
  isClient: boolean;
  forceCollapsed?: boolean;
}

const TeamPlayerItem = memo(
  ({
    player,
    index,
    teamIndex,
    positionInTeam,
    isClient,
    forceCollapsed = false,
  }: TeamPlayerItemProps) => {
    const { state, assignPlayerToTeam } = useAppState();
    const playerStats = state.playerStats[player.username];

    // Get combat level from stats if available
    const combatLevel = playerStats?.stats?.skills
      ? computeCombatLevel(playerStats.stats.skills)
      : null;

    const isLoading = !playerStats;
    const hasError = false; // We'll handle errors differently now
    const stats = playerStats?.stats || null;

    // Memoize the drag data to ensure it updates when stats change
    const dragData = useMemo(
      () => ({
        playerIndex: index,
        username: player.username,
        teamId: player.teamId,
        teamIndex,
        positionInTeam,
        // Include current stats data for drag overlay
        combatLevel,
        isLoading,
        hasError,
        stats,
      }),
      [
        index,
        player.username,
        player.teamId,
        teamIndex,
        positionInTeam,
        combatLevel,
        isLoading,
        hasError,
        stats,
      ],
    );

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: `player-${index}`,
      data: {
        ...dragData,
        // Add sortable data for reordering
        sortableId: `team-${teamIndex}-player-${positionInTeam}`,
        canReorder: true,
      },
    });

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
      id: `player-${index}`,
      data: {
        ...dragData,
        // Add sortable data for reordering
        sortableId: `team-${teamIndex}-player-${positionInTeam}`,
        canReorder: true,
      },
    });

    const style = {
      opacity: isClient && isDragging ? 0.5 : 1,
    };

    // Combine both refs
    const setRefs = (element: HTMLElement | null) => {
      if (isClient) {
        setNodeRef(element);
        setDroppableRef(element);
      }
    };

    return (
      <div ref={isClient ? setRefs : undefined} style={style}>
        <PlayerCard
          username={player.username}
          combatLevel={combatLevel}
          isLoading={isLoading}
          hasError={hasError}
          stats={stats}
          dragListeners={isClient ? listeners : undefined}
          dragAttributes={isClient ? attributes : undefined}
          isDropTarget={isClient && isOver}
          onUnassign={() => assignPlayerToTeam(index, null)}
          alwaysCollapsed={forceCollapsed}
        />
      </div>
    );
  },
);

TeamPlayerItem.displayName = "TeamPlayerItem";

export default TeamPlayerItem;
