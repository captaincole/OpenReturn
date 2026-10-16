# Fill in a Summa comparison folder

You are helping a taxpayer check the Summa tax engine against the return
they filed. Fill in the scenario files in `{{FOLDER}}` from their tax
documents and their filed return. The engine code is in `{{AGENT}}`.

## Rules

- **Never invent a number.** Take every value from a document or the
  filed return. If something is missing or unclear, ask the taxpayer.
- **Replace the example.** The files start as a fake return ("Jordan").
  Remove every Jordan entry the taxpayer does not have.
- **Keep the structure.** Change values and add entries in the same
  shape. Do not change the import lines or move the files.
- **Keep the data here.** Do not send, upload, or commit anything.

## facts.ts — the documents

- One fact per document, written with the builders the file already uses.
  Jordan's file shows one example of each document type.
- The key and value shape of each type is documented in
  `{{AGENT}}/src/engine/facts/kinds/*.ts`.
- Amounts from documents keep their cents, exactly as printed.
- **A document or amount with no matching type:** do not drop it. Add a
  fact with the closest category and a clear key (for example
  `account.<payer>.k1`). The check flags it, and that tells the
  maintainer what to build.

## decisions.ts — the choices

- Filing status and the scope answers (digital assets, foreign accounts, …).
- One Form 8949 box per sale, from the box checked on the 1099-B or 1099-DA.

## expected.ts — the filed return

- Take values from the **filed return**, not from the documents.
- Enter every non-blank numeric line, in whole dollars, as printed.
- Line ids are the `fieldId` values in
  `{{AGENT}}/forms/<federal|state/ca>/<form>/catalog.json`. Match by the
  `label`. Skip Form 8949; Schedule D carries its totals.
- A line you cannot match to a `fieldId`: list it for the taxpayer. Do not guess.

## index.ts

- Set `preparer`: `{ kind: "cpa" | "enrolled_agent" | "software" | "self", name: "<firm or software and version>" }`.
- If the filed Schedule B line 2 (or 6) equals the sum of its whole-dollar
  rows rather than the rounded sum of the cents amounts, add
  `rounding: { scheduleB: "sum_rounded_rows" }` to `preparer`.
- Add each form the taxpayer filed to the form list, if it is missing.

## When you are done

Run, from `{{AGENT}}` (or ask the taxpayer to run it and paste the output;
it holds no amounts):

```
npx tsx scripts/compareFiled/cli.ts {{FOLDER}} --check
```

Fix every **unknown fact**, **unknown decision**, and input problem it
lists, unless the item is a real document the engine does not support.
Then tell the taxpayer which items remain and why.
