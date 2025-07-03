import { Box, Typography } from "@mui/material";
import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface UnassignDroppableProps {
  children: React.ReactNode;
}

const UnassignDroppable = ({ children }: UnassignDroppableProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: "unassign-tile-ideas" });

  const shouldShowOver = isOver;

  return (
    <div
      ref={setNodeRef}
      style={{
        background: shouldShowOver
          ? "rgba(23, 239, 145, 0.2)"
          : "rgba(23, 239, 145, 0.05)",
        border: shouldShowOver
          ? "2px dashed rgb(23, 239, 145)"
          : "2px dashed rgba(23, 239, 145, 0.4)",
        borderRadius: 8,
        transition: "all 0.2s",
        position: "relative",
        margin: "0 16px",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
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
            bgcolor: "rgba(23, 239, 145, .4)",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1,
          }}>
          <Typography
            variant="body2"
            color="primary"
            sx={{ fontWeight: "bold" }}>
            Drop tile here to unassign
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default UnassignDroppable;
