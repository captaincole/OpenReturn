/*
 * Form 8697: the look-back method for long-term contracts completed or adjusted
 * in 2025 (irs-8697-inst-2025::sec::who-must-file::b01). One fact for the whole
 * form: the taxpayer states each prior year's amounts from their own contract
 * records and returns, or from the statement a pass-through entity sends with
 * Schedule K-1 (box 20 code J, irs-1065k1-inst-2025::sec::box-20-other-information::b03;
 * irs-8697-inst-2025::sec::pass-through-entities::b02). The engine figures the
 * interest. A fact means the look-back method applies: the exceptions (home
 * construction, small contracts, the de minimis election) are Cade's question.
 */

import type { RefundAccountType } from "./refundDeposit.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * Part I, the regular method, or Part II, the simplified marginal impact method
 * (SMIM), which a taxpayer uses only with the election in effect
 * (irs-8697-inst-2025::sec::part-i-regular-method::b01, ::part-ii-simplified-marginal-impact::b01).
 */
export type LookBackMethod = "regular" | "simplified_marginal_impact";

/* One prior year of Part I (a calendar year ending December 31). Whole dollars, as stated. */
export interface RegularLookBackYear {
  taxYear: number;
  /*
   * Line 1: taxable income or loss as shown on that year's return (or as
   * previously adjusted), before loss carrybacks; line 3 of the most recent
   * earlier Form 8697 when one affects the year (irs-8697-inst-2025::sec::line-1::b01).
   */
  taxableIncome: number;
  /*
   * Line 2: the net change to income from the contracts (actual less estimated
   * contract price and costs), with the other income and expense changes it
   * causes (irs-8697-inst-2025::sec::line-2::b01). A decrease is negative.
   */
  incomeAdjustment: number;
  /* Line 4: the year's tax on line 3 at that year's rates, after nonrefundable credits, AMT included (::lines-4-and-5::b01). */
  taxOnAdjustedIncome: number;
  /* Line 5: the tax shown on the return, or line 4 of the most recent earlier Form 8697 (::lines-4-and-5::b01). */
  taxAsReported: number;
  /*
   * A loss or credit carryback or carryover to or from this year changes because
   * of the look-back, or a carryback refund was allowed for this year's tax. The
   * interest then runs over other periods (::lines-7-and-8::b01, b02).
   */
  carryoverChanged?: boolean;
}

/* One prior year of Part II (a calendar year ending December 31). */
export interface SimplifiedLookBackYear {
  taxYear: number;
  /* Line 1: the net change to regular taxable income from the contracts (irs-8697-inst-2025::sec::line-1-2::b01). */
  incomeAdjustment: number;
  /* Line 3: the same change to alternative minimum taxable income (::line-3-2::b01). */
  amtiAdjustment: number;
  /*
   * Line 6: the year's total tax liability, as adjusted for earlier look-back
   * applications and after carryovers and carrybacks. Used only when line 5 is
   * negative (the overpayment ceiling).
   */
  totalTaxLiability: number;
}

/* Part I's filing-year column: line 1 is Form 1040 line 15; the taxpayer states lines 2 and 4. */
export interface LookBackFilingYear {
  incomeAdjustment: number;
  taxOnAdjustedIncome: number;
}

/* Item C: a pass-through entity that holds the contracts. */
export interface LookBackEntity {
  name: string;
  ein: string;
}

interface LookBackCommon {
  /* Item C; absent for the taxpayer's own contracts. More than one needs an attached schedule. */
  entities?: LookBackEntity[];
  /*
   * The date the 2025 return is filed and its tax fully paid, YYYY-MM-DD, when
   * before the due date: the interest stops then (::lines-7-and-8::b01). Absent:
   * the due date of the 2025 return.
   */
  filedAndPaidOn?: string;
  /* Lines 9b–9d (Part II 10b–10d): the account for a refund of interest. Absent: a check. */
  refundDeposit?: { routingNumber: string; accountNumber: string; accountType: RefundAccountType };
}

export interface RegularLookBackFactValue extends LookBackCommon {
  method: "regular";
  filingYear: LookBackFilingYear;
  /* Oldest first: columns (a), (b), then more Forms 8697. */
  priorYears: RegularLookBackYear[];
  /*
   * Line 2 includes other adjustments the look-back causes (a medical expense
   * floor that moves with AGI): column 2(c) is then left blank (::line-2::b01).
   */
  otherAdjustmentsIncluded?: boolean;
}

export interface SimplifiedLookBackFactValue extends LookBackCommon {
  method: "simplified_marginal_impact";
  /* Oldest first: columns (a), (b), (c), then more Forms 8697. */
  priorYears: SimplifiedLookBackYear[];
}

export type LookBackFactValue = RegularLookBackFactValue | SimplifiedLookBackFactValue;

export interface LookBackFact {
  key: string;
  value: LookBackFactValue;
}

/* Cade records the fact in this category, under this one key. */
export const LOOK_BACK_CATEGORY = "other";
export const LOOK_BACK_FACT_KEY = "look_back.long_term_contracts";

/* The look-back fact, or undefined. The latest row of the key wins (rows are in recorded order). */
export function getLookBackFact(facts: ReadonlyArray<FactRow>): LookBackFact | undefined {
  const rows = facts.filter(
    (row) => row.category === LOOK_BACK_CATEGORY && row.key === LOOK_BACK_FACT_KEY,
  );
  const row = rows[rows.length - 1];
  return row === undefined ? undefined : { key: row.key, value: row.value as LookBackFactValue };
}
