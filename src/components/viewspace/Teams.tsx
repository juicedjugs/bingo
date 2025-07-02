import React, { useState, useEffect } from "react";
import { Box, ListSubheader, Typography, Divider, Paper } from "@mui/material";
import { useAppState } from "../../state";
import PlayerCard from "./PlayerCard";
import TeamPlayerItem from "./TeamPlayerItem";
import TeamDroppable from "./TeamDroppable";
import { Player } from "./types";

const Teams = () => {
  const {
    state: { teams, players },
  } = useAppState();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    <Box sx={{ p: 4, width: "100%", maxWidth: 1600, mx: "auto" }}>
      <ListSubheader sx={{ fontSize: 24, mb: 2 }}>Teams</ListSubheader>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {teams.map((team, i) => (
          <TeamDroppable key={i} teamId={String(i)} isClient={isClient}>
            <Paper
              elevation={2}
              sx={{
                bgcolor: "#232323",
                border: "1px solid #ffffff20",
                borderRadius: 3,
                p: 2,
                mb: 1,
                position: "relative",
              }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {team.name}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  overflowX: "auto",
                  pb: 1,
                  "&::-webkit-scrollbar": {
                    height: 8,
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "#333",
                    borderRadius: 4,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#666",
                    borderRadius: 4,
                    "&:hover": {
                      backgroundColor: "#888",
                    },
                  },
                }}>
                {(teamPlayers[String(i)] || []).length === 0 ? (
                  <Typography sx={{ color: "#888", p: 1 }}>
                    (No players)
                  </Typography>
                ) : (
                  teamPlayers[String(i)].map((player, j) => {
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
                        />
                      </Box>
                    );
                  })
                )}
              </Box>
            </Paper>
          </TeamDroppable>
        ))}
      </Box>
    </Box>
  );
};

export default Teams;

// Export PlayerCard for use in drag overlay
export { PlayerCard };
