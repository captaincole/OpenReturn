/*
 * The $25,000 special allowance for rental real estate with active
 * participation, and its phaseout by modified AGI: Form 8582 lines 5 to 8
 * (irs-8582-inst-2025::sec::line-5::b01, ::line-8::b01) and Form 8582-CR
 * lines 9 to 12 and 21 to 24 (irs-8582cr-inst-2025::sec::special-allowance-for-rental-real-estate::b03,
 * ::b04), which read the same amounts.
 */

import { roundDollars } from "../../money.js";

export const ALLOWANCE_THRESHOLD = 150_000;
export const ALLOWANCE_THRESHOLD_MFS_APART = 75_000;
export const ALLOWANCE_RATE = 0.5;
export const MAX_ALLOWANCE = 25_000;
export const MAX_ALLOWANCE_MFS_APART = 12_500;

/* A married person filing separately who lived apart from the spouse all year. */
export const isMfsApart = (info: {
  filingStatus?: string;
  livedApartFromSpouseAllYear?: boolean;
}) =>
  info.filingStatus === "married_filing_separately" && info.livedApartFromSpouseAllYear === true;

/* "Multiply line 7 by 50% (0.50). Do not enter more than $25,000" (Form 8582 line 8; Form 8582-CR lines 12 and 24). */
export const halfOfExcess = (excess: number, cap: number) =>
  Math.min(roundDollars(excess * ALLOWANCE_RATE), cap);
