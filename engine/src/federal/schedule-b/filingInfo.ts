import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8621FilingInfo } from "../8621/filingInfo.js";
import type { Form8814FilingInfo } from "../8814/filingInfo.js";
import type { Receipt } from "../passThrough/receipts.js";

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

export interface ScheduleBFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form8814FilingInfo, "form8814Totals">,
    Pick<Form8621FilingInfo, "form8621Totals"> {
  /** 1099-INT box 1 + box 3, then each K-1's interest (passThroughInterest). */
  interestPayers?: PayerAmount[];
  /** 1099-DIV box 1a, each K-1's dividends, a "Form 8814" row for each Form 8814 line 9, then each PFIC's dividends. */
  dividendPayers?: PayerAmount[];
  /** The K-1 interest and dividends the rows list; lines 2 and 6 wait or show the gap with them. */
  passThroughInterest?: Receipt;
  passThroughDividends?: Receipt;
  rounding?: ScheduleBRounding;
  hasForeignFinancialAccount?: boolean;
  hasForeignTrust?: boolean;
  /** Why Form 8815 line 14 is unsupported (federal/8815/line9Gaps.ts); line 3 is then unsupported too. */
  savingsBondExclusionGap?: string;
}
