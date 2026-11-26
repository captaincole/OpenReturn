/*
 * Schedule 1 line 21, the student loan interest deduction: the Form 1098-E facts
 * (facts/kinds/studentLoanInterest.ts) and the Student Loan Interest Deduction
 * Worksheet (irs-1040-inst-2025::sec::line-24e::b01 and ::b02).
 */

import type { FormAccessor } from "../../defineForm.js";
import { STUDENT_LOAN_KEYS, studentLoanInterestForms } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { filingStatusOf, missingInputs, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import { files2555 } from "../2555/results.js";
import { files4563, form4563Line15Total } from "../4563/results.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";
import type { Schedule1 } from "./types.js";

/* Worksheet line 1: "Don't enter more than $2,500". */
const INTEREST_LIMIT = 2500;
/* Worksheet line 5: $170,000 married filing jointly; $85,000 single, HOH or QSS. */
const PHASEOUT_START_JOINT = 170000;
const PHASEOUT_START_OTHER = 85000;
/* Worksheet line 7: divide by $30,000 married filing jointly, else $15,000. */
const PHASEOUT_RANGE_JOINT = 30000;
const PHASEOUT_RANGE_OTHER = 15000;

/*
 * The line 21 instructions send a filer of Form 2555 to Pub. 970, whose MAGI
 * adds back the exclusions (irs-pub-970-2025::sec::magi-for-the-lifetime::b01
 * is the same add-back for the education credits); the worksheet here has no
 * line for them.
 */
const PUB_970_WITH_FORM_2555 =
  "Student loan interest with Form 2555: the deduction's modified AGI adds back the exclusions (Pub. 970), and the 1040 worksheet has no line for them.";

export const BOX_2_CHECKED =
  "A Form 1098-E has box 2 checked: box 1 leaves out loan origination fees or capitalized interest on loans made before September 1, 2004, which Pub. 970 figures; the engine does not.";

export interface StudentLoanWorksheetInput {
  /* Interest paid on qualified student loans in 2025 (1098-E box 1 summed), cents kept. */
  interestPaid: number;
  /* Worksheet line 2: Form 1040 line 9. */
  totalIncome: number;
  /* Worksheet line 3: Schedule 1 lines 11 through 20, 23 and 25. */
  otherAdjustments: number;
  /* Pub. 970 Worksheet 4-1 line 8: "income from American Samoa you are excluding (Form 4563, line 15)". */
  americanSamoaExcluded?: number;
  jointReturn: boolean;
}

/*
 * Worksheet lines 1–9. Line 7 is the ratio itself: the instructions round it "to
 * at least three places", and the full ratio is more places than three. With
 * Form 4563, Pub. 970 Worksheet 4-1 (irs-pub-970-2025::sec::student-loan-interest-deduction-worksheet::b01,
 * b02) is the same worksheet with the exclusion added to line 4 (its line 9).
 */
export function studentLoanInterestDeduction(input: StudentLoanWorksheetInput): number {
  const line1 = Math.min(input.interestPaid, INTEREST_LIMIT);
  const line4 = input.totalIncome - input.otherAdjustments + (input.americanSamoaExcluded ?? 0);
  const line5 = input.jointReturn ? PHASEOUT_START_JOINT : PHASEOUT_START_OTHER;
  if (line4 <= line5) return line1;
  const range = input.jointReturn ? PHASEOUT_RANGE_JOINT : PHASEOUT_RANGE_OTHER;
  const line7 = Math.min(1, (line4 - line5) / range);
  return line1 - line1 * line7;
}

/*
 * The line 21 filing info, and the answer the line waits for. The deduction needs
 * a status other than married filing separately, and neither filer claimed as a
 * dependent on another person's return (irs-1040-inst-2025::sec::line-21::b01).
 */
export function resolveStudentLoanInterest(inputs: ResolverInputs) {
  const forms = studentLoanInterestForms(inputs.facts);
  if (forms.length === 0) return { info: {}, missing: [] };
  const claimedAsDependent = inputs.factByKey.get(STUDENT_LOAN_KEYS.claimedAsDependent) as
    boolean | undefined;
  const separate = filingStatusOf(inputs) === "married_filing_separately";
  return {
    info: {
      studentLoanInterestPaid: sum(...forms.map((form) => form.box1)),
      studentLoanBox2Checked: forms.some((form) => form.box2 === true),
      studentLoanClaimedAsDependent: claimedAsDependent,
    },
    missing: separate
      ? []
      : missingInputs({ [STUDENT_LOAN_KEYS.claimedAsDependent]: claimedAsDependent }),
  };
}

/* Line 21: the worksheet's line 9. Blank with no Form 1098-E, on a separate return, or for a dependent. */
export function line21(form: FormAccessor<Schedule1>, info: Schedule1FilingInfo) {
  if (info.studentLoanInterestPaid === undefined) return undefined;
  if (info.filingStatus === "married_filing_separately") return undefined;
  if (info.studentLoanClaimedAsDependent !== false) return undefined;
  if (info.studentLoanBox2Checked) return unsupported(BOX_2_CHECKED);
  if (files2555(info)) return unsupported(PUB_970_WITH_FORM_2555);
  const totalIncome = form["form-1040.line.9"];
  if (typeof totalIncome !== "number") return undefined;
  /*
   * DECISION (2026-11-26, by the author): with Form 4563, line 21 is the whole
   * Pub. 970 worksheet amount, not a share of it. Text A, the Form 4563
   * instructions: "Deductions and credits that are not definitely related to a
   * particular type of income must be allocated between your excluded income
   * and your other income" (irs-4563-form-2025::sec::filing-form-1040-or-1040-sr::b01).
   * Text B, Pub. 970 Worksheet 4-1, which the line 21 instructions name for a
   * Form 4563 filer: line 8 adds "income from American Samoa you are excluding
   * (Form 4563, line 15)" to modified AGI, and line 14 is the deduction to
   * "Enter ... on Schedule 1 (Form 1040), line 21", with no sharing
   * (irs-pub-970-2025::sec::student-loan-interest-deduction-worksheet::b01,
   * b02, b03). The engine follows Text B: a form's own instructions decide how
   * that form is filled, and Pub. 570's list of shared deductions does not name it.
   */
  const americanSamoaExcluded = form4563Line15Total(info);
  if (files4563(info) && americanSamoaExcluded === undefined) return undefined;
  const otherAdjustments = sum(
    form["1.line.11"],
    form["1.line.12"],
    form["1.line.13"],
    form["1.line.14"],
    form["1.line.15"],
    form["1.line.16"],
    form["1.line.17"],
    form["1.line.18"],
    form["1.line.19a"],
    form["1.line.20"],
    form["1.line.23"],
    form["1.line.25"],
  );
  return roundDollars(
    studentLoanInterestDeduction({
      interestPaid: info.studentLoanInterestPaid,
      totalIncome,
      otherAdjustments,
      americanSamoaExcluded,
      jointReturn: info.filingStatus === "married_filing_jointly",
    }),
  );
}
