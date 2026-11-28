---
name: create-input-documents
description: Find the input documents a scenario needs (W-2, 1099s, SSA-1099, invoices) and make the missing ones as fake PDFs from a committed generator, so the scenario tests Cade's document reading too. A first document of its type is compared with real examples found online. Use when adding a scenario, or when a binding or catalog run finds a line that needs a document the scenario lacks.
argument-hint: <scenario>  e.g. carter
---

# Create input documents

A scenario's input documents are what a user would upload: W-2s, 1099s, an SSA-1099, invoices. Cade reads the PDFs; the engine reads `facts.ts`. Both must hold the same values. Some scenarios come with every document, some with a few, and some with only the amounts (an IRS test package's cover page). This skill finds the missing documents and makes them.

Arguments: `$ARGUMENTS`, the scenario (`engine/tests/scenarios/<scenario>/`). The request may also give its source: an answer key, the documents that came with it, a cover page.

## 1. Sort the inputs

List every input the scenario has or needs, from its source, `facts.ts`, `decisions.ts` and its README. Sort each one:

- **Document:** a value printed on a form someone sends the taxpayer: wages, 1099 boxes, Social Security benefits, an invoice total.
- **Answer:** a value the taxpayer states: filing status, dependents, residency, health coverage, "had no digital assets". An answer never gets a document.

Ask only for documents that carry a value the return needs (document minimalism, CLAUDE.md). A yes/no fact the taxpayer can state is an answer, even when a document could prove it.

## 2. Find the missing documents

Best effort, from two directions:

1. **From the facts:** a fact whose kind is a document kind (`engine/src/facts/kinds/`) needs a PDF in `docs/`. Its `sourceNote` names the PDF when it exists.
2. **From the expected return:** for each line with a value in `expected.ts`, find the fact kind that feeds it: the resolver reads it (`resolveInfo.ts`, `filingInfoResolvers.ts`). A fed line with no fact of that kind needs a document or an answer.

A later run of `write-binding-rules` or `catalog-form-fields` may find a line that names a document the scenario lacks. Come back to this skill then.

**Not supported yet:** last year's return (Form 1040, CA 540). Report it as a missing input and cite #79. Do not make one.

## 3. Make each missing document

Use fake data only: invented names and addresses, and SSNs, EINs and TINs in the fake ranges the other scenarios use (`400-00-…`, `00-0000…`). A downloaded set (TaxCalcBench, an IRS package) keeps its license and source commit in the scenario's README; a TaxCalcBench case also keeps its do-not-train notice (`add-scenario`, step 1).

- **The type has a generator** (`engine/tests/scenarios/documents/<type>.ts`): call it from the scenario's `generate-docs.ts` with the scenario's values.
- **The first document of its type:** write the generator. It is one exported function that takes the fact's value object (the type from `engine/src/facts/kinds/`) and the names and addresses, and returns the PDF bytes. Then the document and the fact cannot disagree. Print only the values the fact holds; never work one out from the others. Copy the drawing helpers you need from `marcus/generate-docs.ts` into `documents/draw.ts`. Follow the official form's box numbers and labels.
- In the scenario's `generate-docs.ts`, take the values from the same objects `facts.ts` uses. Run it: `npx tsx tests/scenarios/<scenario>/generate-docs.ts` from `engine/`.

**A first document of its type is compared with real examples.** No person reviews it first. Do this before the document is used:

1. Search the web for 2 or 3 real examples of the document: the official blank form for an IRS or FTB document, or a sample, a template or a program's required format for a document with no official form (an invoice, a statement).
2. Compare field by field: what each real example has, what ours has, and whether every fact the engine reads can be found on ours.
3. Add what a real one normally has, and remove what no real one would have. Every name, address and number stays made up; never copy a real business's name, logo or licence number.
4. Write the result in the scenario README under "Compared with real examples": each source as a link, and one line on what matched and what changed. Name the comparison in the pull request.

## 4. Check the documents against the facts

1. Read each new PDF. Every value on it is in a fact, and every document fact has its PDF.
2. Point each fact's `sourceNote` at its PDF (`"SSA-1099 (docs/04-ssa-1099.pdf)."`).
3. Note in the scenario's README which documents you made and from what.
4. Run `npm run test:pdf -- <scenario>`. A document changes no value and no filled form: if the golden changes, a fact changed by mistake.

Not in this step: Cade's ingest eval cases (`cade/evals/ingest/`). They come when the evals are updated. Fact kinds and Cade ingest tools for a new document type come in the next step of `/add-scenario`.

## 5. Report

The inputs sorted as documents and answers, the documents made (reused or first of their type), the missing inputs not made (last year's return), and the check results.
