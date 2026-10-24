/*
 * Small lint config, four jobs:
 *  1. Comment style — multi-line comments are starred blocks, not
 *     stacked // lines. JSDoc passes as-is. `npm run lint:fix` converts.
 *  2. Promise safety — no floating promises (type-aware: canon/, apps/ and engine/).
 *  3. Size caps — 400 lines per file, 50 per function (100 in .tsx,
 *     where JSX inflates line counts without adding complexity).
 *     Form-specific engine files and tests are exempt. No grandfather
 *     list: existing offenders fail the gate until they are split up.
 *  4. Money rules — rounding and money formatting in the form engine go
 *     through engine/src/money.ts only.
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
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mjs", "**/*.js"],
    languageOptions: { parser: tsParser },
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/multiline-comment-style": ["error", "starred-block"],
    },
  },
  /*
   * Type-aware rules. These need type information, so they run only on
   * files a tsconfig covers (canon, apps/agent, engine and engine/builder:
   * src+tests+scripts; apps/web: everything). Modeled on n8n's config: a floating promise is an
   * error; an explicit `void` marks intentional fire-and-forget.
   */
  {
    files: ["canon/**/*.ts", "apps/**/*.ts", "apps/**/*.tsx", "engine/**/*.ts"],
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
      /*
       * checksVoidReturn stays on — it is the one case tsc cannot catch
       * (an async handler passed where () => void is expected). The
       * conditional-promise case is mostly tsc's TS2801 already.
       */
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
  /*
   * React hooks correctness, web app only. A conditional hook is always a
   * bug (error). Narrowed effect deps are sometimes deliberate — the rule
   * warns, and intentional sites carry an eslint-disable with a reason.
   */
  {
    files: ["apps/web/**/*.tsx", "apps/web/**/*.ts"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  /*
   * Size caps. A file over 400 real lines is probably two modules; a
   * function over 50 probably wants extraction. Counts skip blank lines
   * and comments. Known exceptions carry an inline disable with a reason.
   */
  {
    files: ["canon/**/*.ts", "apps/**/*.ts", "apps/**/*.tsx", "engine/**/*.ts"],
    rules: {
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["canon/**/*.ts", "apps/**/*.ts", "engine/**/*.ts"],
    rules: {
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    /* JSX markup inflates line counts without adding complexity. */
    files: ["apps/**/*.tsx"],
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
    /*
     * Exempt: per-form registries/bindings mirror the shape of the paper
     * form and are long by nature; tests and fixtures optimize for
     * readability over size.
     */
    files: [
      "engine/src/federal/**",
      "engine/src/state/**",
      "engine/tests/**",
      "canon/tests/**",
      "apps/agent/tests/**",
      "**/*.test.ts",
    ],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
];
