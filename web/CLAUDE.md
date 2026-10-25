# web — Claude notes

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Generated files — do not edit, do not commit

- `next-env.d.ts` — Next.js regenerates it on every `next dev` / `next build`. It pulls Next.js global types (CSS modules, static images, typed routes) into the TypeScript program. Gitignored. Do not edit or delete it; a delete causes type errors until the next build regenerates it.
- `tsconfig.tsbuildinfo` — TypeScript incremental-compile cache. Gitignored. Safe to delete; the next compile recreates it. Delete it if `tsc` results look stale.
- `.next/` — build output, gitignored.

## File conventions

- This file replaced `AGENTS.md` (2026-10-08). If a Next.js upgrade regenerates `AGENTS.md`, merge any changed `nextjs-agent-rules` block into this file and delete it again.

## Colors and themes

The app has a light and a dark theme (`lib/theme.ts`, toggle in both top bars). Use the theme tokens from `app/globals.css` (`bg-bg-*`, `text-ink-*`, `border-border-*`, `accent`, and `ok` / `warn` / `danger` for status). Do not use Tailwind palette colors such as `text-red-400`: they do not change with the theme and are hard to read on one of the two backgrounds. For a one-off per-theme style, use the `light:` variant (for example `light:shadow-black/10`).

## Turbopack dev cache is off

`next.config.ts` sets `experimental.turbopackFileSystemCacheForDev: false`. With the cache on, a restart served a `globals.css` chunk from before edits made while the server was stopped (or before a branch switch): new rules never reached the page. If CSS still looks stale, stop the server and `rm -rf web/.next`.
