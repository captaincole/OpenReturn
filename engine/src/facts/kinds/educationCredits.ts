/*
 * Form 8863 inputs, the education credits. Three kinds of fact, all in category
 * "education":
 *
 * - a Form 1098-T, Tuition Statement: one document per student per institution.
 *   Part III line 22 takes the institution's name, address and EIN from it, and
 *   it answers line 22(2) "Did the student receive Form 1098-T from this
 *   institution for 2025?" (irs-8863-inst-2025::sec::line-22::b01). Its box
 *   amounts are what the institution reports, not what was paid: "use only the
 *   amounts you actually paid" (irs-8863-inst-2025::sec::qualified-education-expenses::b02).
 * - an education credit student: one person the filer claims a credit for, with
 *   the answers of Part III and the Adjusted Qualified Education Expenses
 *   Worksheet for each academic period (irs-8863-inst-2025::sec::adjusted-qualified-education-expenses::b01).
 * - the refundable-credit answers: Part I line 7, asked only of a filer under
 *   24 at the end of 2025 who does not file a joint return
 *   (irs-8863-inst-2025::sec::line-7::b02, b03).
 */

import type { W2Address } from "./wages.js";

type FactRow = { key: string; value: unknown; category: string };

export interface Form1098TFactValue {
  /* FILER'S name and address: the institution. */
  filerName: string;
  filerAddress: W2Address;
  /* FILER'S employer identification number (EIN), as printed (00-0000000). */
  filerEin: string;
  studentName: string;
  /* STUDENT'S TIN, as printed. */
  studentTin?: string;
  /* Box 1: payments received for qualified tuition and related expenses. */
  box1?: number;
  /* Box 4: adjustments made for a prior year. */
  box4?: number;
  /* Box 5: scholarships or grants. */
  box5?: number;
  /* Box 6: adjustments to scholarships or grants for a prior year. */
  box6?: number;
  /* Box 7: box 1 includes amounts for an academic period beginning January–March 2026. */
  box7?: boolean;
  /* Box 8: at least half-time student. */
  box8?: boolean;
  /* Box 9: graduate student. */
  box9?: boolean;
  /* Box 10: reimbursements or refunds from an insurance contract. */
  box10?: number;
}

/* One column of Part III line 22: an institution the student attended. */
export interface EducationInstitution {
  /*
   * The Form 1098-T fact for this student from this institution, when there is
   * one: line 22 takes the name, address and EIN from it, and (2) is Yes.
   */
  form1098TKey?: string;
  /* Without a Form 1098-T: the institution as the student states it. */
  name?: string;
  address?: string;
  /* Needed on (4) for the American opportunity credit, or when (2) or (3) is Yes. */
  ein?: string;
  /* Line 22(2) without a Form 1098-T fact: the student received one for 2025. */
  received2025Form1098T?: boolean;
  /* Line 22(3): the student received a Form 1098-T for 2024 with box 7 checked. */
  received2024Form1098TBox7: boolean;
}

/*
 * One academic period on the Adjusted Qualified Education Expenses Worksheet:
 * a period beginning in 2025, or in January–March 2026 when paid in 2025
 * (irs-8863-inst-2025::sec::adjusted-qualified-education-expenses::b01, b02).
 */
export interface EducationAcademicPeriod {
  /* The period, in the filer's words ("Fall 2025"). */
  description: string;
  /*
   * Worksheet line 1, both credits: tuition and fees required for enrollment,
   * paid in 2025, books and supplies the institution requires be paid to it
   * included (irs-8863-inst-2025::sec::qualified-education-expenses::b01).
   */
  tuitionAndFeesPaid: number;
  /*
   * Worksheet line 1, the American opportunity credit only: books, supplies and
   * equipment needed for the course of study, bought elsewhere. Absent: none.
   */
  courseMaterialsPaid?: number;
  /* Worksheet line 2a: tax-free educational assistance received in 2025 for this period (0 when none). */
  taxFreeAssistance: number;
  /* Worksheet line 2b: received in 2026, before the return is filed. Absent: none. */
  taxFreeAssistanceAfter2025?: number;
  /* Worksheet line 2c: refunds of these expenses received in 2025, or in 2026 before filing. Absent: none. */
  refunds?: number;
}

export interface EducationCreditStudentFactValue {
  /* Line 20: the student's name as shown on page 1 of the return. */
  studentName: string;
  /* Line 21: the student's SSN (or other TIN) as shown on page 1. */
  studentSsn: string;
  /* Line 22: each institution the student attended; a third one goes on another page 2. */
  institutions: EducationInstitution[];
  /* Line 23: the American opportunity credit was claimed for this student for any 4 tax years before 2025. */
  aocClaimedFourPriorYears: boolean;
  /*
   * Line 24: enrolled at least half-time for at least one academic period that
   * began (or is treated as having begun) in 2025, in a program leading to a
   * postsecondary degree, certificate or credential.
   */
  enrolledHalfTimeInProgram: boolean;
  /* Line 25: completed the first 4 years of postsecondary education before 2025. */
  completedFirstFourYears: boolean;
  /* Line 26: convicted, before the end of 2025, of a felony for possessing or distributing a controlled substance. */
  felonyDrugConviction: boolean;
  academicPeriods: EducationAcademicPeriod[];
}

/*
 * Part I line 7: the filer's answers to the questions of
 * irs-8863-inst-2025::sec::line-7::b02, b03. Each is asked only when the path
 * through the questions reaches it.
 */
export interface EducationRefundAnswersFactValue {
  /* Question 3, over age 18: a full-time student during any part of 5 calendar months of 2025. */
  fullTimeStudent?: boolean;
  /* Question 5: earned income was less than one-half of the filer's support. */
  earnedIncomeLessThanHalfOfSupport?: boolean;
  /* Question 6: at least one parent was alive at the end of 2025. */
  parentAlive?: boolean;
}

const EDUCATION_CATEGORY = "education";
const FORM_1098T_START = "payer.";
const FORM_1098T_MIDDLE = "1098t";
const STUDENT_KEY_START = "education.credit_student.";

export const EDUCATION_CREDIT_KEYS = {
  refundAnswers: "education.aoc_refundable_answers",
} as const;

/*
 * One Form 1098-T: the institution, then the student. The student slug is the
 * slug of that student's education credit fact, so a Form 1098-T that no
 * student fact names tells the form which student's answers to ask for.
 */
export function makeForm1098TFactKey(institutionSlug: string, studentSlug: string): string {
  return `${FORM_1098T_START}${institutionSlug}.${FORM_1098T_MIDDLE}.${studentSlug}`;
}

export function isForm1098TFactKey(key: string): boolean {
  const parts = key.split(".");
  return (
    parts.length === 4 &&
    `${parts[0]}.` === FORM_1098T_START &&
    parts[1] !== "" &&
    parts[2] === FORM_1098T_MIDDLE &&
    parts[3] !== ""
  );
}

/* The student part of a Form 1098-T key: the slug of that student's education credit fact. */
export function form1098TStudentSlug(key: string): string | undefined {
  return isForm1098TFactKey(key) ? key.split(".")[3] : undefined;
}

/* Every Form 1098-T fact's key, in the order recorded. */
export function getForm1098TFactKeys(facts: ReadonlyArray<FactRow>): string[] {
  return facts
    .filter((row) => row.category === EDUCATION_CATEGORY && isForm1098TFactKey(row.key))
    .map((row) => row.key);
}

export function makeEducationCreditStudentFactKey(studentSlug: string): string {
  return `${STUDENT_KEY_START}${studentSlug}`;
}

export function isEducationCreditStudentFactKey(key: string): boolean {
  return key.startsWith(STUDENT_KEY_START) && key.split(".").length === 3;
}

export interface EducationCreditStudentFact {
  key: string;
  value: EducationCreditStudentFactValue;
}

/* Every student, in the order recorded: the order of the Parts III. */
export function getEducationCreditStudentFacts(
  facts: ReadonlyArray<FactRow>,
): EducationCreditStudentFact[] {
  return facts
    .filter((row) => row.category === EDUCATION_CATEGORY)
    .filter((row) => isEducationCreditStudentFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as EducationCreditStudentFactValue }));
}

/* The Form 1098-T fact under a key, or undefined when there is none. */
export function readForm1098TFact(
  factByKey: ReadonlyMap<string, unknown>,
  key: string | undefined,
): Form1098TFactValue | undefined {
  if (key === undefined || !isForm1098TFactKey(key)) return undefined;
  const value = factByKey.get(key);
  return typeof value === "object" && value !== null ? (value as Form1098TFactValue) : undefined;
}
