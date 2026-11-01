---
name: cross-check-policyengine
description: Use PolicyEngine-US as a second opinion on the federal engine's constants and line logic. It is not a source of truth; the IRS text decides. Use when checking a threshold or a new-law change, reviewing a form's bindings, or hunting for gaps in a form the engine models.
---

# Cross-check the engine with PolicyEngine-US

PolicyEngine-US (github.com/PolicyEngine/policyengine-us) is an open policy simulation model. It computes a household's tax from facts, but it fills no forms. Read its code next to ours to find leads. A difference is a lead, never a verdict: check every lead against the IRS form or instructions in the corpus before you change the engine.

## Where it helps, and where it does not

It starts later in the chain than we do. Its inputs are often amounts we compute from documents (taxable pension income, the HSA deduction, net capital gains), so it can check the back half of the return (AGI to total tax) but not the front half (documents to income lines).

- **Helps:** constants by year (brackets, thresholds, phase-outs, OBBBA changes). Its parameter files cite the IRC section and often the form line. It also gives a second reading of a formula: a rule it has and we lack (the capital loss limit, the NIIT floor) points at a gap.
- **Does not help:** form lines and per-line whole-dollar rounding, per-lot Form 8949, Schedule B, Schedule H, elections (the HSA last-month rule), or advance premium tax credit. Some variables are bare inputs with no formula, for example the HSA deduction. Where it has no formula, it cannot check ours.
- **It follows the statute when the statute and a form disagree.** We fill the form, so the form's text decides for us. Name such a difference as a source conflict, not a bug on either side.
- **It has bugs too.** The 2025 comparison found one: the CTC phase-out for a qualifying surviving spouse. It was already filed upstream. Before you report a PolicyEngine bug, search its issues and PRs. Ask the user before you file anything upstream.

## Get the code

The full repo is large, so use a sparse, blobless clone into `.scratch/` (gitignored):

```bash
git clone --filter=blob:none --sparse https://github.com/PolicyEngine/policyengine-us .scratch/policyengine-us
git -C .scratch/policyengine-us sparse-checkout set \
  policyengine_us/variables/gov/irs policyengine_us/parameters/gov/irs
```

Add `policyengine_us/tests/policy/baseline/gov/irs` for its YAML test cases (inputs with expected outputs). Write the version (`pyproject.toml`) and commit in every note, so a reader can find the same code.

## How to read it

- **Variables** (`variables/gov/irs/...`): one Python class per tax concept, with `formula(tax_unit, period, parameters)`. A plain sum is an `adds` / `subtracts` list, not code. `defined_for` gates who it applies to.
- **Names follow concepts, not form lines.** For example, `health_savings_account_ald` is the HSA above-the-line deduction, and `limited_capital_loss` is Schedule D line 21 as a positive number. Check the sign convention. Find a variable with `grep -rl` on the concept, then map it to our line by hand.
- **Parameters** (`parameters/gov/irs/...`): YAML with values keyed by start date, and a `metadata.reference` list (IRC section, IRS publication, form and page). Read the value in force for the tax year.
- **Filing status** is an enum. `SURVIVING_SPOUSE` means qualifying surviving spouse; check each status by name, not by position.

## Steps for one form

1. Read the form's `engine/src/federal/<form>/bindings.ts`, including `unsupported`. An unsupported line prints blank, and the next line reads it as $0 with no warning.
2. Find the PolicyEngine variables and parameters for the same lines. Compare constants first, then logic.
3. For each difference, find the rule in the corpus (`npm run corpus -- search "<phrase>"`) and quote its block id. Decide: our bug, their bug, or a scope difference.
4. Check whether a wrong number can print today. Is the line reachable from a real fact path, or does a missing input put the return in pending first?
5. Record each lead as: line, what differs, the IRS text, reachable or not, the fix. Have a second, skeptical pass confirm a lead before you fix it.

## Reporting

- In code comments and commits, cite the IRS form or instructions, never PolicyEngine.
- In an issue or PR, write "compared with PolicyEngine-US <version>" and give the IRS rule that decided each lead.

## Verify a lead

- The IRS rule is quoted from the corpus with its block id, or from the printed form.
- A fix has a unit test that fails before it and passes after it, and `npm test` shows no locked scenario changed unless you verified the new value (`engine-scripts` skill).
