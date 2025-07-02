import React from "react";
import { Box, Typography } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";

export interface TeamDroppableProps {
  teamId: string;
  children: React.ReactNode;
  isClient: boolean;
}

const TeamDroppable = ({ teamId, children, isClient }: TeamDroppableProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: `team-${teamId}` });

  return (
    <div
      ref={isClient ? setNodeRef : undefined}
      style={{
        background: isClient && isOver ? "#333333" : undefined,
        borderRadius: 12,
        transition: "background 0.2s",
        position: "relative",
      }}>
      {children}
      {isClient && isOver && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(100, 181, 246, 0.15)",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1,
          }}>
          <Typography variant="caption" color="primary">
            Drop player here
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default TeamDroppable;
