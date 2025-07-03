import { Box, ListItem, MenuItem, Select, Slider, Button } from "@mui/material";
import { Icon } from "@iconify/react";
import { useEffect } from "react";
import { useAppState } from "../../state";

const BoardControls = () => {
  const { state, setDimension, setScale, setShowTimeIndicators } =
    useAppState();

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if CMD key is pressed (metaKey on Mac) or CTRL key is pressed
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault(); // Prevent default scroll behavior

        // Calculate new scale value based on wheel direction
        const delta = e.deltaY > 0 ? -15 : 15; // Decrease if scrolling down, increase if scrolling up
        const newScale = Math.max(50, Math.min(200, state.scale + delta));

        setScale(newScale);
      }
    };

    // Add event listener to the document
    document.addEventListener("wheel", handleWheel, { passive: false });

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, [state.scale, setScale]);

  return (
    <>
      <Box>
        <Box
          sx={{
            px: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            width: "100%",
          }}>
          <Box>Dimension</Box>
          <Select
            size="small"
            value={state.dimension}
            onChange={(e) => setDimension(e.target.value)}>
            <MenuItem value={3}>3 x 3</MenuItem>
            <MenuItem value={4}>4 x 4</MenuItem>
            <MenuItem value={5}>5 x 5</MenuItem>
            <MenuItem value={6}>6 x 6</MenuItem>
            <MenuItem value={7}>7 x 7</MenuItem>
          </Select>
        </Box>
      </Box>
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            mt: 2,
            px: 2,
            width: "100%",
          }}>
          <Box>Scale</Box>
          <Slider
            value={state.scale}
            sx={{ width: "90%", mx: "auto", mb: 2 }}
            min={50}
            max={200}
            step={1}
            onChange={(e, value) => setScale(value as number)}
          />
        </Box>
      </Box>
      <Box>
        <Box
          sx={{
            px: 2,
            my: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            width: "100%",
          }}>
          <Button
            size="small"
            variant={state.showTimeIndicators ? "contained" : "outlined"}
            onClick={() => setShowTimeIndicators(!state.showTimeIndicators)}
            startIcon={
              <Icon
                icon={
                  state.showTimeIndicators ? "mdi:clock" : "mdi:clock-outline"
                }
                width={18}
                height={18}
              />
            }
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontSize: "0.875rem",
            }}>
            {state.showTimeIndicators ? "Hide Times" : "Show Times"}
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default BoardControls;
