// Minimal, single-purpose lint config: multi-line comments must be starred
// blocks (/* … */ with aligned stars) instead of stacked // lines. JSDoc
// (/** … */) passes as-is. Auto-fixable — `npm run lint:fix` converts
// violations in place. We deliberately add no other rules; tsc and the
// golden tests carry correctness.
import tsParser from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";

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
];
