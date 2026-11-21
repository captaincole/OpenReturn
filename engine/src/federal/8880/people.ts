/*
 * The facts behind each column of Form 8880: who made which contribution, who
 * can take the credit, and the distributions that count on line 4.
 */

import { bornBeforeJan2_2008 } from "../../birthDate.js";
import {
  SPOUSE_KEYS,
  hasDistributionCode,
  isRetirementDistributionFactKey,
  isW2FactKey,
  readSaversCreditFact,
  readTraditionalIraFact,
  type IraOwner,
  type RetirementDistributionFactValue,
  type SaversCreditFactValue,
  type W2FactValue,
} from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import { factsInCategory, text, w2Owner, type ResolverInputs } from "../../resolverInputs.js";

/*
 * W-2 box 12 codes for the elective deferrals line 2 takes
 * (irs-8880-form-2025::sec::line-2::b01: "These amounts may be shown in box 12"):
 * D 401(k), E 403(b), F SARSEP, G 457(b), H 501(c)(18)(D), S SIMPLE, and the
 * designated Roth deferrals AA 401(k), BB 403(b), EE governmental 457(b).
 */
export const ELECTIVE_DEFERRAL_CODES: ReadonlyArray<string> = [
  "D",
  "E",
  "F",
  "G",
  "H",
  "S",
  "AA",
  "BB",
  "EE",
];

/*
 * Form 1099-R box 7 codes whose distribution stays off line 4
 * (irs-8880-form-2025::sec::line-4::b01, ::b02): G and H direct rollovers, L a
 * loan treated as a distribution, 8, P and E corrective distributions of excess
 * contributions or deferrals (P also a contribution returned by the due date),
 * N and R recharacterizations, U ESOP dividends under section 404(k). Codes 6,
 * 9, C, D, F and W are not distributions from a plan the line lists (an
 * exchange of insurance contracts, the cost of life insurance, death benefits,
 * a nonqualified annuity, a charitable gift annuity, long-term care charges).
 */
export const EXCLUDED_DISTRIBUTION_CODES: ReadonlyArray<string> = [
  "6",
  "8",
  "9",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "L",
  "N",
  "P",
  "R",
  "U",
  "W",
];

const DOB_KEY: Record<IraOwner, string> = {
  taxpayer: "identity.dob",
  spouse: SPOUSE_KEYS.dob,
};

export interface Person {
  owner: IraOwner;
  fact?: SaversCreditFactValue;
  /* Born before January 2, 2008; undefined while the date of birth is missing. */
  bornInTime?: boolean;
  /* Line 1 before rounding: traditional and Roth IRA and ABLE contributions. */
  iraAndAbleContributions: number;
  /* Line 2 before rounding: W-2 box 12 deferrals and voluntary contributions. */
  electiveDeferrals: number;
  /* The person's 2025 Form 1099-R distributions that count on line 4. */
  distributions2025: number;
}

export const dobKeyOf = (owner: IraOwner): string => DOB_KEY[owner];

/* A person who made a contribution line 1 or line 2 takes. */
export const madeContribution = (person: Person): boolean =>
  person.iraAndAbleContributions > 0 || person.electiveDeferrals > 0;

/* False when a fact rules the person out; undefined while an answer is missing. */
export function canTakeCredit(person: Person): boolean | undefined {
  if (person.bornInTime === false) return false;
  if (person.fact?.fullTimeStudent === true || person.fact?.claimedAsDependent === true) {
    return false;
  }
  if (person.bornInTime === undefined || person.fact === undefined) return undefined;
  return true;
}

function w2sOf(inputs: ResolverInputs): Array<{ key: string; w2: W2FactValue }> {
  return factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => ({ key: row.key, w2: row.value as W2FactValue }));
}

/* The W-2s a joint return cannot place with a spouse (w2Owner), when one has a deferral. */
export function unplacedDeferralW2Keys(inputs: ResolverInputs): string[] {
  return w2sOf(inputs)
    .filter(({ w2 }) => deferralsOf(w2) > 0 && w2Owner(inputs, w2) === undefined)
    .map(({ key }) => key);
}

const deferralsOf = (w2: W2FactValue): number =>
  sum(
    ...(w2.box12 ?? [])
      .filter((entry) => ELECTIVE_DEFERRAL_CODES.includes(entry.code))
      .map((entry) => entry.amount),
  );

/*
 * The owner's 2025 Forms 1099-R less what the instructions leave off line 4:
 * an excluded code, a traditional IRA distribution rolled over or converted to a
 * Roth IRA (retirement.traditional_ira), and the stated exclusions. Box 1 is the
 * gross distribution: a Roth IRA distribution counts even when not taxable
 * (irs-pub-590a-2025::sec::retirement-savings::b04).
 */
function distributions2025(
  inputs: ResolverInputs,
  owner: IraOwner,
  fact: SaversCreditFactValue | undefined,
): number {
  const counted = factsInCategory(inputs, "retirement")
    .filter((row) => isRetirementDistributionFactKey(row.key))
    .map((row) => row.value as RetirementDistributionFactValue)
    .filter((distribution) => (distribution.owner ?? "taxpayer") === owner)
    .filter((distribution) => !hasDistributionCode(distribution, EXCLUDED_DISTRIBUTION_CODES));
  const ira = readTraditionalIraFact(inputs.factByKey, owner);
  return atLeast(
    0,
    sum(...counted.map((distribution) => distribution.box1)) -
      sum(ira?.rolledOver, ira?.convertedToRoth, fact?.excluded2025Distributions),
  );
}

export function personOf(inputs: ResolverInputs, owner: IraOwner): Person {
  const fact = readSaversCreditFact(inputs.factByKey, owner);
  const ira = readTraditionalIraFact(inputs.factByKey, owner);
  const ownW2s = w2sOf(inputs).filter(({ w2 }) => w2Owner(inputs, w2) === owner);
  return {
    owner,
    fact,
    bornInTime: bornBeforeJan2_2008(text(inputs, dobKeyOf(owner))),
    // Without `contributions`, Form 8606 line 1 as stated is the whole year's contribution.
    iraAndAbleContributions: sum(
      ira?.contributions ?? ira?.nondeductibleContributions,
      fact?.rothIraContributions,
      fact?.ableContributions,
    ),
    electiveDeferrals: sum(
      ...ownW2s.map(({ w2 }) => deferralsOf(w2)),
      fact?.voluntaryEmployeeContributions,
    ),
    distributions2025: distributions2025(inputs, owner, fact),
  };
}
