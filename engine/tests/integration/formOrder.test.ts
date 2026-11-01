import { describe, expect, it } from "vitest";
import { evaluateScenarioForms } from "../golden/runScenario.js";
import { SCENARIOS } from "../scenarios/index.js";

async function lineValues(...args: Parameters<typeof evaluateScenarioForms>) {
  const { forms } = await evaluateScenarioForms(...args);
  const values: Record<string, unknown> = {};
  for (const form of forms.values()) {
    for (const field of form.fields)
      values[field.fieldId] = field.result.ok ? field.result.value : "blank";
  }
  return values;
}

describe.each(SCENARIOS)("form order: $name", (scenario) => {
  it("gives the same lines with the forms in reverse order", async () => {
    const formIds = scenario.forms.map((form) => form.formId);
    const forward = await lineValues(scenario, formIds);
    const reverse = await lineValues(scenario, [...formIds].reverse());
    expect(reverse).toEqual(forward);
  });
});
