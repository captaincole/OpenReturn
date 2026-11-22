/*
 * Form 8880, the saver's credit: one fact per person on the return (the
 * taxpayer, and the spouse on a joint return). It holds the answers no
 * document prints. The W-2 box 12 deferrals, the traditional IRA contributions
 * (retirement.traditional_ira.<owner>) and the 2025 Forms 1099-R come from
 * their own facts.
 *
 * - Who can take the credit (irs-8880-form-2025::sec::who-can-take-this-credit::b01,
 *   ::b02): a person who was a full-time student for part of 5 calendar months
 *   of 2025, or whom someone else claims as a dependent, cannot.
 * - Line 1 (irs-8880-form-2025::sec::omb-no-1545-0074::b01): Roth IRA and ABLE
 *   account contributions. No document the engine reads shows them (Form 5498
 *   and Form 5498-QA arrive after the return is due).
 * - Line 2 (irs-8880-form-2025::sec::line-2::b01): voluntary employee
 *   contributions are after-tax, so W-2 box 12 does not show them.
 * - Line 4 (irs-8880-form-2025::sec::line-4::b01, ::b02): the testing period is
 *   2023, 2024, 2025 and 2026 up to the due date of the 2025 return. Only the
 *   2025 Forms 1099-R are facts; the other years are this answer.
 */

import type { IraOwner } from "./traditionalIra.js";

export interface SaversCreditFactValue {
  /* A full-time student during any part of 5 calendar months of 2025. */
  fullTimeStudent: boolean;
  /* Claimed as a dependent on someone else's 2025 return. */
  claimedAsDependent: boolean;
  /* Line 1: Roth IRA contributions for 2025, not rollovers or conversions. */
  rothIraContributions?: number;
  /* Line 1: contributions to the person's own ABLE account, as its designated beneficiary. */
  ableContributions?: number;
  /* Line 2: voluntary after-tax employee contributions to a qualified plan (not in W-2 box 12). */
  voluntaryEmployeeContributions?: number;
  /*
   * Line 4: the person's own distributions that count on line 4 and that no
   * 2025 Form 1099-R fact shows: those received in 2023, in 2024, and in 2026
   * before the due date of the 2025 return (with extensions), and 2025 ABLE
   * account distributions (Form 1099-QA). 0 when there were none.
   */
  otherDistributions: number;
  /*
   * Joint return only: the part of otherDistributions received in a year the
   * couple did not file a joint return. It stays out of the other spouse's
   * column (the line 4 Exception, irs-8880-form-2025::sec::line-4::b02).
   */
  otherDistributionsInSeparateYears?: number;
  /*
   * Line 4: the part of the person's 2025 Forms 1099-R that the instructions
   * leave off line 4 but that the box 7 code does not show: a rollover within
   * 60 days from an employer plan or a Roth IRA, an inherited IRA of a
   * beneficiary who is not the spouse, a military retirement plan. Rollovers and
   * conversions of a traditional IRA are read from retirement.traditional_ira.
   */
  excluded2025Distributions?: number;
}

const AMOUNT_FIELDS: Array<keyof SaversCreditFactValue> = [
  "rothIraContributions",
  "ableContributions",
  "voluntaryEmployeeContributions",
  "otherDistributionsInSeparateYears",
  "excluded2025Distributions",
];

const SAVERS_CREDIT_KEY_START = "retirement.savers_credit.";

export function makeSaversCreditFactKey(owner: IraOwner): string {
  return `${SAVERS_CREDIT_KEY_START}${owner}`;
}

const isAmount = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/*
 * Cade records this fact as one object he writes himself, so check it. A field
 * that is not the right type makes the whole fact missing, and Cade asks again.
 */
export function readSaversCreditFact(
  factByKey: ReadonlyMap<string, unknown>,
  owner: IraOwner,
): SaversCreditFactValue | undefined {
  const value = factByKey.get(makeSaversCreditFactKey(owner));
  if (typeof value !== "object" || value === null) return undefined;
  const fields = value as Record<string, unknown>;
  const valid =
    typeof fields.fullTimeStudent === "boolean" &&
    typeof fields.claimedAsDependent === "boolean" &&
    isAmount(fields.otherDistributions) &&
    AMOUNT_FIELDS.every((field) => fields[field] === undefined || isAmount(fields[field]));
  return valid ? (value as SaversCreditFactValue) : undefined;
}
