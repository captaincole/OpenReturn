/*
 * The deductions module on every scenario: each catalog item has a state, and
 * the comparison reads the forms as if the return itemizes, so a filer who
 * takes the standard deduction gets an itemized total too.
 */

import { describe, expect, it } from "vitest";
import { DEDUCTION_ITEMS, evaluateScenario } from "../../src/index.js";
import { SCENARIOS } from "../scenarios/index.js";

const evaluated = SCENARIOS.map((scenario) => ({
  name: scenario.name,
  result: evaluateScenario({
    filing: { id: `${scenario.name}-filing`, taxYear: scenario.taxYear },
    facts: scenario.facts,
    decisions: scenario.decisions,
  }),
}));

describe("deductions module", () => {
  it.each(evaluated)("$name: every catalog item has a state", ({ result }) => {
    expect(result.deductions.items.map((item) => item.id)).toEqual(
      DEDUCTION_ITEMS.map((item) => item.id),
    );
  });

  it("tcb-ca-005: medical bills under the floor are closed; two line questions are left", () => {
    const madison = evaluated.find(({ name }) => name === "tcb-ca-005")!.result.deductions;
    const medical = madison.items.find((item) => item.id === "medical");
    expect(medical?.status).toBe("below_floor");
    // The case says nothing about a vehicle license fee or a gift carryover.
    expect(madison.items.flatMap((item) => item.missing)).toEqual([
      "state_local_tax.personal_property",
      "charitable.carryover",
    ]);
    expect(madison.comparison?.federal?.recommendation).toBe("itemize");
  });

  it("jordan: SALT over $500k AGI drops to the $10,000 floor, so the standard deduction wins", () => {
    // He takes the standard deduction: his Schedule A does not file, but the comparison runs it.
    const jordan = evaluated.find(({ name }) => name === "jordan")!.result.deductions;
    expect(jordan.comparison?.federal).toMatchObject({
      itemized: 10000,
      standard: 15750,
      recommendation: "standard",
    });
    expect(jordan.comparison?.ca).toMatchObject({ itemized: 0, recommendation: "standard" });
  });
});
