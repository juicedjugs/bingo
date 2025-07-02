import React, { memo } from "react";
import { Box, Card, CardContent, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { UserStats } from "../../utils/getUserStats";
import { IMPORTANT_STATS } from "./constants";

export interface PlayerCardProps {
  username: string;
  combatLevel: number | null;
  isLoading: boolean;
  hasError: boolean;
  stats: UserStats | null;
  dragListeners?: any;
  dragAttributes?: any;
  isDropTarget?: boolean;
}

const PlayerCard = memo(
  ({
    username,
    combatLevel,
    isLoading,
    hasError,
    stats,
    dragListeners,
    dragAttributes,
    isDropTarget = false,
  }: PlayerCardProps) => {
    const displayText = () => {
      if (isLoading) return "Loading...";
      if (hasError) return "Error";
      if (combatLevel !== null) return `lvl ${combatLevel}`;
      return "Unknown";
    };

    return (
      <Card
        sx={{
          maxWidth: 240,
          position: "relative",
          border: isDropTarget ? "2px solid #64b5f6" : "none",
          backgroundColor: isDropTarget
            ? "rgba(100, 181, 246, 0.1)"
            : undefined,
          transition: "border-color 0.2s, background-color 0.2s",
        }}>
        {/* Drag Handle */}
        <Box
          {...(dragAttributes || {})}
          {...(dragListeners || {})}
          sx={{
            position: "absolute",
            top: 18,
            left: 8,
            width: 20,
            height: 20,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            zIndex: 1,
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            },
            "&:active": {
              cursor: "grabbing",
            },
          }}>
          <Icon icon="mdi:drag" width={20} height={20} color="#fff" />
        </Box>

        <CardContent>
          {/* Title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            {username} ({displayText()})
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
            {/* Important Stats */}
            {IMPORTANT_STATS.map((stat, idx) => (
              <Tooltip key={stat.id} title={`${stat.name}`}>
                <Box key={stat.id} sx={{ display: "flex" }}>
                  <Box
                    sx={{
                      height: 20,
                      width: 20,
                      padding: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <img src={stat.iconPath} alt={stat.name} />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      width: 40,
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                    }}>
                    {(() => {
                      const value =
                        idx === 0
                          ? stats?.skills[0]?.level
                          : stats?.activities.find((a) => a.id === stat.id)
                              ?.score;
                      return value === -1 ? "--" : value;
                    })()}
                  </Box>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  },
);

PlayerCard.displayName = "PlayerCard";

export default PlayerCard;
