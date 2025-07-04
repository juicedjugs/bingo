import React, { memo, useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Divider,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { UserStats } from "../../utils/getUserStats";
import ICON_MAP from "./icon_map";
import { loadBossFilterObj } from "../sidebar/BossIconFilterDialog";
import { useAppState } from "../../state";

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
  alwaysCollapsed?: boolean;
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
    alwaysCollapsed = false,
  }: PlayerCardProps) => {
    const { state } = useAppState();
    const playerStats = state.playerStats[username];

    const displayText = useMemo(() => {
      if (isLoading) return "Loading...";
      if (hasError) return "Error";
      if (combatLevel !== null) return `lvl ${combatLevel}`;
      return "Unknown";
    }, [isLoading, hasError, combatLevel]);

    // --- Listen for boss/stat filter changes to force re-render ---
    const [filterVersion, setFilterVersion] = useState(0);
    useEffect(() => {
      const STORAGE_KEY = "bingo-boss-icon-filter";
      const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) {
          setFilterVersion((v) => v + 1);
        }
      };
      window.addEventListener("storage", onStorage);
      // Also check for changes in this tab
      const origSetItem = localStorage.setItem;
      localStorage.setItem = function (...args) {
        origSetItem.apply(this, args);
        if (args[0] === STORAGE_KEY) {
          setFilterVersion((v) => v + 1);
        }
      };
      return () => {
        window.removeEventListener("storage", onStorage);
        localStorage.setItem = origSetItem;
      };
    }, []);
    // --- End filter change listener ---

    // Add toggle state for activities vs. overall skill
    const [showOverall, setShowOverall] = useState(false);

    // Use stats from state if available, otherwise fall back to props
    const effectiveStats = playerStats?.stats || stats;

    // Memoize expensive calculations
    const displayItems = useMemo(() => {
      const items = [];

      // Find the 'Overall' skill (usually first in the array)
      const overallSkill =
        effectiveStats?.skills?.find(
          (s) => s.name.toLowerCase() === "overall",
        ) || effectiveStats?.skills?.[0];

      if (overallSkill) {
        items.push({
          type: "overall",
          name: "Overall",
          level: overallSkill.level,
          xp: overallSkill.xp,
        });
      }

      // Show all activities, matching icons by name, but exclude League/Deadman Points
      const selectedBossObj =
        typeof window !== "undefined" ? loadBossFilterObj() : undefined;
      const activities = (effectiveStats?.activities || [])
        .filter((activity) => !/league|deadman/i.test(activity.name))
        .filter((activity) => {
          const key = normalizeKey(activity.name);
          return selectedBossObj && selectedBossObj[key]?.checked;
        });

      // Add activities
      for (const activity of activities) {
        // Don't duplicate if activity is "Overall"
        if (normalizeKey(activity.name) === "overall") continue;
        items.push({
          type: "activity",
          ...activity,
        });
      }

      return items;
    }, [effectiveStats, filterVersion]);

    // --- Weight and rank from state ---
    const { weightedScore, rank } = useMemo(() => {
      const weight = playerStats?.weight || 0;

      // Compute rank from all players in state
      const allPlayers = Object.entries(state.playerStats).map(
        ([name, data]) => ({
          username: name,
          weight: data.weight,
        }),
      );
      const sortedPlayers = allPlayers.sort((a, b) => b.weight - a.weight);
      const playerRank =
        sortedPlayers.findIndex((p) => p.username === username) + 1;

      return { weightedScore: weight, rank: playerRank };
    }, [playerStats?.weight, state.playerStats, username]);

    const [collapsed, setCollapsed] = useState(false);
    const [hovered, setHovered] = useState(false);

    // Simple logic: use alwaysCollapsed if set, otherwise use local collapsed state
    const effectiveCollapsed = alwaysCollapsed || collapsed;

    const handleCollapseToggle = useCallback(() => {
      setCollapsed(!collapsed);
    }, [collapsed]);

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

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
          width: 240,
          display: effectiveCollapsed ? "flex" : undefined,
          alignItems: effectiveCollapsed ? "center" : undefined,
          justifyContent: effectiveCollapsed ? "center" : undefined,
          flexDirection: "column",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        {/* Drag Handle - always absolute at top left, only visible on hover */}
        <Box
          sx={{
            position: "absolute",

            top: 8,
            left: 8,
            zIndex: 3,
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
            transition: "opacity 0.2s",
          }}>
          <Box
            {...(dragAttributes || {})}
            {...(dragListeners || {})}
            sx={{
              width: 20,
              height: 20,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
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
        </Box>
        {/* Collapse/Expand Arrow - always absolute at top right */}
        <IconButton
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 3,
            color: "#aaa",
            p: 0.5,
          }}
          onClick={handleCollapseToggle}
          aria-label={effectiveCollapsed ? "Expand" : "Collapse"}>
          <Icon
            icon={effectiveCollapsed ? "mdi:chevron-right" : "mdi:chevron-down"}
            width={20}
            height={20}
          />
        </IconButton>
        {/* Username and level header - always centered, large, and with vertical space */}
        <Box
          sx={{
            width: "100%",
            pt: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}>
          <Box
            sx={{
              fontWeight: 700,
              fontSize: 16,
              textAlign: "center",
              letterSpacing: 0.5,
              color: "#fff",
              width: "100%",
              lineHeight: 1.2,
              pointerEvents: "auto",
            }}>
            {username}
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: 12,
                color: "#aaa",
                ml: 1,
                display: "inline-block",
              }}>
              ({displayText})
            </Typography>
          </Box>
        </Box>

        {/* Weighted score and rank display */}
        <Box
          sx={{
            width: "100%",
            display: "block",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            mt: 1,
            mb: 2,
          }}>
          <Typography
            variant="body2"
            sx={{ color: "#4caf50", fontWeight: 600 }}>
            Weight: {weightedScore}
          </Typography>
          {rank !== null && (
            <Typography variant="body2" sx={{ color: "#ffa", fontWeight: 600 }}>
              Rank: {rank}
            </Typography>
          )}
        </Box>
        {/* Stats section - only this toggles */}
        {!effectiveCollapsed && (
          <>
            <Divider sx={{ mx: 2 }} />
            <CardContent
              sx={{
                maxWidth: 240,
                width: 240,
                minHeight: 40,
                transition: "min-height 0.2s",
              }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {displayItems.map((item, idx) => {
                  if (item.type === "overall") {
                    return (
                      <Tooltip key="overall" title="Overall">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            minWidth: 60,
                          }}>
                          <Box
                            sx={{
                              height: 18,
                              width: 18,
                              padding: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              "& > img": {
                                height: "18px",
                                width: "18px",
                              },
                            }}>
                            <img src="./Stats_icon.webp" alt="Overall" />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              display: "flex",
                              width: 40,
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                            }}>
                            {item.level}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  } else {
                    const key = normalizeKey(item.name);
                    const iconLabel = (ICON_MAP as Record<string, string>)[key];
                    const iconPath = iconLabel
                      ? `game_icon_${key}.png`
                      : undefined;
                    return (
                      <Tooltip
                        key={item.name}
                        title={iconLabel || item.name}
                        arrow>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            minWidth: 60,
                          }}>
                          {iconPath ? (
                            <Box
                              sx={{
                                height: 18,
                                width: 18,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}>
                              <img
                                src={iconPath}
                                alt={iconLabel || item.name}
                              />
                            </Box>
                          ) : null}
                          <Typography
                            variant="subtitle2"
                            sx={{
                              display: "flex",
                              width: 40,
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                            }}>
                            {"score" in item
                              ? item.score === -1
                                ? "--"
                                : item.score >= 10000
                                ? `${Math.round(item.score / 1000)}k`
                                : item.score
                              : "--"}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  }
                })}
              </Box>
            </CardContent>
          </>
        )}
      </Card>
    );
  },
);

PlayerCard.displayName = "PlayerCard";

export default PlayerCard;
