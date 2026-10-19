# tests

Scenario tests should cover *EVERY* supported form field at some level. This is the core way that we can establish that our engine is accurate, as all scenarios are CPA reviewed. 

The offline golden suite — `npm test` from the repo root, and what the
pre-commit hook runs. Fast, deterministic, no network, no AI: it exercises
the form engine and PDF fill entirely in memory. Positional args filter by
check name: `npm test -- alex`, `npm test -- catalog-fill`,
`npm test -- form-540`.

Two kinds of checks, one summary table (`runAll.ts`):

- **Scenario goldens** (`scenarios/alex|alejandro|marcus|jordan|carter|tara/`) — each scenario
  bundles facts + decisions + per-form expected line values. `runScenario.ts`
  runs the engine over them and asserts every field, then diffs the filled
  PDF against a golden. These are the ground truth for "did the math change".
  - `alex` — single CA filer, one W-2, standard deduction (the canonical case)
  - `alejandro` — adds 1099-INT/DIV investment income
  - `marcus` — adds capital gains (8949 / Schedule D)
  - `jordan` — high income: HSA, RSU and crypto sales, 401(k) rollovers,
    1099-MISC (locked engine output, see `scripts/lockScenario.ts`)
  - `carter` — **unverified**: IRS ATS test scenario 8 moved to CA. MFS,
    age 65+, Roth and rollover 1099-Rs, capital gain distribution, Social
    Security. No answer key: hand-checked, locked engine output
    (`verification: "unverified"`; the summary line says so)
  - `tara` — **unverified**: IRS ATS test scenario 1 moved to CA. Single,
    two W-2s, a household employee (Schedule H), home energy improvements
    (Form 5695 Part II, Schedule 3). Hand-checked, locked engine output
- **Catalog-fill checks** (`catalogFill.ts`) — for every form in its
  `CATALOGS` registry: fill the blank PDF with synthetic values for every
  cataloged field and diff against a golden snapshot. Catches widget-mapping
  drift without needing scenario coverage.

## Adding coverage

- **New scenario**: follow [Add a scenario](../../../docs/adding-a-scenario.md).
  In short: create `scenarios/<name>/` (see `alex/` for the file shape:
  `facts.ts`, `decisions.ts`, `expected.ts`, `index.ts`), and add it to
  the `SCENARIOS` arrays in `runAll.ts` and
  `src/mastra/tools/requiredInputs.test.ts`.
- **New form's catalog check**: `CATALOGS` in `catalogFill.ts` mirrors the
  engine registry, so a registered form gets a check by itself. The first
  run fails with "no golden — run --update";
  run `npx tsx tests/catalogFill.ts --form-id=<id> --update` (from
  `apps/agent/`) to bootstrap the snapshot, eyeball the PDF it wrote, and
  commit it.

`helpers/` holds the shared assertion/fixture/golden-PDF utilities.

Unit tests are separate: vitest, colocated with the code they test
(`src/**/*.test.ts`, `scripts/**/*.test.ts`, and the rule tests in
`tests/*.test.ts`; the engine boundary check is one of them). Run them
with `npm run test:unit` (from the repo root or `apps/agent/`). The
pre-commit hook runs them after the golden suite.
