import type { BaseFilingInfo } from "../../filingInfo.js";

/** Amount keeps cents. */
export interface PayerAmount {
  payerName: string;
  amount: number;
}

/**
 * Lines 2 and 6. "round_total" (default) is the IRS rule. "sum_rounded_rows"
 * only matches another preparer's filed return; it is never an AI decision.
 */
export type ScheduleBRounding = "round_total" | "sum_rounded_rows";

export interface ScheduleBFilingInfo extends BaseFilingInfo {
  /** 1099-INT box 1 + box 3. */
  interestPayers?: PayerAmount[];
  /** 1099-DIV box 1a. */
  dividendPayers?: PayerAmount[];
  rounding?: ScheduleBRounding;
  hasForeignFinancialAccount?: boolean;
  hasForeignTrust?: boolean;
}
