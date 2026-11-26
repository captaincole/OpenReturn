/*
 * Form 8912 Parts I and II from the return. Every function reads cross-form
 * fields by their full id, so Schedule 3 can call them with its own accessor.
 */

import { numberOrBlank, sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { foreignTaxCreditGap } from "../1116/credit.js";
import { dependentCareCreditGap } from "../2441/creditGap.js";
import { generalBusinessCreditGap } from "../3800/receivers.js";
import { amtGap } from "../6251/foreignTaxCredit.js";
import { mortgageCreditGap } from "../8396/creditGap.js";
import { line6bFrom8801, type Form8801CreditInfo } from "../8801/credit.js";
import { line6cFrom8839 } from "../8839/receivers.js";
import { nonrefundableCreditGap } from "../8863/credit.js";
import { creditGap } from "../8880/credit.js";
import { refuelingCreditGap } from "../8911/credit.js";
import { cleanVehicleCreditGap } from "../8936/credit.js";
import { line6lGap } from "../8978/receivers.js";
import type { Form8912FilingInfo, Form8912Inputs } from "./filingInfo.js";
import {
  line12,
  line14,
  PART_III_ROWS,
  partI,
  partII,
  type PartIILines,
  type PartILines,
} from "./lines.js";

export type Accessor = { readonly [fieldId: string]: unknown };
type Value = number | Unsupported | undefined;

/* Every slot Part II reads: this form's, and the gaps of the credits on lines 10a to 10d. */
export type Form8912CreditInfo = Form8912FilingInfo & Form8801CreditInfo;

const files = (info: Form8912CreditInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/* Part III in groups of 20 rows: one line 14 for each copy of Part III (line-14::b01). */
export function partIIIPages(inputs: Form8912Inputs): number[][] {
  const pages: number[][] = [];
  for (let start = 0; start < inputs.partIII.length; start += PART_III_ROWS) {
    pages.push(inputs.partIII.slice(start, start + PART_III_ROWS).map((row) => row.amount));
  }
  return pages;
}

/* Part I, or undefined while a Part IV waits (its line 20 is not known). */
export function partIOf(info: Form8912FilingInfo): PartILines | undefined {
  const inputs = info.form8912;
  if (inputs === undefined) return undefined;
  const lines20 = inputs.partIV.map((form) => form.lines?.line20);
  if (lines20.some((line) => line === undefined)) return undefined;
  const lines14 = partIIIPages(inputs).map((page) => line14(page));
  return partI(lines14, lines20 as number[], inputs.carryforward);
}

/*
 * Schedule 3 lines the engine has no rules for: while the form that feeds one
 * files, line 10b would leave it out. Line 5a is Form 5695 Part I.
 */
const UNCOMPUTED_CREDITS: ReadonlyArray<[formId: string, line: string]> = [
  ["form-5695", "Schedule 3 line 5a (Form 5695 Part I, the residential clean energy credit)"],
  ["form-8859", "Schedule 3 line 6h (Form 8859)"],
  ["form-8834", "Schedule 3 line 6i (Form 8834)"],
];

/* Why a credit lines 10a to 10d add is an engine gap; undefined when each is a number or blank. */
function creditsBeforeGap(form: Accessor, info: Form8912CreditInfo): string | undefined {
  const uncomputed = UNCOMPUTED_CREDITS.find(([formId]) => files(info, formId));
  if (uncomputed) return `Line 10b adds ${uncomputed[1]}, which the engine does not compute.`;
  const adoption = line6cFrom8839(form, info)?.value;
  const priorYearMinimumTax = line6bFrom8801(form, info)?.value;
  const gaps = [
    foreignTaxCreditGap(form, info),
    dependentCareCreditGap(form, info),
    nonrefundableCreditGap(form, info)?.reason,
    creditGap(form, info)?.reason,
    typeof adoption === "object" ? adoption.reason : undefined,
    cleanVehicleCreditGap(form, info),
    mortgageCreditGap(form, info),
    refuelingCreditGap(form, info),
    generalBusinessCreditGap(form, info),
    typeof priorYearMinimumTax === "object" ? priorYearMinimumTax.reason : undefined,
    line6lGap(info),
  ];
  const gap = gaps.find((reason) => reason !== undefined);
  return gap === undefined
    ? undefined
    : `Lines 10a to 10d add a credit the engine cannot figure: ${gap}`;
}

/*
 * Line 10b: "the amount from Form 1040, 1040-SR, or 1040-NR, line 19; and
 * Schedule 3 (Form 1040), lines 2 through 5b, 6c through 6j, and 6l through
 * 6z" (irs-8912-inst-2025::sec::line-10b::b01). Line 6e is reserved.
 */
const LINE_10B_CREDITS = [
  "form-1040.line.19",
  "schedule-3.0.line.2",
  "schedule-3.0.line.3",
  "schedule-3.0.line.4",
  "schedule-3.0.line.5a",
  "schedule-3.0.line.5b",
  "schedule-3.0.line.6c",
  "schedule-3.0.line.6d",
  "schedule-3.0.line.6f",
  "schedule-3.0.line.6g",
  "schedule-3.0.line.6h",
  "schedule-3.0.line.6i",
  "schedule-3.0.line.6j",
  "schedule-3.0.line.6l",
  "schedule-3.0.line.6m",
  "schedule-3.0.line.6z_amount",
] as const;

/* Line 7: "the sum of the tax reported on Form 1040 ... line 16; and Schedule 2 (Form 1040), line 1z". */
function line7Of(form: Accessor): number | undefined {
  const line16 = numberOrBlank(form["form-1040.line.16"]);
  if (line16 === undefined) return undefined;
  return line16 + sum(form["schedule-2.0.line.1z_total_lines_1a_through_1y"]);
}

const FORM_6251_LINE_11 = "form-6251.0.line.11_amt";

/*
 * Line 8: "the alternative minimum tax from Form 6251, line 11". Blank with no
 * Form 6251; a gap on its line 11 is a gap here; blank while it waits.
 */
function line8Of(form: Accessor, info: Form8912CreditInfo): Value | "waits" {
  if (!files(info, "form-6251")) return undefined;
  const gap = amtGap(form, info);
  if (gap !== undefined) return gap;
  return numberOrBlank(form[FORM_6251_LINE_11]) ?? "waits";
}

/* Lines 7 to 11, or the gap or wait that keeps them blank. */
export function partIIOf(form: Accessor, info: Form8912CreditInfo): PartIILines | Value {
  const gap = creditsBeforeGap(form, info);
  if (gap !== undefined) return unsupported(gap);
  const line7 = line7Of(form);
  if (line7 === undefined) return undefined;
  const line8 = line8Of(form, info);
  if (line8 === "waits" || typeof line8 === "object") return line8 === "waits" ? undefined : line8;
  return partII(line7, line8, {
    line10a: numberOrBlank(form["schedule-3.0.line.1"]),
    line10b: sumOrBlank(...LINE_10B_CREDITS.map((id) => form[id])),
    line10c: numberOrBlank(form["schedule-3.0.line.6a"]),
    line10d: numberOrBlank(form["schedule-3.0.line.6b"]),
  });
}

/* One line of Part II, or its gap or wait. */
export function partIILine(
  form: Accessor,
  info: Form8912CreditInfo,
  pick: (lines: PartIILines) => number | undefined,
): Value {
  const lines = partIIOf(form, info);
  if (lines === undefined || typeof lines !== "object" || "unsupported" in lines) return lines;
  return pick(lines);
}

/*
 * Line 12: the smallest of line 4, line 11 and the pass-through formula
 * (irs-8912-inst-2025::sec::line-12::b02, ::b03); the formula divides by the
 * taxable income, Form 1040 line 15.
 *
 * DECISION (2026-11-26, by the author): the engine takes no deduction this
 * year for a CREB credit line 12 cannot use.
 * - "If you can't use all of the credit from Part I because of the tax
 *   liability limit ..., you can deduct the unused credit for the current tax
 *   year" (irs-8912-inst-2025::sec::line-12::b01).
 * - "However, you can choose to deduct the unused credit in the next tax year
 *   instead of the current tax year", and a current-year deduction needs the
 *   "trial and error" method (the same block).
 * The engine always takes the next-year choice, one rule every time, so line
 * 12 is figured once from this year's tax.
 */
export function line12Of(form: Accessor, info: Form8912CreditInfo): Value {
  const part1 = partIOf(info);
  const part2 = partIIOf(form, info);
  if (part1 === undefined) return undefined;
  if (part2 === undefined || typeof part2 !== "object" || "unsupported" in part2) return part2;
  const interests = info.form8912?.passThroughCrebs;
  if (interests === undefined) return undefined;
  const taxableIncome = numberOrBlank(form["form-1040.line.15"]);
  if (interests.length > 0 && taxableIncome === undefined) return undefined;
  return line12(part1.line4, part2.line11, interests, taxableIncome ?? 0);
}

/*
 * Schedule 3 line 6k: line 12 ("Report this amount on Schedule 3 (Form 1040),
 * line 6k"; irs-1040-inst-2025::sec::line-6k::b01). Undefined when Form 8912
 * does not file, so Schedule 3 keeps its old reason; blank when line 12 is 0.
 */
export function line6kFrom8912(
  form: Accessor,
  info: Form8912CreditInfo,
): { value: Value } | undefined {
  if (!files(info, "form-8912")) return undefined;
  const credit = line12Of(form, info);
  return { value: credit === 0 ? undefined : credit };
}
