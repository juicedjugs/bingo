import { Box, ListItem, Typography, IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import React, { useState, useEffect, memo, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import getUserStats, { computeCombatLevel } from "../../utils/getUserStats";

interface PlayerItemProps {
  player: any;
  playerIndex: number;
  isClient: boolean;
  onRemove: (index: number) => void;
}

const PlayerItem = memo(
  ({ player, playerIndex, isClient, onRemove }: PlayerItemProps) => {
    const [combatLevel, setCombatLevel] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
      setIsHydrated(true);
    }, []);

    useEffect(() => {
      if (!isHydrated || !player.username) return;

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

      fetchCombatLevel();
    }, [player.username, isHydrated]);

    const dragData = useMemo(
      () => ({
        playerIndex,
        username: player.username,
        combatLevel,
        isLoading,
        hasError,
        stats,
      }),
      [playerIndex, player.username, combatLevel, isLoading, hasError, stats],
    );

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: `player-${playerIndex}`,
      data: dragData,
    });

    const displayText = () => {
      if (!isHydrated) return "...";
      if (isLoading) return "Loading...";
      if (hasError) return "Error";
      if (combatLevel !== null) return `${combatLevel}`;
      return "Unknown";
    };

    return (
      <div
        ref={isHydrated ? setNodeRef : undefined}
        style={{
          opacity: isHydrated && isDragging ? 0.5 : 1,
        }}>
        <Box
          sx={{
            border: "1px solid #ffffff20",
            borderRadius: 2,
            my: 1,
            px: 1,
            py: 2,
            bgcolor: "#232323",
            position: "relative",
            transition: "background 0.2s",
            "&:hover": { bgcolor: "#282828" },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Drag to assign to team">
              <IconButton
                size="small"
                {...(isHydrated ? attributes : {})}
                {...(isHydrated ? listeners : {})}
                sx={{
                  cursor: isHydrated ? "grab" : "default",
                  color: "text.secondary",
                  "&:hover": { color: "primary.main" },
                  "&:active": { cursor: isHydrated ? "grabbing" : "default" },
                }}
                onDoubleClick={() => onRemove(playerIndex)}>
                <Icon icon="mdi:drag" width={16} />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="body2">
                {player.username} ({displayText()})
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Remove">
            <IconButton
              size="small"
              color="error"
              onClick={() => onRemove(playerIndex)}>
              <Icon icon="mdi:trash" width={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </div>
    );
  },
);

PlayerItem.displayName = "PlayerItem";

export default PlayerItem;
