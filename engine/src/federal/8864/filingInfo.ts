import type { BaseFilingInfo } from "../../filingInfo.js";
import type { OwnProductionLines } from "./lines.js";

/* A whole-dollar amount, or why the engine cannot place it. */
export type AmountOrGap = { amount: number } | { gap: string };

export interface Form8864Figures {
  /* Lines 7 to 9; undefined with no production of the taxpayer's own, or while a gap stops them. */
  lines?: OwnProductionLines;
  /* The return has production of its own: lines 7 to 9 are figured (or have a gap). */
  ownProduction: boolean;
  /* Why lines 7 to 9 cannot be figured. */
  gap?: string;
  /* Line 10: undefined with no pass-through credit. */
  line10?: AmountOrGap;
  /* Line A: undefined with no transfer election. */
  transferRegistration?: { number: string } | { gap: string };
}

export interface Form8864FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8864 does not file. */
  form8864?: Form8864Figures;
  /*
   * Set whether or not the form files, because the income is added from the
   * facts alone: the Schedule C businesses whose line 6 waits on a gap of
   * lines 7 to 9 (receivers.ts), and the amount Form 6251 line 3 takes back.
   */
  form8864IncomeGapBusinessKeys?: string[];
  form8864IncomeIncluded?: AmountOrGap;
}
