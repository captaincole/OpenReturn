---
name: form-verify
description: Run every gate for a form change (typecheck, lint, unit, integration, golden and catalog-fill tests) and list the form's unsupported lines for the PR body. Use as the last step before a PR that adds or changes a form.
argument-hint: <form>  e.g. federal/8959
---

# Form verify

Arguments: `$ARGUMENTS`, the form (`federal/<short>` or `state/<st>/<short>`).

1. Run `.claude/skills/form-verify/check.sh <form>` from the repo root. It stops at the first gate that fails. A person or another agent can run the same script.
2. If a gate fails, report the gate and its output. Fix it with the skill that owns the part: `form-catalog`, `form-wiring` or `form-bindings`. Never edit an `expected.ts` to make a golden test pass.
3. When every gate passes, read the `unsupported` entries in the form's `bindings.ts`. These lines are left for a person.
4. Report:
   - each gate and its result
   - the last lines of `form-status`
   - the `unsupported` list as a table (fieldId, reason), ready for the PR body
