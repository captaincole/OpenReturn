/*
 * Form 8859's Tax Liability Limit Worksheet—Line 2 and the lines of other forms
 * that take line 3. The worksheet reads other forms by full field id, so any
 * form's accessor works. Each export takes the merged FilingInfo, which holds
 * every slot the credits before this one read.
 */

import type { FormAccessor } from "../../defineForm.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import { numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { foreignTaxCreditGap } from "../1116/credit.js";
import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import { dependentCareCreditGap } from "../2441/creditGap.js";
import type { Form2441FilingInfo } from "../2441/filingInfo.js";
import { files2555 } from "../2555/results.js";
import { mortgageCreditGap, type CreditLimitInfo } from "../8396/creditGap.js";
import { line6cFrom8839 } from "../8839/receivers.js";
import { nonrefundableCreditGap } from "../8863/credit.js";
import type { Form8863FilingInfo } from "../8863/filingInfo.js";
import { creditGap } from "../8880/credit.js";
import type { Form8880FilingInfo } from "../8880/filingInfo.js";
import { cleanVehicleCreditGap } from "../8936/credit.js";
import { line6lGap } from "../8978/receivers.js";
import { worksheetBLine14 } from "../schedule-8812/worksheetB.js";
import type { Form8859FilingInfo } from "./filingInfo.js";
import {
  carryforwardFrom2024,
  form8859Lines,
  taxLiabilityLimit,
  type Form8859Lines,
  type TaxLiabilityLimit,
} from "./lines.js";

type Lines = FormAccessor<object>;
type Result<T> = T | Unsupported | undefined;

export type Form8859CreditInfo = Form8859FilingInfo &
  CreditLimitInfo &
  Form1116FilingInfo &
  Form2441FilingInfo &
  Form8863FilingInfo &
  Form8880FilingInfo;

/* The evaluator passes every form the merged FilingInfo, which holds these slots. */
const asInfo = (info: BaseFilingInfo) => info as Form8859CreditInfo;

export const form8859Files = (info: BaseFilingInfo): boolean =>
  info.mustFile?.["form-8859"]?.value === true;

export const isUnsupported = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/*
 * Worksheet line 2 lists Schedule 3 lines 1, 2, 3, 4, 5b, 6c, 6d, 6f, 6g, 6l and
 * 6m and Form 1040 line 19 (tax-liability-limit-worksheet-line-2::b01). A gap in
 * one of them is a gap here: the total would leave a credit out.
 */
function otherCreditsGap(form: Lines, info: Form8859CreditInfo): string | undefined {
  const adoption = line6cFrom8839(form, info)?.value;
  const gaps = [
    line6lGap(info),
    foreignTaxCreditGap(form, info),
    dependentCareCreditGap(form, info),
    nonrefundableCreditGap(form, info)?.reason,
    creditGap(form, info)?.reason,
    cleanVehicleCreditGap(form, info),
    mortgageCreditGap(form, info),
    isUnsupported(adoption) ? adoption.reason : undefined,
  ];
  return gaps.find((reason) => reason !== undefined);
}

/*
 * The child tax credit amount of worksheet line 2: Form 1040 line 19, or "the
 * amount from line 14 of Credit Limit Worksheet B ... if the Instructions for
 * Schedule 8812 (Form 1040) direct you to complete Credit Limit Worksheet B"
 * (irs-8859-form-2025::sec::line-4::b01). They do with this credit, no Form
 * 2555 and Schedule 8812 line 4 above 0 (irs-1040s8-inst-2025::sec::line-13::b01).
 * With Form 2555 it is line 19; Schedule 8812 line 13 then leaves line 6h out
 * (Worksheet A line 4 is -0-, line-21::b03), so the read makes no cycle.
 */
function childCredit(form: Lines, info: Form8859CreditInfo): Result<number> {
  const children = sum(form["schedule-8812.0.line.4_qualifying_children_under_17"]) > 0;
  if (!children || files2555(info)) return sum(form["form-1040.line.19"]);
  const line14 = worksheetBLine14(form, info);
  return isUnsupported(line14)
    ? unsupported(`Credit Limit Worksheet B line 14: ${line14.reason}`)
    : line14;
}

/* The Tax Liability Limit Worksheet, or why the engine cannot figure it; undefined while it waits. */
export function taxLiabilityLimitOf(form: Lines, info: BaseFilingInfo): Result<TaxLiabilityLimit> {
  const slots = asInfo(info);
  const gap = otherCreditsGap(form, slots);
  if (gap !== undefined) {
    return unsupported(`Line 2 of the Tax Liability Limit Worksheet takes ${gap}`);
  }
  const child = childCredit(form, slots);
  if (isUnsupported(child)) {
    return unsupported(`Line 2 of the Tax Liability Limit Worksheet takes ${child.reason}`);
  }
  if (child === undefined) return undefined;
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  if (line18 === undefined) return undefined;
  const otherCredits = sum(
    form["schedule-3.0.line.6l"],
    form["schedule-3.0.line.1"],
    form["schedule-3.0.line.2"],
    form["schedule-3.0.line.6d"],
    form["schedule-3.0.line.3"],
    form["schedule-3.0.line.4"],
    form["schedule-3.0.line.5b"],
    form["schedule-3.0.line.6m"],
    form["schedule-3.0.line.6f"],
    child,
    form["schedule-3.0.line.6g"],
    form["schedule-3.0.line.6c"],
  );
  return taxLiabilityLimit(line18, otherCredits);
}

/* Line 1, blank while the carryforward is not recorded. */
export function line1Of(info: BaseFilingInfo): number | undefined {
  const stated = asInfo(info).dcHomebuyerCarryforward;
  return stated === undefined ? undefined : carryforwardFrom2024(stated);
}

/* Lines 1 to 4, or why line 2 cannot be figured; undefined while an input waits. */
export function form8859LinesOf(form: Lines, info: BaseFilingInfo): Result<Form8859Lines> {
  const line1 = line1Of(info);
  const limit = taxLiabilityLimitOf(form, info);
  if (line1 === undefined || limit === undefined) return undefined;
  if (isUnsupported(limit)) return limit;
  return form8859Lines(line1, limit);
}

/* Why line 3 is an engine gap while Form 8859 files; undefined when it is not. */
export function homebuyerCreditGap(form: Lines, info: BaseFilingInfo): string | undefined {
  if (!form8859Files(info)) return undefined;
  const limit = taxLiabilityLimitOf(form, info);
  return isUnsupported(limit) ? limit.reason : undefined;
}

/*
 * Schedule 3 line 6h: "Include this amount [line 3] on Schedule 3 (Form 1040),
 * line 6h" (irs-8859-form-2025::sec::face-page-1::b01). Undefined when Form 8859
 * does not file, so Schedule 3 keeps the reason the line had before.
 */
export function line6hFrom8859(
  form: Lines,
  info: BaseFilingInfo,
): { value: number | Unsupported | undefined } | undefined {
  if (!form8859Files(info)) return undefined;
  const lines = form8859LinesOf(form, info);
  if (lines === undefined || isUnsupported(lines)) return { value: lines };
  return { value: lines.line3 };
}
