import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  // FormGroup,
  // FormControlLabel,
  Checkbox,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
} from "@mui/material";
import ICON_MAP from "../viewspace/icon_map";

const STORAGE_KEY = "bingo-boss-icon-filter";
const DEFAULT_WEIGHT = 1;

export function getDefaultBossFilterObj() {
  // Returns { key: { checked: true, weight: 1 } }
  const obj: Record<string, { checked: boolean; weight: number }> = {};
  for (const key of Object.keys(ICON_MAP)) {
    obj[key] = { checked: true, weight: DEFAULT_WEIGHT };
  }
  return obj;
}

export function loadBossFilterObj(): Record<
  string,
  { checked: boolean; weight: number }
> {
  if (typeof window === "undefined") return getDefaultBossFilterObj();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultBossFilterObj();
    const obj = JSON.parse(raw);
    if (typeof obj === "object" && obj !== null) {
      // Fill in any missing keys
      const def = getDefaultBossFilterObj();
      for (const key of Object.keys(def)) {
        if (!obj[key]) obj[key] = { checked: true, weight: DEFAULT_WEIGHT };
        if (typeof obj[key].weight !== "number")
          obj[key].weight = DEFAULT_WEIGHT;
        if (typeof obj[key].checked !== "boolean") obj[key].checked = true;
      }
      return obj;
    }
    return getDefaultBossFilterObj();
  } catch {
    return getDefaultBossFilterObj();
  }
}

export function saveBossFilterObj(
  obj: Record<string, { checked: boolean; weight: number }>,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

const BossIconFilterDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [filterObj, setFilterObj] = useState(getDefaultBossFilterObj());

  useEffect(() => {
    if (open) {
      setFilterObj(loadBossFilterObj());
    }
  }, [open]);

  const handleToggle = (key: string) => {
    setFilterObj((prev) => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked },
    }));
  };

  const handleWeightChange = (key: string, value: string) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 1000) num = 1000;
    setFilterObj((prev) => ({
      ...prev,
      [key]: { ...prev[key], weight: num },
    }));
  };

  const handleSave = () => {
    saveBossFilterObj(filterObj);
    onClose();
  };

  const handleSelectAll = () => {
    setFilterObj((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = { ...updated[key], checked: true };
      }
      return updated;
    });
  };
  const handleClearAll = () => {
    setFilterObj((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = { ...updated[key], checked: false };
      }
      return updated;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Boss Weights</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
          <Button size="small" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button size="small" onClick={handleClearAll}>
            Clear All
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Show</TableCell>
                <TableCell>Icon</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Weight</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(ICON_MAP).map(([key, label]) => (
                <TableRow key={key}>
                  <TableCell>
                    <Checkbox
                      checked={!!filterObj[key]?.checked}
                      onChange={() => handleToggle(key)}
                    />
                  </TableCell>
                  <TableCell>
                    <img
                      src={`game_icon_${key}.png`}
                      alt={label}
                      style={{ width: 20, height: 20 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{label}</Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={filterObj[key]?.weight ?? 1}
                      onChange={(e) => handleWeightChange(key, e.target.value)}
                      inputProps={{ min: 0, max: 1000, style: { width: 60 } }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
