# The Form Engine (`@openreturn/engine`)

[← Back to the README](../README.md)

The deterministic core of OpenReturn. Facts and decisions go in, evaluated tax
forms come out. **No AI anywhere in the math** — every line on every form is
computed by a typed, pure-function derivation you can read, test, and diff.

```
evaluateScenario({ filing, facts, decisions })  →  EvaluatedScenario (all forms)
pendingInputs(scenario)                         →  decision + fact keys still needed
renderForm(scenario, formId, loadBlankPdf)      →  filled PDF bytes
```

## The package

```
engine/
├── src/        the engine (below)
├── tests/      unit, integration, golden, and the scenarios (tests/README.md)
├── scripts/    renderScenario, lockScenario, compareFiled
├── paths.ts    where the package sits on disk, for offline tooling
└── builder/    @openreturn/builder: dev-time tools that build the engine's
                assets (catalog.json, bindings drafts, tax tables; builder/README.md)
```

Other code imports only the `exports` in `package.json`:
`@openreturn/engine` (evaluate, render, pendingInputs, FORMS, the FormField
types), `@openreturn/engine/facts` (the fact vocabulary and row types),
`@openreturn/engine/catalog` (for the builder, `builder/`),
`@openreturn/engine/paths`, and `@openreturn/engine/scenarios` (test fixtures).
A deep import does not resolve.

Commands, from the repo root: `npm test` (golden), `npm run test:unit`,
`npm run test:integration`, `npm run typecheck`. From this folder:
`npx tsx scripts/renderScenario.ts --scenario=<name>`.

## The three rules

1. **The engine imports nothing outside `src/`** — no Mastra, no db
   layer, no AI, no network. The only exceptions: node builtins, `zod`,
   and `pdf-lib`. `tests/unit/boundary.test.ts` enforces this on every
   commit; if your change fails it, the fix is to move code or pass data in,
   never to widen the whitelist casually.
2. **The engine does no I/O.** Callers load fact/decision rows and pass
   them to `evaluateScenario` — the runtime bridge is the agent's
   `src/mastra/loadScenario.ts`, the only place db and engine meet.
   `renderForm` gets the blank PDF from the caller's `BlankPdfLoader`.
3. **The engine owns its vocabulary.** `facts/rows.ts` defines what a fact
   and a decision look like; the db layer imports those types, not the other
   way around.

## Layout

```
src/
├── index.ts          public API: evaluateScenario, renderForm, pendingInputs
├── pendingInputs.ts  the decision and fact keys the filed forms still need
├── engine.ts         fixpoint evaluator (cross-form refs converge in ≤5 passes)
├── defineForm.ts     typed binding authoring API (defineForm, stubZero)
├── money.ts          the one module for money math (sum, atLeast, roundDollars, stepsOf, formatDollars)
├── types.ts          FormField model, DerivationContext
├── filingInfo.ts     facts + decisions → typed FilingInfo projection
├── filingInfoResolvers.ts  per-form resolve<Form>Info slot resolvers
├── catalog.ts        widget catalogs (fieldId → PDF widget inventories)
├── formSpec.ts       FormSpec shape shared by jurisdiction registries
├── registry.ts       composes federal + state into the global FORMS list
├── facts/            fact vocabulary: row shapes + per-kind key conventions
├── data/             federal tables (rate schedules, tax table, std deduction)
├── worksheets/       IRS/FTB worksheets as pure functions (QDCG, 5695 line 31, …)
├── render/           PDF fill (fillFromCatalog + hand-verified widget overrides)
├── federal/          one folder per federal form (catalog.json, bindings.ts, …) + registry (index.ts)
└── state/
    ├── index.ts      one import + one spread per supported state
    └── ca/           CA registry + one folder per CA form (+ ca/data/ tables)
```

Each form's folder is its `relativeDir` (`federal/1040`, `state/ca/540`).
The engine keeps `catalog.json` there, next to `bindings.ts`. The source
documents (`blank.pdf`, instructions) use the same subpath in
`sources/<year>/forms/<relativeDir>/`.

## Adding a form

1. Put `blank.pdf` in `sources/<year>/forms/<jurisdiction>/<short>/`.
   Generate `catalog.json` into `src/<jurisdiction>/<short>/` with
   `npm run form-engine -- generate-catalog`.
2. In `src/<jurisdiction>/<short>/`, add `types.ts` (the form's
   FormFields — every field must declare `category` and `valueType`; TS
   won't compile otherwise), `filingInfo.ts`, and `bindings.ts`.
3. Add a `resolve<Form>Info` function (in `filingInfoResolvers.ts` or the
   form's `resolveInfo.ts`) and list it in `resolveFilingInfo`
   (`filingInfo.ts`). Every form needs one: it writes the form's
   must-file entry, `mustFile: { "<formId>": resolveMustFile(…) }`, plus
   any slots the form's `filingInfo.ts` declares. If the form reads an
   answer (a decision, or a fact that is not a document), list it in
   `missingInputs: { "<formId>": missingInputs({ "<key>": value }) }`.
   Otherwise a missing answer leaves a line blank or wrong and nothing
   tells Cade to ask. `tests/integration/requiredInputs.test.ts` fails when you forget.
4. Add a `makeFormSpec` entry (+ catalog import) to the jurisdiction's
   `index.ts`.
5. Add golden coverage under `tests/scenarios/`, and a catalog-fill golden
   (`tests/README.md`).

If a new form makes you touch files outside its folder and its jurisdiction
registry, the registry isn't doing its job — surface the missing abstraction
instead of papering over it.

## Adding a state

1. Create `state/<st>/` containing the state's forms (step 2 above per
   form), its `index.ts` exporting `<ST>_FORMS` + `<ST>_CATALOGS`, and its
   data tables under `state/<st>/data/`.
2. Add one import + two spreads in `state/index.ts`.

That's the whole diff outside your state's folder. States may read core and
federal results (CA 540 reads federal AGI cross-form) but never each other.

## Conventions

- **All money math goes through `money.ts`.** Whole-dollar rounding is
  `roundDollars()`, the nearest dollar (the IRS rule) — see CLAUDE.md for
  the evidence and the one exception ("or part" step rules, `stepsOf()`,
  round up by definition). Lint bans `Math.round` / `ceil` / `floor` /
  `trunc`, `toFixed`, and `toLocaleString` elsewhere in the engine.
- **Never invent a number.** A field whose inputs are missing evaluates to
  `blocked` with a reason — that's what feeds the open-questions list.
- **Tax years are parameter-keyed data** (tables take `taxYear`), not
  directory-per-year. The source documents in `sources` are by
  year; how the engine's rules change by year is still open. Decide it
  when a second filing year ships.
