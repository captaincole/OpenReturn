---
name: engine-scripts
description: Run the form-engine CLI (catalogs, bindings, tax tables), the engine's scenario scripts (render, lock, compare a filed return) and Cade's review diagnostics (smoke:review, inspectLastReview). Use for any engine asset, scenario, golden, or review-pipeline check.
---

# Engine, builder and review scripts

The form-engine CLI lives under `engine/builder/scripts/formEngine/`, Cade's tooling under `cade/scripts/`, engine scripts under `engine/scripts/`. The subcommand CLI has its own copy of the small dispatcher, `scripts/lib/cli.ts` — no args lists subcommands, `-- <cmd> --help` shows options. All run from the repo root; `--` passes args through both npm layers.

**`npm run form-engine`** — source documents (`sources`) → engine assets (`engine/src`): `generate-catalog`, `generate-bindings`, `generate-types`, `ingest-federal-tax-table`, `ingest-ca-tax-table`. It is the builder's CLI (`engine/builder/`): put `ANTHROPIC_API_KEY` in `engine/builder/.env.development` for the two AI commands, and run Canon (`npm run dev:canon`) for `generate-bindings`.

**Standalone diagnostics** (run via `npx tsx` from `cade/`):

| script | use |
|---|---|
| `smokeReview.ts` | three end-to-end review scenarios (npm: `smoke:review`; needs `npm run dev:canon`) |
| `inspectLastReview.ts` | dump most recent review-decision workflow run + trace |

**Engine scripts** (run via `npx tsx` from `engine/`):

| script | use |
|---|---|
| `renderScenario.ts` | render every form in a scenario to PDF for spot-checking |
| `lockScenario.ts --scenario=<name>` | rewrite a scenario's `expected.ts` engineFields from the engine's output — only after the output is verified (jordan pattern, see docs/contributing.md); then `renderScenario.ts --scenario=<name> --golden` rewrites its golden PDFs |
| `compareFiled/cli.ts <folder>` | private comparison kit: engine vs a real filed return (scenario format, kept outside the repo); writes a no-amounts report with root causes for the checker to send to a maintainer. Follow the `verify-with-filed-return` skill. |

The comparison kit refuses a folder inside the project. Private tax data never enters the repo, not even `.scratch/`: never write real figures, or any hint that a real return shaped something, into a committed file, a code comment, or a commit message.

## Verify your change

- The golden suite: `npm test` (a positional filter narrows it: `npm test -- alex`). Every scenario must pass. A locked scenario that changes means the engine's output changed: lock it only after you verified the new value against the form instructions or a filed return (`verify-with-filed-return` skill).
- `npm run test:unit` and `npm run test:integration` for the engine: the boundary test, the money rules, the bindings.
- A catalog or bindings change: `npx tsx scripts/renderScenario.ts --scenario=<name>` from `engine/`, then open the PDF and find the value in the right widget. The goldens trust the catalog's field-to-widget mapping, so a mislabeled catalog passes them and still prints in the wrong box.
- A tax-table ingest: check a few bracket boundaries by hand against the source PDF.
- A change to the review diagnostics or the ground path: `npm run smoke:review` with Canon running, then `npm run evals:lite --flow=review` for the verdicts.
