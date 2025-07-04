import { Box } from "@mui/material";
import { useAppState } from "../../state";
import Teams from "./Teams";

import BoardView from "./BoardView";
import { BingoBoard } from "./BingoBoard";

interface ViewspaceProps {
  tab: "board" | "teams";
}

const Viewspace = ({ tab }: ViewspaceProps) => {
  const { state } = useAppState();
  const dimension = state.dimension;
  return (
    <Box sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "auto",
          textAlign: "center",
        }}>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            padding: 4,
            // Use table display to vertically center children without flex
            display: "table",
          }}>
          <Box
            sx={{
              display: "table-cell",
              verticalAlign: "middle",
              textAlign: "center",
            }}>
            {/* Board */}
            {tab === "board" ? <BingoBoard /> : <Teams />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Viewspace;
