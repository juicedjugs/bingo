import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig(() => ({
  base: process.env.VITE_BASE || "/",
  plugins: [reactRouter()],
  ssr: {
    // Workaround for resolving dependencies in the server bundle
    // Without this, the React context will be different between direct import and transitive imports in development environment
    // For more information, see https://github.com/mui/material-ui/issues/45878#issuecomment-2987441663
    optimizeDeps: {
      include: ["@emotion/*", "@mui/*"],
    },
    noExternal: ["@emotion/*", "@mui/*"],
  },
  build: {
    rollupOptions: {
      external: ["node:fs/promises", "node:path", "@iconify/json"],
    },
  },
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
}));
