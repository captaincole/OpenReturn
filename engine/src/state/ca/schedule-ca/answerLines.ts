/*
 * MANUAL EDIT: Schedule CA (540) lines spread into bindings.ts. Column A copies
 * the federal Schedule 1 line (ca-540-sched-ca-inst-2025, "Column A – Federal
 * Amounts"); columns B and C follow the line's instruction, cited per line.
 */

import type { FormSpec } from "../../../defineForm.js";
import { numberOrBlank, roundDollars, sum, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";
import { scheduleEAdjustment } from "../3801/worksheetBindings.js";
import type { DepreciationAdjustment } from "./activities.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

/* A Schedule 1 line copied into column A; blank when the federal line is blank or 0 (an empty total). */
const copy = (federalId: string) => (form: Record<string, unknown>) => {
  const amount = numberOrBlank(form[`schedule-1.${federalId}`]);
  return amount === 0 ? undefined : amount;
};
const copyText = (federalId: string) => (form: Record<string, unknown>) => {
  const value = form[`schedule-1.${federalId}`];
  return typeof value === "string" ? value : undefined;
};

/* Column A copies: Section B lines 2 and 8, Section C lines 16–25. */
const COPIED: Array<[keyof ScheduleCa, string]> = [
  ["0.line.b2a_federal", "0.line.2a"],
  ["1.line.b8b_federal", "0.line.8b"],
  ["1.line.b8h_federal", "0.line.8h"],
  ["1.line.b8i_federal", "0.line.8i"],
  ["1.line.b8k_federal", "0.line.8k"],
  ["2.line.c16_federal", "1.line.16"],
  ["2.line.c19a_federal", "1.line.19a"],
  ["2.line.c20_federal", "1.line.20"],
  ["3.line.c24a_federal", "1.line.24a"],
  ["3.line.c24d_federal", "1.line.24d"],
  ["3.line.c24e_federal", "1.line.24e"],
  ["3.line.c24f_federal", "1.line.24f"],
  ["3.line.c24h_federal", "1.line.24h"],
  ["3.line.c24i_federal", "1.line.24i"],
  ["3.line.c25_federal", "1.line.25"],
];

const LINE_24_SUBTRACTIONS = [
  "3.line.c24b_subtractions",
  "3.line.c24c_subtractions",
  "3.line.c24d_subtractions",
  "3.line.c24f_subtractions",
  "3.line.c24g_subtractions",
  "3.line.c24i_subtractions",
  "3.line.c24j_subtractions",
  "3.line.c24z_subtractions",
] as const;

/* A depreciation adjustment's column, or why it is not figured. */
function depreciationColumn(
  adjustment: DepreciationAdjustment | undefined,
  side: "subtraction" | "addition",
) {
  if (!adjustment || adjustment.waits) return undefined;
  if (adjustment.gap) return unsupported(adjustment.gap);
  return adjustment[side] > 0 ? adjustment[side] : undefined;
}

/*
 * Line 5 column B or C. With FTB 3801 filed, its Schedule E worksheet total
 * 2(e): positive in column C, negative in column B as a positive amount
 * (ca-3801-inst-2025::sec::individuals::b01; "Use form FTB 3801 to figure the
 * total adjustment for line 5", ca-540-sched-ca-inst-2025::sec::line-5-rental-real-estate-royalties-partnerships-s-corporations-trusts-etc::b01).
 * Otherwise FTB 3885A line 8a/14a in column B, 8b/14b in column C
 * (ca-3885a-inst-2025::sec::line-8a-and-line-8b::b01).
 */
export function line5Column(
  form: Record<string, unknown>,
  info: ScheduleCaFilingInfo,
  side: "subtraction" | "addition",
) {
  if (info.mustFile?.["form-3801"]?.value !== true) {
    return depreciationColumn(info.rentalDepreciationAdjustment, side);
  }
  const adjustment = scheduleEAdjustment(form, info);
  if (adjustment === undefined || isUnsupportedResult(adjustment)) return adjustment;
  const amount = side === "subtraction" ? -adjustment : adjustment;
  return amount > 0 ? amount : undefined;
}

/* An amount above 0, rounded; blank otherwise. */
const positive = (amount: number | undefined) =>
  amount !== undefined && amount > 0 ? roundDollars(amount) : undefined;

/*
 * Schedule D-1 line 38 against federal Form 4797 line 35, for the Schedule C
 * businesses that took the deduction: federal more is column B, California more
 * is column C (ca-540-sched-d1-inst-2025::sec::part-iv::b03). Only while
 * Schedule D-1 files; with no California difference it does not.
 */
function recaptureColumn(info: ScheduleCaFilingInfo, side: "subtraction" | "addition") {
  if (info.mustFile?.["schedule-d-1"]?.value !== true) return undefined;
  return depreciationColumn(info.scheduleD1Recapture, side);
}

/*
 * The Schedule C wages the federal wage credits took off, both credits in one
 * amount (facts/kinds/activitiesOnReturn.ts, wageCreditReduction). Form 5884:
 * "Enter the amount of the federal Work Opportunity Credit that reduced the
 * federal deduction for wages on Schedule CA (540), Part I ... line 3, line 5,
 * or line 6, column B" (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b07);
 * "California has no similar credits." Form 8844: "The provisions of Section
 * 280C(a) of the Internal Revenue Code (relating to rule for employment
 * credits) shall not apply" (ca-rtc-2025::sec::s17270::b). The FTB names no
 * Form 8844 adjustment, so column B gives those wages back the same way (8844
 * QUESTIONS.md item 11). Form 8820: "Enter the amount of the federal Orphan
 * Drug Credit that reduced the federal deduction for qualified clinical
 * testing expenses on Schedule CA (540), Part I ... line 3, line 5, or line 6,
 * column B" (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b08),
 * on whichever Schedule C lines it lowered. Column B only.
 */
const wageCreditColumn = (info: ScheduleCaFilingInfo, side: "subtraction" | "addition") =>
  side === "subtraction" ? (info.caWageCreditAddBack ?? 0) : 0;

/*
 * Line 3 column B or C: a California employee's profit or loss, plus the FTB
 * 3885A business difference, the Schedule D-1 Part IV difference and, in
 * column B, the wages the federal wage credits took off.
 */
export function line3Column(info: ScheduleCaFilingInfo, side: "subtraction" | "addition") {
  const employee =
    side === "subtraction" ? info.caEmployeeAmounts?.netProfit : info.caEmployeeAmounts?.netLoss;
  const depreciation = depreciationColumn(info.businessDepreciationAdjustment, side);
  if (depreciation !== undefined && typeof depreciation !== "number") return depreciation;
  if (info.businessDepreciationAdjustment?.waits) return undefined;
  const recapture = recaptureColumn(info, side);
  if (recapture !== undefined && typeof recapture !== "number") return recapture;
  const total =
    (employee ?? 0) + (depreciation ?? 0) + (recapture ?? 0) + wageCreditColumn(info, side);
  return positive(total);
}

const FARM_DEPRECIATION_GAP =
  "A farm deducts depreciation on federal Schedule F line 14, and California's can differ (ca-540-sched-ca-inst-2025::sec::line-6-farm-income-or-loss::b01): FTB 3885A needs the farm's assets, and the farm fact holds only the federal amount.";

/*
 * The federal wage credits reduce Schedule F lines 22 and 15, and Schedule CA
 * lists "Employer wage expense for the federal Work Opportunity Credit" and the
 * "Small Employer Health Insurance Credit" among the business deductions that
 * differ (ca-540-sched-ca-inst-2025::sec::business-deductions-related-to::b01).
 * The farm's stated employmentCredits add the credits no employee fact
 * figures (Forms 5884, 8844, 8932, 8994) and do not say which, so the
 * California amount is not known. The Form 5884 and Form 8844 parts that the
 * employee facts figure are known (caFarmLaborCredits).
 */
const FARM_WAGE_CREDIT_GAP =
  "A stated federal wage credit (Forms 5884, 8844, 8932, 8994 on Schedule F line 22, or Form 8941 on line 15) reduced the farm's deduction, and California's business deductions differ for the Work Opportunity Credit and the Small Employer Health Insurance Credit (ca-540-sched-ca-inst-2025::sec::business-deductions-related-to::b01); the farm fact does not split those credits by form.";

/*
 * Line 6 columns B and C: the adjustments "generally are necessary because of
 * the difference between California and federal law relating to depreciation
 * methods, special credits, NOLs, and accelerated write-offs"
 * (ca-540-sched-ca-inst-2025::sec::line-6-farm-income-or-loss::b01). A farm with
 * no depreciation and no federal wage credit has none of these on line 34:
 * blank. With depreciation or a stated wage credit the California amount is
 * not known (a gap). The labor hired that the Form 5884 and Form 8844
 * credits of the farms' own employees took off goes in column B, once for
 * both: "Enter the amount of the federal Work Opportunity Credit that reduced
 * the federal deduction for wages on Schedule CA (540), Part I ... line 3,
 * line 5, or line 6, column B"
 * (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b07), and
 * section 280C(a) does not apply for California (ca-rtc-2025::sec::s17270::b;
 * line3Column). A passive farm, which needs FTB 3801, is already a gap on
 * federal line 34.
 */
export function line6Column(info: ScheduleCaFilingInfo, side: "subtraction" | "addition") {
  const farms = info.farms ?? [];
  if (farms.some((farm) => (farm.value.expenses?.depreciation ?? 0) > 0)) {
    return unsupported(FARM_DEPRECIATION_GAP);
  }
  const figured = info.caFarmLaborCredits;
  const employmentCredits = sum(...farms.map((farm) => farm.value.employmentCredits));
  const otherCredits =
    employmentCredits > (figured?.credit ?? 0) ||
    farms.some((farm) => (farm.value.smallEmployerHealthCredit ?? 0) > 0);
  if (otherCredits) return unsupported(FARM_WAGE_CREDIT_GAP);
  return side === "subtraction" ? positive(figured?.reduction) : undefined;
}

export function answerLines(): Bindings {
  const bindings: Record<string, unknown> = Object.fromEntries(
    COPIED.map(([field, federal]) => [field, copy(federal)]),
  );
  return {
    ...(bindings as Bindings),
    "0.line.b2b_divorce_date": copyText("0.line.2b"),
    "2.line.c19b_recipient_ssn": copyText("1.line.19b"),
    "2.line.c19c_divorce_date": copyText("1.line.19c"),
    /*
     * Line 3 column B: "enter the amount of federal business income from line 3,
     * column A, on line 3, column B"; column C the loss
     * (ca-540-sched-ca-inst-2025::sec::line-3-business-income-or-loss::b04), as the
     * taxpayer states them; and FTB 3885A line 8a/14a or 8b/14b
     * (ca-3885a-inst-2025::sec::line-8a-and-line-8b::b01).
     */
    "0.line.b3_subtractions": (_, info) => line3Column(info, "subtraction"),
    "0.line.b3_additions": (_, info) => line3Column(info, "addition"),
    // Line 5: FTB 3801's Schedule E adjustment when it files, else FTB 3885A (line5Column).
    "0.line.b5_subtractions": (form, info) => line5Column(form, info, "subtraction"),
    "0.line.b5_additions": (form, info) => line5Column(form, info, "addition"),
    // MANUAL EDIT: line 6 column A copies Schedule 1 line 6; columns B and C (line6Column).
    "0.line.b6_federal": copy("0.line.6"),
    "0.line.b6_subtractions": (_, info) => line6Column(info, "subtraction"),
    "0.line.b6_additions": (_, info) => line6Column(info, "addition"),
    // Lines 15 and 17 column B: not allowed to a California employee (::line-11-through-line-25::b02).
    "2.line.c15_subtractions": (_, info) =>
      positive(info.caEmployeeAmounts?.selfEmploymentTaxDeduction),
    "2.line.c17_subtractions": (_, info) =>
      positive(info.caEmployeeAmounts?.selfEmployedHealthInsurance),
    // Line 24i: "Enter the amount from column A in column B" (::line-11-through-line-25::b07).
    "3.line.c24i_subtractions": (form) => numberOrBlank(form["3.line.c24i_federal"]),
    // Line 25: "Add line 24a through line 24z", column B.
    "3.line.c25_subtractions": (form) =>
      sumOrBlank(...LINE_24_SUBTRACTIONS.map((field) => numberOrBlank(form[field]))),
  };
}
