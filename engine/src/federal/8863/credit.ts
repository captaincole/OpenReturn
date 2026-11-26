/*
 * Parts I and II and the Credit Limit Worksheet, from Part III and the return.
 * Every function reads cross-form fields by their full id, so Form 1040 and
 * Schedule 3 can call the gap tests with their own accessors.
 */

import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { foreignTaxCreditGap } from "../1116/credit.js";
import type { Form8863Figured, Form8863FilingInfo } from "./filingInfo.js";
import {
  creditLimitLines,
  partIILines,
  partILines,
  type CreditLimitLines,
  type PartIILines,
  type PartILines,
} from "./lines.js";

/* Any form's accessor: these functions read fields by their full id only. */
export type Accessor = { readonly [fieldId: string]: unknown };
type Result<T> = T | Unsupported | undefined;

export const LINE_8_ID = "form-8863.0.line.8_refundable_american_opportunity_credit";
export const LINE_19_ID = "form-8863.0.line.19_nonrefundable_education_credits";

const SEPARATE_RETURN_GAP =
  "A married filing separately return cannot take an education credit (irs-8863-inst-2025::sec::who-can-claim-an-education-credit::b03); lines 2 and 13 have no amount for it.";
const MAGI_GAP =
  "Lines 3 and 14 must add back the income excluded on Form 2555 or Form 4563 (irs-8863-inst-2025::sec::line-3::b01, Pub. 970 Worksheet 2-1), and these lines do not add it back yet.";
const FORM_8978_GAP =
  "Credit Limit Worksheet line 5 adds Schedule 3 line 6l (Form 8978), which the engine does not compute.";

const files = (info: Form8863FilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/* The return's figures, once the form files and the filing status is known. */
function returnOf(info: Form8863FilingInfo): Result<{ figured: Form8863Figured; joint: boolean }> {
  const figured = info.form8863;
  if (figured === undefined || figured.studentsMissing || info.filingStatus === undefined) {
    return undefined;
  }
  if (info.filingStatus === "married_filing_separately") return unsupported(SEPARATE_RETURN_GAP);
  return { figured, joint: info.filingStatus === "married_filing_jointly" };
}

/* Lines 3 and 14: Form 1040 line 11b; a gap with Form 2555 or 4563. */
function magiOf(form: Accessor, info: Form8863FilingInfo): Result<number> {
  if (files(info, "form-2555") || files(info, "form-4563")) return unsupported(MAGI_GAP);
  return numberOrBlank(form["form-1040.line.11b"]);
}

const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/*
 * Part I; undefined when no student takes the American opportunity credit (the
 * part stays blank) or while an input waits. A line 7 answer that waits leaves
 * lines 7–9 blank.
 */
export function partIOf(form: Accessor, info: Form8863FilingInfo): Result<PartILines> {
  const ret = returnOf(info);
  if (ret === undefined || isGap(ret)) return ret;
  if (!ret.figured.americanOpportunity) return undefined;
  const magi = magiOf(form, info);
  if (magi === undefined || isGap(magi)) return magi;
  const { refund } = ret.figured;
  const refundable = refund.kind === "waits" ? undefined : refund.kind === "refundable";
  return partILines(ret.figured.line1, magi, ret.joint, refundable);
}

/* Part II through line 18; line 10 zero needs no MAGI ("skip lines 11 through 17"). */
export function partIIOf(form: Accessor, info: Form8863FilingInfo): Result<PartIILines> {
  const ret = returnOf(info);
  if (ret === undefined || isGap(ret)) return ret;
  if (ret.figured.line10 === 0) return partIILines(0, 0, ret.joint);
  const magi = magiOf(form, info);
  if (magi === undefined || isGap(magi)) return magi;
  return partIILines(ret.figured.line10, magi, ret.joint);
}

/* Schedule 3 lines the worksheet's line 5 adds but the engine does not compute, or a gap in line 1. */
function creditsGap(form: Accessor, info: Form8863FilingInfo): string | undefined {
  const foreignTax = foreignTaxCreditGap(form, info);
  if (foreignTax !== undefined) return `Credit Limit Worksheet line 5 adds ${foreignTax}`;
  return files(info, "form-8978") ? FORM_8978_GAP : undefined;
}

/*
 * Line 9 as the worksheet's line 2 reads it: 0 when Part I is blank (no
 * American opportunity credit) or line 4 stops it; undefined while it waits.
 */
function line9Of(form: Accessor, info: Form8863FilingInfo): Result<number> {
  if (info.form8863?.americanOpportunity !== true) return 0;
  const partI = partIOf(form, info);
  if (partI === undefined || isGap(partI)) return partI;
  if (partI.credit && partI.line9 === undefined) return undefined;
  return partI.line9 ?? 0;
}

/* The Credit Limit Worksheet, once lines 9 and 18 are figured. */
export function worksheetOf(form: Accessor, info: Form8863FilingInfo): Result<CreditLimitLines> {
  const partII = partIIOf(form, info);
  if (partII === undefined || isGap(partII)) return partII;
  const line9 = line9Of(form, info);
  if (line9 === undefined || isGap(line9)) return line9;
  const gap = creditsGap(form, info);
  if (gap !== undefined) return unsupported(gap);
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  if (line18 === undefined) return undefined;
  return creditLimitLines(partII.line18, line9, line18, [
    form["schedule-3.0.line.1"],
    form["schedule-3.0.line.2"],
    form["schedule-3.0.line.6d"],
    form["schedule-3.0.line.6l"],
  ]);
}

/* Form 1040 line 29 when Form 8863 line 8 is not a number: the gap that kept it blank. */
export function refundableCreditGap(form: Accessor, info: Form8863FilingInfo): Result<never> {
  if (!files(info, "form-8863")) return undefined;
  const partI = partIOf(form, info);
  return isGap(partI) ? partI : undefined;
}

/* Schedule 3 line 3 when Form 8863 line 19 is not a number: the gap that kept it blank. */
export function nonrefundableCreditGap(form: Accessor, info: Form8863FilingInfo): Result<never> {
  if (!files(info, "form-8863")) return undefined;
  const worksheet = worksheetOf(form, info);
  return isGap(worksheet) ? worksheet : undefined;
}
