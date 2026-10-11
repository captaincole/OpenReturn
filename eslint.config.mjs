/*
 * Small lint config, two jobs:
 *  1. Comment style — multi-line comments are starred blocks, not
 *     stacked // lines. JSDoc passes as-is. `npm run lint:fix` converts.
 *  2. Promise safety — no floating promises (type-aware, apps/ only).
 * Formatting is Prettier's job; correctness is tsc + the golden tests.
 */
import stylistic from "@stylistic/eslint-plugin";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.mastra/**",
      "**/.data/**",
      "**/.vercel/**",
      ".scratch/**",
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
   * files a tsconfig covers (apps/agent: src+tests+scripts; apps/web:
   * everything). Modeled on n8n's config: a floating promise is an
   * error; an explicit `void` marks intentional fire-and-forget.
   */
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
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
    },
  },
];
