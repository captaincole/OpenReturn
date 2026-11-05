import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { makeBusinessFactKey, makeDividendFactKey, makeW2FactKey } from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows";
import { tcbUs006Scenario as base } from "../scenarios/tcb-us-006/index.js";

/*
 * The tcb-us-006 MFS filer (taxable income before QBI 234,185 with $80,000 of
 * wages) with the rideshare business as an SSTB. The threshold is $197,300 and
 * the phase-in range ends at $247,300.
 */
const W2_KEY = makeW2FactKey("abc-co");
const BUSINESS_KEY = makeBusinessFactKey("rideshare");
const DIVIDEND_KEY = makeDividendFactKey("azure");

function evaluate(opts: { wages: number; specifiedService?: boolean; reitDividends?: number }) {
  const facts = base.facts.map((fact): TaxFactRow => {
    const value = fact.value as Record<string, unknown>;
    if (fact.key === W2_KEY) return { ...fact, value: { ...value, box1: opts.wages } };
    if (fact.key === BUSINESS_KEY) {
      return { ...fact, value: { ...value, specifiedService: opts.specifiedService } };
    }
    if (fact.key === DIVIDEND_KEY) {
      return { ...fact, value: { ...value, box5: opts.reitDividends } };
    }
    return fact;
  });
  const scenario = evaluateScenario({
    filing: { id: "form-8995-a-sstb-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const value = (formId: string, fieldId: string) => {
    const field = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
    return field?.result.ok ? field.result.value : undefined;
  };
  return {
    f8995a: (line: string) => value("form-8995-a", `form-8995-a.${line}`),
    line13a: value("form-1040", "form-1040.line.13a"),
  };
}

describe("Form 8995-A with a specified service trade or business", () => {
  it("leaves an SSTB above the phase-in range off Part I; the REIT part still computes", () => {
    const result = evaluate({ wages: 100000, specifiedService: true, reitDividends: 1000 });
    expect(result.f8995a("1.line.33")).toBe(254185);
    expect(result.f8995a("0.part1.business_a_name")).toBeUndefined();
    expect(result.f8995a("0.line.2_a")).toBeUndefined();
    expect(result.f8995a("1.line.27")).toBe(0);
    expect(result.f8995a("1.line.31")).toBe(200);
    expect(result.f8995a("1.line.32")).toBe(200);
    expect(result.f8995a("1.line.39")).toBe(200);
    expect(result.line13a).toBe(200);
  });

  it("waits above the phase-in range while the specified-service answer is missing", () => {
    const result = evaluate({ wages: 100000, reitDividends: 1000 });
    expect(result.f8995a("0.part1.business_a_name")).toBeUndefined();
    expect(result.f8995a("1.line.27")).toBeUndefined();
    expect(result.f8995a("1.line.39")).toBeUndefined();
  });

  it("leaves line 2 blank for an SSTB in the phase-in range (Schedule A, not modeled)", () => {
    const result = evaluate({ wages: 80000, specifiedService: true });
    expect(result.f8995a("1.line.33")).toBe(234185);
    expect(result.f8995a("0.part1.business_a_name")).toBe("Rideshare");
    expect(result.f8995a("0.part1.business_a_specified_service")).toBe(true);
    expect(result.f8995a("0.line.2_a")).toBeUndefined();
    expect(result.f8995a("1.line.39")).toBeUndefined();
  });

  it("figures an SSTB at or below the threshold like any business", () => {
    const result = evaluate({ wages: 30000, specifiedService: true });
    expect(result.f8995a("1.line.33")).toBe(184185);
    expect(result.f8995a("0.line.2_a")).toBe(92935);
    expect(result.f8995a("0.line.13_a")).toBe(18587);
    expect(result.f8995a("1.line.39")).toBe(18587);
    expect(result.line13a).toBe(18587);
  });
});
