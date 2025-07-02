import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  basename: process.env.VITE_BASE?.replace(/\/$/, "") || "/",
  async prerender() {
    return ["/", "/teams", "/board"];
  },
} satisfies Config;
