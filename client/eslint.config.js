import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "vite.config.*",
      "tailwind.config.*",
      "postcss.config.*",
      "eslint.config.*",
      "src/components/ui/**",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: true,
      },
      globals: {
        React: "writable",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: true,
        alias: {
          map: [["@", "./src"]],
          extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
      },
      react: {
        version: "detect",
      },
    },

    rules: {
      "no-unused-vars": "off",

      // --- TypeScript ---
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // --- React Hooks ---
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // --- React Fast Refresh ---
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // --- Import Order ---
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "object", "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // --- General JS/TS ---
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      "no-debugger": "warn",
    },
  },
]);
