import React from "react";
import { Box, Typography, TextField } from "@mui/material";

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sx?: any;
}

const ColorControl: React.FC<ColorControlProps> = ({
  label,
  value,
  onChange,
  sx,
}) => {
  return (
    <Box sx={sx}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 32,
            height: 32,
            border: "none",
            borderRadius: 4,
          }}
        />
        <TextField
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
      </Box>
    </Box>
  );
};

export default ColorControl;
