/*
 * Form 8862's rules as pure functions. The form has no arithmetic: it states
 * the facts that the credits already test, in day counts, dates and Yes/No
 * answers. Each rule names its block in irs-8862-inst-2025 or the form face
 * (irs-8862-face-2025).
 */

import { ageAtYearEnd, type DependentFactValue } from "../../facts/index.js";
import type { StudentPartIII } from "../8863/filingInfo.js";

/* Line 1: "Enter the year for which you are filing this form ... Do not enter the year the credit(s) was disallowed" (line-1::b01). */
export const TAX_YEAR = 2025;

/*
 * Lines 7 and 9, the cautions on the form face: "If you enter less than 183
 * (184 if the year on line 1 is a leap year) ... you cannot claim the EIC."
 * 2025 is not a leap year.
 */
export const HALF_YEAR_DAYS = 183;

/* Line 7: a child born or who died during the year: "enter '365' ('366' if the year is a leap year)" (line-7::b02). */
export const DAYS_IN_YEAR = 365;

/* The month count of a full year: a child in the home 12 months lived there every day of it. */
const MONTHS_IN_YEAR = 12;

/* Line 5: Child 1 to Child 3 "as listed on Schedule EIC". */
export const EIC_CHILD_COLUMNS = 3;
/* Line 12: four children; "more than four ... attach a statement". */
export const CTC_CHILD_COLUMNS = 4;
/* Line 13: four other dependents; "more than four ... attach a statement". */
export const OTHER_DEPENDENT_COLUMNS = 4;
/* Part IV: three students; "more than three students, attach a statement". */
export const STUDENT_COLUMNS = 3;

/* Line 8 prints a date as month (MM) and day (DD). */
export interface MonthDay {
  month: string;
  day: string;
}

/* The month, day and year of an MM/DD/YYYY date; undefined when unreadable. */
function dateParts(
  date: string | undefined,
): { month: number; day: number; year: number } | undefined {
  const parts = date?.trim().split("/").map(Number);
  if (parts?.length !== 3 || parts.some((part) => !Number.isInteger(part))) return undefined;
  const [month, day, year] = parts as [number, number, number];
  return { month, day, year };
}

const twoDigits = (value: number): string => String(value).padStart(2, "0");

/*
 * Line 8: "If the child was born or died during the year entered on line 1,
 * enter the month and day ... Otherwise, skip this line." Undefined for a date
 * in another year, or no date.
 */
export function monthDayIn(date: string | undefined, taxYear: number): MonthDay | undefined {
  const parts = dateParts(date);
  if (parts?.year !== taxYear) return undefined;
  return { month: twoDigits(parts.month), day: twoDigits(parts.day) };
}

const bornOrDiedIn = (child: DependentFactValue, taxYear: number): boolean =>
  monthDayIn(child.dob, taxYear) !== undefined ||
  monthDayIn(child.dateOfDeath, taxYear) !== undefined;

/*
 * Line 7: the days the child lived with the taxpayer in the United States.
 * A child born or who died during the year, whose home was the taxpayer's
 * for more than half the time alive, is "365" (line-7::b02); the caller lists
 * only a child who passed that test. A child in the home in the United States
 * all 12 months lived there every day, temporary absences counted
 * (line-7::b02). Else the stated days; undefined while they are missing.
 */
export function line7Days(child: DependentFactValue, taxYear: number): number | undefined {
  if (bornOrDiedIn(child, taxYear)) return DAYS_IN_YEAR;
  if (child.monthsLivedWithYou === MONTHS_IN_YEAR && child.livedInUs === true) return DAYS_IN_YEAR;
  return child.daysLivedWithYouInUs;
}

/* The cautions of lines 7 and 9: fewer than 183 days stops the EIC. */
export function enoughDaysInUs(days: number): boolean {
  return days >= HALF_YEAR_DAYS;
}

/*
 * Line 10: "Enter your age at the end of the year on line 1": the year less
 * the birth year. Undefined without a readable date of birth.
 */
export function line10Age(dob: string | undefined, taxYear: number): number | undefined {
  return ageAtYearEnd(dob, taxYear);
}

/*
 * Line 14: lived with the taxpayer more than half the year, or "meet one of
 * these exceptions": the children of divorced or separated parents, here the
 * Form 8332 release (line-14::b01). A kidnapped child has no fact.
 */
export function line14LivedWithYou(
  livedWithYouOverHalfYear: boolean | undefined,
  child: DependentFactValue,
): boolean | undefined {
  if (livedWithYouOverHalfYear === true || child.form8332Release === true) return true;
  return livedWithYouOverHalfYear;
}

/*
 * Line 19a: an eligible student for the AOTC (line-19a::b01): no AOTC in 4
 * earlier years (1), the first 4 years not completed (2), at least half-time
 * in a degree program (3), and no felony drug conviction (4). Form 8863
 * lines 23–26 hold the same answers along its path; a "Stop!" leaves the
 * later ones unanswered, which fails the test.
 */
export function line19aEligible(student: StudentPartIII): boolean {
  return (
    !student.line23 &&
    student.line24 === true &&
    student.line25 === false &&
    student.line26 === false
  );
}

/* Line 19b: the AOTC or Hope credit was claimed for any 4 earlier years (line-19b::b01; Form 8863 line 23). */
export function line19bClaimedFourYears(student: StudentPartIII): boolean {
  return student.line23;
}
