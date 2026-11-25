/*
 * Form 6252: one fact per installment sale, "a disposition of property where at
 * least one payment is received after the end of the tax year in which the
 * disposition occurs" (irs-6252-form-2025::sec::purpose-of-form::b01). The fact
 * holds the sale as it was made (Part I, the same every year) and this year's
 * payments (Part II). The taxpayer states each amount; the engine figures the
 * lines. California's FTB 3805E reads the same fact.
 *
 * One fact is one property: "If you have only a few sales to separately report,
 * use a separate Form 6252 for each one" (irs-pub-537-2025::sec::reporting-an-installment-sale::b02).
 * Not in this fact: a sale the taxpayer elects out of (Form 4797, Form 8949 or
 * Schedule D), interest on the payments (Schedule B), a like-kind exchange with
 * an installment note (Form 8824), and a selling price reduced after the sale.
 */

import { INHERITED } from "./businessPropertySale.js";
import { isIsoDate } from "./depreciation.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * The code on line 1 (irs-6252-form-2025::sec::specific-instructions::b01):
 * 1 timeshare or residential lot; 2 personal-use property sold by an individual;
 * 3 property used or produced in farming; 4 every other installment sale.
 */
export type InstallmentPropertyCode = 1 | 2 | 3 | 4;

/*
 * Where line 26 and line 37 go (irs-6252-form-2025::sec::line-26::b01):
 * - capital_asset: Schedule D, short or long term by the holding period;
 * - business: trade or business or rental property (section 1231 property):
 *   Form 4797 line 4 when held more than 1 year, line 10 when not;
 * - ordinary: an ordinary gain from a noncapital asset: Form 4797 line 10.
 */
export type InstallmentPropertyUse = "capital_asset" | "business" | "ordinary";

/* Line 29 b–e: the exceptions a person states (29a the engine figures from the dates). */
export type SecondDispositionException =
  "stock_to_issuer" | "involuntary_conversion" | "after_death" | "no_tax_avoidance";

/* A second disposition by the related party during this tax year (lines 28–30). */
export interface SecondDisposition {
  /* The date of the second disposition, YYYY-MM-DD, in the tax year (line 29a's date). */
  date: string;
  /*
   * Line 30: the amount realized from the part resold, cumulative when part was
   * sold in an earlier year (irs-6252-form-2025::sec::line-30::b01). The FMV
   * when the property is not sold or exchanged (a gift).
   */
  amountRealized: number;
  /* Line 29 b–e, when one applies; absent: none. */
  exception?: SecondDispositionException;
}

/* Line 3 "Yes": the buyer is a related party (installment-sales-to-related-party::b01). */
export interface InstallmentRelatedParty {
  /* Line 27: name, address and taxpayer identifying number. */
  name: string;
  address: string;
  identifyingNumber: string;
  /* The property sold is marketable securities: line 29a's two-year exception does not apply. */
  marketableSecurities?: boolean;
  /* Line 28: did the related party resell or dispose of the property during this tax year? */
  resoldThisYear: boolean;
  /* Lines 29–30: required when resoldThisYear is true. */
  secondDisposition?: SecondDisposition;
}

export interface InstallmentSaleFactValue {
  /* Line 1: the property, in the taxpayer's words. */
  description: string;
  propertyCode: InstallmentPropertyCode;
  /* Line 2a: YYYY-MM-DD, or INHERITED. */
  dateAcquired: string;
  /* Line 2b: YYYY-MM-DD, in the tax year or an earlier one. */
  dateSold: string;
  use: InstallmentPropertyUse;
  /*
   * Section 1250 property (real property that was depreciated): the
   * Unrecaptured Section 1250 Gain Worksheet takes part of line 26
   * (irs-6252-form-2025::sec::line-26::b01). Absent: not section 1250 property.
   */
  section1250?: boolean;
  /*
   * Form 8960 only, for use "business" or "ordinary": the property was used in a
   * non-section 1411 trade or business (one that is not passive to the taxpayer
   * and does not trade financial instruments). Its gain this year comes out of
   * net investment income (Lines 5a–5d Worksheet line 2(d),
   * irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b06).
   * A passive rental's property is false. Absent: Form 8960 line 5b waits for it.
   */
  nonSection1411TradeOrBusiness?: boolean;
  /* Line 4: can the total selling price be determined by the end of the year of sale? */
  sellingPriceDeterminable: boolean;
  /*
   * Line 5: money, the face amount of the installment obligation, the FMV of
   * other property, and debt the buyer assumed; no interest. A contingent
   * payment sale states its maximum selling price (line-5::b01). Absent only for
   * a contingent payment sale with no stated maximum: the form is a gap.
   */
  sellingPrice?: number;
  /* Line 6: mortgages and other debts the buyer assumed or took the property subject to. Absent: none. */
  liabilitiesAssumed?: number;
  /* Line 8: cost or other basis, with improvements (line-8::b01). */
  costOrOtherBasis: number;
  /* Line 9: depreciation and amortization allowed or allowable (line-9::b01). Absent: none. */
  depreciationAllowed?: number;
  /* Line 11: commissions and other expenses of the sale (line-11::b01). Absent: none. */
  expensesOfSale?: number;
  /*
   * Line 12 for a sale in an earlier year: the ordinary income recapture of that
   * year's Form 4797 Part III line 31 (line-12::b01). Needed when line 9 is more
   * than 0; absent with no depreciation: 0.
   */
  recaptureIncome?: number;
  /* Line 15: a main home's excluded gain, from Pub. 523 (line-15::b01). Absent: not a main home. */
  excludedGain?: number;
  /*
   * Line 21: money and the FMV of property or services received this tax year,
   * no interest (line-21::b01). 0 when nothing was received.
   */
  paymentsThisYear: number;
  /*
   * The part of this year's payments that an earlier year's line 34 already
   * treated as received ("If in prior years an amount was entered on the
   * equivalent of line 34, don't include it on this line", line-21::b01). Absent: none.
   */
  paymentsTreatedAsReceivedEarlier?: number;
  /*
   * Line 23 for a sale in an earlier year: everything received before this year,
   * deemed payments included (line-23::b01). Needed then; never in the year of sale.
   */
  paymentsPriorYears?: number;
  /*
   * Line 25 for a sale in an earlier year: section 1252, 1254 or 1255 recapture (or
   * pre-June 7, 1984 section 1245 or 1250 recapture) not yet reported
   * (line-25::b01). Absent: none.
   */
  remainingRecapture?: number;
  /* Absent: the buyer is not a related party (line 3 "No"). */
  relatedParty?: InstallmentRelatedParty;
  /* FTB 3805E only: the California amounts that differ from the federal ones. Absent: none differ. */
  california?: InstallmentSaleCaliforniaAmounts;
}

/*
 * FTB 3805E's own amounts (ca-3805e-inst-2025): line 9 "Use California
 * amounts", line 15 "using California amounts", line 12 from Schedule D-1, and
 * the California basis of Schedule D (540) (ca-540-sched-d-inst-2025::sec::line-1::b02).
 * Each absent field is the federal amount.
 */
export interface InstallmentSaleCaliforniaAmounts {
  /* Line 8: the California cost or other basis. */
  costOrOtherBasis?: number;
  /* Line 9: California depreciation allowed or allowable. */
  depreciationAllowed?: number;
  /*
   * Line 12 for a sale in an earlier year: the recapture of that year's Schedule
   * D-1. Needed when line 8 or 9 is stated here and California line 9 is above 0.
   */
  recaptureIncome?: number;
  /* Line 15: the main home's excluded gain, using California amounts. */
  excludedGain?: number;
}

export interface InstallmentSaleFact {
  key: string;
  value: InstallmentSaleFactValue;
}

const SALE_CATEGORY = "capital_gains";
const SALE_PREFIX = "installment_sale.";

const CODES: readonly unknown[] = [1, 2, 3, 4];
const USES: readonly unknown[] = ["capital_asset", "business", "ordinary"];
const EXCEPTIONS: readonly unknown[] = [
  "stock_to_issuer",
  "involuntary_conversion",
  "after_death",
  "no_tax_avoidance",
];

export function makeInstallmentSaleFactKey(saleSlug: string): string {
  return `${SALE_PREFIX}${saleSlug}`;
}

export function isInstallmentSaleFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === SALE_PREFIX && parts[1] !== "";
}

const isAmount = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isOptionalAmount = (value: unknown): boolean => value === undefined || isAmount(value);

const isText = (value: unknown): boolean => typeof value === "string" && value !== "";

const isOptionalBoolean = (value: unknown): boolean =>
  value === undefined || typeof value === "boolean";

const OPTIONAL_AMOUNTS = [
  "sellingPrice",
  "liabilitiesAssumed",
  "depreciationAllowed",
  "expensesOfSale",
  "recaptureIncome",
  "excludedGain",
  "paymentsTreatedAsReceivedEarlier",
  "paymentsPriorYears",
  "remainingRecapture",
] as const;

function isSecondDisposition(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const fields = value as Record<string, unknown>;
  return (
    isIsoDate(fields.date) &&
    isAmount(fields.amountRealized) &&
    (fields.exception === undefined || EXCEPTIONS.includes(fields.exception))
  );
}

function isRelatedParty(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== "object" || value === null) return false;
  const fields = value as Record<string, unknown>;
  return (
    isText(fields.name) &&
    isText(fields.address) &&
    isText(fields.identifyingNumber) &&
    (fields.marketableSecurities === undefined ||
      typeof fields.marketableSecurities === "boolean") &&
    typeof fields.resoldThisYear === "boolean" &&
    (fields.secondDisposition === undefined || isSecondDisposition(fields.secondDisposition))
  );
}

const CALIFORNIA_AMOUNTS = [
  "costOrOtherBasis",
  "depreciationAllowed",
  "recaptureIncome",
  "excludedGain",
] as const;

function isCaliforniaAmounts(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== "object" || value === null) return false;
  const fields = value as Record<string, unknown>;
  return CALIFORNIA_AMOUNTS.every((field) => isOptionalAmount(fields[field]));
}

function isSale(value: unknown): value is InstallmentSaleFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fields = value as Record<string, unknown>;
  return (
    isText(fields.description) &&
    CODES.includes(fields.propertyCode) &&
    (fields.dateAcquired === INHERITED || isIsoDate(fields.dateAcquired)) &&
    isIsoDate(fields.dateSold) &&
    USES.includes(fields.use) &&
    isOptionalBoolean(fields.section1250) &&
    isOptionalBoolean(fields.nonSection1411TradeOrBusiness) &&
    typeof fields.sellingPriceDeterminable === "boolean" &&
    isAmount(fields.costOrOtherBasis) &&
    isAmount(fields.paymentsThisYear) &&
    OPTIONAL_AMOUNTS.every((field) => isOptionalAmount(fields[field])) &&
    isRelatedParty(fields.relatedParty) &&
    isCaliforniaAmounts(fields.california)
  );
}

/* Each installment sale fact that is well formed, in the order recorded (the order of the forms); a malformed one is listed. */
export function readInstallmentSaleFacts(facts: ReadonlyArray<FactRow>): {
  sales: InstallmentSaleFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === SALE_CATEGORY && isInstallmentSaleFactKey(row.key),
  );
  return {
    sales: rows
      .filter((row) => isSale(row.value))
      .map((row) => ({ key: row.key, value: row.value as InstallmentSaleFactValue })),
    malformedKeys: rows.filter((row) => !isSale(row.value)).map((row) => row.key),
  };
}
