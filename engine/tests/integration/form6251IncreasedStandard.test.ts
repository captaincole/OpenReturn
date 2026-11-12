import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { lookupStandardDeduction } from "../../src/data/standardDeduction.js";
import { AMT_KEYS } from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { tcbUs002Scenario as base } from "../scenarios/tcb-us-002/index.js";

/*
 * tcb-us-002's filer (standard deduction raised by a $2,500 net qualified
 * disaster loss, $26,125 on Schedule A line 16 and 1040 line 12e) with an
 * incentive stock option spread, so Form 6251 files. Line 2a enters zero and
 * line 3 takes the standard deduction before the loss
 * (irs-6251-inst-2025::sec::line-2a-taxes::b01,
 * irs-6251-inst-2025::sec::net-qualified-disaster-loss::b01): the loss stays
 * deducted for the AMT.
 */
const SPREAD = 10000;
const INCREASED_STANDARD = 26125;
const STANDARD = lookupStandardDeduction("federal", 2025, "head_of_household")!;

const SPREAD_FACT: TaxFactRow = {
  ...base.facts[0]!,
  id: "f-amt-spread",
  category: "other",
  key: AMT_KEYS.isoExerciseSpread,
  value: SPREAD,
  sourceNote: "test",
};

function evaluate(extra: Record<string, unknown> = {}) {
  const kept = base.decisions.filter((decision) => !(decision.decisionKey in extra));
  const changed: AIDecisionRow[] = Object.entries(extra).map(([key, decision]) =>
    decisionRow({ userId: "t", taxYear: base.taxYear, key, decision, rationale: "test" }),
  );
  const scenario = evaluateScenario({
    filing: { id: "form-6251-increased-standard-test", taxYear: base.taxYear },
    facts: [...base.facts, SPREAD_FACT],
    decisions: [...kept, ...changed],
    authEmail: null,
  });
  const result = (formId: string, fieldId: string) =>
    scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId)?.result;
  return Object.assign(
    (formId: string, fieldId: string) => {
      const found = result(formId, fieldId);
      return found?.ok ? found.value : undefined;
    },
    { result },
  );
}

describe("Form 6251 with the increased standard deduction", () => {
  const value = evaluate();

  it("enters zero on line 2a and the standard deduction before the loss on line 3", () => {
    expect(value("form-1040", "form-1040.line.12e")).toBe(INCREASED_STANDARD);
    expect(value("form-6251", "form-6251.0.line.2a_taxes_or_standard_deduction")).toBe(0);
    expect(value("form-6251", "form-6251.0.line.3_other_adjustments")).toBe(STANDARD);
  });

  it("keeps the loss deducted on line 4", () => {
    const line1b = value("form-6251", "form-6251.0.line.1b_taxable_income_start") as number;
    expect(line1b).toEqual(expect.any(Number));
    expect(value("form-6251", "form-6251.0.line.4_alternative_minimum_taxable_income")).toBe(
      line1b + STANDARD + SPREAD,
    );
  });

  it("adds back 1040 line 12e on line 2a and leaves line 3 unsupported without Schedule A", () => {
    const without = evaluate({ "decisions.scope.must_file_schedule_a": false });
    expect(without("form-1040", "form-1040.line.12e")).toBe(STANDARD);
    expect(without("form-6251", "form-6251.0.line.2a_taxes_or_standard_deduction")).toBe(STANDARD);
    expect(without.result("form-6251", "form-6251.0.line.3_other_adjustments")).toHaveProperty(
      "unsupported",
      true,
    );
  });
});
