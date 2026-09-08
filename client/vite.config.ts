import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: { tsconfigPaths: true },
  build: { outDir: "../public/dist", emptyOutDir: true, chunkSizeWarningLimit: 2000 },
});
