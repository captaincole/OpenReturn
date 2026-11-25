/*
 * FTB 3800: the California half of the child's unearned income answers. The
 * return is the child's, as for Form 8615 (childUnearnedIncome.ts): the
 * taxpayer is the child, and the age, parent-alive and dependent answers are
 * the Form 8615 facts. Category other.
 *
 * The parent's amounts come from the parent's California return, which the
 * child asks the parent for (ca-3800-inst-2025::sec::part-ii-tentative-tax-based-on-parent-s-tax-rate::b01).
 * They are answers: the engine does not read another person's return.
 */

import type { ParentFilingStatus } from "./childUnearnedIncome.js";

type FactRow = { key: string; value: unknown; category: string };

/* Another child whose FTB 3800 names the same parent (line 7). */
export interface OtherChildFtb3800 {
  /* That child's FTB 3800 line 5. */
  netUnearnedIncome: number;
  /*
   * For a parent who files Form 540NR: the part of that line 5 from California
   * sources (line 9 worksheet, line B). Absent: all of it (a resident child).
   */
  californiaNetUnearnedIncome?: number;
}

/*
 * The parent's Form 540NR amounts that the line 9 and line 10 worksheets read
 * (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b02, ::b03, ::b04).
 */
export interface ParentForm540NRAmounts {
  /* Line 32: California adjusted gross income. */
  californiaAdjustedGrossIncome: number;
  /* Line 17: adjusted gross income from all sources. */
  adjustedGrossIncome: number;
  /* Line 18: itemized deductions or standard deduction. */
  deductions: number;
  /* Line 31: tax on total taxable income (line 10 worksheet, line A). */
  taxOnTotalTaxableIncome: number;
  /* Line 35: California taxable income (line 10 worksheet, line F). */
  californiaTaxableIncome: number;
}

export interface ParentCaliforniaReturnFactValue {
  /*
   * Header: the parent the instructions pick (::specific-line-instructions::b01,
   * ::b02). Absent: the parent named on the federal Form 8615
   * (child_unearned_income.parent_return), as the instructions say.
   */
  name?: string;
  ssn?: string;
  /* Header and line 9: the parent's California filing status. Absent: the federal one. */
  filingStatus?: ParentFilingStatus;
  /* The parent's return: "540" or "540nr". Absent: "540". */
  returnForm?: "540" | "540nr";
  /*
   * Line 6: Form 540 line 19, or Form 540NR line 19 (total taxable income), as
   * the return shows it. A parent who used Form 540 2EZ states the Form 540 amount.
   */
  taxableIncome: number;
  /*
   * Line 10: Form 540 line 31, or Form 540NR line 37, as the return shows it.
   * A parent who used Form 540 2EZ states the tax from the Form 540 tax table
   * (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b01).
   */
  tax: number;
  /* The tax from FTB 3803 included in that tax. Absent: none. */
  ftb3803Tax?: number;
  /* Line 7: each other child whose FTB 3800 names this parent. Absent or empty: none. */
  otherChildren?: OtherChildFtb3800[];
  /* Required when returnForm is "540nr". */
  form540NR?: ParentForm540NRAmounts;
}

export const CA_CHILD_UNEARNED_INCOME_KEYS = {
  /* The parent's California return: a ParentCaliforniaReturnFactValue. */
  parentCaliforniaReturn: "child_unearned_income.parent_ca_return",
  /*
   * Line 2, for a child who itemizes on Form 540: the part of Form 540 line 18
   * directly connected with producing the unearned income on line 1
   * (ca-3800-inst-2025::sec::part-i-child-s-net-unearned-income::b02), a number.
   */
  californiaItemizedForUnearnedIncome: "child_unearned_income.ca_itemized_for_unearned_income",
} as const;

const CATEGORY = "other";

const isAmount = (value: unknown) => typeof value === "number" && Number.isFinite(value);

/* A Form 540NR block with every amount, or undefined. */
function completeForm540NR(value: unknown): value is ParentForm540NRAmounts {
  if (typeof value !== "object" || value === null) return false;
  const amounts = value as Record<string, unknown>;
  return [
    "californiaAdjustedGrossIncome",
    "adjustedGrossIncome",
    "deductions",
    "taxOnTotalTaxableIncome",
    "californiaTaxableIncome",
  ].every((key) => isAmount(amounts[key]));
}

/*
 * The parent's California return fact, or undefined when it is missing, lacks
 * line 6 or line 10, or names Form 540NR without its amounts.
 */
export function readParentCaliforniaReturnFact(
  facts: ReadonlyArray<FactRow>,
): ParentCaliforniaReturnFactValue | undefined {
  const row = facts.find(
    (each) =>
      each.category === CATEGORY &&
      each.key === CA_CHILD_UNEARNED_INCOME_KEYS.parentCaliforniaReturn,
  );
  const value = row?.value as ParentCaliforniaReturnFactValue | undefined;
  if (typeof value !== "object" || value === null) return undefined;
  if (!isAmount(value.taxableIncome) || !isAmount(value.tax)) return undefined;
  if (value.returnForm === "540nr" && !completeForm540NR(value.form540NR)) return undefined;
  return value;
}
