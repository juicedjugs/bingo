import React from "react";
import { Box, Typography } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";

export interface TeamDroppableProps {
  teamId: string;
  children: React.ReactNode;
  isClient: boolean;
  position?: number;
}

const TeamDroppable = React.memo(
  ({ teamId, children, isClient, position }: TeamDroppableProps) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `team-${teamId}`,
      data: {
        teamId,
        position: position || 0,
        dropPosition: position || 0,
      },
    });

    return (
      <div
        ref={isClient ? setNodeRef : undefined}
        style={{
          position: "relative",
          transition: "all 0.15s ease",
        }}>
        {children}

        {/* Drop indicator - shows when DND Kit detects we're over this droppable */}
        {isClient && isOver && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              bgcolor: "rgba(100, 181, 246, 0.2)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 10,
              border: "2px solid #64b5f6",
              animation: "pulse 1.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%": { opacity: 0.7 },
                "50%": { opacity: 1 },
                "100%": { opacity: 0.7 },
              },
            }}>
            <Box
              sx={{
                bgcolor: "rgba(0, 0, 0, 0.9)",
                color: "#64b5f6",
                px: 3,
                py: 1,
                borderRadius: 2,
                border: "1px solid #64b5f6",
              }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "center" }}>
                Drop here
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
