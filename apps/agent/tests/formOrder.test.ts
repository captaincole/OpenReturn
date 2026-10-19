/*
 * The fixpoint evaluator must not depend on the order of the forms. For
 * every scenario, evaluate its forms in order and in reverse, and compare
 * every line. A settle-pass value that was cached before its inputs were
 * final once made Tara's 1040 line 22 depend on the order.
 */

import { describe, expect, it } from "vitest";
import { evaluateScenarioForms } from "./runScenario.js";
import { SCENARIOS } from "./scenarios/index.js";

async function lineValues(...args: Parameters<typeof evaluateScenarioForms>) {
  const { forms } = await evaluateScenarioForms(...args);
  const values: Record<string, unknown> = {};
  for (const form of forms.values()) {
    for (const f of form.fields) values[f.fieldId] = f.result.ok ? f.result.value : "blank";
  }
  return values;
}

describe.each(SCENARIOS)("form order: $name", (s) => {
  it("gives the same lines with the forms in reverse order", async () => {
    const formIds = s.forms.map((f) => f.formId);
    const forward = await lineValues(s, formIds);
    const reverse = await lineValues(s, [...formIds].reverse());
    expect(reverse).toEqual(forward);
  });
});
