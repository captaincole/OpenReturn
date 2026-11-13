/*
 * The Young Child Tax Credit (Part VII, Step 8) and the Foster Youth Tax
 * Credit (Part IX, Step 10). Both start at $1,189 for each claimant and lose
 * $21.71 for every $100 of California earned income over $27,425 (lines
 * 24–28 and 35–39). The decimals are "out to two decimal places, do not
 * round", so they are kept in whole cents.
 */

import { roundDollars } from "../../../money.js";
import { isYoungChild } from "./children.js";
import { caEitcOutcome, NONE, WAITING, type CaCreditOutcome } from "./credit.js";
import type { Form3514FilingInfo } from "./filingInfo.js";
import {
  CA_YCTC_FYTC_PHASE_OUT_THRESHOLD,
  CA_YCTC_FYTC_REDUCTION_CENTS_PER_100,
  CA_YCTC_ZERO_INCOME_AGI_LIMIT,
  CA_YCTC_ZERO_INCOME_LIMIT,
  CA_YOUNG_CHILD_AND_FOSTER_YOUTH_CREDIT,
  fosterYouthAge,
} from "./limits.js";
import { isGap, partIV, type Lines } from "./lines.js";

export const YCTC_ZERO_EARNED_INCOME_GAP =
  "The YCTC with California earned income of zero or less needs the total net loss without utilization limits (FTB 3514 line 23b) and the EITC steps without earned income, which the engine does not figure.";
export const FOSTER_NAME_GAP =
  "FTB 3514 line 32 asks for the name used in foster care when it differs from the return, and no fact records it.";

/* Whole cents as dollars and two-digit cents, for the split boxes. */
export const centsParts = (cents: number) => {
  const remainder = cents % 100;
  return { dollars: (cents - remainder) / 100, cents: String(remainder).padStart(2, "0") };
};

/* Lines 25 and 36: "Subtract $27,425 from line 23"; undefined at or under the threshold (lines 25–27 are skipped). */
export function excessOverThreshold(earned: number): number | undefined {
  return earned > CA_YCTC_FYTC_PHASE_OUT_THRESHOLD
    ? earned - CA_YCTC_FYTC_PHASE_OUT_THRESHOLD
    : undefined;
}

/*
 * Lines 26–27 and 37–38: line 25 divided by 100 (exact to two decimals,
 * since line 25 is whole dollars), times $21.71 for each claimant, cut to two
 * decimals. Returned in cents.
 */
export function reductionCents(excess: number, claimants: number): number {
  const hundredths = excess * CA_YCTC_FYTC_REDUCTION_CENTS_PER_100 * claimants;
  return (hundredths - (hundredths % 100)) / 100;
}

/*
 * Lines 28 and 39: line 24 (or 35) less the reduction. "If your credit amount
 * is between $0 and $1, enter $1. If your credit amount is over $1, round to
 * the nearest whole dollar."
 */
export function phasedOutCredit(earned: number, claimants: number): number {
  const available = CA_YOUNG_CHILD_AND_FOSTER_YOUTH_CREDIT * claimants;
  const excess = excessOverThreshold(earned);
  if (excess === undefined) return available;
  const credit = available - reductionCents(excess, claimants) / 100;
  if (credit <= 0) return 0;
  return credit < 1 ? 1 : roundDollars(credit);
}

/* Step 8's child: a listed qualifying child younger than six at the end of 2025. */
export const hasYoungChild = (info: Form3514FilingInfo) =>
  (info.caEitcChildren ?? []).some(isYoungChild);

/*
 * Line 23a (ca-3514-inst-2025::sec::line-23a::b01): lines 13 and 17, combat
 * pay not on line 17, and wages not subject to California withholding. All
 * combat pay is on line 17 or not, so it adds in full.
 */
export function totalWages(line13: number, info: Form3514FilingInfo): number {
  return line13 + (info.caCombatPay ?? 0) + (info.caWagesOutsideCalifornia ?? 0);
}

/*
 * Step 8 (::sec::step-8-qualifications-for-young-child-tax::b01): the YCTC
 * needs a qualifying child under six and the EITC allowed on this form. With
 * earned income of zero or less, line 23a over $35,640 or federal AGI over
 * $32,900 stops it (line 23b); otherwise the zero-earned-income test is a gap.
 */
export function yctcOutcome(form: Lines, info: Form3514FilingInfo): CaCreditOutcome {
  if (!hasYoungChild(info)) return NONE;
  const lines = partIV(form, info);
  if (isGap(lines)) return { kind: "unsupported", reason: lines.reason };
  if (lines === undefined) return WAITING;
  if (lines.line19 > 0) {
    const eitc = caEitcOutcome(form, info);
    if (eitc.kind !== "credit") return eitc;
    return { kind: "credit", amount: phasedOutCredit(lines.line19, 1) };
  }
  const agi = form["form-1040.line.11b"];
  if (typeof agi !== "number") return WAITING;
  if (totalWages(lines.line13, info) > CA_YCTC_ZERO_INCOME_LIMIT) return NONE;
  if (agi > CA_YCTC_ZERO_INCOME_AGI_LIMIT) return NONE;
  return { kind: "unsupported", reason: YCTC_ZERO_EARNED_INCOME_GAP };
}

/* Step 10's ages and foster care answers: who claims the FYTC, or undefined while an answer is missing. */
export function fosterYouthClaimants(
  info: Form3514FilingInfo,
): { taxpayer: boolean; spouse: boolean } | undefined {
  const answers = info.caEitcAnswers ?? {};
  const claims = (dob: string | undefined, answer: boolean | undefined) => {
    const age = fosterYouthAge(dob);
    if (age === false) return false;
    return age === undefined || answer === undefined ? undefined : answer;
  };
  const taxpayer = claims(info.taxpayerDateOfBirth, answers.fosterYouthTaxpayer);
  const joint = info.filingStatus === "married_filing_jointly";
  const spouse = joint ? claims(info.spouseDateOfBirth, answers.fosterYouthSpouse) : false;
  if (taxpayer === undefined || spouse === undefined) return undefined;
  return { taxpayer, spouse };
}

/*
 * Step 10 (::sec::step-10-qualifications-for-foster-youth-tax-credit::b01): the
 * FYTC needs the EITC allowed on this form, ages 18 to 25, and California
 * foster care at 13 or older; $1,189 for each spouse who qualifies, reduced by
 * $21.71 (or $43.42 for both) per $100 over $27,425 (::line-37-and-line-38::b01).
 */
export function fytcOutcome(form: Lines, info: Form3514FilingInfo): CaCreditOutcome {
  const eitc = caEitcOutcome(form, info);
  if (eitc.kind !== "credit") return eitc;
  const claimants = fosterYouthClaimants(info);
  if (claimants === undefined) return WAITING;
  const count = Number(claimants.taxpayer) + Number(claimants.spouse);
  if (count === 0) return NONE;
  const lines = partIV(form, info);
  if (lines === undefined || isGap(lines)) return WAITING;
  return { kind: "credit", amount: phasedOutCredit(lines.line19, count) };
}
