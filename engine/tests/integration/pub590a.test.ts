import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { makeTraditionalIraFactKey } from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows";
import { PUB_590A_GAP } from "../../src/federal/schedule-1/pub590a.js";
import { tcbCa005Scenario as base } from "../scenarios/tcb-ca-005/index.js";

/*
 * tcb-ca-005's filer has Social Security and a plan at work (W-2 box 13). With a
 * traditional IRA contribution too, the 1040 instructions send both the IRA
 * deduction and the taxable benefits to Pub. 590-A
 * (irs-1040-inst-2025::sec::use-the-social-security-benefits::b01): Schedule 1
 * line 20 and Form 1040 line 6b are unsupported, and do not loop on each other.
 */
function evaluate(extra: TaxFactRow[]) {
  const scenario = evaluateScenario({
    filing: { id: "pub590a-test", taxYear: base.taxYear },
    facts: [...base.facts, ...extra],
    decisions: base.decisions,
    authEmail: null,
  });
  return (formId: string, fieldId: string) =>
    scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId)?.result;
}

const contribution: TaxFactRow = {
  id: "f-ira",
  userId: base.userId,
  taxYear: base.taxYear,
  category: "retirement",
  key: makeTraditionalIraFactKey("taxpayer"),
  value: { contributions: 3000 },
  sourceNote: "test",
  createdAt: "2026-11-13T00:00:00Z",
};

describe("Social Security with a traditional IRA contribution and a plan", () => {
  it("leaves Schedule 1 line 20 and Form 1040 line 6b to Pub. 590-A", () => {
    const result = evaluate([contribution]);
    expect(result("schedule-1", "schedule-1.1.line.20")).toMatchObject({
      ok: false,
      unsupported: true,
      reason: PUB_590A_GAP,
    });
    expect(result("form-1040", "form-1040.line.6b")).toMatchObject({
      ok: false,
      unsupported: true,
      reason: PUB_590A_GAP,
    });
  });
  it("figures line 6b without the contribution", () => {
    expect(evaluate([])("form-1040", "form-1040.line.6b")).toMatchObject({ ok: true });
  });
});
