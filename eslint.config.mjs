import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    // Kept as a separate package with its own toolchain (Cloudflare Worker);
    // not part of the app build.
    "backend/**",
  ]),
  {
    // Electron main-process files are CommonJS by design (Electron loads
    // main.js directly), so require() is expected there.
    files: ["main.js", "preload.js", "main/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Underscore-prefixed identifiers are the conventional "intentionally
    // unused" marker (e.g. the `_event` first parameter of IPC callbacks).
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
