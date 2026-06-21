import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const workspaceLocal = path.resolve(__dirname, "..", ".local");
const viteCacheDir =
  process.env.VITE_CACHE_DIR ?? path.join(workspaceLocal, "vite-cache", "civic-call");

export default defineConfig({
  plugins: [react()],
  cacheDir: viteCacheDir,
  server: {
    port: 5174,
    proxy: {
      "/.netlify/functions": {
        target: "http://127.0.0.1:8888",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
