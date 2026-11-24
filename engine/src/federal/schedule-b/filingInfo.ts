import type { BaseFilingInfo } from "../../filingInfo.js";
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

/** The foreign deposit and custodial accounts recorded for Form 8938, on this return. */
export interface ForeignAccountFacts {
  /** The countries the accounts are in, each once, in the order recorded. */
  countries: string[];
  /** One account alone was worth more than the FinCEN Form 114 limit at some time in the year. */
  overFincenLimit: boolean;
  /** A Part VI asset is on the return: it may be a financial account, so the countries may be incomplete. */
  countriesIncomplete: boolean;
}

export interface ScheduleBFilingInfo
  extends BaseFilingInfo, Pick<Form8814FilingInfo, "form8814Totals"> {
  /** 1099-INT box 1 + box 3, then each K-1's interest (passThroughInterest). */
  interestPayers?: PayerAmount[];
  /** 1099-DIV box 1a, then each K-1's dividends, then a "Form 8814" row for each Form 8814 line 9. */
  dividendPayers?: PayerAmount[];
  /** The K-1 interest and dividends the rows list; lines 2 and 6 wait or show the gap with them. */
  passThroughInterest?: Receipt;
  passThroughDividends?: Receipt;
  rounding?: ScheduleBRounding;
  hasForeignFinancialAccount?: boolean;
  /** Line 7a question 2 and line 7b from the Form 8938 account facts (resolveInfo.ts). */
  foreignAccountFacts?: ForeignAccountFacts;
  hasForeignTrust?: boolean;
  /** Why Form 8815 line 14 is unsupported (federal/8815/line9Gaps.ts); line 3 is then unsupported too. */
  savingsBondExclusionGap?: string;
}
