import { defineConfig } from "vite";
import { config } from "dotenv";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

config();

export default defineConfig({
  plugins: [react()],
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
