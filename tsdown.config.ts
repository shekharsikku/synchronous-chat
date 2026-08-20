import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  target: "esnext",
  sourcemap: true,
  fixedExtension: false,
});
