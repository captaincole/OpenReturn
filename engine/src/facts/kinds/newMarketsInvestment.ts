/*
 * Form 8874: a qualified equity investment the taxpayer holds directly in a
 * qualified community development entity (CDE), one fact per investment. "A
 * separate form must be provided for each qualified equity investment" (Form
 * 8874-A, When To File): the fact holds that Form 8874-A as printed and the
 * holder's answers that it does not print. "Qualified CDEs must provide
 * taxpayers holding a qualified equity investment with a completed Form
 * 8874-A when a qualified equity investment is acquired"
 * (irs-8874-form-2025::sec::qualified-equity-investment::b02).
 *
 * A new markets credit passed through on a K-1 (code AD) is not stated here:
 * the K-1 fact holds it (federal/passThrough, the business_credit items).
 */

type FactRow = { key: string; value: unknown; category: string };

/* Form 8874-A (Rev. December 2011), Notice of Qualified Equity Investment for New Markets Credit, as printed. */
export interface Form8874ABoxes {
  /* Box 1: name of the qualified CDE. */
  box1CdeName: string;
  /* Box 2: EIN of the qualified CDE. */
  box2CdeEin: string;
  /* Boxes 3 and 4: the parent taxpayer the CDE files a consolidated return with, if any. */
  box3ParentName?: string;
  box4ParentEin?: string;
  /* Boxes 5 and 6: the taxpayer making the qualified equity investment. */
  box5InvestorName: string;
  box6InvestorTin: string;
  /* Box 7: date of the qualified equity investment, YYYY-MM-DD (printed mm/dd/yyyy). */
  box7InvestmentDate: string;
  /* Box 8: amount of the qualified equity investment, the amount paid at its original issue. */
  box8Amount: number;
  /* Box 9: total allowable credit, as printed. */
  box9TotalAllowableCredit?: number;
  /* Boxes 10a to 10g: allowable credit for years 1 to 7, as printed. */
  box10AllowableCredits?: number[];
}

export interface NewMarketsInvestmentFactValue {
  /* Whose investment it is: on a return other than a joint one, only the taxpayer's. */
  owner: "taxpayer" | "spouse";
  notice: Form8874ABoxes;
  /* The CDE's address for Form 8874 column (a), "Name and address": Form 8874-A prints none. */
  cdeAddress: string;
  /*
   * From an activity that is passive for the holder (section 469): Form 3800
   * column (d), which needs Form 8582-CR. Otherwise column (e). The holder
   * states it, as for a Form 3468 property (federal/8874/QUESTIONS.md).
   */
  passive: boolean;
  /*
   * The day the holder sold or otherwise disposed of the investment, YYYY-MM-DD.
   * "You cannot claim the credit for any credit allowance date after the
   * disposition" (irs-8874-form-2025::sec::recapture-of-the-credit::b02).
   * Absent: still held at the end of 2025.
   */
  disposedOn?: string;
  /*
   * The date of the recapture event on a Form 8874-B the CDE sent, YYYY-MM-DD:
   * the entity stopped being a qualified CDE, the proceeds stopped being used
   * for qualified low-income community investments, or the investment was
   * redeemed (irs-8874-form-2025::sec::recapture-of-the-credit::b01). Absent: none.
   */
  recaptureEventOn?: string;
}

export interface NewMarketsInvestmentFact {
  key: string;
  value: NewMarketsInvestmentFactValue;
}

const INVESTMENT_CATEGORY = "other";
const INVESTMENT_PREFIX = "new_markets_investment.";

export const makeNewMarketsInvestmentFactKey = (slug: string) => `${INVESTMENT_PREFIX}${slug}`;

export function isNewMarketsInvestmentFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === INVESTMENT_PREFIX && parts[1] !== "";
}

/* Every investment fact, in the order recorded: the order of the rows of line 1. */
export function getNewMarketsInvestmentFacts(
  facts: ReadonlyArray<FactRow>,
): NewMarketsInvestmentFact[] {
  return facts
    .filter((row) => row.category === INVESTMENT_CATEGORY && isNewMarketsInvestmentFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as NewMarketsInvestmentFactValue }));
}
