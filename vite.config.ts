import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/bingo/",
  build: {
    outDir: "dist",
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
});
