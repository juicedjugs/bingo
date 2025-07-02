import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextareaAutosize,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useAppState, useTileIdeas, TileIdea } from "../../state";
import { useState, useEffect } from "react";
import { getItemImgURL } from "../../utils/getItemImgURL";
import { nanoid } from "nanoid";

const CreateTileIdea = () => {
  const {
    state,
    setOpenCreateTileDialog,
    setEditingTileId,
    assignTileIdeaToBingoTile,
    setCreatingForBoardIndex,
  } = useAppState();
  const { tileIdeas, addTileIdea, updateTileIdea } = useTileIdeas();
  const [itemDescription, setItemDescription] = useState("");
  const [items, setItems] = useState([
    { name: "", previewImgURL: null as string | null },
  ]);

  // Check if we're editing an existing tile
  const editingTile = state.editingTileId
    ? tileIdeas.find((tile: TileIdea) => tile.id === state.editingTileId)
    : null;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingTile) {
      setItemDescription(editingTile.description);
      setItems(
        editingTile.items.length > 0
          ? editingTile.items.map((item: string) => ({
              name: item,
              previewImgURL: getItemImgURL(item),
            }))
          : [{ name: "", previewImgURL: null }],
      );
    } else {
      // Reset form when creating new tile
      setItemDescription("");
      setItems([{ name: "", previewImgURL: null }]);
    }
  }, [editingTile]);

  const handleClose = () => {
    setOpenCreateTileDialog(false);
    setEditingTileId(null);
    setCreatingForBoardIndex(null);
    setItemDescription("");
    setItems([{ name: "", previewImgURL: null }]);
  };

  const handleSave = () => {
    const desc = itemDescription.trim();
    if (!desc) return;
    const validItems = items
      .map((item) => item.name.trim())
      .filter((name) => name.length > 0);

    if (editingTile) {
      // Update existing tile
      updateTileIdea({
        id: editingTile.id,
        items: validItems,
        description: desc,
      });
    } else {
      // Create new tile
      const newTileId = nanoid();
      addTileIdea({
        id: newTileId,
        items: validItems,
        description: desc,
      });

      // If we're creating for a specific board position, assign it
      if (state.creatingForBoardIndex !== null) {
        assignTileIdeaToBingoTile(state.creatingForBoardIndex, newTileId);
      }
    }

    handleClose();
  };

  return (
    <Dialog open={state.openCreateTileDialog}>
      <DialogTitle sx={{ textAlign: "center" }}>
        {editingTile ? "Edit Tile" : "Create Tile Idea"}
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        <TextareaAutosize
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="Enter tile objective..."
          style={{
            fontFamily: "var(--font-family)",
            padding: 12,
            fontSize: 15,
            minWidth: 300,
            minHeight: 100,
          }}
        />
        <Box>
          <Typography variant="subtitle2" sx={{ my: 2 }}>
            Items
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map((item, idx) => (
              <Box
                key={idx}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  label="Item Name"
                  size="small"
                  placeholder="Rune Hasta"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].name = e.target.value;
                    setItems(newItems);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const newItems = [...items];
                      newItems[idx].previewImgURL = getItemImgURL(
                        item.name.trim(),
                      );
                      setItems(newItems);
                    }
                  }}
                  onBlur={() => {
                    if (item.name.trim()) {
                      const newItems = [...items];
                      newItems[idx].previewImgURL = getItemImgURL(
                        item.name.trim(),
                      );
                      setItems(newItems);
                    } else {
                      const newItems = [...items];
                      newItems[idx].previewImgURL = null;
                      setItems(newItems);
                    }
                  }}
                />
                <Box
                  sx={{
                    border: "1px solid #ffffff30",
                    width: 40,
                    height: 40,
                    padding: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 1,
                  }}>
                  {item.previewImgURL && (
                    <img
                      src={item.previewImgURL}
                      alt={item.name}
                      style={{
                        maxWidth: 32,
                        maxHeight: 32,
                        filter: "drop-shadow(0 0 2px #00000040)",
                      }}
                    />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setItems((items) => items.filter((_, i) => i !== idx));
                  }}
                  sx={{ minWidth: 0, ml: 1, py: 1 }}>
                  <Icon icon="mdi:trash" width={20} height={20} />
                </Button>
              </Box>
            ))}
            <Button
              onClick={() =>
                setItems([...items, { name: "", previewImgURL: null }])
              }
              sx={{ alignSelf: "center", mt: 1 }}
              variant="outlined"
              startIcon={<Icon icon="mdi:plus" width={20} height={20} />}>
              Add Item
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 4, py: 2 }}>
        <Button variant="contained" color="error" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!itemDescription.trim()}>
          {editingTile ? "Save Changes" : "Add Tile"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTileIdea;
