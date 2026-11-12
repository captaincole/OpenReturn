/*
 * Line 1h items the engine does not compute yet (irs-1040-inst-2025::sec::line-1h::b01,
 * b02, b03): a corrective distribution of excess deferrals or contributions (a
 * 1099-R not from an IRA, box 7 code 8 or P) and elective deferrals over the
 * year's limit (W-2 box 12 codes D, E, F and S). The disability pensions are in
 * disabilityPensions.ts; strike benefits have no fact.
 */

import {
  ROTH_IRA_CODES,
  SPOUSE_KEYS,
  ageAtYearEnd,
  hasDistributionCode,
  isRetirementDistributionFactKey,
  isW2FactKey,
  type RetirementDistributionFactValue,
  type W2FactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { factsInCategory, type ResolverInputs } from "../../resolverInputs.js";

const TAX_YEAR = 2025;
const DEFERRAL_CODES = ["D", "E", "F", "S"];

/*
 * The most a person can defer in 2025 under the most generous rule that could
 * apply (line-1h::b01, b02): $23,500 ($17,600 for SIMPLE plans only), $3,000
 * more under the 403(b) 15-year rule, and the catch-up by age (unknown age: the
 * largest). Only an amount over this is surely an excess.
 */
function deferralLimit(codes: Set<string>, age: number | undefined): number {
  const simpleOnly = [...codes].every((code) => code === "S");
  const base = simpleOnly ? 17600 : 23500 + (codes.has("E") ? 3000 : 0);
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
    .filter((w2) => (w2.owner ?? "taxpayer") === owner)
    .flatMap((w2) => w2.box12 ?? [])
    .filter((entry) => DEFERRAL_CODES.includes(entry.code.toUpperCase()));
  if (entries.length === 0) return false;
  const dob = inputs.factByKey.get(owner === "taxpayer" ? "identity.dob" : SPOUSE_KEYS.dob);
  const age = ageAtYearEnd(typeof dob === "string" ? dob : undefined, TAX_YEAR);
  const codes = new Set(entries.map((entry) => entry.code.toUpperCase()));
  return sum(...entries.map((entry) => entry.amount)) > deferralLimit(codes, age);
}

function correctiveDistribution(row: RetirementDistributionFactValue): boolean {
  return (
    !row.box7IraSepSimple &&
    !hasDistributionCode(row, ROTH_IRA_CODES) &&
    hasDistributionCode(row, ["8", "P"])
  );
}

/* Why line 1h cannot be figured; undefined when every item it holds has a rule. */
export function line1hGap(inputs: ResolverInputs): string | undefined {
  const corrective = factsInCategory(inputs, "retirement")
    .filter((row) => isRetirementDistributionFactKey(row.key))
    .some((row) => correctiveDistribution(row.value as RetirementDistributionFactValue));
  if (corrective) {
    return "A corrective distribution of excess deferrals or contributions (1099-R code 8 or P, not an IRA) belongs on line 1h, which does not read it yet.";
  }
  if (excessDeferrals(inputs, "taxpayer") || excessDeferrals(inputs, "spouse")) {
    return "W-2 box 12 elective deferrals are over the 2025 limit; the excess belongs on line 1h, which does not figure it yet.";
  }
  return undefined;
}
