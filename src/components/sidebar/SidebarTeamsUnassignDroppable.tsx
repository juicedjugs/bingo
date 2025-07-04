import { Box, Typography } from "@mui/material";
import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface UnassignDroppableProps {
  children: React.ReactNode;
}

const UnassignDroppable = ({ children }: UnassignDroppableProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: "unassign-players" });

  const shouldShowOver = isOver;

  return (
    <div
      ref={setNodeRef}
      style={{
        background: shouldShowOver
          ? "rgba(23, 239, 145, 0.15)"
          : "rgba(23, 239, 145, 0.05)",
        border: shouldShowOver
          ? "2px dashed rgb(23, 239, 145)"
          : "2px dashed rgba(23, 239, 145, 0.4)",
        borderRadius: 8,
        transition: "all 0.2s ease",
        position: "relative",
        margin: "0 16px",
        padding: shouldShowOver ? "8px" : "0px",
        transform: shouldShowOver ? "scale(1.02)" : "scale(1)",
      }}>
      {children}
      {shouldShowOver && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(23, 239, 145, 0.2)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 10,
            border: "2px dashed rgb(23, 239, 145)",
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%": {
                opacity: 0.7,
                transform: "scale(1)",
              },
              "50%": {
                opacity: 1,
                transform: "scale(1.02)",
              },
              "100%": {
                opacity: 0.7,
                transform: "scale(1)",
              },
            },
          }}>
          <Box
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.8)",
              color: "rgb(23, 239, 145)",
              px: 3,
              py: 1,
              borderRadius: 2,
              border: "1px solid rgb(23, 239, 145)",
            }}>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Drop player here to unassign
            </Typography>
          </Box>
        </Box>
      )}
    </div>
  );
};

export default UnassignDroppable;
