import { Box, ListItem } from "@mui/material";
import type { TileIdea } from "../../state";
import TileIdeaItem from "./TileIdeaItem";
import UnassignDroppable from "./TileIdeasUnassignDroppable";

interface TileIdeasListProps {
  filteredTileIdeas: TileIdea[];
}

const TileIdeasList = ({ filteredTileIdeas }: TileIdeasListProps) => {
  return (
    <ListItem
      sx={{
        display: "flex",
        flexDirection: "column",
        px: 0,
        flex: 1,
        minHeight: 0,
      }}>
      <UnassignDroppable>
        <Box
          sx={{
            height: "100%",
            overflowY: "auto",
            px: 2,
          }}>
          <Box>
            {filteredTileIdeas.map((tileIdea: TileIdea, idx: number) => (
              <TileIdeaItem key={tileIdea.id} tileIdea={tileIdea} idx={idx} />
            ))}
          </Box>
        </Box>
      </UnassignDroppable>
    </ListItem>
  );
};

export default TileIdeasList;
