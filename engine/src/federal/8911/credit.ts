/*
 * Form 8911 from the return: the Schedules A, the K-1 credits, and the tax
 * limit of Part II. Every function reads cross-form fields by their full id,
 * so Schedule 3 and Form 8801 call them with their own accessors.
 */

import { atLeast, numberOrBlank, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { claimsByElection, foreignTaxCredit, foreignTaxCreditGap } from "../1116/credit.js";
import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import { isGap } from "../1116/lines.js";
import { dependentCareCreditGap } from "../2441/creditGap.js";
import type { Form2441FilingInfo } from "../2441/filingInfo.js";
import { mortgageCreditGap, type CreditLimitInfo } from "../8396/creditGap.js";
import { line6cFrom8839 } from "../8839/receivers.js";
import { nonrefundableCreditGap } from "../8863/credit.js";
import type { Form8863FilingInfo } from "../8863/filingInfo.js";
import { creditGap } from "../8880/credit.js";
import type { Form8880FilingInfo } from "../8880/filingInfo.js";
import { cleanVehicleCreditGap } from "../8936/credit.js";
import type { Form8911FilingInfo } from "./filingInfo.js";
import {
  netRegularTax,
  partITotals,
  personalCreditLines,
  scheduleATotal,
  type NetRegularTax,
  type ScheduleALines,
} from "./lines.js";

export type Accessor = { readonly [fieldId: string]: unknown };
type Value = number | Unsupported | undefined;

/* Every slot Part II reads: this form's, and the gaps of the credits line 6b adds. */
export type Form8911CreditInfo = Form8911FilingInfo &
  CreditLimitInfo &
  Form8880FilingInfo &
  Form8863FilingInfo &
  Form1116FilingInfo &
  Form2441FilingInfo;

const files = (info: Form8911CreditInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/* The Schedules A, or undefined while one waits on line 13 or line 17. */
function schedulesAOf(info: Form8911FilingInfo): ScheduleALines[] | undefined {
  const sheets = info.refuelingSchedulesA ?? [];
  if (sheets.some((sheet) => sheet.lines === undefined)) return undefined;
  return sheets.map((sheet) => sheet.lines as ScheduleALines);
}

/* Item A: "the total number of ... properties for which you are claiming this credit"; -0- with only line 2. */
export function itemAOf(info: Form8911FilingInfo): number | undefined {
  const sheets = schedulesAOf(info);
  if (sheets === undefined) return undefined;
  return sheets.filter((lines) => (lines.line16 ?? 0) > 0 || (lines.line21 ?? 0) > 0).length;
}

/* Line 1: the Schedule A lines 16; line 4: the Schedule A lines 21. Blank with none. */
export function line1Of(info: Form8911FilingInfo): number | undefined {
  const sheets = schedulesAOf(info);
  return sheets === undefined ? undefined : scheduleATotal(sheets.map((lines) => lines.line16));
}

export function line4Of(info: Form8911FilingInfo): number | undefined {
  const sheets = schedulesAOf(info);
  return sheets === undefined ? undefined : scheduleATotal(sheets.map((lines) => lines.line21));
}

/* Lines 1–3 (irs-8911-inst-2025::sec::line-2::b01: "Other filers ... must enter the passed-through credits on line 2"). */
export function partIOf(info: Form8911FilingInfo) {
  if (schedulesAOf(info) === undefined) return undefined;
  return partITotals(line1Of(info), info.refuelingK1Credit);
}

export function partILine(
  info: Form8911FilingInfo,
  pick: (lines: ReturnType<typeof partITotals>) => number | undefined,
): number | undefined {
  const lines = partIOf(info);
  return lines === undefined ? undefined : pick(lines);
}

/*
 * Line 6b adds Schedule 3 lines the engine does not compute while their form
 * files: then the total would leave a credit out. Line 5a is Form 5695 Part I,
 * which the engine does not model; a Form 5695 on the return may claim it.
 */
const UNCOMPUTED_CREDITS: ReadonlyArray<[formId: string, line: string]> = [
  ["form-5695", "Schedule 3 line 5a (Form 5695 Part I, the residential clean energy credit)"],
  ["form-8859", "Schedule 3 line 6h (Form 8859)"],
  ["form-8834", "Schedule 3 line 6i (Form 8834)"],
  ["form-8978", "Schedule 3 line 6l (Form 8978)"],
];

/* Why a credit line 6b adds is an engine gap; undefined when each is a number or blank. */
function otherCreditsGap(form: Accessor, info: Form8911CreditInfo): string | undefined {
  const uncomputed = UNCOMPUTED_CREDITS.find(([formId]) => files(info, formId));
  if (uncomputed) return `Line 6b adds ${uncomputed[1]}, which the engine does not compute.`;
  const adoption = line6cFrom8839(form, info)?.value;
  const gaps = [
    dependentCareCreditGap(form, info),
    nonrefundableCreditGap(form, info)?.reason,
    creditGap(form, info)?.reason,
    typeof adoption === "object" ? adoption.reason : undefined,
    cleanVehicleCreditGap(form, info),
    mortgageCreditGap(form, info),
  ];
  const gap = gaps.find((reason) => reason !== undefined);
  return gap === undefined ? undefined : `Line 6b adds a credit the engine cannot figure: ${gap}`;
}

/*
 * Line 6b (irs-8911-inst-2025::sec::line-6b::b01): Form 1040 line 19 and
 * Schedule 3 lines 2 through 5 and 7, line 7 "reduced by any general business
 * credit reported on line 6a, any credit for prior-year minimum tax reported on
 * line 6b, or any credit to holders of tax credit bonds reported on line 6k".
 * Line 7 also holds line 6j, this credit, which cannot limit itself
 * (QUESTIONS.md). Line 6e is reserved.
 */
const LINE_6B_CREDITS = [
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
  "schedule-3.0.line.6l",
  "schedule-3.0.line.6m",
  "schedule-3.0.line.6z_amount",
] as const;

/* Line 5: "the sum of the amounts from Form 1040 ... line 16; and Schedule 2 (Form 1040), line 1z". */
function line5Of(form: Accessor): number | undefined {
  const line16 = numberOrBlank(form["form-1040.line.16"]);
  if (line16 === undefined) return undefined;
  return line16 + (numberOrBlank(form["schedule-2.0.line.1z_total_lines_1a_through_1y"]) ?? 0);
}

/* Lines 5–7, or why they cannot be figured. */
function netRegularTaxOf(form: Accessor, info: Form8911CreditInfo): NetRegularTax | Value {
  const foreignTax = foreignTaxCreditGap(form, info);
  if (foreignTax !== undefined) return unsupported(`Line 6a is ${foreignTax}`);
  const gap = otherCreditsGap(form, info);
  if (gap !== undefined) return unsupported(gap);
  if (info.foreignTax?.taxesWaiting === true) return undefined;
  const line5 = line5Of(form);
  if (line5 === undefined) return undefined;
  const line6a = numberOrBlank(foreignTaxCredit(form, info));
  const line6b = sumOrBlank(...LINE_6B_CREDITS.map((id) => form[id]));
  return netRegularTax(line5, line6a, line6b);
}

const NO_FORM_6251 =
  "Line 8 is Form 6251 line 9, and Form 6251 does not file (decisions.scope.must_file_6251 is false).";
const FORM_6251_LINE_7 = "form-6251.0.line.7_tax_on_line_6";
const AMT_COPY_GAP =
  "Form 1116 files: line 8 is Form 6251 line 7 less the AMT foreign tax credit, which is figured on a second set of Forms 1116 with AMT amounts (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01), and the engine does not figure that set.";

/*
 * Line 8: the tentative minimum tax, Form 6251 line 7 less the AMT foreign tax
 * credit, never below 0.
 *
 * DECISION (2026-11-24, by the author, not reviewed by a person): line 8 is the
 * tentative minimum tax after the AMT foreign tax credit, also when Form 6251
 * leaves its line 8 blank.
 * - Form 8911 line 8: "Individuals. Enter the amount from Form 6251, line 9"
 *   (blank form; irs-8911-inst-2025::sec::line-8::b01: "you must still figure
 *   the tentative minimum tax (TMT) to figure your credit"); Form 6251 line 9 is
 *   line 7 less line 8.
 * - Form 6251 instructions: "If the amount on line 10 is greater than or equal
 *   to the amount on line 7 ... Leave line 8 blank"
 *   (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01).
 * The engine takes line 7 less the credit line 8 would hold, as for Form 8801
 * line 23 (docs/rule-decisions.md row 12): one rule for every credit that reads
 * the tentative minimum tax, since line 6a takes the regular foreign tax credit
 * off the other side.
 */
function line8Of(form: Accessor, info: Form8911CreditInfo): Value {
  if (!files(info, "form-6251")) return unsupported(NO_FORM_6251);
  const line7 = numberOrBlank(form[FORM_6251_LINE_7]);
  if (line7 === undefined) return undefined;
  const credit = foreignTaxCredit(form, info);
  if (isGap(credit)) return credit;
  if (claimsByElection(info)) return credit === undefined ? undefined : atLeast(0, line7 - credit);
  return files(info, "form-1116") ? unsupported(AMT_COPY_GAP) : line7;
}

export interface PartIILines extends NetRegularTax {
  line4: number;
  /* Lines 8–10: blank when line 7 is 0 ("stop here"); line 10 also when line 9 is 0. */
  line8?: number;
  line9?: number;
  line10?: number;
}

/* Lines 4–10, once line 4 has an amount; undefined with no personal part or while a line waits. */
export function partIIOf(form: Accessor, info: Form8911CreditInfo): PartIILines | Value {
  const line4 = line4Of(info);
  if (line4 === undefined) return undefined;
  const net = netRegularTaxOf(form, info);
  if (net === undefined || typeof net !== "object" || "unsupported" in net) return net;
  if (net.line7 === 0) return { line4, ...net };
  const line8 = line8Of(form, info);
  if (typeof line8 !== "number") return line8;
  return { line4, ...net, line8, ...personalCreditLines(line4, net.line7, line8) };
}

/* One line of Part II (5–10), or its gap or wait. */
export function partIILine(
  form: Accessor,
  info: Form8911CreditInfo,
  pick: (lines: PartIILines) => number | undefined,
): Value {
  const lines = partIIOf(form, info);
  if (lines === undefined || typeof lines !== "object" || "unsupported" in lines) return lines;
  return pick(lines);
}

/*
 * Schedule 3 line 6j: line 10 ("here and on Schedule 3 (Form 1040), line 6j";
 * irs-1040-inst-2025::sec::line-6j::b01). Undefined when Form 8911 does not
 * file, so Schedule 3 keeps its old reason; blank when line 10 is blank.
 */
export function line6jFrom8911(
  form: Accessor,
  info: Form8911CreditInfo,
): { value: Value } | undefined {
  if (!files(info, "form-8911")) return undefined;
  return { value: partIILine(form, info, (lines) => lines.line10) };
}

/* Why Schedule 3 line 6j is an engine gap, for a total that adds it (Form 8801 line 22). */
export function refuelingCreditGap(form: Accessor, info: Form8911CreditInfo): string | undefined {
  const credit = line6jFrom8911(form, info)?.value;
  return typeof credit === "object" ? credit.reason : undefined;
}

/*
 * Line 3, and whether the form stays on the return. "If zero or less, enter -0-
 * and stop here; do not file this form unless you are claiming a credit on
 * line 3" (lines 7 and 9). With no business part, line 3 is blank while line 10
 * holds a credit or waits; it is 0 when the personal part ends with none, and
 * the form then leaves the return (filesOnlyWithAmountOn in bindings.ts).
 */
export function line3Of(form: Accessor, info: Form8911CreditInfo): Value {
  const partI = partIOf(info);
  if (partI === undefined) return undefined;
  if (partI.line3 !== undefined) return partI.line3;
  if (line4Of(info) === undefined) return 0;
  const lines = partIIOf(form, info);
  if (lines === undefined || typeof lines !== "object" || "unsupported" in lines) return undefined;
  return lines.line10 === undefined ? 0 : undefined;
}
