---
name: engine-scripts
description: Run the form-engine CLI (catalogs, field types, tax tables), the engine's scenario scripts (render, lock, compare a filed return) and Cade's review diagnostics (smoke:review, inspectLastReview). Use for any engine asset, scenario, golden, or review-pipeline check.
---

# Engine, builder and review scripts

The form-engine CLI lives under `engine/builder/scripts/formEngine/`, Cade's tooling under `cade/scripts/`, engine scripts under `engine/scripts/`. The subcommand CLI has its own copy of the small dispatcher, `scripts/lib/cli.ts` — no args lists subcommands, `-- <cmd> --help` shows options. All run from the repo root; `--` passes args through both npm layers.

**`npm run form-engine`** — source documents (`sources`) → engine assets (`engine/src`): `form-status`, `extract-widgets`, `seed-labels`, `write-catalog` (a form is `federal/<short>` or `state/<st>/<short>`), `generate-types`, `ingest-federal-tax-table`, `ingest-ca-tax-table`, `ingest-ca-eitc-table` (the FTB 3514 EITC table, from the booklet in the corpus). It is the builder's CLI (`engine/builder/`). No command calls a model, and the builder has no env file: the `catalog-form-fields` and `write-binding-rules` skills do the labels and the bindings.

**Standalone diagnostics** (run via `npx tsx` from `cade/`):

| script | use |
|---|---|
| `smokeReview.ts` | three end-to-end review scenarios (npm: `smoke:review`; needs `npm run dev:canon`) |
| `inspectLastReview.ts` | dump most recent review-decision workflow run + trace |

**Engine scripts** (run via `npx tsx` from `engine/`):

| script | use |
|---|---|
| `renderScenario.ts` | render every form in a scenario to PDF for spot-checking |
| `draftExpected.ts --scenario=<name>` | write a NEW scenario's first `expected.ts` from the engine's output (jordan pattern, see docs/contributing.md); it refuses a scenario that already asserts values. Check each drafted line, then `renderScenario.ts --scenario=<name> --golden` writes its golden PDFs |
| `compareFiled/cli.ts <folder>` | private comparison kit: engine vs a real filed return (scenario format, kept outside the repo); writes a no-amounts report with root causes for the checker to send to a maintainer. Follow the `verify-with-filed-return` skill. |

**Builder scripts** (run via `npx tsx` from `engine/builder/`):

| script | use |
|---|---|
| `dumpCase.ts <case folder>` | print one downloaded test case (a TaxCalcBench case) as tables: its input files, its answers (`input/remaining_data.json`) and its answer key (`output.xml`) with one table per form. The `add-scenario` skill starts from it. |

The comparison kit refuses a folder inside the project. Private tax data never enters the repo, not even `.scratch/`: never write real figures, or any hint that a real return shaped something, into a committed file, a code comment, or a commit message.

## Verify your change

- The golden suite: `npm test` (a positional filter narrows it: `npm test -- alex`). Every scenario must pass. A locked scenario that changes means the engine's output changed: edit the value in `expected.ts` by hand, only after you verified it against the form instructions or a filed return (`verify-with-filed-return` skill). Never regenerate expected values from the engine.
- `npm run test:unit` and `npm run test:integration` for the engine: the boundary test, the money rules, the bindings.
- `npm run coverage` runs the golden suite under c8 (about 35 seconds) and rewrites `docs/coverage.md` (supported fields, branches and lines, by form) and the table under "Form support" in the root `README.md`: supported fields and tested branches for each jurisdiction and tax year. The script writes between the `coverage-table` marker comments; do not edit there by hand. The printed table and `engine/coverage/index.html` show the lines and paths that no scenario runs; use them to pick the next scenario. Commit `docs/coverage.md` and `README.md` on main after a scenario or a form merges, not in a scenario's own PR: parallel PRs would conflict on it.
- `npm run form-graph` runs every scenario (about 2 seconds) and rewrites `docs/form-graph.md` and `web/data/form-graph.json` (the web app draws it at `/library/graph`): which form reads which form, and the state of each field (verified, locked, not run, unsupported) with the count of fields that it feeds. Use it to pick the next form or field to work on. It also lists the forms the engine lacks, from the form names in blank fields; `engine/scripts/formGraph/missingForms.ts` is the hand-kept list of those forms, and a name on no list shows under "Names not classified". `sections.ts` in the same folder is the hand-kept part of the return for each form (income, deductions, tax, credits, payments): the web page draws one lane for each part. Add a new form to it; a form on no list goes to "Other". Like the coverage report, commit it on main after a scenario or a form merges, not in a scenario's own PR.
- A catalog or bindings change: `npx tsx scripts/renderScenario.ts --scenario=<name>` from `engine/`, then open the PDF and find the value in the right widget. The goldens trust the catalog's field-to-widget mapping, so a mislabeled catalog passes them and still prints in the wrong box.
- A tax-table ingest: check a few bracket boundaries by hand against the source PDF.
- A change to the review diagnostics or the ground path: `npm run smoke:review` with Canon running, then `npm run evals:lite -- --flow=review` for the verdicts.
