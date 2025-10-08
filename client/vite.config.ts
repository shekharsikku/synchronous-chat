import { defineConfig } from "vite";
import { config } from "dotenv";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";

config();

export default defineConfig({
  plugins: [react(), visualizer({ filename: "../public/test/stats.html" })],
  define: {
    "import.meta.env": process.env,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
