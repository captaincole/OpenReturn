---
name: write-binding-rules
description: Draft or redraft the bindings of a form the engine already catalogs (the code in bindings.ts that computes each field), one field at a time, with a line-rule-drafter and a line-rule-skeptic subagent grounded in Canon. Use to bind lines a scenario needs, fix a wrong line, or finish a form's fields that are not drafted.
argument-hint: <form> [lines…]  e.g. federal/8959 line.21 line.22
---

# Write binding rules

A binding is the function in `engine/src/<form>/bindings.ts` that computes one catalog field, or an `unsupported` entry that says why the engine does not compute it. This skill drafts them one field at a time:

- A `line-rule-drafter` subagent writes one binding, grounded in the instructions through Canon.
- A read-only `line-rule-skeptic` subagent checks it against the instructions.

The repo holds the state: `form-status` lists the fields that are not drafted, so a new session continues where the last one stopped.

Arguments: `$ARGUMENTS`. The first is the form (`federal/<short>` or `state/<st>/<short>`). The rest name lines.

## 1. Check before you start

1. Run `npm run form-engine -- form-status <form> --json`. If the catalog or the wiring is not done, stop: that work comes first.
2. Choose the fields:
   - With line arguments: the catalog fieldIds of those lines. `line.21` matches `….line.21` and `….line.21_*`, not `….line.210`.
   - With no line arguments: every field in `notDrafted`.
   - Work in catalog order, because a line usually reads the lines above it.
3. Check that Canon answers. Call `mcp__canon__searchRefDocs` once, with a phrase from the form and the `instructionsDocId` from form-status. If the tool is missing or fails, stop. Tell the user to run `npm run dev:canon` and approve the `canon` server in `/mcp`.
4. Run `npm run corpus -- outline <instructionsDocId>`. If it fails, the corpus does not have the instructions: add them with the `corpus` skill first.
5. Run `npm -w @openreturn/engine run typecheck` and `npm test`. Both must pass now, so that a later failure belongs to this work.
6. To redraft a field that already has a binding or an `unsupported` entry, delete that entry, so the drafter starts clean.

## 2. Draft each field

Draft one field at a time: the drafters edit the same files.

A part of more than 8 fields that a scenario needs (a worksheet part, a threshold part) can go to one drafter as a group. Give the drafter and the skeptic every fieldId in the part. The skeptic returns one verdict per field, and steps 3–4 apply to each field. A field with its own gate or a read from another form stays on its own.

1. Start a `line-rule-drafter` with the form, the fieldId, its catalog label and the instructions docId.
2. Start a `line-rule-skeptic` with the same input and the drafter's report.
3. Act on the skeptic's verdict:
   - `agree`: keep the binding.
   - `fix`: start a new `line-rule-drafter` with the skeptic's reason, then a new `line-rule-skeptic`. If the skeptic still does not agree, replace the binding with an `unsupported` entry. Its reason is the skeptic's finding, in one sentence.
   - `unsupported`: replace the binding with an `unsupported` entry and the skeptic's reason.
4. Write one line for the field: `<fieldId>: bound | unsupported — <blockId>`.

## 3. Commit after each part

After the last field of each part of the form (Part I, Part II, …), or of each page when the form has no parts:

1. Run `npm -w @openreturn/engine run typecheck`, `npm test`, `npm -w @openreturn/engine run test:unit` and `npm -w @openreturn/engine run test:integration`.
2. A golden failure means a scenario's value changed. Do not edit `expected.ts` to match the engine. Find the binding that caused it and send it back to a drafter with the failure. If you think the expected value is wrong, stop and ask the user.
3. Commit with the subject `<Form>: <lines>` (for example `Form 8959: lines 20–22`). List each new `unsupported` field and its reason in the body.

## 4. Report

Run `form-status` again. Report one row per field: fieldId, result, blockId, and the reason for each `unsupported` field. The `unsupported` list goes in the PR body: those lines are left for a person.
