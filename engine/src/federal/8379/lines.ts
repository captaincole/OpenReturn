/*
 * Form 8379 arithmetic: pure functions with the 2025 amounts. The form changes
 * no amount on the return; it splits the joint return's items between the
 * spouses so the IRS can figure the injured spouse's share of the refund
 * (irs-8379-inst-2025::sec::general-instructions::b01).
 */

import { atLeast, roundDollars, sum } from "../../money.js";

/* Line 1: the tax year of the return this form is filed with. */
export const FORM_TAX_YEAR = "2025";

/*
 * Line 5: "Enter the name(s) of the community property state(s)" (the form),
 * from the fact's two-letter codes (irs-8379-inst-2025::sec::line-5::b01).
 */
export const COMMUNITY_PROPERTY_STATE_NAMES: Readonly<Record<string, string>> = {
  AZ: "Arizona",
  CA: "California",
  ID: "Idaho",
  LA: "Louisiana",
  NV: "Nevada",
  NM: "New Mexico",
  TX: "Texas",
  WA: "Washington",
  WI: "Wisconsin",
};

/*
 * Line 15 worksheet line 2: the additional standard deduction for 2025, for
 * each box checked for age or blindness (irs-8379-inst-2025::sec::basic-standard-deduction::b01).
 */
export const ADDITIONAL_STANDARD_DEDUCTION_2025 = 1600;

/* Form 8959 line 21: the regular Medicare tax, 1.45% of the Medicare wages on line 20 (the form). */
export const REGULAR_MEDICARE_TAX_RATE = 0.0145;

/*
 * The most social security tax one person owes for 2025 on wages: "the amount
 * withheld in excess of $10,918.20" is the Schedule 3 line 11 credit
 * (irs-1040-inst-2025::sec::line-11-2::b01).
 */
export const MAX_SOCIAL_SECURITY_TAX_2025 = 10918.2;

/* Every Part III line: "Column (a) must equal columns (b) + (c)" (irs-8379-face-2025::sec::face-part-iii::b01). */
export const otherSpouseShare = (joint: number, injured: number): number => joint - injured;

/*
 * DECISION (2026-11-26, by the author): line 15 with the standard deduction.
 * The Form 8379 instructions: "In columns (b) and (c), include one-half of your
 * basic standard deduction ... 2025 $30,000" (irs-8379-inst-2025::sec::line-15::b01,
 * ::basic-standard-deduction::b01). The 2025 Form 1040 chart gives $33,100 for
 * a joint return with one box checked, so the basic amount is $31,500
 * (irs-1040-inst-2025::sec::single-1::b01). The engine takes the basic
 * standard deduction from the joint return: column (a) less $1,600 for each
 * box checked, half to each column, then each spouse's boxes. The
 * instructions were printed before the 2025 law raised the amount, and
 * column (a) must equal columns (b) + (c), which $30,000 cannot give.
 * The same rule covers "line 4c of the Standard Deduction Worksheet for
 * Dependents": that line is the basic standard deduction of a dependent.
 */
export function standardDeductionShares(
  jointTotal: number,
  injuredBoxes: number,
  otherBoxes: number,
): { injured: number; other: number } {
  const additional = (injuredBoxes + otherBoxes) * ADDITIONAL_STANDARD_DEDUCTION_2025;
  const basic = jointTotal - additional;
  // Worksheet line 3: line 2 × line 1, the injured spouse's boxes.
  const injured = roundDollars(basic / 2) + injuredBoxes * ADDITIONAL_STANDARD_DEDUCTION_2025;
  return { injured, other: otherSpouseShare(jointTotal, injured) };
}

/*
 * One spouse's part of Form 8959 line 24 (irs-8379-inst-2025::sec::line-19::b01:
 * "any Additional Medicare Tax withholding from Form 8959, line 24, attributed
 * to each spouse"): Form 8959 lines 19 to 22 on that spouse's W-2s alone,
 * box 6 less 1.45% of box 5, never below 0.
 */
export function additionalMedicareWithholding(medicareTaxWithheld: number, medicareWages: number) {
  return atLeast(
    0,
    roundDollars(medicareTaxWithheld) - roundDollars(medicareWages * REGULAR_MEDICARE_TAX_RATE),
  );
}

/*
 * Schedule 3 line 11 would hold this spouse's excess social security tax: more
 * than one employer, and more than $10,918.20 withheld in all
 * (irs-1040-inst-2025::sec::line-11-2::b01).
 */
export function hasExcessSocialSecurity(socialSecurityTaxByW2: readonly number[]): boolean {
  return (
    socialSecurityTaxByW2.length > 1 && sum(...socialSecurityTaxByW2) > MAX_SOCIAL_SECURITY_TAX_2025
  );
}

/* The answers Part I reads, in its order; undefined while one is missing. */
export interface PartOneAnswers {
  joint?: boolean;
  offsetForOtherSpouseDebt?: boolean;
  legallyObligated?: boolean;
  communityProperty?: boolean;
  madePayments?: boolean;
  earnedIncome?: boolean;
  claimedEicOrActc?: boolean;
  claimedRefundableCredit?: boolean;
}

export type PartOneLine = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/*
 * Part I filled: each line reached, Yes (true) or No (false); a line skipped or
 * not reached is absent. partII: the form goes to Part II; false at a "Stop
 * here. Do not file this form."
 */
export interface PartOneLines {
  answers: Partial<Record<PartOneLine, boolean>>;
  partII: boolean;
}

type Next = PartOneLine | "partII" | "stop";

/* Where each answer goes next (irs-8379-face-2025::sec::face-part-i::b01, ::b02, ::b03). */
const ROUTE: Record<PartOneLine, { key: keyof PartOneAnswers; yes: Next; no: Next }> = {
  2: { key: "joint", yes: 3, no: "stop" },
  3: { key: "offsetForOtherSpouseDebt", yes: 4, no: "stop" },
  4: { key: "legallyObligated", yes: "stop", no: 5 },
  5: { key: "communityProperty", yes: "partII", no: 6 },
  6: { key: "madePayments", yes: "partII", no: 7 },
  7: { key: "earnedIncome", yes: 8, no: 9 },
  8: { key: "claimedEicOrActc", yes: "partII", no: 9 },
  9: { key: "claimedRefundableCredit", yes: "partII", no: "stop" },
};

/* Part I from its answers, or the answer that the first line it cannot fill waits on. */
export function partOneLines(
  answers: PartOneAnswers,
): PartOneLines | { waitsOn: keyof PartOneAnswers } {
  const filled: Partial<Record<PartOneLine, boolean>> = {};
  let line: Next = 2;
  while (line !== "partII" && line !== "stop") {
    const step: { key: keyof PartOneAnswers; yes: Next; no: Next } = ROUTE[line];
    const answer = answers[step.key];
    if (answer === undefined) return { waitsOn: step.key };
    filled[line] = answer;
    line = answer ? step.yes : step.no;
  }
  return { answers: filled, partII: line === "partII" };
}
