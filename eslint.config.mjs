import eslintReact from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  {
    ignores: [
      "dist/**",
      "dist-server/**",
      "node_modules/**",
      "generated/**",
      "build/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "vite.config.ts",
    ],
  },

  // React frontend
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [eslintReact.configs["recommended-typescript"]],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      parserOptions: { project: ["./tsconfig.json"] },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },

  // NestJS backend
  {
    files: ["server/**/*.ts"],
    languageOptions: {
      parserOptions: { project: ["./tsconfig.server.json"] },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  prettier,
]);
