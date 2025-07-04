import { Box, ListItem, Typography, IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import React, { useState, useEffect, memo, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useAppState } from "../../state";
import { computeCombatLevel } from "../../utils/getUserStats";

interface PlayerItemProps {
  player: any;
  playerIndex: number;
  isClient: boolean;
  onRemove: (index: number) => void;
}

const PlayerItem = memo(
  ({ player, playerIndex, isClient, onRemove }: PlayerItemProps) => {
    const { state } = useAppState();
    const playerStats = state.playerStats[player.username];

    // Get combat level from stats if available
    const combatLevel = playerStats?.stats?.skills
      ? computeCombatLevel(playerStats.stats.skills)
      : null;

    const isLoading = !playerStats;
    const hasError = false; // We'll handle errors differently now
    const stats = playerStats?.stats || null;

    // Get weight and rank from state
    const weight = playerStats?.weight || 0;

    // Compute rank from all players in state
    const allPlayers = Object.entries(state.playerStats).map(
      ([name, data]) => ({
        username: name,
        weight: data.weight,
      }),
    );
    const sortedPlayers = allPlayers.sort((a, b) => b.weight - a.weight);
    const rank =
      sortedPlayers.findIndex((p) => p.username === player.username) + 1;

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
      if (isLoading) return "Loading...";
      if (hasError) return "Error";
      if (combatLevel !== null) return `${combatLevel}`;
      return "Unknown";
    };

    return (
      <div
        ref={!isLoading ? setNodeRef : undefined}
        style={{
          opacity: !isLoading && isDragging ? 0.5 : 1,
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
                {...(!isLoading ? attributes : {})}
                {...(!isLoading ? listeners : {})}
                sx={{
                  cursor: !isLoading ? "grab" : "default",
                  color: "text.secondary",
                  "&:hover": { color: "primary.main" },
                  "&:active": { cursor: !isLoading ? "grabbing" : "default" },
                }}
                onDoubleClick={() => onRemove(playerIndex)}>
                <Icon icon="mdi:drag" width={16} />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="body2">
                {player.username} ({displayText()})
              </Typography>
              {!isLoading && (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}>
                  {weight.toLocaleString()} (Rank {rank})
                </Typography>
              )}
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
