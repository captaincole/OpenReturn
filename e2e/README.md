# End-to-end tests

Playwright drives the real web app, agent, and model through Chrome.

```bash
npm run e2e        # stop `npm run dev:all` first — the run needs :3000 and :4111
```

- **Models:** the run uses `apps/agent/.env.development`, then the `E2E_*` lines in the gitignored `apps/agent/.env` override it. The default setup is Gemma 4 31b on a LAN machine with an RTX 4090. It passes in about 2 minutes. To set it up, add these lines (with that machine's address):
  ```
  E2E_LUCA_MODEL=ollama/gemma4:31b
  E2E_LUCA_MODEL_URL=http://<pc>:11434/v1
  E2E_JUDGE_MODEL=ollama/gemma4:31b
  E2E_JUDGE_MODEL_URL=http://<pc>:11434/v1
  ```
- **Another model for one run:** set the same variables in the shell; the shell wins. For example `E2E_LUCA_MODEL=anthropic/claude-haiku-5-5 npm run e2e` (a cloud model needs no URL). `summary.md` names the models each run used.
- **Grounding reviews:** off (`DECISION_REVIEW=off`). On a local model they share the GPU with Luca and make each turn several times slower. `E2E_DECISION_REVIEW=on npm run e2e` turns them on.
- **Data:** each run gets its own folder, `e2e/.run/<runId>/`, with `data/` (app.db, mastra.db, documents), `agent.log`, `web.log`, `transcript.md`, and Playwright output (`report/`, trace and video on failure). Your real `.data/` is never touched. Delete `e2e/.run/` freely.
- **The Alex test** (`alex.spec.ts`): create owner → start filing → scripted intake with the W-2 upload (`alexAnswers.ts`) → wait for generated forms → check the stored W-2, the decisions, and the sidecar against `packages/engine/tests/scenarios/alex/`.
- **Result:** `e2e/.run/<runId>/summary.md`, one row per stage:
  - `plumbing` — setup, filing, chat, upload, forms page. A failure means the app broke. The run stops there.
  - `model` — W-2 read, decisions, final values. A failure can be a model mistake. Run again before you debug.
- **When Luca asks something new:** the intake stage fails and the transcript shows the question. Add a keyword rule to `ANSWERS` in `alexAnswers.ts`.
- **Debug a failure:** `npx playwright show-trace e2e/.run/<runId>/test-results/**/trace.zip`.
