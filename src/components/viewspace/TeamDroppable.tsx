import React from "react";
import { Box, Typography } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";

export interface TeamDroppableProps {
  teamId: string;
  children: React.ReactNode;
  isClient: boolean;
  dragMode?: "insert" | "swap" | null;
  dragTarget?: { teamId: string; playerIndex?: number } | null;
}

const TeamDroppable = React.memo(
  ({
    teamId,
    children,
    isClient,
    dragMode,
    dragTarget,
  }: TeamDroppableProps) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `team-${teamId}`,
      data: {
        teamId,
        dropPosition: 0, // Always add to the end of the team
      },
    });

    const isDragTarget = dragTarget?.teamId === teamId;
    const showInsertIndicator = dragMode === "insert" && isDragTarget;

    return (
      <div
        ref={isClient ? setNodeRef : undefined}
        className="team-dropper"
        style={{
          position: "relative",
          transition: "all 0.15s ease",
        }}>
        {children}

        {/* Insert indicator overlay - shows when dragging over team area but not over player cards */}
        {showInsertIndicator && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              bgcolor: "rgba(100, 181, 246, 0.1)",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 10,
              border: "2px dashed #64b5f6",
            }}>
            <Box
              sx={{
                bgcolor: "rgba(0, 0, 0, 0.8)",
                color: "#64b5f6",
                px: 3,
                py: 1,
                borderRadius: 2,
                border: "1px solid #64b5f6",
              }}>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                Insert into team
              </Typography>
            </Box>
          </Box>
        )}
      </div>
    );
  },
);

TeamDroppable.displayName = "TeamDroppable";

export default TeamDroppable;
