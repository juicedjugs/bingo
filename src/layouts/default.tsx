import { Box, Tab, Tabs } from "@mui/material";
import { Icon } from "@iconify/react";
import { Outlet, useLocation, Link } from "react-router";

const DefaultLayout = () => {
  const location = useLocation();

  // Determine current tab from URL
  const getCurrentTab = (): "teams" | "board" => {
    // Extract the path without basename for comparison
    const path = location.pathname;
    if (path.endsWith("/board")) return "board";
    if (path.endsWith("/teams")) return "teams";
    if (path === "/" || path.endsWith("/")) return "teams"; // Default to teams for root
    return "teams"; // Default fallback
  };

  const currentTab = getCurrentTab();

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
        <Tabs centered value={currentTab}>
          <Tab
            component={Link}
            to="/teams"
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
            component={Link}
            to="/board"
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
        <Outlet />
      </main>
    </>
  );
};

export default DefaultLayout;
