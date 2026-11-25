/*
 * Part III's questions (lines 27–29): a sale to a related party whose buyer
 * resells the property before paying in full
 * (irs-6252-form-2025::sec::installment-sales-to-related-party::b01).
 */

import type { InstallmentSaleFactValue, SecondDispositionException } from "../../facts/index.js";
import type { LineStop } from "./sale.js";

/*
 * "If the property was sold to a related party, also complete Part III for the
 * year of sale and 2 years after the year of sale unless you received the final
 * payment during the tax year" (irs-6252-form-2025::sec::which-parts-to-complete::b01).
 * Line 29a: "The second disposition was more than 2 years after the first
 * disposition (other than dispositions of marketable securities)".
 */
export const RELATED_PARTY_YEARS = 2;
const PREPARED_YEAR = 2025;

export interface PartIIIAnswers {
  /* Line 27, first row: the related party's name; second row: address and identifying number. */
  line27Row1: string;
  line27Row2: string;
  /* Line 28. */
  resold: boolean;
  /* Line 29a's date (YYYY-MM-DD) when the box is checked. */
  box29aDate?: string;
  /* Line 29 b–e. */
  exception?: SecondDispositionException;
  /* Line 28 "Yes" and no line 29 condition: lines 30–37 are completed. */
  completeLines30To37: boolean;
}

const yearOf = (date: string): number => Number(date.slice(0, 4));

/* More than 2 years after the first disposition: after the second anniversary of its date. */
export function moreThanTwoYearsAfter(firstDate: string, secondDate: string): boolean {
  const anniversary = `${String(yearOf(firstDate) + RELATED_PARTY_YEARS)}-${firstDate.slice(5)}`;
  return secondDate > anniversary;
}

const MARKETABLE_AFTER_WINDOW =
  "The related party resold marketable securities more than 2 years after the year of sale. The two-year limit does not apply to marketable securities (irs-pub-537-2025::sec::sale-and-later-disposition::b02), but the form completes Part III only for the year of sale and 2 years after (irs-6252-form-2025::sec::which-parts-to-complete::b01); the engine does not choose.";
const RESALE_NOT_THIS_YEAR =
  "Line 28 asks about a second disposition during this tax year, and the stated date is not in 2025.";

export interface PartIIIResult {
  answers?: PartIIIAnswers;
  gap?: LineStop;
  waits?: LineStop;
}

/* Lines 27–29, or why Part III is a gap or waits; no answers when Part III is not completed. */
export function partIIIAnswers(
  sale: InstallmentSaleFactValue,
  receivedFinalPayment: boolean,
): PartIIIResult {
  const party = sale.relatedParty;
  if (party === undefined || receivedFinalPayment) return {};
  if (PREPARED_YEAR - yearOf(sale.dateSold) > RELATED_PARTY_YEARS) {
    return party.resoldThisYear && party.marketableSecurities === true
      ? { gap: { from: 30, reason: MARKETABLE_AFTER_WINDOW } }
      : {};
  }
  const base = {
    line27Row1: party.name,
    line27Row2: `${party.address}, ${party.identifyingNumber}`,
    resold: party.resoldThisYear,
    completeLines30To37: false,
  };
  if (!party.resoldThisYear) return { answers: base };
  const resale = party.secondDisposition;
  if (resale === undefined) return { answers: base, waits: { from: 30 } };
  if (yearOf(resale.date) !== PREPARED_YEAR) {
    return { answers: base, gap: { from: 30, reason: RESALE_NOT_THIS_YEAR } };
  }
  const after2Years =
    party.marketableSecurities !== true && moreThanTwoYearsAfter(sale.dateSold, resale.date);
  return {
    answers: {
      ...base,
      box29aDate: after2Years ? resale.date : undefined,
      exception: resale.exception,
      completeLines30To37: !after2Years && resale.exception === undefined,
    },
  };
}
