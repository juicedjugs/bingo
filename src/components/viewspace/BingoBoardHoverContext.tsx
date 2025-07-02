import { createContext } from "react";

export const BingoBoardHoverContext = createContext<{
  hoveredTileIndex: number | null;
  setHoveredTileIndex: (idx: number | null) => void;
}>({
  hoveredTileIndex: null,
  setHoveredTileIndex: () => {},
});
