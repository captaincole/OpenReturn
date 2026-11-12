/*
 * The EIC's qualifying child, from irs-1040-inst-2025::sec::step-2-2::b01: the
 * relationship test (the same list as the child tax credit), the age test
 * (under 19 and younger than the taxpayer, or the spouse on a joint return;
 * under 24, a full-time student and younger; or any age and permanently and
 * totally disabled) and the residency
 * test (lived with the taxpayer in the United States more than half the year).
 * The joint return test is Cade's conversation: a dependent fact is a person
 * the taxpayer claims. Undefined while an answer the test needs is missing.
 */

import {
  ageAtYearEnd,
  isQualifyingChildRelationship,
  livedWithTaxpayerOverHalfYear,
  type DependentFactValue,
} from "../../facts/index.js";

/* MM/DD/YYYY as a sortable number (YYYYMMDD); undefined when unreadable. */
function dateKey(date: string | undefined): number | undefined {
  const parts = date?.trim().split("/").map(Number);
  if (parts?.length !== 3 || parts.some((part) => !Number.isFinite(part))) return undefined;
  const [month, day, year] = parts as [number, number, number];
  return year * 10000 + month * 100 + day;
}

/* Born after the other person (younger); undefined when either date is unknown. */
export function isYoungerThan(
  dob: string | undefined,
  otherDob: string | undefined,
): boolean | undefined {
  const born = dateKey(dob);
  const otherBorn = dateKey(otherDob);
  return born === undefined || otherBorn === undefined ? undefined : born > otherBorn;
}

/* The four-digit year of an MM/DD/YYYY date; undefined when unreadable. */
export function birthYear(dob: string | undefined): string | undefined {
  const year = dob?.trim().split("/")[2];
  return dateKey(dob) === undefined || year?.length !== 4 ? undefined : year;
}

/* Younger than any of the filers (the taxpayer, and the spouse on a joint return). */
function youngerThanAFiler(
  dob: string | undefined,
  filerDobs: ReadonlyArray<string | undefined>,
): boolean | undefined {
  const answers = filerDobs.map((filerDob) => isYoungerThan(dob, filerDob));
  if (answers.includes(true)) return true;
  return answers.includes(undefined) ? undefined : false;
}

function passesAgeTest(
  child: DependentFactValue,
  filerDobs: ReadonlyArray<string | undefined>,
  taxYear: number,
): boolean | undefined {
  if (child.permanentlyDisabled === true) return true;
  const age = ageAtYearEnd(child.dob, taxYear);
  if (age === undefined) return undefined;
  const younger = youngerThanAFiler(child.dob, filerDobs);
  if (age < 19) return younger;
  if (age < 24 && child.fullTimeStudent === undefined) return undefined;
  if (age < 24 && child.fullTimeStudent) return younger;
  return child.permanentlyDisabled === undefined ? undefined : false;
}

/* filerDobs: the taxpayer's date of birth, and the spouse's on a joint return. */
export function isEicQualifyingChild(
  child: DependentFactValue,
  filerDobs: ReadonlyArray<string | undefined>,
  taxYear: number,
): boolean | undefined {
  if (!isQualifyingChildRelationship(child.relationship)) return false;
  const overHalfYear = livedWithTaxpayerOverHalfYear(child, taxYear);
  const residency =
    overHalfYear === undefined || child.livedInUs === undefined
      ? undefined
      : overHalfYear && child.livedInUs;
  if (residency === false) return false;
  const age = passesAgeTest(child, filerDobs, taxYear);
  if (age === false) return false;
  return age === undefined || residency === undefined ? undefined : true;
}

// Schedule EIC, line 1: "you have to list only three to get the maximum credit."
const SCHEDULE_EIC_COLUMNS = 3;

/*
 * The children Schedule EIC lists, in the order recorded. Line 2: the child must
 * have an SSN "unless … you are claiming the self-only EIC"; page 2: for the
 * self-only EIC, "Complete line 1 and lines 2 through 6 for Child 1." So the
 * children with SSNs (up to three) when any has one, else one child.
 */
export function scheduleEicChildren<T extends { dependent: DependentFactValue }>(
  children: readonly T[],
): T[] {
  const withSsn = children.filter((child) => child.dependent.ssn !== undefined);
  return withSsn.length > 0 ? withSsn.slice(0, SCHEDULE_EIC_COLUMNS) : children.slice(0, 1);
}
