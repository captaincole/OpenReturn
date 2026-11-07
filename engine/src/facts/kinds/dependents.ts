/*
 * One fact per dependent the taxpayer claims (the 1040 Dependents table, Schedule
 * 8812 lines 4 and 6, CA 540 line 10). Recording the fact means the person is
 * claimed as a dependent: the Who Qualifies steps (1040 instructions) are Cade's
 * conversation, not the engine's.
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface DependentFactValue {
  firstName: string;
  lastName: string;
  /* An SSN valid for employment (Schedule 8812: the child tax credit needs one). */
  ssn?: string;
  /* An ITIN or ATIN when there is no SSN (enough for the credit for other dependents). */
  tin?: string;
  /* As the 1040 prints it: "Daughter", "Son", "Niece", "Parent". */
  relationship: string;
  dob?: string; // MM/DD/YYYY
  monthsLivedWithYou?: number;
  livedInUs?: boolean;
  usCitizenOrResident?: boolean;
  fullTimeStudent?: boolean;
  permanentlyDisabled?: boolean;
}

export interface DependentFact {
  dependentSlug: string;
  dependent: DependentFactValue;
  sourceFact: TaxFactRow;
}

const DEPENDENT_CATEGORY = "dependents";
const DEPENDENT_KEY_RE = /^dependent\.([^.]+)$/;

export function makeDependentFactKey(dependentSlug: string): string {
  return `dependent.${dependentSlug}`;
}

export function isDependentFactKey(key: string): boolean {
  return DEPENDENT_KEY_RE.test(key);
}

export function isDependentFact(fact: TaxFactRow): boolean {
  return fact.category === DEPENDENT_CATEGORY && DEPENDENT_KEY_RE.test(fact.key);
}

export function parseDependentFact(fact: TaxFactRow): DependentFact | null {
  const match = DEPENDENT_KEY_RE.exec(fact.key);
  if (!match || fact.category !== DEPENDENT_CATEGORY) return null;
  return {
    dependentSlug: match[1]!,
    dependent: fact.value as DependentFactValue,
    sourceFact: fact,
  };
}

export function getDependentFacts(facts: FactsView): DependentFact[] {
  return facts
    .byCategory(DEPENDENT_CATEGORY)
    .map(parseDependentFact)
    .filter((fact): fact is DependentFact => fact !== null);
}

/*
 * The relationships that make a qualifying child (1040 instructions, Who Qualifies
 * as Your Dependent, Step 1): a child, stepchild, foster child, sibling, half or
 * step sibling, or a descendant of any of them. Spelled as the 1040 prints them.
 */
const QUALIFYING_CHILD_RELATIONSHIPS = new Set([
  "son",
  "daughter",
  "child",
  "stepson",
  "stepdaughter",
  "stepchild",
  "foster child",
  "brother",
  "sister",
  "half brother",
  "half sister",
  "stepbrother",
  "stepsister",
  "grandson",
  "granddaughter",
  "grandchild",
  "great-grandchild",
  "niece",
  "nephew",
]);

export function isQualifyingChildRelationship(relationship: string): boolean {
  return QUALIFYING_CHILD_RELATIONSHIPS.has(relationship.trim().toLowerCase());
}

/* Age on December 31 of the tax year; undefined when the date of birth is unknown or unreadable. */
export function ageAtYearEnd(dob: string | undefined, taxYear: number): number | undefined {
  if (dob === undefined) return undefined;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dob.trim());
  if (!match) return undefined;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const hadBirthday = month < 12 || (month === 12 && day <= 31);
  return taxYear - year - (hadBirthday ? 0 : 1);
}

export type DependentCredit = "child_tax_credit" | "other_dependents";

/*
 * Which box in row (7) of the 1040 Dependents table the engine checks, from
 * irs-1040s8-inst-2025 "Credits for Qualifying Children" and "Credit for Other
 * Dependents (ODC)": the child tax credit needs a qualifying child under 17 at
 * the end of the year with an SSN; any other dependent who is a U.S. citizen,
 * national or resident alien with an SSN, ITIN or ATIN gets the credit for other
 * dependents. Undefined while the date of birth is unknown: the engine then waits.
 */
export function dependentCredit(
  dependent: DependentFactValue,
  taxYear: number,
): DependentCredit | undefined {
  const citizenOrResident = dependent.usCitizenOrResident !== false;
  const age = ageAtYearEnd(dependent.dob, taxYear);
  if (age === undefined) return undefined;
  const livedOverHalfYear = (dependent.monthsLivedWithYou ?? 12) > 6;
  const qualifyingChild =
    age < 17 &&
    isQualifyingChildRelationship(dependent.relationship) &&
    livedOverHalfYear &&
    citizenOrResident &&
    dependent.ssn !== undefined;
  if (qualifyingChild) return "child_tax_credit";
  const hasTin = dependent.ssn !== undefined || dependent.tin !== undefined;
  return citizenOrResident && hasTin ? "other_dependents" : undefined;
}
