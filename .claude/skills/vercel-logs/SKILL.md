---
name: vercel-logs
description: Read Cade's production runtime and build logs on Vercel with the vercel CLI. Use when debugging a deployed agent request, a missing log line, or a failed deployment.
---

# Vercel logs (production debugging)

Production runtime logs for the agent come through `vercel logs`, but with gotchas:

- **Run from `cade/`** — the linked project's directory. From the repo root, the CLI uses the wheel-of-finances project context and returns nothing for the agent. `cade/.vercel/project.json` (gitignored) is what scopes the call.
- **`/health` bypasses user middleware.** Mastra special-cases its framework routes; a `/health` hit doesn't fire `server.middleware`, so it won't show your `console.log` lines. Test logging via `/api/*` or `/app/*` instead.
- **We don't use Mastra's `PinoLogger`** — its default destination is async-buffered and gets truncated on Vercel function exit, swallowing every log line on requests that error. We ship `ConsoleLogger` (`cade/src/mastra/server/consoleLogger.ts`) instead — a ~70-line `MastraLogger` subclass that writes single-line JSON via `console.{log,warn,error}`. `vercel logs --json` parses each line into its structured fields. Use `mastra.getLogger()` (or `logger.error("msg", { err })`) anywhere new error paths land; no need for ad-hoc `console.log`.
- **Useful flags:** `--since 30m --limit 30 --expand` (historical), `--follow` (live tail), `--json` (richer per-request record incl. `responseStatusCode`, `cache`, structured `logs` array). No duration field — log timings yourself in middleware if needed.
- **Build logs (separate from runtime):** `vercel inspect <deployment-url> --logs`.
