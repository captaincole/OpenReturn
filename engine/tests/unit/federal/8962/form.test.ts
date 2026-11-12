/*
 * Form 8962 evaluated from facts. The returns start from tcb-us-007 (README.md):
 * an MFS filer with one Form 1095-A ($500 a month of advance payments) and
 * household income over 400% of the poverty line.
 */

import { describe, expect, it } from "vitest";
import {
  PREMIUM_TAX_CREDIT_KEYS,
  isMarketplaceCoverageFactKey,
  type MarketplaceCoverageAmounts,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { MARKETPLACE_COVERAGE } from "../../../scenarios/tcb-us-007/facts.js";
import { tcbUs007Scenario as base } from "../../../scenarios/tcb-us-007/index.js";

/* base's facts with each changed key's value replaced. */
function facts(changes: Record<string, unknown>): TaxFactRow[] {
  return base.facts.map((fact) =>
    fact.key in changes ? { ...fact, value: changes[fact.key] } : fact,
  );
}

const coverageKey = base.facts.find((fact) => isMarketplaceCoverageFactKey(fact.key))!.key;

function evaluate(factRows: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: base.name, taxYear: base.taxYear },
    facts: factRows,
    decisions: base.decisions,
  });
  const field = (fieldId: string) => {
    const formId = fieldId.startsWith("form-1040.") ? "form-1040" : fieldId.split(".")[0]!;
    return result.forms.get(formId)?.fields.find((candidate) => candidate.fieldId === fieldId)
      ?.result;
  };
  const line = (fieldId: string) => {
    const result = field(fieldId);
    return result?.ok ? result.value : undefined;
  };
  const unsupported = (fieldId: string) => {
    const result = field(fieldId);
    return result !== undefined && !result.ok && "unsupported" in result;
  };
  return { line, unsupported };
}

const f8962 = (name: string) => `form-8962.0.line.${name}`;

describe("Form 8962 evaluated", () => {
  it("repays all the advance payments for MFS with no exception", () => {
    const { line } = evaluate(base.facts);
    expect(line(f8962("11_col_a"))).toBeUndefined();
    expect(line(f8962("11_col_f"))).toBe(6000);
    expect(line(f8962("24_total_ptc"))).toBe(0);
    expect(line(f8962("27_excess_advance_ptc"))).toBe(6000);
    expect(line(f8962("28_repayment_limitation"))).toBeUndefined();
    expect(line(f8962("29_excess_advance_ptc_repayment"))).toBe(6000);
    expect(line("schedule-2.0.line.1a_excess_aptc_repayment")).toBe(6000);
    expect(line("form-1040.line.17")).toBe(6000);
  });

  it("figures the credit for MFS with the line A exception", () => {
    const { line } = evaluate(facts({ [PREMIUM_TAX_CREDIT_KEYS.mfsException]: true }));
    expect(line("form-8962.0.header.a_mfs_exception")).toBe(true);
    expect(line(f8962("7_applicable_figure"))).toBe("0.0850"); // line 5 is 401
    expect(line(f8962("8a_annual_contribution_amount"))).toBe(15431); // 181,542 × 0.085
    expect(line(f8962("11_col_a"))).toBe(7800);
    expect(line(f8962("11_col_b"))).toBe(8400);
    expect(line(f8962("11_col_d"))).toBe(0); // the contribution is above the SLCSP premium
    expect(line(f8962("11_col_e"))).toBe(0);
    expect(line(f8962("24_total_ptc"))).toBe(0);
    expect(line(f8962("29_excess_advance_ptc_repayment"))).toBe(6000);
  });

  it("uses lines 12-23 for two plans in different months", () => {
    const month = (from: number, to: number, amounts: MarketplaceCoverageAmounts) =>
      Array.from({ length: 12 }, (_, index) => (index >= from && index <= to ? amounts : {}));
    const plan = (months: MarketplaceCoverageAmounts[]) => ({
      ...MARKETPLACE_COVERAGE,
      months,
      annualTotals: {},
    });
    const first = month(0, 3, {
      enrollmentPremium: 1000.4,
      slcspPremium: 1100.6,
      advancePayment: 900.5,
    });
    const second = month(4, 11, { enrollmentPremium: 500, slcspPremium: 450, advancePayment: 400 });
    const rows = [
      ...facts({ [coverageKey]: plan(first) }),
      {
        ...base.facts[0]!,
        id: "f-plan-2",
        key: `${coverageKey}-2`,
        category: "health_coverage",
        value: plan(second),
      },
    ];
    const { line } = evaluate(rows);
    expect(line(f8962("10_use_annual_calc_no"))).toBe(true);
    expect(line(f8962("12_col_f"))).toBe(901);
    expect(line(f8962("16_col_f"))).toBe(400);
    expect(line(f8962("25_advance_payment_ptc"))).toBe(6804); // 4 × 901 + 8 × 400
    expect(line(f8962("29_excess_advance_ptc_repayment"))).toBe(6804);
  });

  it("leaves column (b) to a person when a month's premium is 0 (unpaid)", () => {
    const months = MARKETPLACE_COVERAGE.months.map((row, index) =>
      index === 2 ? { ...row, enrollmentPremium: 0 } : row,
    );
    const { unsupported } = evaluate(
      facts({
        [PREMIUM_TAX_CREDIT_KEYS.mfsException]: true,
        [coverageKey]: { ...MARKETPLACE_COVERAGE, months },
      }),
    );
    expect(unsupported(f8962("14_col_a"))).toBe(true);
    expect(unsupported(f8962("14_col_b"))).toBe(true);
  });
});
