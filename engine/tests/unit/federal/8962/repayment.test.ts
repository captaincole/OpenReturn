/*
 * Form 8962 lines 24-29 for a filer who can take the credit: the Table 5
 * repayment limit (irs-8962-inst-2025::sec::table-5-repayment-limitation::b01)
 * and net PTC (::sec::line-26::b01). The returns keep tcb-us-007's taxpayer,
 * W-2 and Form 1095-A (premium $650, SLCSP $700 a month), with only the wages,
 * the monthly advance payment and the filing status changed. Single uses one
 * column of Table 5; MFS with the line A exception uses "any other filing status".
 */

import { describe, expect, it } from "vitest";
import {
  PREMIUM_TAX_CREDIT_KEYS,
  SPOUSE_KEYS,
  isMarketplaceCoverageFactKey,
  isW2FactKey,
  makeForm8949BoxDecisionKey,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import {
  ABC_TRADE_ID,
  INTUIT_TRADE_ID,
  MARKETPLACE_COVERAGE,
} from "../../../scenarios/tcb-us-007/facts.js";
import { tcbUs007Scenario as base } from "../../../scenarios/tcb-us-007/index.js";

type Status = "single" | "married_filing_separately";

const KEPT_ANSWERS = new Set<string>([
  PREMIUM_TAX_CREDIT_KEYS.allocatesPolicyOrMarriageCalc,
  PREMIUM_TAX_CREDIT_KEYS.mfsException,
]);
const SPOUSE = new Set<string>(Object.values(SPOUSE_KEYS));

/* The taxpayer, a W-2 of `wages` and the 1095-A; nothing else, so AGI is the wages. */
function facts(wages: number, advancePayment: number, status: Status): TaxFactRow[] {
  const kept = base.facts.filter(
    (fact) =>
      (fact.key.startsWith("identity.") && (status !== "single" || !SPOUSE.has(fact.key))) ||
      (status !== "single" && SPOUSE.has(fact.key)) ||
      isW2FactKey(fact.key) ||
      isMarketplaceCoverageFactKey(fact.key) ||
      KEPT_ANSWERS.has(fact.key),
  );
  return kept.map((fact) => {
    if (isW2FactKey(fact.key)) {
      const w2 = fact.value as W2FactValue;
      return {
        ...fact,
        value: { ...w2, box1: wages, box2: 0, box3: wages, box5: wages, box12: [] },
      };
    }
    if (isMarketplaceCoverageFactKey(fact.key)) {
      const months = MARKETPLACE_COVERAGE.months.map((row) => ({ ...row, advancePayment }));
      const annualTotals = {
        ...MARKETPLACE_COVERAGE.annualTotals,
        advancePayment: advancePayment * 12,
      };
      return { ...fact, value: { ...MARKETPLACE_COVERAGE, months, annualTotals } };
    }
    if (fact.key === PREMIUM_TAX_CREDIT_KEYS.mfsException) return { ...fact, value: true };
    return fact;
  });
}

const DROPPED = new Set([
  makeForm8949BoxDecisionKey(INTUIT_TRADE_ID),
  makeForm8949BoxDecisionKey(ABC_TRADE_ID),
]);

function decisions(status: Status): AIDecisionRow[] {
  const changes: Record<string, unknown> = {
    "decisions.scope.filing_status": status,
    "decisions.scope.has_reportable_sales": false,
    "decisions.scope.must_file_schedule_d": false,
    "decisions.scope.must_file_8949": false,
  };
  return base.decisions
    .filter((row) => !DROPPED.has(row.decisionKey))
    .map((row) =>
      row.decisionKey in changes ? { ...row, decision: changes[row.decisionKey] } : row,
    );
}

function lines(wages: number, advancePayment: number, status: Status) {
  const result = evaluateScenario({
    filing: { id: base.name, taxYear: base.taxYear },
    facts: facts(wages, advancePayment, status),
    decisions: decisions(status),
  });
  const fields = result.forms.get("form-8962")?.fields ?? [];
  const line = (name: string) => {
    const found = fields.find((field) => field.fieldId === `form-8962.0.line.${name}`)?.result;
    return found?.ok ? found.value : undefined;
  };
  return {
    percent: line("5_household_income_percent_fpl"),
    line24: line("24_total_ptc"),
    line25: line("25_advance_payment_ptc"),
    line26: line("26_net_ptc"),
    line27: line("27_excess_advance_ptc"),
    line28: line("28_repayment_limitation"),
    line29: line("29_excess_advance_ptc_repayment"),
  };
}

/* $800 a month of advance payments: more than the credit in each band. */
const HIGH_ADVANCE = 800;

describe("Form 8962 Table 5 repayment limit", () => {
  it.each([
    // wages, line 5, single limit, other-status limit
    [25000, 166, 375, 750],
    [37650, 250, 975, 1950],
    [52710, 350, 1625, 3250],
  ])(
    "wages %i: line 5 = %i, limits %i single and %i otherwise",
    (wages, percent, single, other) => {
      for (const [status, limit] of [
        ["single", single],
        ["married_filing_separately", other],
      ] as const) {
        const result = lines(wages, HIGH_ADVANCE, status);
        expect(result.percent).toBe(percent);
        expect(result.line26).toBeUndefined();
        expect(result.line27).toBeGreaterThan(limit);
        expect(result.line28).toBe(limit);
        expect(result.line29).toBe(Math.min(result.line27 as number, limit));
      }
    },
  );
});

describe("Form 8962 net premium tax credit", () => {
  it("prints line 26 and leaves line 27 blank when the credit is more than the advance payments", () => {
    // 166%: line 8a = 160, so the credit is the full $7,800 premium; advance payments are $6,000.
    const result = lines(25000, 500, "single");
    expect(result.line24).toBe(7800);
    expect(result.line25).toBe(6000);
    expect(result.line26).toBe(1800);
    expect(result.line27).toBeUndefined();
    expect(result.line28).toBeUndefined();
    expect(result.line29).toBeUndefined();
  });
});
