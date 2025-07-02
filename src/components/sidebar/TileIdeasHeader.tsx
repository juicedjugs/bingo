import { Box, IconButton, ListSubheader, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAppState } from "../../state";
import { useTileIdeas } from "../../state";
import type { TileIdea } from "../../state";
import CreateTileIdea from "../dialog/CreateTile";

interface TileIdeasHeaderProps {
  showSnackbar: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
}

const TileIdeasHeader = ({ showSnackbar }: TileIdeasHeaderProps) => {
  const { setOpenCreateTileDialog } = useAppState();
  const { tileIdeas, addTileIdea } = useTileIdeas();

  // Clipboard Export
  const handleExport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(tileIdeas, null, 2));
      showSnackbar("Exported tile ideas to clipboard!", "success");
    } catch (err) {
      showSnackbar("Failed to export to clipboard.", "error");
    }
  };

  // Clipboard Import
  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showSnackbar("Clipboard is empty.", "info");
        return;
      }
      let imported: TileIdea[] = [];
      try {
        imported = JSON.parse(text);
      } catch (e) {
        showSnackbar("Clipboard does not contain valid JSON.", "error");
        return;
      }
      if (!Array.isArray(imported)) {
        showSnackbar("Clipboard JSON is not a list.", "error");
        return;
      }
      // Filter valid tile ideas (must have id, description, items)
      imported = imported.filter(
        (t) =>
          t &&
          typeof t.id === "string" &&
          Array.isArray(t.items) &&
          typeof t.description === "string",
      );
      if (imported.length === 0) {
        showSnackbar("No valid tile ideas found in clipboard.", "info");
        return;
      }
      // Deduplicate by id
      const existingIds = new Set(tileIdeas.map((t: TileIdea) => t.id));
      const newOnes = imported.filter((t) => !existingIds.has(t.id));
      const duplicates = imported.length - newOnes.length;
      if (newOnes.length === 0) {
        showSnackbar("All imported tile ideas are duplicates.", "info");
        return;
      }
      newOnes.forEach(addTileIdea);
      showSnackbar(
        `Imported ${newOnes.length} tile idea${newOnes.length > 1 ? "s" : ""}${
          duplicates > 0
            ? ` (${duplicates} duplicate${duplicates > 1 ? "s" : ""} skipped)`
            : ""
        }!`,
        "success",
      );
    } catch (err) {
      showSnackbar("Failed to import from clipboard.", "error");
    }
  };

  return (
    <ListSubheader sx={{ display: "flex", justifyContent: "space-between" }}>
      Tile Ideas ({tileIdeas.length})
      <Box>
        <Tooltip title="Import Tile Ideas From Clipboard">
          <IconButton color="inherit" sx={{ p: 0.5 }} onClick={handleImport}>
            <Icon icon="mdi:clipboard-text" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export Tile Ideas To Clipboard">
          <IconButton color="inherit" sx={{ p: 0.5 }} onClick={handleExport}>
            <Icon icon="mdi:download" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Create Tile Idea">
          <IconButton
            color="inherit"
            sx={{ p: 0.5 }}
            onClick={() => setOpenCreateTileDialog(true)}>
            <Icon icon="mdi:plus" />
          </IconButton>
        </Tooltip>

        <CreateTileIdea />
      </Box>
    </ListSubheader>
  );
};

export default TileIdeasHeader;
