// eslint.config.js  – flat config
import js from "@eslint/js";
import globals from "globals";
import * as tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  /* ─────────────────────────── JS base ─────────────────────────────── */
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  /* ─────────────────────────── TS rules ─────────────────────────────── */
  ...tseslint.configs.recommended,          // applies to **/*.ts,tsx

  /* ─────────────────────────── React + hooks ────────────────────────── */
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { react, "react-hooks": reactHooks },

    /* 👇 tell eslint-plugin-react to auto-detect the installed React ver. */
    settings: {
      react: { version: "detect" },
    },

    rules: {
      ...react.configs.recommended.rules,  // keep the recommended set

      /* no longer needed with the new JSX transform */
      "react/react-in-jsx-scope": "off",

      /* we use TS, prop-types are redundant */
      "react/prop-types": "off",

      /* hooks rules */
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
