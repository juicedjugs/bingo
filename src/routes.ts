import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./layouts/default.tsx", [
    index("./pages/home.tsx"),
    route("/teams", "./pages/teams.tsx"),
    route("/board", "./pages/board.tsx"),
  ]),
] satisfies RouteConfig;
