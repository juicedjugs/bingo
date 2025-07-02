import { Box, List } from "@mui/material";
import SidebarBoard from "./SidebarBoard";
import SidebarTeams from "./SidebarTeams";

interface SidebarProps {
  tab: "board" | "teams";
}

const Sidebar = ({ tab }: SidebarProps) => {
  return (
    <Box
      sx={{
        width: "300px",
        height: "calc(100vh - 49px)",
        borderRight: "1px solid #303030",
        flexShrink: 0,
      }}>
      <List
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 49px)",
        }}>
        {tab === "board" ? <SidebarBoard /> : <SidebarTeams />}
      </List>
    </Box>
  );
};

export default Sidebar;
