---
name: e2e
description: Run the Playwright end-to-end suite (web + Cade + Canon + a real model) and read its summary. Use after a change to the web app, the agent tools, document generation, or Canon's MCP surface.
---

# End-to-end run

After a change to the web app, the agent tools, or document generation, run `npm run e2e` in the background (a few minutes; the models come from `cade/.env.development` (Canon's from `canon/.env.development`) and optional `E2E_*` lines in the gitignored `cade/.env`, see web/e2e/README.md). Read `web/e2e/.run/<runId>/summary.md`. A `plumbing` failure means the change probably broke the app. A `model` failure can be a model mistake: run again before you debug. `dev:all` must be stopped first.

## Steps

1. Free the ports: the run needs `:3000`, `:4111` and `:4112`. Stop `npm run dev:all`; a run started while a dev server holds a port times out after five minutes waiting for the web server.
2. Decide on grounding reviews. They are off by default. `E2E_DECISION_REVIEW=on npm run e2e` turns them on with one judge round per decision; use that for any change to Canon, the review workflow, or the MCP client. Expect ten to fifteen minutes instead of three.
3. Run in the background and wait for it; do not poll.
4. Read `web/e2e/.run/<runId>/summary.md`: one row per stage. With reviews on, the Notes list the verdict counts; a decision that ends `review_unreached` or `review_failed` fails `plumbing`.
5. Count error lines in `agent.log` and `canon.log` in the same folder.
6. Report: pass or fail, the models used, the stage that failed and its detail, and the summary path.

## Debugging a failure

- The run's folder holds `transcript.md`, the three server logs, `data/` (its own app.db, mastra.db, documents) and, on failure, Playwright's trace and video under `test-results/`. Your real `.data/` is never touched.
- From `web/`: `npx playwright show-trace e2e/.run/<runId>/test-results/**/trace.zip`.
- When Cade asks something new, the intake stage fails and the transcript shows the question. Add a keyword rule to `ANSWERS` in `web/e2e/alexAnswers.ts`.
- The run copies `canon/.env.development` and `cade/.env.development` into its own env files, so a port or path override left in those files (for example from a worktree) carries into the run.

## Before the full run: targeted calls

A full run costs minutes; check the one path you changed first, against `npm run dev:all`.

- Cade: `curl -s http://127.0.0.1:4111/app/state | head -c 400` returns the case state; a tool change shows in a chat turn, and `npm run smoke:review` exercises the review queue and Canon's `run_ground` tool.
- Canon: `curl -s http://127.0.0.1:4112/health`; `npm run corpus -- search "<phrase>"` for retrieval; `npm run smoke:review` for the judges.
- Web, through the same proxy the browser uses: create the owner with `curl` against `/api/auth/setup`, log in against `/api/auth/login` with `-c cookies.txt`, then `POST /api/agent/app/ask` with the cookie for an Ask turn and `GET /api/agent/app/ask/<threadId>` until the turn is completed. The browser tools cannot type into the password fields (a password-manager extension takes them), so the cookie path is the reliable one.

Then the full run, with reviews on for a change to Canon, the review workflow or the MCP client, and off otherwise.
