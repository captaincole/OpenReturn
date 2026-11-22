/*
 * MANUAL EDIT: Part III, page 2 (irs-8863-inst-2025::sec::part-iii-student-and-educational::b01
 * through use-the-adjusted-qualified-education-expenses-2::b01). Each copy of
 * the form prints one page 2: a student, from one institution on (federal/index.ts
 * appends page 2 only for the later copies). A continuation page for a third
 * institution is "completed only through line 22" (line-22::b01).
 */

import type { BindingFn } from "../../defineForm.js";
import { namesOnReturn } from "../returnNames.js";
import type {
  Form8863FilingInfo,
  InstitutionColumn,
  PartIIIPage,
  StudentPartIII,
} from "./filingInfo.js";
import type { AmericanOpportunityLines } from "./lines.js";
import type { Form8863 } from "./types.js";

type Fn = BindingFn<Form8863, Form8863FilingInfo, keyof Form8863>;
type Bindings = Partial<{ [K in keyof Form8863]: BindingFn<Form8863, Form8863FilingInfo, K> }>;
type Value = string | number | boolean | undefined;

const EIN_DIGITS = 9;
const COLUMNS = [
  { letter: "a", order: "first" },
  { letter: "b", order: "second" },
] as const;

/* The page this copy prints and its student; undefined when the form has no student. */
function pageOf(
  info: Form8863FilingInfo,
): { page: PartIIIPage; student: StudentPartIII } | undefined {
  const figured = info.form8863;
  const page = figured?.pages[info.form8863CopyIndex ?? 0];
  const student = page === undefined ? undefined : figured?.students[page.student];
  return page === undefined || student === undefined ? undefined : { page, student };
}

const studentLine =
  (pick: (student: StudentPartIII) => Value): Fn =>
  (_, info) => {
    const found = pageOf(info);
    return found === undefined ? undefined : pick(found.student);
  };

/* Lines 23–31: not on a continuation page. */
const answerLine =
  (pick: (student: StudentPartIII) => Value): Fn =>
  (_, info) => {
    const found = pageOf(info);
    return found === undefined || found.page.continuation ? undefined : pick(found.student);
  };

const columnLine =
  (index: number, pick: (column: InstitutionColumn) => Value): Fn =>
  (_, info) => {
    const found = pageOf(info);
    const column = found?.student.institutions[found.page.firstInstitution + index];
    return column === undefined ? undefined : pick(column);
  };

/* A Yes/No pair: the box that matches the answer is checked; an unanswered question leaves both blank. */
const checked = (answer: boolean | undefined, box: boolean) => (answer === box ? true : undefined);

function headerBindings(): Record<string, Fn> {
  const ssn =
    (start: number, end: number): Fn =>
    (_, info) =>
      info.taxpayerSSN?.slice(start, end);
  const studentSsn = (start: number, end: number) =>
    studentLine((student) => student.ssn?.slice(start, end));
  return {
    "1.header.taxpayer_name": (_, info) => namesOnReturn(info),
    "1.header.ssn_part1": ssn(0, 3),
    "1.header.ssn_part2": ssn(3, 5),
    "1.header.ssn_part3": ssn(5, 9),
    // line-21::b01: the student's name and SSN as shown on page 1 of the return.
    "1.line.20_student_name": studentLine((student) => student.name),
    "1.line.21_student_ssn_part1": studentSsn(0, 3),
    "1.line.21_student_ssn_part2": studentSsn(3, 5),
    "1.line.21_student_ssn_part3": studentSsn(5, 9),
  };
}

/* Line 22, columns (a) and (b): name, address, the two Form 1098-T questions and the EIN digits. */
function institutionBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  COLUMNS.forEach(({ letter, order }, index) => {
    const line = `1.line.22${letter}`;
    out[`${line}_${order}_institution_name`] = columnLine(index, (column) => column.name);
    out[`${line}_1_${order}_institution_address`] = columnLine(index, (column) => column.address);
    for (const box of [true, false]) {
      const word = box ? "yes" : "no";
      out[`${line}_2_received_1098t_2025_${word}`] = columnLine(index, (column) =>
        checked(column.received2025, box),
      );
      out[`${line}_3_received_1098t_2024_box7_${word}`] = columnLine(index, (column) =>
        checked(column.received2024Box7, box),
      );
    }
    for (let digit = 0; digit < EIN_DIGITS; digit++) {
      out[`${line}_4_${order}_institution_ein_digit${digit + 1}`] = columnLine(
        index,
        (column) => column.ein?.[digit],
      );
    }
  });
  return out;
}

/* Lines 23–26 (line-23::b01 through line-26::b01). */
function questionBindings(): Record<string, Fn> {
  const pair = (line: string, pick: (student: StudentPartIII) => boolean | undefined) => ({
    [`${line}_yes`]: answerLine((student) => checked(pick(student), true)),
    [`${line}_no`]: answerLine((student) => checked(pick(student), false)),
  });
  return {
    ...pair("1.line.23_aoc_claimed_4_prior_years", (student) => student.line23),
    ...pair("1.line.24_enrolled_at_least_half_time", (student) => student.line24),
    ...pair("1.line.25_completed_first_4_years", (student) => student.line25),
    ...pair("1.line.26_felony_drug_conviction", (student) => student.line26),
  };
}

const americanOpportunity = (pick: (lines: AmericanOpportunityLines) => number) =>
  answerLine((student) =>
    student.americanOpportunity === undefined ? undefined : pick(student.americanOpportunity),
  );

/* Lines 27–31: one credit per student ("If you complete lines 27 through 30 ... don't complete line 31"). */
const amountBindings: Record<string, Fn> = {
  "1.line.27_aoc_adjusted_qualified_expenses": americanOpportunity((lines) => lines.line27),
  "1.line.28_subtract_2000_from_line27": americanOpportunity((lines) => lines.line28),
  "1.line.29_multiply_line28_by_25_percent": americanOpportunity((lines) => lines.line29),
  "1.line.30_aoc_tentative_credit_student": americanOpportunity((lines) => lines.line30),
  "1.line.31_llc_adjusted_qualified_expenses": answerLine((student) => student.line31),
};

export const partIIIBindings = {
  ...headerBindings(),
  ...institutionBindings(),
  ...questionBindings(),
  ...amountBindings,
} as Bindings;
