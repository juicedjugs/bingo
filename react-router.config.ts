import type { Config } from "@react-router/dev/config";

const isDev = process.env.NODE_ENV === "development";

export default {
  appDirectory: "src",
  ssr: false,
  basename: isDev ? "/" : "/bingo",
  async prerender() {
    return ["/", "/teams", "/board"];
  },
} satisfies Config;
