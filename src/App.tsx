import React, { useState, useEffect } from "react";
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

// Get the basename based on environment
const getBasename = () => {
  return import.meta.env.DEV ? "" : "/bingo";
};

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState<Page>("teams");

  // Handle initial URL and browser navigation
  useEffect(() => {
    const getPageFromURL = (): Page => {
      const path = window.location.pathname;
      const basename = getBasename();

      // Remove basename from path for comparison
      const relativePath = basename ? path.replace(basename, "") : path;

      if (relativePath.includes("/board")) return "board";
      return "teams";
    };

    // Set initial page from URL
    setCurrentPage(getPageFromURL());

    // Listen to browser back/forward buttons
    const handlePopState = () => {
      setCurrentPage(getPageFromURL());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);

    // Build the correct URL with basename
    const basename = getBasename();
    let newPath: string;

    if (page === "teams") {
      newPath = basename + "/";
    } else {
      newPath = basename + `/${page}`;
    }

    // Handle root case for development
    if (import.meta.env.DEV && newPath === "/") {
      newPath = "/";
    }

    window.history.pushState({}, "", newPath);
  };

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
            onClick={() => navigateToPage("teams")}
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
            onClick={() => navigateToPage("board")}
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
