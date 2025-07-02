import { Box, Button } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAppState } from "../../state";
import { useTileIdeas } from "../../state";
import type { TileIdea } from "../../state";

interface BoardActionsProps {
  showSnackbar: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
}

const BoardActions = ({ showSnackbar }: BoardActionsProps) => {
  const {
    state,
    clearBoard,
    shuffleBoard,
    assignTileIdeaToBingoTile,
    setOpenPngExportDialog,
  } = useAppState();

  const { tileIdeas } = useTileIdeas();

  // Randomize Board from tile ideas
  const handleRandomizeBoard = () => {
    if (!tileIdeas.length) {
      showSnackbar("No tile ideas to randomize from.", "info");
      return;
    }
    const { dimension } = state;
    const boardSize = dimension * dimension;
    let randomizedIdeas = [];
    if (tileIdeas.length >= boardSize) {
      // Shuffle and take first N
      randomizedIdeas = [...tileIdeas];
      for (let i = randomizedIdeas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomizedIdeas[i], randomizedIdeas[j]] = [
          randomizedIdeas[j],
          randomizedIdeas[i],
        ];
      }
      randomizedIdeas = randomizedIdeas.slice(0, boardSize);
    } else {
      // Not enough, allow repeats
      randomizedIdeas = [];
      for (let i = 0; i < boardSize; i++) {
        randomizedIdeas.push(
          tileIdeas[Math.floor(Math.random() * tileIdeas.length)],
        );
      }
    }
    randomizedIdeas.forEach((idea, idx) => {
      assignTileIdeaToBingoTile(idx, idea.id);
    });
    showSnackbar("Board randomized from tile ideas!", "success");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        mb: 2,
        justifyContent: "center",
        color: "text.secondary",
      }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1,
          justifyContent: "center",
          mb: 1,
        }}>
        <Button
          size="small"
          sx={{
            width: "130px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          color="inherit"
          onClick={() => {
            clearBoard();
            showSnackbar("Board cleared!", "success");
          }}>
          <Icon
            icon="mdi:delete-sweep"
            height={20}
            style={{ marginRight: 8 }}
          />
          Clear
        </Button>
        <Button
          size="small"
          sx={{
            width: "130px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          color="inherit"
          onClick={() => {
            shuffleBoard();
            showSnackbar("Board shuffled!", "success");
          }}>
          <Icon icon="mdi:shuffle" height={20} style={{ marginRight: 8 }} />
          Shuffle
        </Button>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1,
          justifyContent: "center",
          color: "text.secondary",
        }}>
        <Button
          size="small"
          sx={{
            width: "130px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          color="inherit"
          onClick={handleRandomizeBoard}>
          <Icon
            icon="mdi:dice-multiple"
            height={20}
            style={{ marginRight: 8 }}
          />
          Randomize
        </Button>
        <Button
          size="small"
          sx={{
            width: "130px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
          color="inherit"
          onClick={() => {
            setOpenPngExportDialog(true);
          }}>
          <Icon icon="mdi:download" height={20} style={{ marginRight: 8 }} />
          Save PNG
        </Button>
      </Box>
    </Box>
  );
};

export default BoardActions;
