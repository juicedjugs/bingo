import {
  Divider,
  ListSubheader,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useTileIdeas } from "../../state";
import type { TileIdea } from "../../state";
import Fuse from "fuse.js";
import { Icon } from "@iconify/react";

// Import the decomposed components
import BoardControls from "./BoardControls";
import BoardActions from "./BoardActions";
import TileIdeasHeader from "./TileIdeasHeader";
import TileIdeasSearch from "./TileIdeasSearch";
import TileIdeasList from "./TileIdeasList";
import SnackbarNotification from "./SnackbarNotification";
import ExportPng from "../dialog/ExportPng";
import BossIconFilterDialog from "./BossIconFilterDialog";

const SidebarBoard = () => {
  const { tileIdeas } = useTileIdeas();

  const [search, setSearch] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [openBossFilter, setOpenBossFilter] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get tile ideas safely for rendering
  const getTileIdeasForRender = (): TileIdea[] => {
    if (!isHydrated) return [];
    return tileIdeas || [];
  };

  // Set up fuse.js for fuzzy search on description and items
  const tileIdeasForRender = getTileIdeasForRender();
  const fuse = new Fuse(tileIdeasForRender, {
    keys: ["description", "items"],
    threshold: 0.4,
  });

  // If search is empty, show original order; otherwise, show sorted by relevance
  const filteredTileIdeas =
    search.trim() === ""
      ? tileIdeasForRender
      : fuse.search(search).map((result) => result.item);

  // Helper to show snackbar
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((s) => ({ ...s, open: false }));
  };

  return (
    <>
      <ListSubheader>Board Controls</ListSubheader>
      <BoardControls />
      <BoardActions showSnackbar={showSnackbar} />
      <Divider sx={{ my: 1 }} />
      <TileIdeasHeader showSnackbar={showSnackbar} />
      <TileIdeasSearch search={search} onSearchChange={setSearch} />
      <TileIdeasList filteredTileIdeas={filteredTileIdeas} />
      <SnackbarNotification snackbar={snackbar} onClose={handleSnackbarClose} />
      <ExportPng />
    </>
  );
};

export default SidebarBoard;
