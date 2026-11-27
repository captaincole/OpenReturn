/*
 * One fact per dependent the taxpayer claims (the 1040 Dependents table, Schedule
 * 8812 lines 4 and 6, CA 540 line 10). Recording the fact means the person is
 * claimed as a dependent: the Who Qualifies steps (1040 instructions) are Cade's
 * conversation, not the engine's. One exception: a child whose custodial parent
 * (this taxpayer) released the claim on Form 8332 (releasedToNoncustodialParent)
 * is recorded too, because the child still counts for head of household, the
 * earned income credit and the dependent care credit; that child is not claimed
 * (getClaimedDependentFacts leaves it out). A second exception: a child who lived
 * with the taxpayer half the year or less with no Form 8332 release is the other
 * parent's qualifying child, so getClaimedDependentFacts leaves that child out too.
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
  /*
   * A child who lived with the taxpayer more than half the year: true when the
   * taxpayer, as the custodial parent, released the claim for 2025 to the other
   * parent (signed Form 8332 Part I or II, or a pre-1985 decree lets the other
   * parent claim the child). "If conditions (1) through (4) apply, only the
   * noncustodial parent can claim the child for purposes of the child tax
   * credit and credit for other dependents" (irs-1040-inst-2025::sec::
   * definitions-and-special-rules::b02), and "The custodial parent ... can
   * claim the child for the earned income credit and these other benefits"
   * (::b03). So the child is not on this return's Dependents table and earns
   * neither credit, but stays a qualifying child for head of household, the
   * earned income credit and the dependent care credit. Absent: no release.
   */
  releasedToNoncustodialParent?: boolean;
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

/* Every dependent fact, in the order recorded: a released child too (the qualifying-child tests read them all). */
export function getDependentFacts(facts: ReadonlyArray<FactRow>): DependentFact[] {
  return facts.map(parseDependentFact).filter((fact): fact is DependentFact => fact !== null);
}

/* A child the taxpayer released to the other parent is not the taxpayer's dependent. */
export function isClaimedDependent(dependent: DependentFactValue): boolean {
  return dependent.releasedToNoncustodialParent !== true;
}

/*
 * The dependents the return claims, in the order recorded: every dependent fact
 * but a child released to the noncustodial parent and a child who is the other
 * parent's qualifying child ("The dependents you claim are those you list by
 * name and SSN in the Dependents section",
 * irs-1040-inst-2025::sec::head-of-household::b03).
 */
export function getClaimedDependentFacts(
  facts: ReadonlyArray<FactRow>,
  taxYear: number,
): DependentFact[] {
  return getDependentFacts(facts).filter(
    (fact) =>
      isClaimedDependent(fact.dependent) && !isOtherParentsQualifyingChild(fact.dependent, taxYear),
  );
}

/*
 * The age test of a qualifying child (1040 instructions, Who Qualifies as Your
 * Dependent, Step 1, irs-1040-inst-2025::sec::who-qualifies-as-your::b02):
 * "Under age 19 at the end of 2025", or "Under age 24 at the end of 2025, a
 * full-time student", or "Any age and permanently and totally disabled".
 * "Younger than you" is not checked: this fact holds no filer's date of birth.
 * Undefined while the student or disability answer the test needs is missing.
 */
export function passesQualifyingChildAgeTest(
  dependent: DependentFactValue,
  taxYear: number,
): boolean | undefined {
  if (dependent.permanentlyDisabled === true) return true;
  const age = ageAtYearEnd(dependent.dob, taxYear);
  if (age === undefined) return undefined;
  if (age < 19) return true;
  if (age < 24 && dependent.fullTimeStudent === true) return true;
  if (age < 24 && dependent.fullTimeStudent === undefined) return undefined;
  return dependent.permanentlyDisabled === undefined ? undefined : false;
}

/*
 * A child by relationship and by the qualifying child age test (not only the
 * child tax credit's under 17) who lived with the taxpayer half the year
 * or less, with no Form 8332 release (form8332Release false), is not this
 * taxpayer's dependent. The child fails the residency test of a qualifying
 * child, and a qualifying relative is a person "Who wasn't a qualifying child
 * (see Step 1) of any taxpayer for 2025"
 * (irs-1040-inst-2025::sec::is-your-qualifying-relative::b01): the child is the
 * qualifying child of the parent the child lived with. Only the release moves
 * the claim: "A child will be treated as the qualifying child or qualifying
 * relative of the child's noncustodial parent (defined later) if all of the
 * following conditions apply" (irs-1040-inst-2025::sec::definitions-and-special-rules::b01),
 * condition 4 being the signed Form 8332 (::b02).
 */
export function isOtherParentsQualifyingChild(
  dependent: DependentFactValue,
  taxYear: number,
): boolean {
  return (
    dependent.form8332Release === false &&
    passesQualifyingChildAgeTest(dependent, taxYear) === true &&
    isQualifyingChildRelationship(dependent.relationship) &&
    livedWithTaxpayerOverHalfYear(dependent, taxYear) === false
  );
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
 * employment; a taxpayer with only an ITIN has no fact yet. A child the
 * taxpayer released to the noncustodial parent earns neither credit here: only
 * the noncustodial parent claims them (irs-1040-inst-2025::sec::definitions-and-special-rules::b02).
 * Nor does a child who lived here half the year or less with no release
 * (isOtherParentsQualifyingChild): that child is no dependent of this taxpayer.
 */
export function dependentCredit(
  dependent: DependentFactValue,
  taxYear: number,
): DependentCredit | undefined {
  if (!isClaimedDependent(dependent) || isOtherParentsQualifyingChild(dependent, taxYear)) {
    return "none";
  }
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
  const otherParentsChildByAge =
    isQualifyingChildRelationship(dependent.relationship) &&
    passesQualifyingChildAgeTest(dependent, taxYear) !== false;
  if (otherParentsChildByAge && !livedOverHalfYear && dependent.form8332Release === undefined) {
    return undefined;
  }
  const qualifyingChild =
    childByRelationship && (livedOverHalfYear || dependent.form8332Release === true);
  if (qualifyingChild && citizenOrResident && dependent.ssn !== undefined) {
    return "child_tax_credit";
  }
  return citizenOrResident && hasTin ? "other_dependents" : "none";
}
