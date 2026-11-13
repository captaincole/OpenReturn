/*
 * FTB 3532 Parts II and III: the qualifying person and the answers about them,
 * from the dependent facts and the head of household answers.
 */

import {
  ageAtYearEnd,
  getDependentFacts,
  HEAD_OF_HOUSEHOLD_KEYS,
  makeDependentFactKey,
  type CaHohMaritalStatus,
  type DependentFactValue,
} from "../../../facts/index.js";
import type { ResolverInputs } from "../../../resolverInputs.js";

export const TAX_YEAR = 2025;
const DAYS_IN_2025 = 365;

export interface QualifyingPerson {
  factKey: string;
  dependent: DependentFactValue;
}

/*
 * The qualifying person: the dependent the answer names, else the only dependent
 * on the return. `gap` says why the engine cannot name one; `waits` is true while
 * the return has more than one dependent and no answer names one.
 */
export function findQualifyingPerson(inputs: ResolverInputs): {
  person?: QualifyingPerson;
  waits: boolean;
  gap?: string;
} {
  const dependents = getDependentFacts(inputs.facts);
  const named = inputs.factByKey.get(HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson);
  if (typeof named === "string" && named !== "") {
    const match = dependents.find((fact) => fact.dependentSlug === named);
    return match
      ? {
          person: { factKey: makeDependentFactKey(named), dependent: match.dependent },
          waits: false,
        }
      : {
          waits: false,
          gap: `The qualifying person "${named}" is not a recorded dependent; a qualifying person who is not a dependent has no fact yet.`,
        };
  }
  if (dependents.length === 1) {
    const only = dependents[0]!;
    return { person: { factKey: only.sourceFact.key, dependent: only.dependent }, waits: false };
  }
  if (dependents.length > 1) return { waits: true };
  return {
    waits: false,
    gap: "No dependent is recorded; a qualifying person who is not a dependent has no fact yet.",
  };
}

const spelled = (relationship: string) =>
  relationship
    .toLowerCase()
    .replaceAll("-", " ")
    .split(" ")
    .filter((word) => word !== "")
    .join(" ");

/* Line 2's boxes a–e, as the form lists each relationship (the 1040 spellings too). */
const LINE_2_BOXES: ReadonlyArray<[string, ReadonlyArray<string>]> = [
  [
    "child_or_stepchild",
    [
      "son",
      "daughter",
      "stepson",
      "stepdaughter",
      "child",
      "stepchild",
      "adopted son",
      "adopted daughter",
      "adopted child",
    ],
  ],
  [
    "grandchild_sibling_niece_nephew",
    [
      "grandchild",
      "grandson",
      "granddaughter",
      "brother",
      "sister",
      "half brother",
      "half sister",
      "stepbrother",
      "stepsister",
      "nephew",
      "niece",
    ],
  ],
  ["foster_child", ["foster child", "eligible foster child"]],
  [
    "parent_or_stepparent",
    ["father", "mother", "stepfather", "stepmother", "parent", "stepparent"],
  ],
  [
    "other_relative",
    [
      "grandfather",
      "grandmother",
      "grandparent",
      "son in law",
      "daughter in law",
      "father in law",
      "mother in law",
      "brother in law",
      "sister in law",
      "uncle",
      "aunt",
    ],
  ],
];

/* Line 2's option for the relationship, or undefined when no box names it. */
export function relationshipBox(relationship: string): string | undefined {
  const words = spelled(relationship);
  return LINE_2_BOXES.find(([, names]) => names.includes(words))?.[0];
}

/* Line 3: "If your qualifying person is age 19 or older in 2025, go to line 3a. If not, go to line 4." */
export function asksLines3aAnd3b(dependent: DependentFactValue): boolean | undefined {
  const age = ageAtYearEnd(dependent.dob, TAX_YEAR);
  return age === undefined ? undefined : age >= 19;
}

/* Line 3a: a full-time student under 24. Undefined while the student answer is missing for a person under 24. */
export function fullTimeStudentUnder24(dependent: DependentFactValue): boolean | undefined {
  const age = ageAtYearEnd(dependent.dob, TAX_YEAR);
  if (age === undefined) return undefined;
  if (age >= 24) return false;
  return dependent.fullTimeStudent;
}

const bornIn = (dob: string | undefined, year: number) => dob?.trim().endsWith(`/${year}`) === true;

/*
 * Line 5 (ca-3532-inst-2025::sec::line-5::b02, b04): the days the qualifying person
 * lived with the taxpayer. The stated days win. A birth during the year is 365
 * days. Otherwise twelve months in the home is every day of the year, but only for
 * a taxpayer who did not live with a spouse/RDP during the year (boxes a, b, c,
 * e): boxes d and f count half the days the spouse/RDP also lived there, so they
 * need the stated days. Undefined while the days are not known.
 */
export function daysLivedWithTaxpayer(
  dependent: DependentFactValue,
  maritalStatus: CaHohMaritalStatus | undefined,
): number | undefined {
  if (dependent.daysLivedWithYou !== undefined) return dependent.daysLivedWithYou;
  if (bornIn(dependent.dob, TAX_YEAR)) return DAYS_IN_2025;
  const countsEveryDay =
    maritalStatus !== undefined &&
    maritalStatus !== "divorced_or_separated" &&
    maritalStatus !== "married_lived_together";
  return countsEveryDay && dependent.monthsLivedWithYou === 12 ? DAYS_IN_2025 : undefined;
}
