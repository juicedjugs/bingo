import {
  Box,
  List,
  ListItem,
  ListSubheader,
  Divider,
  Button,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useState, useEffect, useMemo } from "react";
import { useAppState } from "../../state";
import type { Player } from "../viewspace/types";
import PlayerItem from "./SidebarTeamsPlayerItem";
import TeamItem from "./SidebarTeamsTeamItem";
import UnassignDroppable from "./SidebarTeamsUnassignDroppable";
import SnackbarNotification from "./SnackbarNotification";

const SidebarTeams = () => {
  const {
    state: { teams, players },
    addTeam,
    addPlayer,
    editTeam,
    removeTeam,
    removePlayer,
  } = useAppState();

  const [newTeamName, setNewTeamName] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  useEffect(() => {
    setIsClient(window ? true : false);
    setIsHydrated(true);
  }, []);

  // Helper to show snackbar
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((s) => ({ ...s, open: false }));
  };

  // Clipboard Export
  const handleExportPlayers = async () => {
    try {
      if (!players || players.length === 0) {
        showSnackbar("No players to export.", "info");
        return;
      }
      await navigator.clipboard.writeText(JSON.stringify(players, null, 2));
      showSnackbar("Exported players to clipboard!", "success");
    } catch (err) {
      showSnackbar("Failed to export to clipboard.", "error");
    }
  };

  // Clipboard Import
  const handleImportPlayers = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showSnackbar("Clipboard is empty.", "info");
        return;
      }
      let imported: Player[] = [];
      try {
        imported = JSON.parse(text);
      } catch (e) {
        showSnackbar("Clipboard does not contain valid JSON.", "error");
        return;
      }
      if (!Array.isArray(imported)) {
        showSnackbar("Clipboard JSON is not a list.", "error");
        return;
      }
      // Filter valid players (must have username, teamId can be null)
      imported = imported.filter(
        (p) =>
          p &&
          typeof p.username === "string" &&
          p.username.trim().length > 0 &&
          (p.teamId === null || typeof p.teamId === "string"),
      );
      if (imported.length === 0) {
        showSnackbar("No valid players found in clipboard.", "info");
        return;
      }
      // Deduplicate by username
      const existingUsernames = new Set(
        players?.map((p: Player) => p.username.toLowerCase()) || [],
      );
      const newOnes = imported.filter(
        (p) => !existingUsernames.has(p.username.toLowerCase()),
      );
      const duplicates = imported.length - newOnes.length;
      if (newOnes.length === 0) {
        showSnackbar("All imported players are duplicates.", "info");
        return;
      }
      newOnes.forEach((player) => addPlayer(player.username));
      showSnackbar(
        `Imported ${newOnes.length} player${newOnes.length > 1 ? "s" : ""}${
          duplicates > 0
            ? ` (${duplicates} duplicate${duplicates > 1 ? "s" : ""} skipped)`
            : ""
        }!`,
        "success",
      );
    } catch (err) {
      showSnackbar("Failed to import from clipboard.", "error");
    }
  };

  const handleAddTeam = () => {
    const trimmedName = newTeamName.trim();
    if (trimmedName) {
      // Check for duplicate team names
      const isDuplicate = teams.some(
        (team) => team.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (!isDuplicate) {
        addTeam(trimmedName);
        setNewTeamName("");
      }
    }
  };

  const handleAddPlayer = () => {
    const trimmedUsername = newPlayerName.trim();
    if (trimmedUsername) {
      // Check for duplicate player usernames
      const isDuplicate = players?.some(
        (player) =>
          player.username.toLowerCase() === trimmedUsername.toLowerCase(),
      );

      if (!isDuplicate) {
        addPlayer(trimmedUsername);
        setNewPlayerName("");
      }
    }
  };

  // Memoize teams list to prevent re-renders when only players change
  const teamsList = useMemo(() => {
    // Only render teams after hydration to prevent mismatch
    const teamsToRender = !isHydrated ? [] : teams;
    return teamsToRender.map((team, i) => (
      <TeamItem
        key={`team-${i}-${team.name}`}
        team={team}
        teamIndex={i}
        onEdit={editTeam}
        onRemove={removeTeam}
      />
    ));
  }, [teams, editTeam, removeTeam, isHydrated]);

  // Safe display functions that handle hydration
  const getTeamsCount = () => {
    if (!isHydrated) return 0;
    return teams.length;
  };

  const getPlayersCount = () => {
    if (!isHydrated) return 0;
    return players ? players.length : 0;
  };

  // Get players safely for rendering
  const getPlayersForRender = () => {
    if (!isHydrated) return [];

    return players.filter((player) => player.teamId === null) || [];
  };

  // Get the original index of a player in the players array
  const getOriginalPlayerIndex = (player: any) => {
    return players.findIndex((p) => p.username === player.username);
  };

  return (
    <>
      {/* Teams Section - Simple list for team management */}
      <ListSubheader>Teams ({getTeamsCount()})</ListSubheader>

      <ListItem
        sx={{
          flex: 1,
          maxHeight: "30vh",
          overflowY: "auto",
          mb: 1,
          px: 2,
          display: "block",
        }}>
        <List disablePadding>{teamsList}</List>
      </ListItem>

      <ListItem sx={{ display: "flex", gap: 1, my: 2, px: 2 }}>
        <TextField
          placeholder="New team name"
          value={newTeamName}
          size="small"
          fullWidth
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTeam()}
        />
        <Button variant="contained" size="small" onClick={handleAddTeam}>
          Add
        </Button>
      </ListItem>

      <Divider sx={{ my: 1 }} />

      {/* Players Section - Draggable unassigned players */}
      <ListSubheader
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}>
        <span>Players ({getPlayersCount()})</span>
        <Box>
          <Tooltip title="Import Players from Clipboard">
            <IconButton
              color="inherit"
              sx={{ p: 0.5 }}
              onClick={handleImportPlayers}>
              <Icon icon="mdi:clipboard-text" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Players to Clipboard">
            <IconButton
              color="inherit"
              sx={{ p: 0.5 }}
              onClick={handleExportPlayers}>
              <Icon icon="mdi:download" />
            </IconButton>
          </Tooltip>
        </Box>
      </ListSubheader>

      <ListItem sx={{ display: "block", px: 0 }}>
        <UnassignDroppable>
          <Box
            sx={{
              flex: 1,
              maxHeight: "50vh",
              minHeight: "80px",
              overflowY: "auto",
              px: 2,
            }}>
            <Box>
              {getPlayersForRender().map((player) => {
                const originalIndex = getOriginalPlayerIndex(player);
                return (
                  <PlayerItem
                    key={`player-${originalIndex}-${player.username}`}
                    player={player}
                    playerIndex={originalIndex}
                    isClient={isClient}
                    onRemove={removePlayer}
                  />
                );
              })}
            </Box>
          </Box>
        </UnassignDroppable>
      </ListItem>

      {/* This will be pushed to the bottom */}
      <ListItem sx={{ display: "flex", gap: 1, my: 2, px: 2, mt: "auto" }}>
        <TextField
          placeholder="New player username"
          value={newPlayerName}
          size="small"
          fullWidth
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
        />
        <Button variant="contained" size="small" onClick={handleAddPlayer}>
          Add
        </Button>
      </ListItem>
      <SnackbarNotification snackbar={snackbar} onClose={handleSnackbarClose} />
    </>
  );
};

export default SidebarTeams;
