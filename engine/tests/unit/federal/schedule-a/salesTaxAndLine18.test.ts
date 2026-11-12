/*
 * Schedule A line 5a (general sales taxes by election, irs-1040sa-inst-2025::sec::line-5a::b01)
 * and line 18 (itemizing below the standard deduction,
 * ::sec::total-itemized-deductions::b01). tcb-us-010 (a QSS who forces itemizing:
 * $426 of sales tax, $8,000 of gifts) with one change each.
 */

import { describe, expect, it } from "vitest";
import type { AIDecisionRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { tcbUs010Scenario as base } from "../../../scenarios/tcb-us-010/index.js";

const ELECTION = "decisions.itemized.elect_general_sales_tax";

function scheduleA(decisions: AIDecisionRow[]) {
  const result = evaluateScenario({
    filing: { id: "schedule-a-test", taxYear: base.taxYear },
    facts: base.facts,
    decisions,
    authEmail: null,
  });
  const form = result.forms.get("schedule-a")!;
  const value = (id: string) => {
    const field = form.fields.find((each) => each.fieldId === `schedule-a.0.${id}`)!;
    return field.result.ok ? field.result.value : undefined;
  };
  return { value, missing: form.missingInputs };
}

const decide = (key: string, decision: unknown) =>
  base.decisions.map((row) => (row.decisionKey === key ? { ...row, decision } : row));

describe("line 5a", () => {
  it("prints the general sales taxes with the election", () => {
    const { value } = scheduleA(base.decisions);
    expect(value("line.5a_state_local_income_or_sales_tax")).toBe(426);
    expect(value("line.5a_general_sales_tax_election")).toBe(true);
  });

  it("prints the income taxes without it", () => {
    const { value } = scheduleA(decide(ELECTION, false));
    expect(value("line.5a_state_local_income_or_sales_tax")).toBe(0);
    expect(value("line.5a_general_sales_tax_election")).toBe(false);
  });

  it("asks for the election once a sales tax amount is stated", () => {
    const { missing } = scheduleA(base.decisions.filter((row) => row.decisionKey !== ELECTION));
    expect(missing).toContain(ELECTION);
  });
});

describe("line 18", () => {
  it("is checked when the return itemizes below the standard deduction", () => {
    expect(scheduleA(base.decisions).value("line.18_elect_itemize_below_standard")).toBe(true);
  });

  it("stays unchecked when the federal return takes the standard deduction", () => {
    const { value } = scheduleA(decide("decisions.itemize_vs_standard", "standard"));
    expect(value("line.18_elect_itemize_below_standard")).toBe(false);
  });
});
