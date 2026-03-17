import { defineConfig } from "vite";
import { resolve } from "path";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: { tsconfigPaths: true, alias: { "@": resolve(__dirname, "src") } },
  build: { chunkSizeWarningLimit: 2000 },
});
