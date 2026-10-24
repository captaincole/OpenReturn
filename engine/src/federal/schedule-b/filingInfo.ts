/*
 * ScheduleBFilingInfo — Schedule B (Interest and Ordinary Dividends)
 * specific slots layered on top of BaseFilingInfo.
 *
 * Parts I and II list one row per payer; each 1099-INT / 1099-DIV fact is
 * one payer. Part III answers come from two scope decisions.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";

/** One Schedule B row: payer name and amount (cents kept). */
export interface PayerAmount {
  payerName: string;
  amount: number;
}

/**
 * How lines 2 and 6 total the payer rows (`decisions.rounding.schedule_b`).
 *   - "round_total" (default, the IRS rule): add the amounts with cents,
 *     round only the total.
 *   - "sum_rounded_rows": add the rows as printed (whole dollars), as
 *     some preparers do. Set only to match another preparer's filed
 *     return (Scenario.preparer.rounding); never an AI decision.
 */
export type ScheduleBRounding = "round_total" | "sum_rounded_rows";

export interface ScheduleBFilingInfo extends BaseFilingInfo {
  /** Part I line 1: taxable interest per payer (1099-INT box 1 + box 3). */
  interestPayers?: PayerAmount[];
  /** Part II line 5: ordinary dividends per payer (1099-DIV box 1a). */
  dividendPayers?: PayerAmount[];
  /** Totaling method for lines 2 and 6. Absent means "round_total". */
  rounding?: ScheduleBRounding;
  /** Line 7a: `decisions.scope.has_foreign_financial_account`. */
  hasForeignFinancialAccount?: boolean;
  /** Line 8: `decisions.scope.has_foreign_trust`. */
  hasForeignTrust?: boolean;
}
