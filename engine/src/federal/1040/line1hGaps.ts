/*
 * Line 1h items the engine does not compute yet (irs-1040-inst-2025::sec::line-1h::b01,
 * b02, b03): a corrective distribution with code P or B (correctiveWithoutRule)
 * and elective deferrals over the
 * year's limit (W-2 box 12, DEFERRAL_CODES). The disability pensions are in
 * disabilityPensions.ts; strike benefits have no fact.
 */

import {
  SPOUSE_KEYS,
  ageAtYearEnd,
  hasDistributionCode,
  isCorrectiveDistribution,
  isW2FactKey,
  parseRetirementDistributionFact,
  type RetirementDistributionFactValue,
  type W2FactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { factsInCategory, w2Owner, type ResolverInputs } from "../../resolverInputs.js";

const TAX_YEAR = 2025;
/*
 * Elective deferrals under the one limit: 401(k) D, 403(b) E, SARSEP F,
 * SIMPLE S, and the designated Roth contributions 401(k) AA and 403(b) BB,
 * which "are subject to this limit" (line-1h::b01). Section 457(b) deferrals
 * (G, and Roth EE) have a limit of their own (line-1h::b02) and are left out.
 */
const DEFERRAL_CODES = ["D", "E", "F", "S", "AA", "BB"];
const SECTION_403B_CODES = ["E", "BB"];

/*
 * The most a person can defer in 2025 under the most generous rule that could
 * apply (line-1h::b01, b02): $23,500 ($17,600 for SIMPLE plans only), $3,000
 * more under the 403(b) 15-year rule, and the catch-up by age (unknown age: the
 * largest). Only an amount over this is surely an excess.
 */
function deferralLimit(codes: Set<string>, age: number | undefined): number {
  const simpleOnly = [...codes].every((code) => code === "S");
  const has403b = SECTION_403B_CODES.some((code) => codes.has(code));
  const base = simpleOnly ? 17600 : 23500 + (has403b ? 3000 : 0);
  const sixtyToSixtyThree = age === undefined || (age >= 60 && age <= 63);
  const catchUp = sixtyToSixtyThree
    ? simpleOnly
      ? 5250
      : 11250
    : age >= 50
      ? simpleOnly
        ? 3850
        : 7500
      : 0;
  return base + catchUp;
}

function excessDeferrals(inputs: ResolverInputs, owner: "taxpayer" | "spouse"): boolean {
  const entries = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => row.value as W2FactValue)
    // An unplaced W-2 on a joint return counts for both: a bound, not a figure.
    .filter((w2) => (w2Owner(inputs, w2) ?? owner) === owner)
    .flatMap((w2) => w2.box12 ?? [])
    .filter((entry) => DEFERRAL_CODES.includes(entry.code.toUpperCase()));
  if (entries.length === 0) return false;
  const dob = inputs.factByKey.get(owner === "taxpayer" ? "identity.dob" : SPOUSE_KEYS.dob);
  const age = ageAtYearEnd(typeof dob === "string" ? dob : undefined, TAX_YEAR);
  const codes = new Set(entries.map((entry) => entry.code.toUpperCase()));
  return sum(...entries.map((entry) => entry.amount)) > deferralLimit(codes, age);
}

/*
 * Code P is taxable in a prior year (an amended return), and code B with 8 is a
 * designated Roth excess, already in W-2 box 1 (line-1h::b01): neither has a
 * 2025 line 1h amount the engine figures. Code 8 alone is line 1h's.
 */
function correctiveWithoutRule(row: RetirementDistributionFactValue): boolean {
  return isCorrectiveDistribution(row) && hasDistributionCode(row, ["P", "B"]);
}

/* Why line 1h cannot be figured; undefined when every item it holds has a rule. */
export function line1hGap(inputs: ResolverInputs): string | undefined {
  const corrective = inputs.facts
    .map(parseRetirementDistributionFact)
    .some((fact) => fact !== null && correctiveWithoutRule(fact.distribution));
  if (corrective) {
    return "A corrective distribution with code P (taxable in a prior year) or a designated Roth excess (code B) is not modeled for line 1h.";
  }
  if (excessDeferrals(inputs, "taxpayer") || excessDeferrals(inputs, "spouse")) {
    return "W-2 box 12 elective deferrals, designated Roth contributions included, are over the 2025 limit; the excess not from Roth contributions belongs on line 1h, which does not figure it yet.";
  }
  return undefined;
}
