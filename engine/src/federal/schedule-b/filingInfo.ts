import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8814FilingInfo } from "../8814/filingInfo.js";
import type { Receipt } from "../passThrough/receipts.js";

/** Amount keeps cents; undefined while a foreign-currency fact waits for its rate. */
export interface PayerAmount {
  payerName: string;
  amount: number | undefined;
}

/**
 * Lines 2 and 6. "round_total" (default) is the IRS rule. "sum_rounded_rows"
 * only matches another preparer's filed return; it is never an AI decision.
 */
export type ScheduleBRounding = "round_total" | "sum_rounded_rows";

/**
 * The foreign financial accounts recorded for Form 8938, on this return: the
 * Part V accounts and the Part VI assets answered as financial accounts.
 */
export interface ForeignAccountFacts {
  /** At least one account is recorded: line 7a question 1 is Yes. */
  recorded: boolean;
  /** The countries the accounts are in, each once, in the order recorded. */
  countries: string[];
  /** One account alone was worth more than the FinCEN Form 114 limit at some time in the year. */
  overFincenLimit: boolean;
  /** An account has no country recorded (no address of an institution, entity or issuer). */
  countriesIncomplete: boolean;
  /** The Part VI asset facts that do not say whether they are a financial account: line 7 waits for them. */
  unansweredAssetKeys: string[];
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
