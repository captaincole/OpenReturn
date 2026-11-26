/*
 * Schedule 3 Part II as line 15 adds it: "Add lines 9 through 12 and 14".
 * Schedule 3 and Form 1040 line 31 ("Amount from Schedule 3, line 15") both
 * call partTwoTotal, so the two lines cannot differ. Lines 10, 11 and 12 come
 * from the filing info, and line 9 from Form 8962 only when that form files:
 * a read of a Schedule 3 field from Form 1040 tripled the evaluation time of
 * every return with a Schedule 3 (federal/4136/QUESTIONS.md, doubt 9).
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import { numberOrBlank, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { line12From4136 } from "../4136/receivers.js";
import type { Schedule3PartTwoInfo } from "./filingInfo.js";

type Accessor = { readonly [fieldId: string]: unknown };
type Line = number | Unsupported | undefined;

export const NET_PTC_ID = "form-8962.0.line.26_net_ptc";
const EXCESS_ADVANCE_PTC_ID = "form-8962.0.line.27_excess_advance_ptc";

/*
 * Line 9: "If the premium tax credit you can claim exceeds your advance credit
 * payments, your net premium tax credit will be shown on Form 8962, line 26.
 * Enter that amount, if any, on line 9" (irs-1040-inst-2025::sec::line-9-3::b02).
 * Blank when Form 8962 does not file, and for 0.
 */
export function line9From8962(form: Accessor, info: BaseFilingInfo): number | undefined {
  if (info.mustFile?.["form-8962"]?.value !== true) return undefined;
  const net = numberOrBlank(form[NET_PTC_ID]);
  return net !== undefined && net > 0 ? net : undefined;
}

/* Line 10: the payment with an extension (irs-1040-inst-2025::sec::line-10-4::b01). */
export const line10 = (info: BaseFilingInfo): number | undefined =>
  (info as Schedule3PartTwoInfo).schedule3ExtensionPayment;

/* Line 11: the excess social security tax (excessSocialSecurity.ts), or its gap. */
export function line11(info: BaseFilingInfo): Line {
  const own = info as Schedule3PartTwoInfo;
  if (own.schedule3ExcessSocialSecurityGap !== undefined) {
    return unsupported(own.schedule3ExcessSocialSecurityGap);
  }
  return own.schedule3ExcessSocialSecurity;
}

/*
 * A line that files and is still blank while it waits: Form 4136 line 17
 * waiting for a registration number, or Form 8962 with neither line 26 nor
 * line 27 figured. Line 15 waits with it rather than add the other lines alone.
 */
function partTwoWaits(form: Accessor, info: BaseFilingInfo): boolean {
  const fuel = line12From4136(info);
  if (fuel !== undefined && fuel.value === undefined) return true;
  if (info.mustFile?.["form-8962"]?.value !== true) return false;
  return (
    numberOrBlank(form[NET_PTC_ID]) === undefined &&
    numberOrBlank(form[EXCESS_ADVANCE_PTC_ID]) === undefined
  );
}

/*
 * Line 15. Line 14 adds lines 13a to 13z, which have no rules and no facts, so
 * no line 13 item is known to apply and line 14 counts as none. A gap on line
 * 11 or 12 is a gap here; blank when every line is blank or one waits.
 */
export function partTwoTotal(form: Accessor, info: BaseFilingInfo): Line {
  const line12 = line12From4136(info)?.value;
  const lines: Line[] = [line9From8962(form, info), line10(info), line11(info), line12];
  const gap = lines.find((line) => typeof line === "object");
  if (gap !== undefined) return gap;
  return partTwoWaits(form, info) ? undefined : sumOrBlank(...lines);
}
