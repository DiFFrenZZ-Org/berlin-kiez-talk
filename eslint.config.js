// eslint.config.js  – flat config

import js from "@eslint/js";
import globals from "globals";
import * as tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  /* ------------------------------------------------ JS base ------------- */
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  /* ------------------------------------------------ TS rules ------------ */
  ...tseslint.configs.recommended, // applies to **/*.ts,tsx by default

  /* ------------------------------------------------ React + hooks ------- */
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      // keep all recommended React rules …
      ...react.configs.recommended.rules,

      // modern JSX transform → no import React
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off", // no prop-types in TS

      // hook correctness
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
