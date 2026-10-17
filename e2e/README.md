# End-to-end tests

Playwright drives the real web app, agent, and model through Chrome.

```bash
npm run e2e        # stop `npm run dev:all` first — the run needs :3000 and :4111
```

- **Models:** the run uses `apps/agent/.env.development` as is, so it uses whatever `LUCA_MODEL` / `JUDGE_MODEL` you set there (local Ollama or cloud).
- **Data:** each run gets its own folder, `e2e/.run/<runId>/`, with `data/` (app.db, mastra.db, documents), `agent.log`, `web.log`, `transcript.md`, and Playwright output (`report/`, trace and video on failure). Your real `.data/` is never touched. Delete `e2e/.run/` freely.
- **The Alex test** (`alex.spec.ts`): create owner → start filing → scripted intake with the W-2 upload (`alexAnswers.ts`) → wait for generated forms → check the stored W-2, the decisions, and the sidecar against `apps/agent/tests/scenarios/alex/`.
- **Result:** `e2e/.run/<runId>/summary.md`, one row per stage:
  - `plumbing` — setup, filing, chat, upload, forms page. A failure means the app broke. The run stops there.
  - `model` — W-2 read, decisions, final values. A failure can be a model mistake. Run again before you debug.
- **When Luca asks something new:** the intake stage fails and the transcript shows the question. Add a keyword rule to `ANSWERS` in `alexAnswers.ts`.
- **Debug a failure:** `npx playwright show-trace e2e/.run/<runId>/test-results/**/trace.zip`.
