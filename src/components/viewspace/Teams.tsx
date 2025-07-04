import React, { useState, useEffect } from "react";
import {
  Box,
  ListSubheader,
  Typography,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useAppState } from "../../state";
import PlayerCard from "./PlayerCard";
import TeamPlayerItem from "./TeamPlayerItem";
import TeamDroppable from "./TeamDroppable";
import { Player } from "./types";
import BossIconFilterDialog from "../sidebar/BossIconFilterDialog";
import { useDndContext } from "@dnd-kit/core";

const Teams = () => {
  const {
    state: { teams, players },
    assignPlayerToTeam,
  } = useAppState();

  const [isClient, setIsClient] = useState(false);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<number>>(new Set());
  const [openBossFilter, setOpenBossFilter] = useState(false);
  const { active } = useDndContext();
  const isDragging = !!active;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleTeamCollapse = (teamIndex: number) => {
    setCollapsedTeams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teamIndex)) {
        newSet.delete(teamIndex);
      } else {
        newSet.add(teamIndex);
      }
      return newSet;
    });
  };

  const clearTeamPlayers = (teamId: string) => {
    // Find all players in this team and unassign them
    players.forEach((player, index) => {
      if (player.teamId === teamId) {
        assignPlayerToTeam(index, null);
      }
    });
  };

  // Only render static content during server/initial client render to avoid hydration mismatch
  if (!isClient) {
    return (
      <Box sx={{ p: 4, width: "100%", maxWidth: 1600, mx: "auto" }}>
        <ListSubheader sx={{ fontSize: 24, mb: 2 }}>Teams</ListSubheader>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Static placeholder for server render */}
        </Box>
      </Box>
    );
  }

  // Group players by teamId
  const teamPlayers: {
    [teamId: string]: Player[];
  } = {};
  players.forEach((player) => {
    if (player.teamId !== null) {
      if (!teamPlayers[player.teamId]) teamPlayers[player.teamId] = [];
      teamPlayers[player.teamId].push(player);
    }
  });

  return (
    <Box sx={{ p: 4, mx: "auto", maxWidth: 1200, width: "100%" }}>
      <Typography sx={{ fontSize: 24, mb: 2 }}>
        Teams ({teams.length})
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {teams.map((team, i) => {
          const teamId = String(i);
          const hasPlayers = (teamPlayers[teamId] || []).length > 0;

          return (
            <Paper
              key={i}
              elevation={2}
              sx={{
                bgcolor: "#232323",
                border: "1px solid #ffffff20",
                borderRadius: 3,
                mb: 1,
                position: "relative",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#64b5f6",
                  boxShadow: "0 4px 12px rgba(100, 181, 246, 0.2)",
                },
              }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: 2,
                }}>
                <Typography variant="h6">
                  {team.name} ({teamPlayers[teamId]?.length || 0} Players)
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Boss filter settings">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenBossFilter(true);
                      }}
                      sx={{ color: "primary.main" }}>
                      <Icon icon="mdi:cog" width={20} height={20} />
                    </IconButton>
                  </Tooltip>
                  {hasPlayers && (
                    <Tooltip title="Clear all players from team">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Remove all players from ${team.name}?`,
                            )
                          ) {
                            clearTeamPlayers(teamId);
                          }
                        }}
                        sx={{
                          color: "#ff6b6b",
                          "&:hover": {
                            bgcolor: "rgba(255, 107, 107, 0.1)",
                          },
                        }}>
                        <Icon icon="mdi:delete" width={20} height={20} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip
                    title={collapsedTeams.has(i) ? "Show stats" : "Hide stats"}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTeamCollapse(i);
                      }}
                      sx={{ color: "primary.main" }}>
                      <Icon
                        icon={
                          collapsedTeams.has(i)
                            ? "mdi:chevron-right"
                            : "mdi:chevron-down"
                        }
                        width={24}
                        height={24}
                      />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ mb: 1 }} />

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "120px",
                  position: "relative",
                  p: 2,
                }}>
                {/* Drop placeholder - only shows when dragging */}
                {isDragging && (
                  <TeamDroppable teamId={teamId} isClient={isClient}>
                    <Box
                      sx={{
                        width: 240,
                        height: 120,
                        border: "2px dashed #64b5f6",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "rgba(100, 181, 246, 0.1)",
                        animation: "pulse 1.5s ease-in-out infinite",
                        "@keyframes pulse": {
                          "0%": { opacity: 0.7 },
                          "50%": { opacity: 1 },
                          "100%": { opacity: 0.7 },
                        },
                      }}>
                      <Typography
                        variant="body2"
                        color="#64b5f6"
                        sx={{ fontWeight: "bold" }}>
                        Drop here
                      </Typography>
                    </Box>
                  </TeamDroppable>
                )}

                {/* Existing player cards */}
                {(teamPlayers[teamId] || []).map((player, j) => {
                  const playerIndex = players.findIndex(
                    (p) =>
                      p.username === player.username &&
                      p.teamId === player.teamId,
                  );

                  return (
                    <Box key={`team-${i}-player-${j}`} sx={{ flexShrink: 0 }}>
                      <TeamPlayerItem
                        player={player}
                        index={playerIndex}
                        teamIndex={i}
                        positionInTeam={j}
                        isClient={isClient}
                        forceCollapsed={collapsedTeams.has(i)}
                      />
                    </Box>
                  );
                })}

                {/* Show "no players" message when not dragging and no players */}
                {!isDragging && (teamPlayers[teamId] || []).length === 0 && (
                  <Typography sx={{ color: "#888", p: 1 }}>
                    (No players)
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Boss Filter Dialog */}
      <BossIconFilterDialog
        open={openBossFilter}
        onClose={() => setOpenBossFilter(false)}
      />
    </Box>
  );
};

export default Teams;

// Export PlayerCard for use in drag overlay
export { PlayerCard };
