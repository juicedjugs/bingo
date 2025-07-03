import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";
import ICON_MAP from "../viewspace/icon_map";

const STORAGE_KEY = "bingo-boss-icon-filter";

export function getDefaultBossKeys() {
  return Object.keys(ICON_MAP);
}

export function loadBossFilter(): string[] {
  if (typeof window === "undefined") return getDefaultBossKeys();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultBossKeys();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
    return getDefaultBossKeys();
  } catch {
    return getDefaultBossKeys();
  }
}

export function saveBossFilter(keys: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

const BossIconFilterDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [checked, setChecked] = useState<string[]>(getDefaultBossKeys());

  useEffect(() => {
    if (open) {
      setChecked(loadBossFilter());
    }
  }, [open]);

  const handleToggle = (key: string) => {
    setChecked((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSave = () => {
    saveBossFilter(checked);
    onClose();
  };

  const handleSelectAll = () => setChecked(getDefaultBossKeys());
  const handleClearAll = () => setChecked([]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Boss Icon Filter</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
          <Button size="small" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button size="small" onClick={handleClearAll}>
            Clear All
          </Button>
        </Box>
        <FormGroup>
          {Object.entries(ICON_MAP).map(([key, label]) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={checked.includes(key)}
                  onChange={() => handleToggle(key)}
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <img
                    src={`game_icon_${key}.png`}
                    alt={label}
                    style={{ width: 20, height: 20 }}
                  />
                  <Typography variant="body2">{label}</Typography>
                </Box>
              }
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BossIconFilterDialog;
