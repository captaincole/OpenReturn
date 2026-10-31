---
name: verify-with-filed-return
description: Verify the form engine against a real filed return with the private comparison kit, without the return's figures ever entering the project. Use when a maintainer or checker has a return folder outside the repo and wants the engine checked, a root cause fixed, or a fake scenario built from the match.
---

# Verify the engine against a filed return

The human guide is `docs/testing-with-your-return.md`; the kit is `engine/scripts/compareFiled/`. This skill is Claude's side of it: run the kit, read its reports, fix the engine, and keep every private figure out of the project.

## The privacy contract

- The return lives in a folder **outside the project** that the user names in the session. Never read, list, copy or open that folder's files. The kit refuses a folder inside the project.
- Run the kit without `--show-values`. The default output and the two report files hold line ids, how far each line is off, and document counts, but no amounts, names or payers. `--show-values` prints amounts to the terminal and is for the taxpayer only.
- Nothing from the return goes into a committed file, a code comment, a commit message, a PR, `.scratch/`, or memory: no figures, no payer names, and no hint that a real return shaped a change. Write "verified against a filed return" and no more.
- Ask the user to fill in or correct the folder's files themselves. The kit's `AI_PROMPT.md` exists for an AI session the taxpayer runs with their own data, not for this one.

## Steps

All commands run from `engine/`.

1. **Check the inputs**: `npx tsx scripts/compareFiled/cli.ts <folder> --check`. Report what it lists (unknown facts or decisions, filed lines typed with cents, line ids that do not exist, forms the engine does not model). The user fixes the files; a real document the engine does not support stays listed and tells us what to build.
2. **Run the comparison**: `npx tsx scripts/compareFiled/cli.ts <folder>`. It writes `openreturn-check-<year>-<date>.md` and `.json` into the folder. Read those two files only.
3. **Work the root causes.** The report lists them after the per-form summary: a root line differs while every line it reads matches. One root often explains the lines after it. For each root, find the cause in the engine code: a binding, a worksheet step, a rounding choice, or a missing form.
4. **Decide what each cause is.** An engine bug gets a fix. A preparer's choice (rounding, where a total lands) becomes an option with the IRS rule as the default; see the rounding convention in CLAUDE.md and the `preparer` field in the folder's `index.ts`. A line the engine does not model becomes an issue.
5. **Fix, then ask for a re-run.** Run the engine's suites (`npm test`, `npm run test:unit`) and ask the user to run step 2 again. Repeat until the roots are gone or named as out of scope.
6. **Lock the shape, not the numbers.** Build or extend a fake scenario with the same shape (`docs/adding-a-scenario.md`), lock the engine's output with `lockScenario` (see the `engine-scripts` skill), and record new rounding evidence in CLAUDE.md's rounding section without any real figure.

## Verify your fix

- Before the fix, note the root line ids from the report.
- After the fix: `npm test` from the repo root. No locked scenario may change unless you verified the new value; `npm run test:unit` for the engine rules.
- The user re-runs step 2. The old root ids are gone from the new report; a new root appearing downstream means the fix moved the error, not removed it.
- The fake scenario you lock: `npm test -- <scenario>` passes, and `npx tsx scripts/renderScenario.ts --scenario=<name> --golden` from `engine/` writes its PDFs. Open one page and find a changed value in the right widget.

## Reporting

Say which roots were found, which are fixed, which are preparer choices, and which are unsupported, by line id. The user decides what to send to a maintainer; both report files are already safe to share.
