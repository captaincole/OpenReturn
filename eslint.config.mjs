/*
 * Five jobs: comment style, names, promise safety, size caps, engine money rules.
 * Formatting is Prettier's job; correctness is tsc + the golden tests.
 */
import stylistic from "@stylistic/eslint-plugin";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.mastra/**",
      "**/.data/**",
      "**/.vercel/**",
      ".scratch/**",
      ".claude/**",
      "**/dist/**",
      "**/next-env.d.ts",
      /* Playwright report bundles (minified JS). */
      "web/e2e/.run/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mjs", "**/*.js"],
    languageOptions: { parser: tsParser },
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/multiline-comment-style": ["error", "starred-block"],
      /* A name says what the value is; `_` (ignored) and `i` (index) are the only short names. */
      "id-length": ["error", { min: 2, properties: "never", exceptions: ["_", "i"] }],
    },
  },
  /*
   * Type-aware: runs only on files a tsconfig covers. An explicit `void`
   * marks intentional fire-and-forget.
   */
  {
    files: ["canon/**/*.ts", "cade/**/*.ts", "web/**/*.ts", "web/**/*.tsx", "engine/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-floating-promises": ["error", { ignoreVoid: true }],
      /* checksVoidReturn catches an async handler passed as () => void; tsc does not. */
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
  /* Narrowed effect deps are sometimes deliberate: warn, and disable inline with a reason. */
  {
    files: ["web/**/*.tsx", "web/**/*.ts"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  /* Size caps. No grandfather list: offenders fail until split. Exceptions disable inline with a reason. */
  {
    files: ["canon/**/*.ts", "cade/**/*.ts", "web/**/*.ts", "web/**/*.tsx", "engine/**/*.ts"],
    rules: {
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["canon/**/*.ts", "cade/**/*.ts", "web/**/*.ts", "engine/**/*.ts"],
    rules: {
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    /* JSX markup inflates line counts without adding complexity. */
    files: ["web/**/*.tsx"],
    rules: {
      "max-lines-per-function": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    /*
     * The form engine rounds and formats money in one place: money.ts.
     * A bare Math.round here would skip the IRS nearest-dollar rule.
     */
    files: ["engine/src/**/*.ts"],
    ignores: ["engine/src/money.ts", "**/*.test.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        ...["round", "ceil", "floor", "trunc"].map((property) => ({
          object: "Math",
          property,
          message: "Money math goes through engine/src/money.ts (roundDollars, stepsOf, …).",
        })),
        ...["toFixed", "toLocaleString"].map((property) => ({
          property,
          message: "Money formatting goes through engine/src/money.ts (formatDollars).",
        })),
      ],
    },
  },
  {
    /* Per-form files mirror the paper form; tests favor readability over size. */
    files: [
      "engine/src/federal/**",
      "engine/src/state/**",
      "engine/tests/**",
      "canon/tests/**",
      "cade/tests/**",
      "**/*.test.ts",
    ],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
  {
    /* scripts/lockScenario.ts writes these; its template emits short names. */
    files: [
      "engine/tests/scenarios/carter/expected.ts",
      "engine/tests/scenarios/jordan/expected.ts",
      "engine/tests/scenarios/tara/expected.ts",
    ],
    rules: { "id-length": "off" },
  },
];
