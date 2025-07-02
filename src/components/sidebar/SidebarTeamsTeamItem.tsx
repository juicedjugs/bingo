import {
  Box,
  ListItem,
  Typography,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import React, { useState, memo } from "react";
import { useAppState } from "../../state";

interface TeamItemProps {
  team: any;
  teamIndex: number;
  onEdit: (index: number, name: string) => void;
  onRemove: (index: number) => void;
}

const TeamItem = memo(
  ({ team, teamIndex, onEdit, onRemove }: TeamItemProps) => {
    const {
      state: { players },
    } = useAppState();

    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");

    // Count players in this team
    const playerCount = players.filter(
      (player) => player.teamId === String(teamIndex),
    ).length;

    const handleEditClick = () => {
      setIsEditing(true);
      setEditName(team.name);
    };

    const handleSaveEdit = () => {
      if (editName.trim()) {
        onEdit(teamIndex, editName.trim());
      }
      setIsEditing(false);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditName("");
    };

    const handleDeleteClick = () => {
      onRemove(teamIndex);
    };

    return (
      <ListItem
        sx={{
          border: "1px solid #ffffff20",
          borderRadius: 2,
          mb: 1,
          px: 2,
          py: 0,
          minHeight: 48,
          bgcolor: "#232323",
          position: "relative",
          transition: "background 0.2s",
          "&:hover": { bgcolor: "#282828" },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        {isEditing ? (
          <>
            <TextField
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              size="small"
              autoFocus
              sx={{ mr: 1 }}
            />
            <IconButton
              size="small"
              color="primary"
              sx={{ mr: 1 }}
              onClick={handleSaveEdit}>
              <Icon icon="mdi:harddisk" width={18} />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              sx={{ mr: 1 }}
              onClick={handleCancelEdit}>
              <Icon icon="mdi:close" width={18} />
            </IconButton>
          </>
        ) : (
          <>
            <Typography variant="subtitle2">
              {team.name} ({playerCount})
            </Typography>
            {isHovered && (
              <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={handleEditClick}>
                    <Icon icon="mdi:pencil" width={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleDeleteClick}>
                    <Icon icon="mdi:trash" width={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </>
        )}
      </ListItem>
    );
  },
);

TeamItem.displayName = "TeamItem";

export default TeamItem;
