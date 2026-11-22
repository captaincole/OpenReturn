/*
 * Part III for each student, from the student facts and their Forms 1098-T
 * (irs-8863-inst-2025::sec::part-iii-student-and-educational::b01 through
 * use-the-adjusted-qualified-education-expenses-2::b01).
 */

import {
  readForm1098TFact,
  type EducationCreditStudentFact,
  type EducationInstitution,
  type W2Address,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { ssnOf } from "../../values.js";
import type { InstitutionColumn, PartIIIPage, StudentPartIII } from "./filingInfo.js";
import { adjustedExpenses, americanOpportunityLines, type StudentCredit } from "./lines.js";

/* Line 22 has two columns; a third institution goes on another page 2 "completed only through line 22" (line-22::b01). */
export const INSTITUTIONS_PER_PAGE = 2;

/* The 9 digits of an EIN as printed, or undefined when it is not 9 digits. */
function einDigits(raw: string | undefined): string | undefined {
  const digits = [...(raw ?? "")].filter((char) => char >= "0" && char <= "9").join("");
  return digits.length === 9 ? digits : undefined;
}

const addressText = (address: W2Address): string =>
  [address.line1, address.line2, `${address.city}, ${address.state} ${address.zip}`]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");

/*
 * One column of line 22. A Form 1098-T fact gives the name, the address, the
 * EIN and a "Yes" on (2). Line 22(4) asks for the EIN "if you're claiming the
 * American opportunity credit or if you checked 'Yes' in (2) or (3)".
 */
function institutionColumn(
  institution: EducationInstitution,
  factByKey: ReadonlyMap<string, unknown>,
  credit: StudentCredit,
): { column: InstitutionColumn; waits: boolean } {
  const form = readForm1098TFact(factByKey, institution.form1098TKey);
  const received2025 = form !== undefined ? true : institution.received2025Form1098T;
  const einAsked =
    credit === "american_opportunity" ||
    received2025 === true ||
    institution.received2024Form1098TBox7;
  const ein = einAsked ? einDigits(form?.filerEin ?? institution.ein) : undefined;
  const column: InstitutionColumn = {
    name: form?.filerName ?? institution.name,
    address: form !== undefined ? addressText(form.filerAddress) : institution.address,
    received2025,
    received2024Box7: institution.received2024Form1098TBox7,
    ein,
  };
  return { column, waits: received2025 === undefined || (einAsked && ein === undefined) };
}

/*
 * Lines 23–26 along the form's path: each "Stop!" sends the student to line 31
 * and leaves the later questions unanswered. "No" on 23, "Yes" on 24, "No" on
 * 25 and "No" on 26 complete lines 27–30 (line-23::b01 through line-26::b02).
 */
function questions(fact: EducationCreditStudentFact["value"]) {
  const line23 = fact.aocClaimedFourPriorYears;
  const line24 = line23 ? undefined : fact.enrolledHalfTimeInProgram;
  const line25 = line24 === true ? fact.completedFirstFourYears : undefined;
  const line26 = line25 === false ? fact.felonyDrugConviction : undefined;
  const credit: StudentCredit = line26 === false ? "american_opportunity" : "lifetime_learning";
  return { line23, line24, line25, line26, credit };
}

export function studentPartIII(
  fact: EducationCreditStudentFact,
  factByKey: ReadonlyMap<string, unknown>,
): StudentPartIII {
  const answers = questions(fact.value);
  const columns = fact.value.institutions.map((institution) =>
    institutionColumn(institution, factByKey, answers.credit),
  );
  const adjusted = adjustedExpenses(fact.value.academicPeriods, answers.credit);
  const american = answers.credit === "american_opportunity";
  return {
    factKey: fact.key,
    name: fact.value.studentName,
    ssn: ssnOf(fact.value.studentSsn),
    institutions: columns.map((each) => each.column),
    ...answers,
    americanOpportunity: american ? americanOpportunityLines(adjusted) : undefined,
    line31: american ? undefined : adjusted,
    waits: columns.some((each) => each.waits),
  };
}

/* One page 2 per student, and one more for each further pair of institutions. */
export function partIIIPages(students: ReadonlyArray<StudentPartIII>): PartIIIPage[] {
  return students.flatMap((student, index) => {
    const count = Math.max(1, student.institutions.length);
    const pages: PartIIIPage[] = [];
    for (let first = 0; first < count; first += INSTITUTIONS_PER_PAGE) {
      pages.push({ student: index, firstInstitution: first, continuation: first > 0 });
    }
    return pages;
  });
}

/* Line 1 adds every line 30; line 10 every line 31 (part-i-refundable-american::b01, line-10::b01). */
export function partIIITotals(students: ReadonlyArray<StudentPartIII>) {
  return {
    line1: sum(...students.map((student) => student.americanOpportunity?.line30)),
    line10: sum(...students.map((student) => student.line31)),
  };
}
