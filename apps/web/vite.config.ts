import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { redact } from "@tanstack/redact/vite";

export default defineConfig({
  plugins: [tailwindcss(), react(), redact(), babel({ presets: [reactCompilerPreset()] })],
  resolve: { tsconfigPaths: true },
  build: { chunkSizeWarningLimit: 2000 },
});
