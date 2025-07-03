import { Box, ListItem, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAppState } from "../../state";
import { useTileIdeas } from "../../state";
import type { TileIdea } from "../../state";
import { getItemImgURL } from "../../utils/getItemImgURL";
import { useDraggable } from "@dnd-kit/core";
import { memo, useState } from "react";

interface TileIdeaItemProps {
  tileIdea: TileIdea;
  idx: number;
}

const TileIdeaDraggable = memo(
  ({
    tileIdea,
    children,
    isOverIcons,
  }: {
    tileIdea: any;
    children: React.ReactNode;
    isOverIcons?: boolean;
  }) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
      id: `tile-idea-${tileIdea.id}`,
      data: { tileIdea },
    });

    // Only apply drag listeners if not over icons
    const effectiveListeners = isOverIcons ? {} : listeners;
    const effectiveAttributes = isOverIcons ? {} : attributes;

    return (
      <div
        ref={setNodeRef}
        {...effectiveListeners}
        {...effectiveAttributes}
        style={{ cursor: "grab" }}>
        {children}
      </div>
    );
  },
);

const TileIdeaItem = memo(({ tileIdea, idx }: TileIdeaItemProps) => {
  const { setEditingTileId, setOpenCreateTileDialog } = useAppState();
  const { deleteTileIdea } = useTileIdeas();
  const [isHovered, setIsHovered] = useState(false);
  const [isOverIcons, setIsOverIcons] = useState(false);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTileId(tileIdea.id);
    setOpenCreateTileDialog(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTileIdea(tileIdea.id);
  };

  const handleIconsMouseEnter = () => {
    setIsOverIcons(true);
  };

  const handleIconsMouseLeave = () => {
    setIsOverIcons(false);
  };

  return (
    <TileIdeaDraggable
      key={tileIdea.id}
      tileIdea={tileIdea}
      isOverIcons={isOverIcons}>
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsOverIcons(false);
        }}
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "70px",
          py: 2,
          borderBottom: "1px solid #ffffff20",
          position: "relative",
        }}>
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
          <Typography variant="subtitle2">{tileIdea.description}</Typography>
          {tileIdea.timeToComplete && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: "rgba(160, 160, 160, 0.1)",
                border: "1px solid rgba(160, 160, 160, 0.2)",
                alignSelf: "flex-start",
              }}>
              <Icon
                icon="mdi:clock-outline"
                width={12}
                height={12}
                color="#a0a0a0"
              />
              <Typography
                variant="caption"
                sx={{
                  color: "#a0a0a0",
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                }}>
                {tileIdea.timeToComplete}h
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}>
          {tileIdea.items
            .filter((item: string, itemIdx: number) => itemIdx < 3)
            .map((item: string) => (
              <Tooltip title={item} arrow key={item}>
                <img
                  style={{
                    filter: "drop-shadow(0 0 2px #000000)",
                  }}
                  src={getItemImgURL(item)}
                  alt={tileIdea.description}
                  height={28}
                />
              </Tooltip>
            ))}
        </Box>

        {/* Hover icons */}
        {isHovered && (
          <Box
            onMouseEnter={handleIconsMouseEnter}
            onMouseLeave={handleIconsMouseLeave}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              display: "flex",
              gap: 1,
              zIndex: 10,
            }}>
            <Box
              onClick={handleEditClick}
              sx={{
                width: 24,
                height: 24,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                },
              }}>
              <Icon icon="mdi:pencil" width={16} height={16} color="#fff" />
            </Box>
            <Box
              onClick={handleDeleteClick}
              sx={{
                width: 24,
                height: 24,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(255, 0, 0, 0.8)",
                },
              }}>
              <Icon icon="mdi:trash" width={16} height={16} color="#fff" />
            </Box>
          </Box>
        )}
      </Box>
    </TileIdeaDraggable>
  );
});

export default TileIdeaItem;
