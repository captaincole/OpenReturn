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
| `compareFiled/cli.ts <folder>` | private comparison kit: engine vs a real filed return (scenario format, kept outside the repo); writes a no-amounts report with root causes for the checker to send to a maintainer |

The comparison kit refuses a folder inside the project. Private tax data never enters the repo, not even `.scratch/`: never write real figures, or any hint that a real return shaped something, into a committed file, a code comment, or a commit message.
