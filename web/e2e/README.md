# End-to-end tests

Claude Code follows the `e2e` skill (`.claude/skills/e2e/SKILL.md`) to run this suite and read its summary.

Playwright drives the real web app, agent, Canon, and model through Chrome.

```bash
npm run e2e        # stop `npm run dev:all` first — the run needs :3000, :4111 and :4112
```

The suite lives in the web app because it drives the web app; Playwright is a web dev dependency (`npm run install:all` installs it). The root `npm run e2e` runs `npm --prefix web run e2e`.

- **Models:** the run uses `cade/.env.development` (Canon: `canon/.env.development`; `E2E_JUDGE_*` overrides its judge too). Optional `E2E_*` lines in the gitignored `cade/.env` override it, for example a larger model on another machine that runs Ollama:
  ```
  E2E_CADE_MODEL=ollama/gemma4:31b
  E2E_CADE_MODEL_URL=http://<host>:11434/v1
  E2E_JUDGE_MODEL=ollama/gemma4:31b
  E2E_JUDGE_MODEL_URL=http://<host>:11434/v1
  ```
  Small local models fail the intake often; a model the size of Gemma 4 31b passes most runs.
- **Another model for one run:** set the same variables in the shell; the shell wins. For example `E2E_CADE_MODEL=anthropic/claude-haiku-5-5 npm run e2e` (a cloud model needs no URL). `summary.md` names the models each run used.
- **Grounding reviews:** off (`DECISION_REVIEW=off`). On a local model they share the GPU with Cade and make each turn several times slower. `E2E_DECISION_REVIEW=on npm run e2e` turns them on; that run exercises Cade's MCP call to Canon's `ground` workflow, and a decision that ends `review_unreached` or `review_failed` fails `plumbing`. The judges get one round per decision (`CANON_GROUND_MAX_ITERATIONS=1`; `E2E_GROUND_MAX_ITERATIONS` raises it): the run checks the plumbing, not the verdict.
- **Data:** each run gets its own folder, `web/e2e/.run/<runId>/`, with `data/` (app.db, mastra.db, canon.db, documents), `canon.log`, `agent.log`, `web.log`, `transcript.md`, and Playwright output (`report/`, trace and video on failure). Your real `.data/` is never touched. Delete `web/e2e/.run/` freely.
- **The Alex test** (`alex.spec.ts`): create owner → ask the tax code one question with a definite answer (`ask.ts`: the 2025 self-only HSA limit; the answer must cite a reference and state $4,300, and the reference PDF must open) → start filing → scripted intake with the W-2 upload (`alexAnswers.ts`) → wait for generated forms → check the stored W-2, the decisions, and the sidecar against `engine/tests/scenarios/alex/`.
- **Result:** `web/e2e/.run/<runId>/summary.md`, one row per stage:
  - `plumbing` — setup, filing, chat, upload, forms page. A failure means the app broke. The run stops there.
  - `model` — W-2 read, decisions, final values. A failure can be a model mistake. Run again before you debug.
- **When Cade asks something new:** the intake stage fails and the transcript shows the question. Add a keyword rule to `ANSWERS` in `alexAnswers.ts`.
- **Debug a failure:** from `web/`, `npx playwright show-trace e2e/.run/<runId>/test-results/**/trace.zip`.
