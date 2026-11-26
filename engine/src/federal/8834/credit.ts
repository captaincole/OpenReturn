/*
 * Form 8834 from the return: line 1 from Form 8582-CR, lines 2 to 6 from the
 * tax and the credits that come before this one. Every function reads
 * cross-form fields by their full id, so Schedule 3, Form 3800, Form 8911 and
 * Form 8801 call them with their own accessors.
 */

import { atLeast, numberOrBlank, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { claimsByElection, foreignTaxCredit, foreignTaxCreditGap } from "../1116/credit.js";
import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import { dependentCareCreditGap } from "../2441/creditGap.js";
import type { Form2441FilingInfo } from "../2441/filingInfo.js";
import { addCells, isGap, type Cell } from "../3800/cells.js";
import { needsPassiveLimit } from "../3800/credits.js";
import type { Form3800FilingInfo } from "../3800/filingInfo.js";
import { mortgageCreditGap, type CreditLimitInfo } from "../8396/creditGap.js";
import type { PassiveLimitInfo } from "../8582-cr/filingInfo.js";
import { allowedForSource, passiveCreditLimitOf } from "../8582-cr/form.js";
import { line6cFrom8839 } from "../8839/receivers.js";
import { nonrefundableCreditGap } from "../8863/credit.js";
import type { Form8863FilingInfo } from "../8863/filingInfo.js";
import { creditGap } from "../8880/credit.js";
import type { Form8880FilingInfo } from "../8880/filingInfo.js";
import { cleanVehicleCreditGap } from "../8936/credit.js";
import { line6lGap } from "../8978/receivers.js";
import {
  line7Of,
  netRegularTaxLines,
  skipsToLine7,
  taxLimitLines,
  type NetRegularTaxLines,
  type TaxLimitLines,
} from "./lines.js";

export type Accessor = { readonly [fieldId: string]: unknown };
type Value = number | Unsupported | undefined;

/* Every slot the form reads: Form 8582-CR's, Form 3800's sources, and the gaps of the credits line 3b adds. */
export type Form8834CreditInfo = PassiveLimitInfo &
  Form3800FilingInfo &
  CreditLimitInfo &
  Form8880FilingInfo &
  Form8863FilingInfo &
  Form1116FilingInfo &
  Form2441FilingInfo;

const files = (info: Form8834CreditInfo, formId: string) => info.mustFile?.[formId]?.value === true;

const NO_FORM_8582_CR =
  "Line 1 is the credit Form 8582-CR allows (irs-8834-form-2025::sec::specific-instructions::b01), and Form 8582-CR does not file (decisions.scope.must_file_8582_cr is false).";
const CURRENT_CREDITS_GAP =
  "Form 8582-CR shares its allowed credit between this credit and Form 3800's current-year passive credits, and the engine figures those credits after the tax limits that subtract this one (Form 3800 line 10b, Form 8911 line 6b); it does not figure the two together.";

/*
 * Line 1: "Enter the qualified electric vehicle passive activity credits
 * allowed for your current tax year from Form 8582-CR"
 * (irs-8834-form-2025::sec::specific-instructions::b01): the part of each
 * prior year unallowed credit that Form 8582-CR allows (its Worksheet 9
 * column (c), or line 37 when it is the only credit, line-37::b01). 0 with no
 * such credit. Undefined while Form 8582-CR waits.
 */
export function line1Of(form: Accessor, info: Form8834CreditInfo): Value {
  const vehicles = info.electricVehiclePassiveCarryovers ?? [];
  if (vehicles.length === 0) return 0;
  if (!files(info, "form-8582-cr")) return unsupported(NO_FORM_8582_CR);
  const current = (info.form3800Sources?.current ?? []).map((source) => source.credit);
  if (current.some(needsPassiveLimit)) return unsupported(CURRENT_CREDITS_GAP);
  const limit = passiveCreditLimitOf(info.form3800Sources?.carryovers ?? [], form, info);
  if (limit === undefined) return undefined;
  return addCells(0, ...vehicles.map((vehicle) => allowedForSource(limit, vehicle)));
}

/* Line 2: "the sum of the amounts from Form 1040 ... line 16; and Schedule 2 (Form 1040), line 1z" (face-page-1::b01). */
function line2Of(form: Accessor): number | undefined {
  const line16 = numberOrBlank(form["form-1040.line.16"]);
  if (line16 === undefined) return undefined;
  return line16 + (numberOrBlank(form["schedule-2.0.line.1z_total_lines_1a_through_1y"]) ?? 0);
}

/*
 * Line 3b (irs-8834-form-2025::sec::line-3b::b01): Form 1040 line 19 and
 * Schedule 3 lines 2 through 5 and 7, line 7 "reduced by any general business
 * credit reported on line 6a, any credit for prior year minimum tax reported
 * on line 6b, any alternative fuel vehicle refueling property credit
 * (personal-use part) reported on line 6j, or any credit to holders of tax
 * credit bonds reported on line 6k". Line 7 also holds line 6i, this credit,
 * which cannot limit itself (QUESTIONS.md). Line 6e is reserved.
 */
const LINE_3B_CREDITS = [
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
  "schedule-3.0.line.6l",
  "schedule-3.0.line.6m",
  "schedule-3.0.line.6z_amount",
] as const;

/* Schedule 3 lines line 3b adds that the engine does not compute while their form files. */
const UNCOMPUTED_CREDITS: ReadonlyArray<[formId: string, line: string]> = [
  ["form-5695", "Schedule 3 line 5a (Form 5695 Part I, the residential clean energy credit)"],
  ["form-8859", "Schedule 3 line 6h (Form 8859)"],
];

/* Why a credit line 3b adds is an engine gap; undefined when each is a number or blank. */
function otherCreditsGap(form: Accessor, info: Form8834CreditInfo): string | undefined {
  const uncomputed = UNCOMPUTED_CREDITS.find(([formId]) => files(info, formId));
  if (uncomputed) return `Line 3b adds ${uncomputed[1]}, which the engine does not compute.`;
  const adoption = line6cFrom8839(form, info)?.value;
  const gaps = [
    dependentCareCreditGap(form, info),
    nonrefundableCreditGap(form, info)?.reason,
    creditGap(form, info)?.reason,
    typeof adoption === "object" ? adoption.reason : undefined,
    cleanVehicleCreditGap(form, info),
    mortgageCreditGap(form, info),
    line6lGap(info),
  ];
  const gap = gaps.find((reason) => reason !== undefined);
  return gap === undefined ? undefined : `Line 3b adds a credit the engine cannot figure: ${gap}`;
}

/* Lines 2 to 4, or why they cannot be figured. */
function netRegularTaxOf(
  form: Accessor,
  info: Form8834CreditInfo,
): NetRegularTaxLines | Unsupported | undefined {
  const foreignTax = foreignTaxCreditGap(form, info);
  if (foreignTax !== undefined) return unsupported(`Line 3a is ${foreignTax}`);
  const gap = otherCreditsGap(form, info);
  if (gap !== undefined) return unsupported(gap);
  if (info.foreignTax?.taxesWaiting === true) return undefined;
  const line2 = line2Of(form);
  if (line2 === undefined) return undefined;
  const line3a = numberOrBlank(foreignTaxCredit(form, info));
  const line3b = sumOrBlank(...LINE_3B_CREDITS.map((id) => form[id]));
  return netRegularTaxLines(line2, line3a, line3b);
}

const NO_FORM_6251 =
  "Line 5 is Form 6251 line 9, and Form 6251 does not file (decisions.scope.must_file_6251 is false).";
const FORM_6251_LINE_7 = "form-6251.0.line.7_tax_on_line_6";
const AMT_COPY_GAP =
  "Form 1116 files: line 5 is Form 6251 line 7 less the AMT foreign tax credit, which is figured on a second set of Forms 1116 with AMT amounts (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01), and the engine does not figure that set.";

/*
 * Line 5: the tentative minimum tax, Form 6251 line 7 less the AMT foreign tax
 * credit, never below 0. "Although you may not owe alternative minimum tax
 * (AMT), you generally must still figure your tentative minimum tax (TMT) to
 * figure your credit" (irs-8834-form-2025::sec::line-5::b01).
 *
 * DECISION (2026-11-26, by the author): line 5 is the tentative minimum tax
 * after the AMT foreign tax credit, also when Form 6251 leaves its line 8 blank.
 * - Form 8834 line 5: "Individuals. Enter the amount from Form 6251, line 9"
 *   (irs-8834-form-2025::sec::face-page-1::b02); Form 6251 line 9 is line 7
 *   less line 8.
 * - Form 6251 instructions: "If the amount on line 10 is greater than or equal
 *   to the amount on line 7 ... Leave line 8 blank"
 *   (irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01).
 * The engine takes line 7 less the credit line 8 would hold, as Forms 8801,
 * 8911 and 3800 do (docs/rule-decisions.md row A58; rows 12, A14, A33): one rule for
 * every credit that reads the tentative minimum tax, since line 3a takes the
 * regular foreign tax credit off the other side.
 */
function line5Of(form: Accessor, info: Form8834CreditInfo): Value {
  if (!files(info, "form-6251")) return unsupported(NO_FORM_6251);
  const line7 = numberOrBlank(form[FORM_6251_LINE_7]);
  if (line7 === undefined) return undefined;
  const credit = foreignTaxCredit(form, info);
  if (isGap(credit)) return credit;
  if (claimsByElection(info)) return credit === undefined ? undefined : atLeast(0, line7 - credit);
  return files(info, "form-1116") ? unsupported(AMT_COPY_GAP) : line7;
}

/* Lines 2 to 6, or their gap or wait. Line 1 does not enter them. */
export function taxLimitOf(
  form: Accessor,
  info: Form8834CreditInfo,
): TaxLimitLines | Unsupported | undefined {
  const net = netRegularTaxOf(form, info);
  if (net === undefined || isGap(net) || skipsToLine7(net)) return net;
  const line5 = line5Of(form, info);
  if (typeof line5 !== "number") return line5;
  return taxLimitLines(net, line5);
}

/* One of lines 2 to 4: a gap in line 5 does not stop them. */
export function netRegularTaxLine(
  form: Accessor,
  info: Form8834CreditInfo,
  pick: (lines: NetRegularTaxLines) => number | undefined,
): Value {
  const lines = netRegularTaxOf(form, info);
  return lines === undefined || isGap(lines) ? lines : pick(lines);
}

/* Line 5 or line 6. */
export function taxLimitLine(
  form: Accessor,
  info: Form8834CreditInfo,
  pick: (lines: TaxLimitLines) => number | undefined,
): Value {
  const lines = taxLimitOf(form, info);
  return lines === undefined || isGap(lines) ? lines : pick(lines);
}

/* Line 7: the smaller of line 1 and line 6 (lines.ts). */
export function line7Value(form: Accessor, info: Form8834CreditInfo): Value {
  const line1 = line1Of(form, info);
  const limit = taxLimitOf(form, info);
  if (isGap(line1)) return line1;
  if (isGap(limit)) return limit;
  if (line1 === undefined || limit === undefined) return undefined;
  return line7Of(line1, limit);
}

/*
 * Schedule 3 line 6i: "Report this amount on Schedule 3 (Form 1040), line 6i"
 * (face-page-1::b02; irs-1040-inst-2025::sec::line-6i::b01). Undefined when
 * Form 8834 does not file, so Schedule 3 keeps its old reason.
 */
export function line6iFrom8834(
  form: Accessor,
  info: Form8834CreditInfo,
): { value: Cell } | undefined {
  if (!files(info, "form-8834")) return undefined;
  return { value: line7Value(form, info) };
}

/* Why Schedule 3 line 6i is an engine gap, for a total that adds it (Form 3800 line 10b, Form 8911 line 6b, Form 8801 line 22). */
export function electricVehicleCreditGap(
  form: Accessor,
  info: Form8834CreditInfo,
): string | undefined {
  const credit = line6iFrom8834(form, info)?.value;
  return isGap(credit) ? `Schedule 3 line 6i (Form 8834): ${credit.reason}` : undefined;
}
