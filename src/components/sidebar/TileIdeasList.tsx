import { Box } from "@mui/material";
import type { TileIdea } from "../../state";
import TileIdeaItem from "./TileIdeaItem";
import UnassignDroppable from "./TileIdeasUnassignDroppable";

interface TileIdeasListProps {
  filteredTileIdeas: TileIdea[];
}

const TileIdeasList = ({ filteredTileIdeas }: TileIdeasListProps) => {
  return (
    <UnassignDroppable>
      <Box
        sx={{
          flex: 1,
          px: 2,
          overflowY: "auto",
        }}>
        {filteredTileIdeas.map((tileIdea: TileIdea, idx: number) => (
          <TileIdeaItem key={tileIdea.id} tileIdea={tileIdea} idx={idx} />
        ))}
      </Box>
    </UnassignDroppable>
  );
};

export default TileIdeasList;
