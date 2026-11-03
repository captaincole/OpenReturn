---
name: update-form
description: Update an output tax form the engine already has (1040, a schedule, a CA form) so it computes every line a scenario needs. Finds the lines that are blank, unsupported or wrong, adds what is missing, and surfaces any wrong rule for a person instead of changing it. Use when a scenario needs lines a supported form does not fill yet.
argument-hint: <form>  e.g. federal/schedule-1
---

# Update a form

An output form gets most of its changes from new scenarios: a line that is blank or `unsupported`, or a value that is wrong for a case the rule did not cover. This skill finds those lines on one form and fixes the ones it can.

Arguments: `$ARGUMENTS`, the form (`federal/<short>` or `state/<st>/<short>`). The request also names the scenario, or the lines.

The facts come first. A line that needs a document the engine cannot read yet (no fact kind in `engine/src/facts/kinds/`) is not this skill's work: that comes in an earlier step, when the scenario's documents become facts. Report the line and the document it needs.

## 1. Find the lines

1. With a scenario: run `npm test -- <scenario>`. Its `expected.ts` holds the scenario's answer key, and the golden run lists each line on this form that the engine gets wrong or leaves blank. Read the scenario's facts and `expected.ts` to find lines the key leaves out but the form needs, such as a total that feeds another form.
2. With named lines: run `npm run form-engine -- form-status <form>` and read each line's entry in `bindings.ts`.
3. Leave out each line whose value already matches.

## 2. Check the box

For each line with a wrong value, confirm that the catalog row is the right box on the PDF: from `engine/`, run `npx tsx scripts/renderScenario.ts --scenario=<scenario>`, open the PDF and find the value. A value in the wrong box, or a label that names another line, is a catalog problem: fix it with `catalog-form-fields` before you change a rule. A line that is wrong only because a line it reads is blank needs no check yet. Check it again after step 3.

## 3. Fix each line

- **Blank, unsupported or not drafted:** run `write-binding-rules <form> <lines>`. Delete an `unsupported` entry only when its reason is no longer true (the facts it says are missing now exist).
- **A wrong value from a rule that exists:** the rule already gives the right value for other scenarios, so find what this scenario has that they do not. Read the rule and the instructions (Canon, then `npm run corpus -- read <blockId>`).
  - **Additive:** the rule leaves out a case this scenario has, such as a filing status or a worksheet branch. Send the line to `write-binding-rules` with that case. The change must not change any other scenario's value.
  - **A mistake:** the rule is wrong for every scenario, or the fix would change a verified scenario's value. Stop. Report the line, the rule, the blockId and the scenario values it would change. A person decides. Never edit an `expected.ts`.
- **A downstream line:** a fixed line often feeds other lines and forms (Schedule 1 line 10 → Form 1040 line 8). Run the same checks on each line that reads it.

## 4. Verify and commit

1. Run `verify-form <form>`, and again for each other form you changed. No other scenario's golden may change: steps 1–3 keep each fix additive. If one does change, a fix was not additive: undo it and report it as a mistake.
2. Commit each form with the subject `<Form>: <lines>`, and list in the body what each fix added.

## 5. Report

One row per line: the line, what it was (blank, unsupported, wrong), what you did, and the blockId. List the lines left for a person and the documents still missing.
