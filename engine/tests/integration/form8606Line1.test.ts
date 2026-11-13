import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { makeTraditionalIraFactKey, makeW2FactKey } from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows";
import { NONDEDUCTIBLE_DISAGREES } from "../../src/federal/schedule-1/iraDeduction.js";
import { alexScenario as base } from "../scenarios/alex/index.js";

/*
 * Form 8606 line 1 from the IRA Deduction Worksheet (irs-8606-inst-2025::sec::line-1::b01):
 * the smaller of worksheet lines 10 and 11, less line 12 (Schedule 1 line 20).
 * Alex is single with a plan at work; the tests change the W-2 and add $7,000
 * of traditional IRA contributions.
 */
function evaluate(w2Change: Record<string, unknown>, iraChange: Record<string, unknown> = {}) {
  const w2Key = makeW2FactKey("brightside-logistics");
  const facts = base.facts.map((fact) =>
    fact.key === w2Key ? { ...fact, value: { ...(fact.value as object), ...w2Change } } : fact,
  );
  const ira: TaxFactRow = {
    id: "f-ira",
    userId: base.userId,
    taxYear: base.taxYear,
    category: "retirement",
    key: makeTraditionalIraFactKey("taxpayer"),
    value: { contributions: 7000, ...iraChange },
    sourceNote: "test",
    createdAt: "2026-11-13T00:00:00Z",
  };
  const scenario = evaluateScenario({
    filing: { id: "form-8606-line-1-test", taxYear: base.taxYear },
    facts: [...facts, ira],
    decisions: base.decisions,
    authEmail: null,
  });
  const form8606 = scenario.forms.get("form-8606");
  return {
    line20: scenario.forms
      .get("schedule-1")
      ?.fields.find((field) => field.fieldId === "schedule-1.1.line.20")?.result,
    files8606: form8606?.mustFile.ok === true && form8606.mustFile.value === true,
    line1: form8606?.fields.find(
      (field) => field.fieldId === "form-8606.0.line.1_nondeductible_traditional_contributions",
    )?.result,
  };
}

describe("Form 8606 line 1 from the IRA Deduction Worksheet", () => {
  it("takes what the phase-out leaves: $83,000 wages, covered, single", () => {
    const result = evaluate({ box1: 83000, box16: 83000 });
    expect(result.line20).toMatchObject({ ok: true, value: 4200 });
    expect(result.files8606).toBe(true);
    expect(result.line1).toMatchObject({ ok: true, value: 2800 });
  });

  it("files no Form 8606 for a filer who deducts it all", () => {
    const result = evaluate({ box13: { retirementPlan: false } });
    expect(result.line20).toMatchObject({ ok: true, value: 7000 });
    expect(result.files8606).toBe(false);
    expect(result.line1).toBeUndefined();
  });

  it("is a gap when a stated nondeductible amount differs from what the worksheet leaves", () => {
    const result = evaluate({ box1: 83000, box16: 83000 }, { nondeductibleContributions: 0 });
    expect(result.line20).toMatchObject({ ok: false, reason: NONDEDUCTIBLE_DISAGREES });
  });
});
