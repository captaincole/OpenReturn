---
name: add-scenario
description: Add a golden scenario from a real example (a TaxCalcBench case, an IRS test package, a CPA return of a fake taxpayer) and grow the engine until it matches the example's answer key. Runs create-input-documents, the fact kinds, update-form and the new-form skills in order. Use when a new example should become a scenario.
argument-hint: <source>  e.g. TaxCalcBench ty25-us-003
---

# Add a scenario

A scenario is one fake taxpayer: their documents as facts, their answers as decisions, and the expected value of each line (`docs/adding-a-scenario.md`). This skill turns an example with an answer key into a scenario, and adds what the engine lacks until the scenario matches the key.

Arguments: `$ARGUMENTS`, the source. The request may also say which forms to check.

## 1. Read the source

1. Read every file the source has: the documents, the answers (a JSON file, a cover page) and the answer key (an e-file XML, a CPA's PDFs).
2. Name the scenario. A downloaded case keeps its id with a prefix (`tcb-us-003`); a hand-built one takes the taxpayer's first name.
3. Choose the forms to check: only the forms the answer key has. A federal-only key makes a federal-only scenario: list only federal forms in `index.ts`, and decide `decisions.scope.must_file_ca_540` as `false` with the state the source gives. A state-only key (TaxCalcBench `ty25-ca-*`) checks only the state forms: list the federal forms that the state return reads, with locked goldens and no expected values (`tcb-ca-005`). For such a case, add a federal line or form only when a state line reads it. Each other federal gap stays `unsupported` and goes on the tracking issue.
4. Make a table of the key. For a TaxCalcBench case, `npx tsx scripts/dumpCase.ts <case folder>` (from `engine/builder`) prints the input files, the answers and the key as tables: start from its output, not from the raw XML. The table has one row per line with a value, and the engine form and fieldId it maps to (the catalog label names the line). A line on a form the engine does not have goes in the table too: step 5 adds that form.
5. Write the scenario's `README.md`: the source and its commit or date, the license (copy a downloaded set's license file next to its documents), the taxpayer in two sentences, and the forms checked. TaxCalcBench is for evaluation only and asks each copy to keep its notice: copy its `CANARY.txt` to `docs/TAXCALCBENCH-CANARY.txt`, and put its two canary strings in the README and in a comment at the top of each `.ts` file in the folder, as `tcb-ca-005` does. `tests/unit/benchmarkNotice.test.ts` fails on a file that lacks them.

## 2. Make the input documents

Run `create-input-documents <scenario>`. It sorts the inputs into documents and answers, copies or makes the PDFs in `docs/`, and stops for a person's review on the first document of a type. Last year's return is not supported (#79).

## 3. Turn documents and answers into facts

1. For each document, find its fact kind in `engine/src/facts/kinds/`. A box the return needs and the kind lacks is added to the kind, to Cade's ingest tool schema (`cade/src/mastra/tools/`) and to Cade's instructions where he must ask for it. A new document type gets a new kind and tool (`docs/adding-a-scenario.md`, step 5a–5c).
2. For each answer, find the fact key or decision key the engine reads (the resolvers' `missingInputs`). An answer with no key gets one, next to the facts it belongs with, and goes in `missingInputs` of the form that reads it, so Cade asks for it.
3. Facts hold what the documents print, even when the key disagrees. Note each disagreement in the README.

## 4. Write the scenario

1. `facts.ts`, `decisions.ts` and `index.ts` (copy the closest scenario), and the entry in `tests/scenarios/index.ts`. Each fact's `sourceNote` names its PDF or the answer it came from.
2. `expected.ts`: each line of the table from step 1, as the key prints it. Comment each value with the line's label.
3. Set `skip: true` in `index.ts`. The pre-commit hook runs every golden test, and the new scenario fails until step 5 is done; a skipped scenario still runs when you name it.
4. Run `npm test -- <scenario>`. The failures are the work list for step 5.

## 5. Grow the engine

Work in form order: a form before the forms that read it (8606 before the 1040).

- **A form the engine has:** `update-form <form>` with the scenario.
- **A form the engine does not have:** `catalog-form-fields`, then `register-form`, then `write-binding-rules` for the lines the key fills. Its blank PDF goes in `sources/<year>/forms/<jurisdiction>/<short>/`, and its instructions must be in the corpus (`corpus` skill) before the bindings.
- **A line the key fills that the instructions leave blank** (an e-file key often fills every line of a part the taxpayer skips): follow the instructions. Leave the line out of `expected.ts` and list it in the README.
- **A line the engine cannot match now:** stop and ask the user. The fix may be a new form, a known mismatch (`knownMismatches`) or a key mistake to report upstream.

Never change a value in `expected.ts` to match the engine. When the key and the instructions disagree, the instructions win: record it in the README, and ask the user before you change the key's value.

## 6. Finish

1. When every line matches, remove `skip: true`. Then write the goldens: `npx tsx scripts/renderScenario.ts --scenario=<scenario> --golden` (from `engine/`), and point each form's `goldenPdfPath` at its PDF. Read the PDFs.
2. Run `verify-form` for each form you changed. No other scenario's golden may change.
3. Add new input documents to `docs/testing-with-your-return.md` ("What OpenReturn supports") and `engine/scripts/compareFiled/support.ts`.
4. Commit each step on its own: the documents, the facts, the scenario, then each form.
5. Open the PR. Its description links each PDF the scenario adds or changes (`CLAUDE.md`, "Pull requests"): the made input documents first. Then run the `pr-review` and `tax-correctness-review` workflows on it. The second needs `npm run dev:canon`; give it `maxFinders: 16`, because its default count missed rule errors on scenario PRs. A scenario checks one taxpayer; the reviews find the rules that break for others. Report the findings to the user before you fix them.
6. A pass is **strong** when the findings that stand (`keep` in pr-review, `survivors` in tax-correctness-review) include more than one of `high` severity or more than three of `medium`. After a strong pass: fix, commit, push, and run both workflows again on the new head. Three passes is the limit: when the third pass is still strong, stop and report it to the user. A pass with only `low` findings, or none, ends the loop. The tax review is scoped to the returns the scenarios cover and to common returns; its `uncovered` list and `out_of_scope` findings go on the tracking issue as checkboxes, not into the loop. Each pass's applied and deferred findings go on the tracking issue.

## 7. Report

The key's lines and their result, the forms added and changed, the answers and fact kinds added, the key lines left out (with the reason) and the documents a person must review.
