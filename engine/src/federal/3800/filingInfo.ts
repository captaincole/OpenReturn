import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Carryover, CurrentCredit } from "./credits.js";

/*
 * A current-year credit as the resolver finds it. A research credit (lines 1c
 * and 4i) also carries the taxable income attributable to its source, for the
 * limitation that reads Part II line 11 (irs-3800-inst-2025::sec::lines-1c-and-4i::b01).
 * A K-1 credit for a line the engine figures from its own form (lines 1s, 1y,
 * 1aa) keeps its detail, so the form's line can stand in for it.
 */
export interface CreditSource {
  credit: CurrentCredit;
  attributableTaxableIncome?: number;
  fromK1?: { detail: string };
}

export interface Form3800Sources {
  current: CreditSource[];
  carryovers: Carryover[];
}

export interface Form3800FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 3800 does not file. */
  form3800Sources?: Form3800Sources;
  /* The copy rendered: Parts V and VI print 15 and 35 rows a copy (copies.ts). */
  form3800CopyIndex?: number;
}
