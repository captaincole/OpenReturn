import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import {
  HSA_COVERAGE_KEYS,
  isW2FactKey,
  makeSocialSecurityFactKey,
  type W2FactValue,
} from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { alexScenario as base } from "../scenarios/alex/index.js";

/*
 * Schedule CA Part I line 27: "Subtract line 26 from line 10 in column B and
 * column C", and a negative column B goes to Form 540 line 16 as a positive
 * amount (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b08).
 * Alex (single, California, one W-2) with $80,000 of wages and a $3,000 HSA
 * contribution of his own: California takes the HSA deduction back.
 */
const HSA_CONTRIBUTION = 3000;

const fact = (category: string, key: string, value: unknown): TaxFactRow => ({
  id: `t-${key}`,
  userId: base.userId,
  taxYear: base.taxYear,
  category,
  key,
  value,
  sourceNote: "test",
  createdAt: "2026-11-12T00:00:00Z",
});

const HSA_FACTS = [
  fact("hsa", HSA_COVERAGE_KEYS.coverageType, "self-only"),
  fact("hsa", HSA_COVERAGE_KEYS.coverageMonths, 12),
  fact("hsa", HSA_COVERAGE_KEYS.ownContributions, HSA_CONTRIBUTION),
];

/* Benefits of $2,000 with $80,000 of wages: 85% is taxable, $1,700 in column B. */
const SOCIAL_SECURITY = fact("retirement", makeSocialSecurityFactKey("ssa"), {
  payerName: "Social Security Administration",
  box3: 2000,
  box5: 2000,
});

function evaluate(extra: TaxFactRow[]) {
  const wages = base.facts.map((row) =>
    isW2FactKey(row.key)
      ? { ...row, value: { ...(row.value as W2FactValue), box1: 80000, box16: 80000 } }
      : row,
  );
  const decisions: AIDecisionRow[] = [
    ...base.decisions.filter(
      (each) => each.decisionKey !== "decisions.scope.must_file_schedule_ca",
    ),
    decisionRow({
      userId: base.userId,
      taxYear: base.taxYear,
      key: "decisions.scope.must_file_schedule_ca",
      decision: true,
      rationale: "test",
    }),
  ];
  const scenario = evaluateScenario({
    filing: { id: "schedule-ca-line-27-test", taxYear: base.taxYear },
    facts: [...wages, ...extra],
    decisions,
    authEmail: null,
  });
  return (formId: string, fieldId: string) => {
    const found = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
    return found?.result.ok ? found.result.value : undefined;
  };
}

describe("Schedule CA line 27 and Form 540 lines 14 and 16", () => {
  it("carries an HSA deduction alone: line 27 column B is negative, Form 540 line 16 adds it back", () => {
    const value = evaluate(HSA_FACTS);
    expect(value("form-1040", "form-1040.line.11b")).toBe(77000);
    expect(value("schedule-ca", "schedule-ca.3.line.c27_subtractions")).toBe(-HSA_CONTRIBUTION);
    expect(value("form-540", "form-540.line.14_ca_adjustments_subtractions")).toBe(0);
    expect(value("form-540", "form-540.line.16_ca_adjustments_additions")).toBe(HSA_CONTRIBUTION);
    expect(value("form-540", "form-540.line.17_ca_agi")).toBe(80000);
  });

  it("nets Social Security against the HSA deduction: line 14 is never negative", () => {
    const value = evaluate([...HSA_FACTS, SOCIAL_SECURITY]);
    expect(value("schedule-ca", "schedule-ca.0.line.6b_subtractions")).toBe(1700);
    expect(value("schedule-ca", "schedule-ca.3.line.c27_subtractions")).toBe(1700 - 3000);
    expect(value("form-540", "form-540.line.14_ca_adjustments_subtractions")).toBe(0);
    expect(value("form-540", "form-540.line.16_ca_adjustments_additions")).toBe(1300);
    expect(value("form-540", "form-540.line.17_ca_agi")).toBe(80000);
  });

  it("leaves line 27 column B blank when lines 10 and 26 are blank", () => {
    const value = evaluate([]);
    expect(value("schedule-ca", "schedule-ca.3.line.c27_subtractions")).toBeUndefined();
    expect(value("form-540", "form-540.line.14_ca_adjustments_subtractions")).toBe(0);
  });
});
