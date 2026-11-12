import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { lookupStandardDeduction } from "../../src/data/standardDeduction.js";
import type { AIDecisionRow } from "../../src/facts/rows";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { tcbUs002Scenario as base } from "../scenarios/tcb-us-002/index.js";

/*
 * tcb-us-002's filer (federal standard deduction raised by a net qualified
 * disaster loss, $26,125 on Schedule A line 16) files Form 540 and itemizes
 * for California. Schedule CA Part II must not copy line 16, which holds the
 * federal standard deduction, and line 30 must not fall back to the California
 * standard deduction: Part II waits for a person, and Form 540 waits with it.
 */
const INCREASED_STANDARD = 26125;
const CHANGED: Record<string, unknown> = {
  "decisions.scope.must_file_ca_540": true,
  "decisions.scope.ca_residency": "full_year",
  "decisions.scope.must_file_schedule_a": true,
};

/* Form 540 lines that read line 18, directly or through another line. */
const AFTER_LINE_18 = [
  "line.19_taxable_income",
  "line.31_tax_amount",
  "line.33_tax_after_exemption_credits",
  "line.35_total_tax_after_credits",
  "line.48_tax_after_credits",
  "line.64_total_tax",
  "line.97_overpaid_tax",
  "line.99_overpaid_tax_available",
  "line.115_refund_or_no_amount_due",
];

function evaluate(extra: Record<string, unknown> = {}) {
  const decisions = { ...CHANGED, ...extra };
  const kept = base.decisions.filter((decision) => !(decision.decisionKey in decisions));
  const changed: AIDecisionRow[] = Object.entries(decisions).map(([key, decision]) =>
    decisionRow({ userId: "t", taxYear: base.taxYear, key, decision, rationale: "test" }),
  );
  const scenario = evaluateScenario({
    filing: { id: "schedule-ca-increased-standard-test", taxYear: base.taxYear },
    facts: base.facts,
    decisions: [...kept, ...changed],
    authEmail: null,
  });
  return (formId: string, fieldId: string) => {
    const field = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
    return field?.result.ok ? field.result.value : undefined;
  };
}

describe("Schedule CA Part II with the federal increased standard deduction", () => {
  const value = evaluate();

  it("keeps the federal print: Schedule A line 16 and 1040 line 12e", () => {
    expect(value("schedule-a", "schedule-a.0.line.16_other_itemized_deductions_amount")).toBe(
      INCREASED_STANDARD,
    );
    expect(value("form-1040", "form-1040.line.12e")).toBe(INCREASED_STANDARD);
  });

  it("leaves lines 16, 17 and 29 waiting, not the federal standard deduction", () => {
    for (const line of [
      "5.page2.other_deductions_16_federal",
      "5.page2.total_itemized_17_federal",
      "5.page2.total_itemized_28",
      "5.page2.total_itemized_29",
    ]) {
      expect(value("schedule-ca", `schedule-ca.${line}`), line).toBeUndefined();
    }
  });

  it("leaves line 30 and Form 540 line 18 waiting, not the California standard deduction", () => {
    expect(
      value("schedule-ca", "schedule-ca.5.page2.total_itemized_30_standard_or_itemized"),
    ).toBeUndefined();
    expect(value("form-540", "form-540.line.18_deductions")).toBeUndefined();
  });

  it("leaves Form 540 taxable income and the lines after it waiting", () => {
    for (const line of AFTER_LINE_18) {
      expect(value("form-540", `form-540.${line}`), line).toBeUndefined();
    }
  });

  it("keeps the standard deduction on line 18 when Schedule CA is not filed", () => {
    const withoutScheduleCa = evaluate({ "decisions.scope.must_file_schedule_ca": false });
    const standard = lookupStandardDeduction("state-ca", 2025, "head_of_household");
    expect(withoutScheduleCa("form-540", "form-540.line.18_deductions")).toBe(standard);
    expect(withoutScheduleCa("form-540", "form-540.line.19_taxable_income")).toEqual(
      expect.any(Number),
    );
  });
});
