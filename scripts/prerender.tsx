import React from "react";
import { renderToString } from "react-dom/server";
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import createEmotionCache from "../src/utils/cache.js";
import AppTheme from "../src/utils/theme.js";
import { StateProvider, TileIdeasProvider } from "../src/state.js";
import TeamsView from "../src/components/viewspace/TeamsView.js";
import BoardView from "../src/components/viewspace/BoardView.js";
import { Box, Tab, Tabs } from "@mui/material";
import { Icon } from "@iconify/react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PageProps {
  currentPage: "teams" | "board";
}

const AppContent: React.FC<PageProps> = ({ currentPage }) => (
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

const App: React.FC<PageProps> = ({ currentPage }) => {
  const cache = createEmotionCache();

  return (
    <CacheProvider value={cache}>
      <AppTheme>
        <StateProvider>
          <TileIdeasProvider>
            <AppContent currentPage={currentPage} />
          </TileIdeasProvider>
        </StateProvider>
      </AppTheme>
    </CacheProvider>
  );
};

function generateHTML(
  content: string,
  styles: string,
  title: string,
  scriptPath: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style data-emotion="mui">${styles}</style>
  </head>
  <body>
    <div id="root">${content}</div>
    <script type="module" src="${scriptPath}"></script>
  </body>
</html>`;
}

function prerenderPage(
  page: "teams" | "board",
  outputPath: string,
  scriptPath: string,
) {
  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);

  // Render the app
  const html = renderToString(
    <CacheProvider value={cache}>
      <App currentPage={page} />
    </CacheProvider>,
  );

  // Extract critical CSS
  const chunks = extractCriticalToChunks(html);
  const styleElements = constructStyleTagsFromChunks(chunks);

  // Extract just the CSS content from style tags
  const styles = styleElements
    .replace(/<style[^>]*>/g, "")
    .replace(/<\/style>/g, "");

  // Generate final HTML
  const title =
    page === "teams" ? "Bingo Maker - Teams" : "Bingo Maker - Board";
  const finalHTML = generateHTML(html, styles, title, scriptPath);

  // Write to file
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, finalHTML);

  console.log(`✅ Pre-rendered ${page} page: ${outputPath}`);
}

export function prerender() {
  const distDir = path.join(__dirname, "../dist");

  console.log("🏗️ Pre-rendering pages...");

  // Find the built JS file (it will have a hash in the name)
  const assetsDir = path.join(distDir, "assets");
  let mainJsFile = "";

  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    mainJsFile =
      files.find((file) => file.startsWith("index-") && file.endsWith(".js")) ||
      "";
  }

  const scriptPath = mainJsFile
    ? `/bingo/assets/${mainJsFile}`
    : "/bingo/assets/index.js";

  // Pre-render teams page
  prerenderPage(
    "teams",
    path.join(distDir, "teams", "index.html"),
    "../" + scriptPath.substring(1),
  );

  // Pre-render board page
  prerenderPage(
    "board",
    path.join(distDir, "board", "index.html"),
    "../" + scriptPath.substring(1),
  );

  // Create a simple redirect for the root path
  const redirectHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bingo Maker - Redirecting...</title>
    <script>
      // Redirect to teams page
      window.location.replace('/bingo/teams');
    </script>
  </head>
  <body>
    <p>Redirecting to teams page...</p>
    <a href="/bingo/teams">Click here if you are not redirected automatically</a>
  </body>
</html>`;

  fs.writeFileSync(path.join(distDir, "index.html"), redirectHTML);

  console.log("🎉 Pre-rendering complete!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  prerender();
}
