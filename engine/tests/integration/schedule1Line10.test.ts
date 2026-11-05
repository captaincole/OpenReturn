import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { makeBusinessFactKey } from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows";
import { tcbUs006Scenario as base } from "../scenarios/tcb-us-006/index.js";

/*
 * Schedule 1 line 10 and the 1040 lines that follow it. The tcb-us-006 filer has
 * a rideshare business (line 3 = 100,000) and W-2G winnings (line 9 = 50,000).
 * A blank is not a zero: a line 3 that waits blanks line 10 and the totals after it.
 */
const BUSINESS_KEY = makeBusinessFactKey("rideshare");

function evaluate(business: "loss" | "none") {
  const facts = base.facts.flatMap((fact): TaxFactRow[] => {
    if (fact.key !== BUSINESS_KEY) return [fact];
    if (business === "none") return [];
    const value = fact.value as Record<string, unknown>;
    // Line 31 is a loss, which waits for the at-risk rules (not modeled).
    return [{ ...fact, value: { ...value, expenses: { carAndTruck: 120000 } } }];
  });
  const scenario = evaluateScenario({
    filing: { id: "schedule-1-line-10-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const value = (formId: string, fieldId: string) => {
    const field = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
    return field?.result.ok ? field.result.value : undefined;
  };
  return {
    schedule1: (line: string) => value("schedule-1", `schedule-1.${line}`),
    form1040: (line: string) => value("form-1040", `form-1040.${line}`),
  };
}

describe("Schedule 1 line 10", () => {
  it("stays blank while a business loss leaves line 3 blank, and so do 1040 lines 8–15", () => {
    const result = evaluate("loss");
    expect(result.schedule1("0.line.3")).toBeUndefined();
    expect(result.schedule1("0.line.9")).toBe(50000);
    expect(result.schedule1("0.line.10")).toBeUndefined();
    expect(result.form1040("line.8")).toBeUndefined();
    expect(result.form1040("line.9")).toBeUndefined();
    expect(result.form1040("line.11a")).toBeUndefined();
    expect(result.form1040("line.11b")).toBeUndefined();
    expect(result.form1040("line.15")).toBeUndefined();
  });

  it("computes from line 9 when there is no business", () => {
    const result = evaluate("none");
    expect(result.schedule1("0.line.3")).toBeUndefined();
    expect(result.schedule1("0.line.10")).toBe(50000);
    expect(result.form1040("line.8")).toBe(50000);
    expect(result.form1040("line.9")).toBeTypeOf("number");
  });
});
