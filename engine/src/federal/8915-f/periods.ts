/*
 * The periods of a qualified 2021-or-later disaster, from YYYY-MM-DD dates.
 * Plain integer math on the date parts: no money is involved. Dates compare as
 * strings, which orders YYYY-MM-DD dates correctly.
 */

import type { QualifiedDisaster } from "../../facts/index.js";

/* The SECURE 2.0 Act of 2022 was enacted on this day (qualified-disaster-distribution-requirements::b04). */
export const SECURE_2_0_ENACTED = "2022-12-29";

/*
 * "The qualified disaster distribution period for a qualified disaster will
 * begin on the date the disaster begins and will end 179 days after whichever
 * of the following occurs the latest. Disaster beginning date. Disaster
 * declaration date. December 29, 2022."
 * (irs-8915f-inst-2025::sec::qualified-disaster-distribution-requirements::b04)
 */
export const DISTRIBUTION_PERIOD_DAYS = 179;

/*
 * The qualified distribution repayment period "will end 180 days after
 * whichever of the following occurs the latest" of the same three dates
 * (irs-8915f-inst-2025::sec::qualified-distribution-repayment-period::b01).
 */
export const REPAYMENT_PERIOD_DAYS = 180;

/*
 * A Part IV qualified distribution "was received no more than 180 days before
 * the first day of the disaster and no later than 30 days after the last day of
 * the disaster" (irs-8915f-inst-2025::sec::qualified-distribution-requirements::b02).
 */
export const HOME_PURCHASE_DAYS_BEFORE = 180;
export const HOME_PURCHASE_DAYS_AFTER = 30;

/* A date some days after (or, with a negative count, before) another, YYYY-MM-DD. */
export function daysAfter(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days))
    .toISOString()
    .slice(0, 10);
}

const latest = (...dates: string[]): string =>
  dates.reduce((later, date) => (date > later ? date : later));

/* The day the later of the three dates falls on. */
function latestOfThree(disaster: QualifiedDisaster): string {
  return latest(disaster.beginningDate, disaster.declarationDate, SECURE_2_0_ENACTED);
}

/* The last day a qualified disaster distribution can be made for the disaster. */
export function distributionPeriodEnd(disaster: QualifiedDisaster): string {
  return daysAfter(latestOfThree(disaster), DISTRIBUTION_PERIOD_DAYS);
}

/* The last day a Part IV qualified distribution can be repaid for the disaster. */
export function repaymentPeriodEnd(disaster: QualifiedDisaster): string {
  return daysAfter(latestOfThree(disaster), REPAYMENT_PERIOD_DAYS);
}

/* The distribution was made within the disaster's qualified disaster distribution period. */
export function inDistributionPeriod(disaster: QualifiedDisaster, date: string): boolean {
  return date >= disaster.beginningDate && date <= distributionPeriodEnd(disaster);
}

/*
 * A home purchase distribution received inside the Part IV window. With no
 * ending date (FEMA shows the incident continuing) the window has no end yet.
 */
export function inHomePurchaseWindow(disaster: QualifiedDisaster, date: string): boolean {
  if (date < daysAfter(disaster.beginningDate, -HOME_PURCHASE_DAYS_BEFORE)) return false;
  if (disaster.endingDate === undefined) return true;
  return date <= daysAfter(disaster.endingDate, HOME_PURCHASE_DAYS_AFTER);
}
