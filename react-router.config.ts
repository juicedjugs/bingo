import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  basename: process.env.NODE_ENV === "production" ? "/bingo/" : "/",
  async prerender() {
    return ["/", "/teams", "/board"];
  },
} satisfies Config;
