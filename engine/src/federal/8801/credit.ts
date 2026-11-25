/*
 * Form 8801 lines 22–26: the 2025 return. Every function reads cross-form
 * fields by full id, so Schedule 3 can call them with its own accessor.
 */

import { atLeast, numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { foreignTaxCreditGap } from "../1116/credit.js";
import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import { dependentCareCreditGap } from "../2441/creditGap.js";
import type { Form2441FilingInfo } from "../2441/filingInfo.js";
import { line9Of } from "../6251/foreignTaxCredit.js";
import { mortgageCreditGap, type CreditLimitInfo } from "../8396/creditGap.js";
import { line6cFrom8839 } from "../8839/receivers.js";
import { nonrefundableCreditGap } from "../8863/credit.js";
import type { Form8863FilingInfo } from "../8863/filingInfo.js";
import { creditGap } from "../8880/credit.js";
import type { Form8880FilingInfo } from "../8880/filingInfo.js";
import { cleanVehicleCreditGap } from "../8936/credit.js";
import type { Form8801FilingInfo } from "./filingInfo.js";
import { lines24To26, type Lines24To26 } from "./lines.js";

type Accessor = { readonly [fieldId: string]: unknown };
type Value = number | Unsupported | undefined;

/* Every slot the credit lines read: this form's, and the gaps of the credits line 22 subtracts. */
export type Form8801CreditInfo = Form8801FilingInfo &
  CreditLimitInfo &
  Form8880FilingInfo &
  Form8863FilingInfo &
  Form1116FilingInfo &
  Form2441FilingInfo;

/*
 * Line 22 subtracts these Schedule 3 lines: 1 through 6z but not 6b (this
 * credit) or 6k (Form 8912), and not 6e, which is reserved
 * (irs-8801-inst-2025::sec::line-22::b01).
 */
const SCHEDULE_3_CREDITS = [
  "schedule-3.0.line.1",
  "schedule-3.0.line.2",
  "schedule-3.0.line.3",
  "schedule-3.0.line.4",
  "schedule-3.0.line.5a",
  "schedule-3.0.line.5b",
  "schedule-3.0.line.6a",
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

/*
 * Schedule 3 lines the engine has no rules for: while the form that feeds one
 * files, line 22 would leave it out. Line 5a is Form 5695 Part I, which the
 * engine does not model (irs-1040-inst-2025::sec::line-5a-residential-clean-energy::b01);
 * a Form 5695 on the return may claim it. Line 6z is left blank for 2025
 * (irs-1040-inst-2025::sec::line-6z::b01).
 */
const UNCOMPUTED_CREDITS: ReadonlyArray<[formId: string, line: string]> = [
  ["form-5695", "Schedule 3 line 5a (Form 5695 Part I, the residential clean energy credit)"],
  ["form-3800", "Schedule 3 line 6a (Form 3800)"],
  ["form-8859", "Schedule 3 line 6h (Form 8859)"],
  ["form-8834", "Schedule 3 line 6i (Form 8834)"],
  ["form-8911", "Schedule 3 line 6j (Form 8911)"],
  ["form-8978", "Schedule 3 line 6l (Form 8978)"],
];

/*
 * Why a credit line 22 subtracts is an engine gap; undefined when each is a
 * number or blank. Schedule 3 lines 5b and 6d and Form 1040 line 19 (Schedule
 * 8812) have no gap of their own that blanks them: the Schedule 8812 one is the
 * adoption credit below (irs-8801-inst-2025::sec::line-22::b01).
 */
function otherCreditsGap(form: Accessor, info: Form8801CreditInfo): string | undefined {
  const files = (formId: string) => info.mustFile?.[formId]?.value === true;
  const uncomputed = UNCOMPUTED_CREDITS.find(([formId]) => files(formId));
  if (uncomputed) return `Line 22 subtracts ${uncomputed[1]}, which the engine does not compute.`;
  const adoption = line6cFrom8839(form, info)?.value;
  const gaps = [
    foreignTaxCreditGap(form, info),
    dependentCareCreditGap(form, info),
    nonrefundableCreditGap(form, info)?.reason,
    creditGap(form, info)?.reason,
    typeof adoption === "object" ? adoption.reason : undefined,
    cleanVehicleCreditGap(form, info),
    mortgageCreditGap(form, info),
  ];
  const gap = gaps.find((reason) => reason !== undefined);
  return gap === undefined
    ? undefined
    : `Line 22 subtracts a credit the engine cannot figure: ${gap}`;
}

/*
 * Line 22 (irs-8801-inst-2025::sec::line-22::b01): Form 1040 line 16 plus
 * Schedule 2 line 1z, less Form 1040 line 19 and the Schedule 3 credits above.
 * "If the result is zero or less, enter -0-."
 */
export function line22Of(form: Accessor, info: Form8801CreditInfo): Value {
  const gap = otherCreditsGap(form, info);
  if (gap !== undefined) return unsupported(gap);
  const line16 = numberOrBlank(form["form-1040.line.16"]);
  if (line16 === undefined) return undefined;
  const tax = line16 + sum(form["schedule-2.0.line.1z_total_lines_1a_through_1y"]);
  const credits = sum(form["form-1040.line.19"], ...SCHEDULE_3_CREDITS.map((id) => form[id]));
  return atLeast(0, tax - credits);
}

const NO_FORM_6251 =
  "Line 23 is 2025 Form 6251 line 9, and Form 6251 does not file (decisions.scope.must_file_6251 is false).";

/* Line 23: 2025 Form 6251 line 9, the tentative minimum tax; a gap there is a gap here. */
export function line23Of(form: Accessor, info: Form8801CreditInfo): Value {
  if (info.mustFile?.["form-6251"]?.value !== true) return unsupported(NO_FORM_6251);
  return line9Of(form, info);
}

/* Line 21 once figured; lines 22–26 follow only when it is above 0 ("If zero or less, stop here"). */
export function line21Of(info: Form8801FilingInfo): Value {
  const priorYear = info.form8801PriorYear;
  if (priorYear?.partII !== undefined) return priorYear.partII.line21;
  const gap = priorYear?.line11Gap ?? priorYear?.line12Gap;
  return gap === undefined ? undefined : unsupported(gap);
}

/* Lines 24–26, or the gap or wait that keeps them blank. */
export function lines24To26Of(
  form: Accessor,
  info: Form8801CreditInfo,
): Lines24To26 | Unsupported | undefined {
  const line21 = line21Of(info);
  if (typeof line21 !== "number") return line21;
  if (line21 <= 0) return undefined;
  const line22 = line22Of(form, info);
  if (typeof line22 !== "number") return line22;
  const line23 = line23Of(form, info);
  if (typeof line23 !== "number") return line23;
  return lines24To26(line21, line22, line23);
}

/*
 * Schedule 3 line 6b: Form 8801 line 25 ("Also enter this amount on your 2025
 * Schedule 3 (Form 1040), line 6b"). Undefined when Form 8801 does not file, so
 * Schedule 3 keeps its old reason; a credit of 0 leaves the line blank.
 */
export function line6bFrom8801(
  form: Accessor,
  info: Form8801CreditInfo,
): { value: Value } | undefined {
  if (info.mustFile?.["form-8801"]?.value !== true) return undefined;
  const lines = lines24To26Of(form, info);
  if (lines === undefined || "unsupported" in lines) return { value: lines };
  return { value: lines.line25 > 0 ? lines.line25 : undefined };
}
