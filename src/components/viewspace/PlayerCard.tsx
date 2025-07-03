import React, { memo } from "react";
import { Box, Card, CardContent, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { UserStats } from "../../utils/getUserStats";
import ICON_MAP from "./icon_map";
import {
  loadBossFilter,
  getDefaultBossKeys,
} from "../sidebar/BossIconFilterDialog";

export interface PlayerCardProps {
  username: string;
  combatLevel: number | null;
  isLoading: boolean;
  hasError: boolean;
  stats: UserStats | null;
  dragListeners?: any;
  dragAttributes?: any;
  isDropTarget?: boolean;
  onUnassign?: () => void;
}

function normalizeKey(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/\(.*?\)/g, "");
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
    onUnassign,
  }: PlayerCardProps) => {
    const displayText = () => {
      if (isLoading) return "Loading...";
      if (hasError) return "Error";
      if (combatLevel !== null) return `lvl ${combatLevel}`;
      return "Unknown";
    };

    // Show all activities, matching icons by name, but exclude League/Deadman Points
    const selectedBossKeys =
      typeof window !== "undefined" ? loadBossFilter() : getDefaultBossKeys();
    const activities = (stats?.activities || [])
      .filter((activity) => !/league|deadman/i.test(activity.name))
      .filter((activity) =>
        selectedBossKeys.includes(normalizeKey(activity.name)),
      );

    return (
      <Card
        sx={{
          maxWidth: 320,
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
          }}
          onDoubleClick={
            typeof onUnassign === "function" ? onUnassign : undefined
          }>
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
            {/* All Activities */}
            {activities.map((activity) => {
              const key = normalizeKey(activity.name);
              const iconLabel = (ICON_MAP as Record<string, string>)[key];
              const iconPath = iconLabel ? `game_icon_${key}.png` : undefined;
              return (
                <Tooltip key={activity.name} title={iconLabel || activity.name}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      minWidth: 80,
                    }}>
                    {iconPath ? (
                      <Box
                        sx={{
                          height: 20,
                          width: 20,
                          padding: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                        <img src={iconPath} alt={iconLabel || activity.name} />
                      </Box>
                    ) : null}
                    <Box
                      sx={{
                        display: "flex",
                        width: 40,
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                      }}>
                      {activity.score === -1 ? "--" : activity.score}
                    </Box>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    );
  },
);

PlayerCard.displayName = "PlayerCard";

export default PlayerCard;
