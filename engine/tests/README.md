# tests

Scenario tests should cover *EVERY* supported form field at some level. This is the core way that we can establish that our engine is accurate, as all scenarios are CPA reviewed. 

Every test for `@openreturn/engine` lives here. No test file goes under `src/`
or `scripts/`; `unit/layout.test.ts` fails on one. Cade's tests (tools, db)
are in `cade/tests/`; the corpus tests are in `canon/tests/`.

| Folder | Kind | Command (repo root) |
| --- | --- | --- |
| `unit/` | One module, its own small inputs. The same folders as `src/` and `scripts/`. | `npm run test:unit` |
| `integration/` | The whole engine over every scenario. | `npm run test:integration` |
| `golden/` | Every scenario and catalog, against locked values and PDFs. | `npm test` |
| `scenarios/` | The scenario data. `scenarios/index.ts` lists them all. | — |
| `helpers/` | Shared assertion, fixture, and golden-PDF code. | — |

The pre-commit hook runs all three. All are offline: no network, no AI.

**Where a new test goes.** A rule, worksheet, or table test goes in
`unit/`, next to the same path as its module. Give it small inputs of its
own, as a table when there are several cases. Do not change a scenario
to check one rule. Only a check that must hold for every scenario goes
in `integration/`.

## Golden suite

`golden/runAll.ts` prints one summary table. Positional args filter by
check name: `npm test -- alex`, `npm test -- catalog-fill`,
`npm test -- form-540`.

- **Scenario goldens** (`scenarios/<name>/`) — each scenario bundles
  facts + decisions + per-form expected line values.
  `golden/runScenario.ts` runs the engine over them and asserts every
  field, then diffs the filled PDF against a golden. These are the ground
  truth for "did the math change".
  - `alex` — single CA filer, one W-2, standard deduction (the canonical case)
  - `alejandro` — adds 1099-INT/DIV investment income
  - `marcus` — adds capital gains (8949 / Schedule D)
  - `jordan` — high income: HSA, RSU and crypto sales, 401(k) rollovers,
    1099-MISC (locked engine output, drafted by `../scripts/draftExpected.ts`)
  - `carter` — **unverified**: IRS ATS test scenario 8 moved to CA. MFS,
    age 65+, Roth and rollover 1099-Rs, capital gain distribution, Social
    Security. No answer key: hand-checked, locked engine output
    (`verification: "unverified"`; the summary line says so)
  - `tara` — **unverified**: IRS ATS test scenario 1 moved to CA. Single,
    two W-2s, a household employee (Schedule H), home energy improvements
    (Form 5695 Part II, Schedule 3). Hand-checked, locked engine output
  - `tcb-us-001` — TaxCalcBench case ty25-us-001, federal only. Head of
    household, a dependent, a $5M long-term stock gain, itemized
    deductions (Schedule A, with Form 1098 mortgage interest and
    investment interest on Form 4952), the AMT on an ISO exercise (Form
    6251). Checked against the case's answer key; its README lists where
    the engine follows the form instead
  - `tcb-us-003` — TaxCalcBench case ty25-us-003, federal only. MFJ,
    spouse 65+, an IRA rollover and a Roth conversion (Form 8606),
    Social Security, the senior deduction (Schedule 1-A). Checked against
    the case's answer key; its README lists where the engine follows the
    instructions instead
  - `tcb-us-004` — TaxCalcBench case ty25-us-004, federal only. MFJ,
    itemized deductions (Schedule A, with investment interest on Form
    4952), a dependent (Schedule 8812), two W-2s, a consulting business
    (Schedule C, SE, 8995), a stock sale, Social Security. Every line
    the engine fills matches the case's answer key
  - `tcb-us-006` — TaxCalcBench case ty25-us-006, federal only. MFS, a
    W-2 with an HSA, a rideshare business (Schedule C, Schedule SE, Form
    8995-A) with its 1099-K, a W-2G, interest and dividends (Forms 8959 and 8960). Checked
    against the case's answer key; its README lists where the engine
    follows the instructions instead
  - `tcb-us-005` — TaxCalcBench case ty25-us-005, federal only. MFJ, a
    real estate professional's rental and a passive royalty (Schedule E,
    Form 8582), a business whose QBI nets the rental's loss (Schedule C
    (Form 8995-A)), a W-2 over the Additional Medicare threshold and a
    child (Schedule 8812). Every line in the case's answer key matches;
    its README lists what it leaves blank and the QJV box
  - `tcb-us-008` — TaxCalcBench case ty25-us-008, federal only. MFS, a
    W-2, a consulting business paid on a 1099-NEC (Schedule C with
    mileage and a simplified home office, Schedule SE, Form 8995), gifts
    on Schedule A, a capital loss carryover on Schedule D. Checked
    against the case's answer key; its README lists the lines not checked
  - `tcb-ca-005` — TaxCalcBench case ty25-ca-005, CA checked only. MFJ,
    a dependent, CA itemized deductions (Schedule CA Part II, FTB 3526),
    the CA AMT on an ISO exercise (Schedule P), an early 1099-R (FTB
    3805P). Every checked line matches the case's CA key; the federal
    forms are inputs with locked goldens
- **Catalog-fill checks** (`golden/catalogFill.ts`) — for every form in its
  `CATALOGS` registry: fill the blank PDF with synthetic values for every
  cataloged field and diff against a golden snapshot in
  `golden/catalog-fill/<relativeDir>.json`. Catches widget-mapping drift
  without needing scenario coverage.

Blank PDFs come from `@openreturn/sources` (`sources/<year>/forms/…`), through
`helpers/formPaths.ts`. The engine itself reads no files.

## Adding coverage

- **New scenario**: follow [Add a scenario](../../docs/adding-a-scenario.md).
  In short: create `scenarios/<name>/` (see `alex/` for the file shape:
  `facts.ts`, `decisions.ts`, `expected.ts`, `index.ts`), and add it to
  `SCENARIOS` in `scenarios/index.ts`. The golden and integration tests
  then run it.
- **New form's catalog check**: `CATALOGS` in `golden/catalogFill.ts`
  mirrors the engine registry, so a registered form gets a check by
  itself. The first run fails with "no golden — run --update"; run
  `npx tsx tests/golden/catalogFill.ts --form-id=<id> --update` (from
  `engine/`) to bootstrap the snapshot, eyeball the PDF it wrote,
  and commit it.
