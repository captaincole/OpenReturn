/*
 * MANUAL EDIT: Schedule CA (540) lines spread into bindings.ts. Column A copies
 * the federal Schedule 1 line (ca-540-sched-ca-inst-2025, "Column A – Federal
 * Amounts"); columns B and C follow the line's instruction, cited per line.
 */

import type { FormSpec } from "../../../defineForm.js";
import { numberOrBlank, roundDollars, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
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

/* An amount above 0, rounded; blank otherwise. */
const positive = (amount: number | undefined) =>
  amount !== undefined && amount > 0 ? roundDollars(amount) : undefined;

/* Line 3 column B or C: a California employee's profit or loss, plus the FTB 3885A business difference. */
function line3Column(info: ScheduleCaFilingInfo, side: "subtraction" | "addition") {
  const employee =
    side === "subtraction" ? info.caEmployeeAmounts?.netProfit : info.caEmployeeAmounts?.netLoss;
  const depreciation = depreciationColumn(info.businessDepreciationAdjustment, side);
  if (depreciation !== undefined && typeof depreciation !== "number") return depreciation;
  if (info.businessDepreciationAdjustment?.waits) return undefined;
  const total = (employee ?? 0) + (depreciation ?? 0);
  return positive(total);
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
    // Line 5: FTB 3885A line 8a/14a in column B, 8b/14b in column C (::line-8a-and-line-8b::b01).
    "0.line.b5_subtractions": (_, info) =>
      depreciationColumn(info.rentalDepreciationAdjustment, "subtraction"),
    "0.line.b5_additions": (_, info) =>
      depreciationColumn(info.rentalDepreciationAdjustment, "addition"),
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
