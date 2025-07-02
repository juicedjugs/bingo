import React from "react";
import { Box, Typography, Slider } from "@mui/material";

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  marks?: { value: number; label: string }[];
  unit?: string;
  sx?: any;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  marks,
  unit = "",
  sx,
}) => {
  return (
    <Box sx={sx}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {label} ({value}
        {unit})
      </Typography>
      <Slider
        value={value}
        onChange={(e, newValue) => onChange(newValue as number)}
        min={min}
        max={max}
        step={step}
        size="small"
        marks={marks}
      />
    </Box>
  );
};

export default SliderControl;
