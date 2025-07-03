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
}

const TeamPlayerItem = memo(
  ({
    player,
    index,
    teamIndex,
    positionInTeam,
    isClient,
  }: TeamPlayerItemProps) => {
    const [combatLevel, setCombatLevel] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [stats, setStats] = useState<UserStats | null>(null);
    const { assignPlayerToTeam } = useAppState();

    useEffect(() => {
      const fetchCombatLevel = async () => {
        try {
          setIsLoading(true);
          setHasError(false);
          const stats = await getUserStats(player.username);
          setStats(stats);
          const level = computeCombatLevel(stats.skills);
          setCombatLevel(level);
        } catch (error) {
          console.error(`Failed to fetch stats for ${player.username}:`, error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };
      if (player.username) {
        fetchCombatLevel();
      }
    }, [player.username]);

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
        />
      </div>
    );
  },
);

TeamPlayerItem.displayName = "TeamPlayerItem";

export default TeamPlayerItem;
