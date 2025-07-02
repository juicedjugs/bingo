import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  basename: process.env.PUBLIC_URL || "/",
  async prerender() {
    return ["/", "/teams", "/board"];
  },
} satisfies Config;
