import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import {
  isRetirementDistributionFactKey,
  makeRetirementDistributionFactKey,
  makeTraditionalIraFactKey,
  type RetirementDistributionFactValue,
} from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows";
import { tcbUs003Scenario as base } from "../scenarios/tcb-us-003/index.js";

/* The tcb-us-003 couple with other IRA facts: the taxpayer's 1099-Rs and IRA answers only. */
const IRA_KEY = makeTraditionalIraFactKey("taxpayer");

const row = (id: string, value: unknown): TaxFactRow => ({
  id: `f-${id}`,
  userId: "form-8606-test",
  taxYear: base.taxYear,
  category: "retirement",
  key: id,
  value,
  sourceNote: "test",
  createdAt: "2026-11-04T00:00:00Z",
});

const distribution = (id: string, box7: string, box1: number): TaxFactRow =>
  row(makeRetirementDistributionFactKey("test-payer", id), {
    payerName: "Test Payer",
    box1,
    box2a: box1,
    box7,
    box7IraSepSimple: true,
  } satisfies RetirementDistributionFactValue);

function evaluate(ira: unknown, distributions: TaxFactRow[]) {
  const kept = base.facts.filter(
    (fact) => !isRetirementDistributionFactKey(fact.key) && !fact.key.includes("traditional_ira"),
  );
  const scenario = evaluateScenario({
    filing: { id: "form-8606-test", taxYear: base.taxYear },
    facts: [...kept, ...distributions, ...(ira === undefined ? [] : [row(IRA_KEY, ira)])],
    decisions: base.decisions,
    authEmail: null,
  });
  const value = (formId: string, fieldId: string) => {
    const field = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
    return field?.result.ok ? field.result.value : undefined;
  };
  const files8606 = scenario.forms.get("form-8606")?.mustFile;
  const pending = pendingInputs(scenario);
  return {
    line4b: value("form-1040", "form-1040.line.4b"),
    f8606: (line: string) => value("form-8606", `form-8606.${line}`),
    files8606: files8606?.ok ? files8606.value : undefined,
    pending: pending.pendingFacts,
    decisions: pending.pendingDecisions,
  };
}

describe("Form 8606 and Form 1040 line 4b", () => {
  it("a Roth conversion with no basis: line 18 plus the other distribution", () => {
    const out = evaluate({ convertedToRoth: 7000 }, [
      distribution("conversion", "2", 7000),
      distribution("other", "7", 1000),
    ]);
    expect(out.f8606("1.line.15c_taxable_traditional_distributions")).toBeUndefined();
    expect(out.f8606("1.line.18_taxable_conversion_amount")).toBe(7000);
    expect(out.line4b).toBe(8000);
  });

  it("a full conversion with basis from earlier years: line 18 only", () => {
    const out = evaluate({ basisPriorYears: 4000, yearEndValue: 0, convertedToRoth: 10000 }, [
      distribution("conversion", "2", 10000),
    ]);
    expect(out.f8606("1.line.18_taxable_conversion_amount")).toBe(6000);
    expect(out.line4b).toBe(6000);
  });

  it("a backdoor Roth contributed in 2025: lines 4–18 and line 4b of 0", () => {
    const ira = {
      nondeductibleContributions: 7000,
      contributionsMadeIn2026: 0,
      basisPriorYears: 0,
      yearEndValue: 0,
      convertedToRoth: 7000,
    };
    const out = evaluate(ira, [distribution("conversion", "2", 7000)]);
    expect(out.f8606("0.line.4_contributions_made_in_2026")).toBe(0);
    expect(out.f8606("0.line.5_basis_less_2026_contributions")).toBe(7000);
    expect(out.f8606("0.line.10_nontaxable_ratio_whole")).toBe(1);
    expect(out.f8606("0.line.11_nontaxable_conversion_portion")).toBe(7000);
    expect(out.f8606("0.line.14_total_traditional_basis_end")).toBe(0);
    expect(out.f8606("1.line.17_basis_in_conversion")).toBe(7000);
    expect(out.f8606("1.line.18_taxable_conversion_amount")).toBe(0);
    expect(out.line4b).toBe(0);
  });

  it("a backdoor Roth without the 2026 split asks for the IRA answers again", () => {
    const ira = { nondeductibleContributions: 7000, yearEndValue: 0, convertedToRoth: 7000 };
    const out = evaluate(ira, [distribution("conversion", "2", 7000)]);
    expect(out.f8606("0.line.4_contributions_made_in_2026")).toBeUndefined();
    expect(out.pending).toContain(IRA_KEY);
  });

  it("a qualified charitable distribution (code Y) does not make Form 8606 file", () => {
    const out = evaluate({ basisPriorYears: 3000, yearEndValue: 50000 }, [
      distribution("qcd", "7Y", 10000),
    ]);
    expect(out.files8606).toBe(false);
  });

  it("an IRA answer that is not a number counts as missing", () => {
    const rows = [distribution("conversion", "2", 7000)];
    const bad = evaluate({ convertedToRoth: "7000" }, rows);
    const none = evaluate(undefined, rows);
    expect(bad.files8606).toBeUndefined();
    expect(bad.pending).toEqual(none.pending);
    expect(bad.decisions).toEqual(none.decisions);
    expect(bad.decisions).toContain("decisions.scope.must_file_8606");
  });
});
