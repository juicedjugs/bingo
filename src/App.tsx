import React, { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { Icon } from "@iconify/react";
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "./utils/cache";
import AppTheme from "./utils/theme";
import "./utils/icons";
import { StateProvider, TileIdeasProvider } from "./state";
import TeamsView from "./components/viewspace/TeamsView";
import BoardView from "./components/viewspace/BoardView";

type Page = "teams" | "board";

const cache = createEmotionCache();

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState<Page>("teams");

  return (
    <>
      {/* Tab Navigation */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          borderBottom: "1px solid #303030",
        }}>
        <Tabs centered value={currentPage}>
          <Tab
            onClick={() => setCurrentPage("teams")}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon
                  icon="mdi:account-group-outline"
                  height={22}
                  style={{ paddingBottom: "2px" }}
                />
                <span>Teams</span>
              </Box>
            }
            value="teams"
          />
          <Tab
            onClick={() => setCurrentPage("board")}
            label={
              <Box sx={{ display: "flex", gap: "6px" }}>
                <Icon icon="mdi:grid" height={18} />
                <span>Board</span>
              </Box>
            }
            value="board"
          />
        </Tabs>
      </Box>

      <main>
        {currentPage === "teams" && <TeamsView />}
        {currentPage === "board" && <BoardView />}
      </main>
    </>
  );
};

export default function App() {
  const isClient = typeof window !== "undefined";

  const content = (
    <AppTheme>
      <StateProvider>
        <TileIdeasProvider>
          <AppContent />
        </TileIdeasProvider>
      </StateProvider>
    </AppTheme>
  );

  if (isClient) {
    return <CacheProvider value={cache}>{content}</CacheProvider>;
  }

  return content;
}
