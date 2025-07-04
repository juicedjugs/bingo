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

interface TeamsProps {
  dragMode?: "insert" | "swap" | null;
  dragTarget?: { teamId: string; playerIndex?: number } | null;
}

const Teams = ({ dragMode, dragTarget }: TeamsProps) => {
  const {
    state: { teams, players },
  } = useAppState();

  const [isClient, setIsClient] = useState(false);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<number>>(new Set());

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
          const isDragTarget = dragTarget?.teamId === teamId;
          const showInsertIndicator = dragMode === "insert" && isDragTarget;

          return (
            <TeamDroppable
              key={i}
              teamId={teamId}
              isClient={isClient}
              dragMode={dragMode}
              dragTarget={dragTarget}>
              <Paper
                elevation={2}
                data-team-area
                data-team-id={teamId}
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
                  ...(showInsertIndicator && {
                    borderColor: "#64b5f6",
                    boxShadow: "0 4px 12px rgba(100, 181, 246, 0.3)",
                    bgcolor: "rgba(100, 181, 246, 0.05)",
                  }),
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

                <Divider sx={{ mb: 1 }} />
                <Box
                  className="team-dropper"
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    minHeight: "120px",
                    position: "relative",
                  }}>
                  {(teamPlayers[teamId] || []).length === 0 ? (
                    <Typography sx={{ color: "#888", p: 1 }}>
                      (No players)
                    </Typography>
                  ) : (
                    teamPlayers[teamId].map((player, j) => {
                      const playerIndex = players.findIndex(
                        (p) =>
                          p.username === player.username &&
                          p.teamId === player.teamId,
                      );
                      const isSwapTarget =
                        dragMode === "swap" &&
                        dragTarget?.teamId === teamId &&
                        dragTarget?.playerIndex === playerIndex;

                      return (
                        <Box
                          key={`team-${i}-player-${j}`}
                          sx={{ flexShrink: 0 }}
                          data-player-card
                          data-player-index={playerIndex}
                          data-team-id={teamId}>
                          <TeamPlayerItem
                            player={player}
                            index={playerIndex}
                            teamIndex={i}
                            positionInTeam={j}
                            isClient={isClient}
                            forceCollapsed={collapsedTeams.has(i)}
                            isSwapTarget={isSwapTarget}
                          />
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Paper>
            </TeamDroppable>
          );
        })}
      </Box>
    </Box>
  );
};

export default Teams;

// Export PlayerCard for use in drag overlay
export { PlayerCard };
