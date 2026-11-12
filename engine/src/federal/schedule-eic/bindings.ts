/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import {
  ageAtYearEnd,
  livedWithTaxpayerOverHalfYear,
  type DependentFactValue,
} from "../../facts/index.js";
import { SSN, ssn } from "../../values.js";
import type { ScheduleEICFilingInfo } from "./filingInfo.js";
import { birthYear, isYoungerThan, scheduleEicChildren } from "./qualifyingChild.js";
import type { ScheduleEIC } from "./types.js";

// Lines 4a and 6 ask about "the end of 2025" and "during 2025".
const TAX_YEAR = 2025;
// Line 3: "If born after 2006 and the child is younger than you …, skip lines 4a and 4b".
const SKIP_LINE_4_BORN_AFTER = 2006;
// Line 4a: "under age 24 at the end of 2025, a student".
const STUDENT_AGE_LIMIT = 24;
// Line 6: "more than half of 2025 but less than 7 months, enter “7.”"
const MONTHS_OVER_HALF_YEAR = 7;
// Line 6: a child born in 2025 enters "12"; "Do not enter more than 12 months."
const MONTHS_FULL_YEAR = 12;

type Bindings = Partial<{
  [K in keyof ScheduleEIC]: BindingFn<ScheduleEIC, ScheduleEICFilingInfo, K>;
}>;
type ColumnBinding = (form: FormAccessor<ScheduleEIC>, info: ScheduleEICFilingInfo) => unknown;
type ChildRule = (child: DependentFactValue, info: ScheduleEICFilingInfo) => unknown;

/*
 * MANUAL EDIT: line 2 prints the SSN. For the self-only EIC (no listed child has
 * an SSN), page 2: "If Child 1 has an ITIN, an ATIN, … enter it on line 2.
 * Otherwise, leave line 2 blank." "Died" (born and died in 2025) has no fact yet.
 */
function childTin(child: DependentFactValue) {
  const raw = child.ssn ?? child.tin;
  return raw === undefined ? undefined : ssn(raw);
}

/* Younger than the taxpayer, or than the spouse on a joint return. */
function youngerThanFiler(
  child: DependentFactValue,
  info: ScheduleEICFilingInfo,
): boolean | undefined {
  const thanYou = isYoungerThan(child.dob, info.taxpayerDateOfBirth);
  if (info.filingStatus !== "married_filing_jointly" || thanYou === true) return thanYou;
  const thanSpouse = isYoungerThan(child.dob, info.spouseDateOfBirth);
  if (thanSpouse === true) return true;
  return thanYou === undefined || thanSpouse === undefined ? undefined : false;
}

/* MANUAL EDIT: line 3's note; undefined while the dates are missing. */
function skipsLine4(child: DependentFactValue, info: ScheduleEICFilingInfo): boolean | undefined {
  const year = birthYear(child.dob);
  if (year === undefined) return undefined;
  if (Number(year) <= SKIP_LINE_4_BORN_AFTER) return false;
  return youngerThanFiler(child, info);
}

/* MANUAL EDIT: line 4a's answer; undefined when line 4 is skipped or an answer is missing. */
function line4a(child: DependentFactValue, info: ScheduleEICFilingInfo): boolean | undefined {
  if (skipsLine4(child, info) !== false) return undefined;
  const younger = youngerThanFiler(child, info);
  const age = ageAtYearEnd(child.dob, TAX_YEAR);
  const tooOld = age !== undefined && age >= STUDENT_AGE_LIMIT;
  // Any one failed condition answers No, even while another answer is missing.
  if (younger === false || tooOld || child.fullTimeStudent === false) return false;
  if (younger === undefined || age === undefined || child.fullTimeStudent === undefined) {
    return undefined;
  }
  return true;
}

/* MANUAL EDIT: line 4b, asked only after a No on line 4a ("Yes. Go to line 5"). */
function line4b(child: DependentFactValue, info: ScheduleEICFilingInfo): boolean | undefined {
  return line4a(child, info) === false ? child.permanentlyDisabled : undefined;
}

/*
 * MANUAL EDIT: line 6. The fact's months are the months with the taxpayer, and
 * livedInUs says the child lived with the taxpayer in the United States; the
 * engine reads the months as U.S. months when livedInUs is true (no fact holds
 * months abroad). The resolver lists only a child who passed the half-year test.
 */
function line6(child: DependentFactValue): number | undefined {
  const months = child.monthsLivedWithYou;
  if (months === undefined || child.livedInUs !== true) return undefined;
  if (livedWithTaxpayerOverHalfYear(child, TAX_YEAR) !== true) return undefined;
  if (birthYear(child.dob) === String(TAX_YEAR)) return MONTHS_FULL_YEAR;
  return Math.min(Math.max(months, MONTHS_OVER_HALF_YEAR), MONTHS_FULL_YEAR);
}

/* The No box of a Yes/No pair: checked when the answer is no, blank when skipped. */
function noBox(answer: boolean | undefined): boolean | undefined {
  return answer === undefined ? undefined : !answer;
}

/*
 * MANUAL EDIT: columns Child 1 to 3, one per child scheduleEicChildren lists
 * (the children with SSNs, or Child 1 alone for the self-only EIC). A column
 * with no child stays blank.
 */
function childColumnBindings(): Bindings {
  const bindings: Record<string, ColumnBinding> = {};
  for (const column of [1, 2, 3]) {
    const of =
      (rule: ChildRule): ColumnBinding =>
      (_, info) => {
        const child = scheduleEicChildren(info.eicQualifyingChildren ?? [])[column - 1]?.dependent;
        return child === undefined ? undefined : rule(child, info);
      };
    const suffix = `child_${column}`;
    bindings[`0.line.1_name_${suffix}`] = of((child) => `${child.firstName} ${child.lastName}`);
    bindings[`0.line.2_ssn_${suffix}`] = of(childTin);
    for (const digit of [1, 2, 3, 4]) {
      bindings[`0.line.3_birth_year_digit_${digit}_${suffix}`] = of(
        (child) => birthYear(child.dob)?.[digit - 1],
      );
    }
    bindings[`0.line.4a_student_under_24_yes_${suffix}`] = of(line4a);
    bindings[`0.line.4a_student_under_24_no_${suffix}`] = of((child, info) =>
      noBox(line4a(child, info)),
    );
    bindings[`0.line.4b_permanently_disabled_yes_${suffix}`] = of(line4b);
    bindings[`0.line.4b_permanently_disabled_no_${suffix}`] = of((child, info) =>
      noBox(line4b(child, info)),
    );
    bindings[`0.line.5_relationship_${suffix}`] = of((child) => child.relationship);
    bindings[`0.line.6_months_lived_in_us_${suffix}`] = of(line6);
  }
  return bindings as Bindings;
}

/* MANUAL EDIT: "Name(s) shown on return"; a joint return names both spouses, as the 1040 does. */
function namesShownOnReturn(info: ScheduleEICFilingInfo): string | undefined {
  if (!info.taxpayerFirstName || !info.taxpayerLastName) return undefined;
  const taxpayer = `${info.taxpayerFirstName} ${info.taxpayerLastName}`;
  if (info.filingStatus !== "married_filing_jointly") return taxpayer;
  if (!info.spouseFirstName || !info.spouseLastName) return undefined;
  return `${taxpayer} & ${info.spouseFirstName} ${info.spouseLastName}`;
}

const formatSsn = (value: string) => SSN.format(value as Parameters<typeof SSN.format>[0]);

export function register(): void {
  defineForm<ScheduleEIC, ScheduleEICFilingInfo>("schedule-eic", {
    bindings: {
      "0.header.name": (_, info) => namesShownOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      ...childColumnBindings(),
    },

    // These SSN widgets (text, maxLength 11) keep the dashes.
    formatters: {
      "0.header.ssn": formatSsn,
      "0.line.2_ssn_child_1": formatSsn,
      "0.line.2_ssn_child_2": formatSsn,
      "0.line.2_ssn_child_3": formatSsn,
    },
  });
}
