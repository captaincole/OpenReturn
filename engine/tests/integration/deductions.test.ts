/*
 * The deductions module must not fork the tax math: with exact facts only, its
 * itemized totals equal the forms' (Schedule A line 17, Schedule CA line 29)
 * for every scenario that itemizes.
 */

import { describe, expect, it } from "vitest";
import { LIFE_KEYS } from "../../src/facts/index.js";
import { DEDUCTION_BRANCHES, evaluateScenario, type EvaluatedScenario } from "../../src/index.js";
import { SCENARIOS } from "../scenarios/index.js";

function line(scenario: EvaluatedScenario, fieldId: string): number | undefined {
  const formId = fieldId.slice(0, fieldId.indexOf("."));
  const field = scenario.forms
    .get(formId)
    ?.fields.find((candidate) => candidate.fieldId === fieldId);
  return field?.result.ok && typeof field.result.value === "number"
    ? field.result.value
    : undefined;
}

const evaluated = SCENARIOS.map((scenario) => ({
  name: scenario.name,
  result: evaluateScenario({
    filing: { id: `${scenario.name}-filing`, taxYear: scenario.taxYear },
    facts: scenario.facts,
    decisions: scenario.decisions,
  }),
}));

describe("deductions module", () => {
  it.each(evaluated)("$name: every catalog branch has a state", ({ result }) => {
    expect(result.deductions.branches.map((branch) => branch.id)).toEqual(
      DEDUCTION_BRANCHES.map((branch) => branch.id),
    );
  });

  const itemizers = evaluated.filter(
    ({ result }) => line(result, "schedule-a.0.line.17_total_itemized_deductions") !== undefined,
  );

  it("covers at least the two TaxCalcBench itemizers", () => {
    expect(itemizers.map(({ name }) => name)).toEqual(
      expect.arrayContaining(["tcb-us-004", "tcb-ca-005"]),
    );
  });

  it.each(itemizers)("$name: the federal total equals Schedule A line 17", ({ result }) => {
    expect(result.deductions.comparison?.federal.itemized).toBe(
      line(result, "schedule-a.0.line.17_total_itemized_deductions"),
    );
    expect(result.deductions.comparison?.federal.decidingBranches).toEqual([]);
  });

  const caItemizers = itemizers.filter(
    ({ result }) => line(result, "schedule-ca.5.page2.total_itemized_29") !== undefined,
  );

  it.each(caItemizers)("$name: the California total equals Schedule CA line 29", ({ result }) => {
    expect(result.deductions.comparison?.ca?.itemized).toBe(
      line(result, "schedule-ca.5.page2.total_itemized_29"),
    );
  });

  it("tcb-ca-005: medical bills under the floor are closed; only the vehicle question is left", () => {
    const madison = evaluated.find(({ name }) => name === "tcb-ca-005")!.result.deductions;
    const medical = madison.branches.find((branch) => branch.id === "medical");
    expect(medical?.status).toBe("below_floor");
    // The documents opened every other branch; the case says nothing about a California vehicle.
    expect(madison.branches.flatMap((branch) => branch.missing)).toEqual([LIFE_KEYS.caVehicle]);
    expect(madison.comparison?.federal.recommendation).toBe("itemize");
  });
});
