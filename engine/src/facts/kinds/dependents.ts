/*
 * One fact per dependent the taxpayer claims (the 1040 Dependents table, Schedule
 * 8812 lines 4 and 6, CA 540 line 10). Recording the fact means the person is
 * claimed as a dependent: the Who Qualifies steps (1040 instructions) are Cade's
 * conversation, not the engine's.
 */

import type { TaxFactRow } from "../rows.js";

type FactRow = { key: string; value: unknown; category: string };

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
  /*
   * MM/DD/YYYY: the date in the tax year the child was adopted, lawfully placed
   * for adoption, or placed as an eligible foster child. The half-year test then
   * counts from that date (1040 instructions, Definitions and Special Rules).
   */
  placedWithYou?: string;
  livedInUs?: boolean;
  usCitizenOrResident?: boolean;
  fullTimeStudent?: boolean;
  permanentlyDisabled?: boolean;
  /* The person's gross income for the year (FTB 3532 line 4; the qualifying relative test). */
  grossIncome?: number;
  /*
   * Days the person lived with the taxpayer during the year, by the FTB 3532 line 5
   * rules (a married filer counts half the days the spouse also lived there).
   */
  daysLivedWithYou?: number;
  /*
   * A child who lived with the taxpayer half the year or less: true when the
   * custodial parent released the claim on Form 8332 (1040 instructions,
   * children of divorced or separated parents), which gives this parent the
   * child tax credit.
   */
  form8332Release?: boolean;
}

export interface DependentFact {
  dependentSlug: string;
  dependent: DependentFactValue;
  sourceFact: FactRow;
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

export function parseDependentFact(fact: FactRow): DependentFact | null {
  const match = DEPENDENT_KEY_RE.exec(fact.key);
  if (!match || fact.category !== DEPENDENT_CATEGORY) return null;
  return {
    dependentSlug: match[1]!,
    dependent: fact.value as DependentFactValue,
    sourceFact: fact,
  };
}

/* Every dependent fact, in the order recorded. */
export function getDependentFacts(facts: ReadonlyArray<FactRow>): DependentFact[] {
  return facts.map(parseDependentFact).filter((fact): fact is DependentFact => fact !== null);
}

/*
 * The relationships that make a qualifying child (1040 instructions, Who Qualifies
 * as Your Dependent, Step 1): a child, stepchild, foster child, sibling, half or
 * step sibling, or a descendant of any of them. An adopted child is the
 * taxpayer's own child. Spelled as the 1040 prints them, hyphens as spaces
 * (normalizeRelationship).
 */
export const QUALIFYING_CHILD_RELATIONSHIPS: ReadonlySet<string> = new Set([
  "son",
  "daughter",
  "child",
  "adopted son",
  "adopted daughter",
  "adopted child",
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
  "great grandson",
  "great granddaughter",
  "great grandchild",
  "niece",
  "nephew",
  "grandniece",
  "grandnephew",
  "great niece",
  "great nephew",
]);

/* A relationship as the lists here spell it: lower case, hyphens as spaces, single spaces. */
export function normalizeRelationship(relationship: string): string {
  return relationship
    .toLowerCase()
    .replaceAll("-", " ")
    .split(" ")
    .filter((word) => word !== "")
    .join(" ");
}

export function isQualifyingChildRelationship(relationship: string): boolean {
  return QUALIFYING_CHILD_RELATIONSHIPS.has(normalizeRelationship(relationship));
}

function parseDob(dob: string | undefined): { month: number; year: number } | undefined {
  if (dob === undefined) return undefined;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dob.trim());
  if (!match) return undefined;
  return { month: Number(match[1]), year: Number(match[3]) };
}

/* Age on December 31 of the tax year; undefined when the date of birth is unknown or unreadable. */
export function ageAtYearEnd(dob: string | undefined, taxYear: number): number | undefined {
  const born = parseDob(dob);
  return born === undefined ? undefined : taxYear - born.year;
}

/* The months of the tax year from a date in it to December 31; 12 for a date in an earlier year. */
function monthsFrom(date: { month: number; year: number }, taxYear: number): number {
  return date.year === taxYear ? 12 - date.month + 1 : 12;
}

/*
 * Row (5)(a) of the Dependents table: lived with the taxpayer more than half the
 * year. A child born during the year counts the months it was alive, and a
 * child adopted or placed during the year counts the months since the placement
 * (1040 instructions, Definitions and Special Rules: the home was the person's
 * home for more than half the time the person was alive, or since the person
 * was adopted or placed). A death during the year has no fact yet. Undefined
 * while an answer is missing.
 */
export function livedWithTaxpayerOverHalfYear(
  dependent: DependentFactValue,
  taxYear: number,
): boolean | undefined {
  const born = parseDob(dependent.dob);
  if (born === undefined || dependent.monthsLivedWithYou === undefined) return undefined;
  const placed = parseDob(dependent.placedWithYou);
  const monthsInScope = Math.min(
    monthsFrom(born, taxYear),
    placed === undefined ? 12 : monthsFrom(placed, taxYear),
  );
  return dependent.monthsLivedWithYou > monthsInScope / 2;
}

/* "none": a dependent who earns neither credit (no TIN, or not a citizen or resident). */
export type DependentCredit = "child_tax_credit" | "other_dependents" | "none";

/*
 * Which box in row (7) of the 1040 Dependents table the engine checks, from
 * irs-1040s8-inst-2025 "Credits for Qualifying Children" and "Credit for Other
 * Dependents (ODC)": the child tax credit needs a qualifying child under 17 at
 * the end of the year with an SSN; any other dependent who is a U.S. citizen,
 * national or resident alien with an SSN, ITIN or ATIN gets the credit for other
 * dependents. Undefined while an answer the rule needs is unknown (the date of
 * birth, the months in the home, the citizenship, or the Form 8332 release for a
 * child who lived with the taxpayer half the year or less): the engine then waits
 * and asks, never assumes. The taxpayer's own SSN must also be valid for
 * employment; a taxpayer with only an ITIN has no fact yet.
 */
export function dependentCredit(
  dependent: DependentFactValue,
  taxYear: number,
): DependentCredit | undefined {
  const age = ageAtYearEnd(dependent.dob, taxYear);
  const livedOverHalfYear = livedWithTaxpayerOverHalfYear(dependent, taxYear);
  if (
    age === undefined ||
    livedOverHalfYear === undefined ||
    dependent.usCitizenOrResident === undefined
  ) {
    return undefined;
  }
  const citizenOrResident = dependent.usCitizenOrResident;
  const hasTin = dependent.ssn !== undefined || dependent.tin !== undefined;
  const childByRelationship = age < 17 && isQualifyingChildRelationship(dependent.relationship);
  if (childByRelationship && !livedOverHalfYear && dependent.form8332Release === undefined) {
    return undefined;
  }
  const qualifyingChild =
    childByRelationship && (livedOverHalfYear || dependent.form8332Release === true);
  if (qualifyingChild && citizenOrResident && dependent.ssn !== undefined) {
    return "child_tax_credit";
  }
  return citizenOrResident && hasTin ? "other_dependents" : "none";
}
