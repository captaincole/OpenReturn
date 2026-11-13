/*
 * The deductions module on every scenario: each catalog item has a state, and
 * the comparison reads the forms as if the return itemizes, so a filer who
 * takes the standard deduction gets an itemized total too.
 */

import { describe, expect, it } from "vitest";
import { DEDUCTION_ITEMS, evaluateScenario } from "../../src/index.js";
import { loadScenarios } from "../scenarios/index.js";

const SCENARIOS = await loadScenarios();

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

  it("jordan: a recorded 'Schedule A does not file' does not hide the comparison", () => {
    const scenario = SCENARIOS.find(({ name }) => name === "jordan")!;
    const optOut = {
      ...scenario.decisions[0],
      id: "schedule-a-opt-out",
      decisionKey: "decisions.scope.must_file_schedule_a",
      decision: false,
    };
    const { deductions } = evaluateScenario({
      filing: { id: "jordan-filing", taxYear: scenario.taxYear },
      facts: scenario.facts,
      decisions: [optOut, ...scenario.decisions],
    });
    expect(deductions.comparison?.federal).toMatchObject({ itemized: 10000, standard: 15750 });
  });
  it("tcb-us-002: the standard side adds the net qualified disaster loss", () => {
    const ben = evaluated.find(({ name }) => name === "tcb-us-002")!.result.deductions;
    // Standard deduction 23,625 plus Form 4684 line 15's 2,500; itemizing would give 24,761.
    expect(ben.comparison?.federal).toMatchObject({
      itemized: 24761,
      standard: 26125,
      recommendation: "standard",
    });
  });

  it("tcb-us-002: no comparison while Form 4684 waits", () => {
    const scenario = SCENARIOS.find(({ name }) => name === "tcb-us-002")!;
    // Insurance over the basis with no amount received: line 4 waits, so the loss does too.
    const facts = scenario.facts.map((fact) => {
      if (fact.key !== "casualty.monsoon") return fact;
      const event = fact.value as { properties: Array<Record<string, unknown>> };
      const [shed] = event.properties;
      return { ...fact, value: { ...event, properties: [{ ...shed, reimbursement: 13000 }] } };
    });
    const { deductions } = evaluateScenario({
      filing: { id: "tcb-us-002-filing", taxYear: scenario.taxYear },
      facts,
      decisions: scenario.decisions,
    });
    expect(deductions.comparison).toBeUndefined();
  });
});
