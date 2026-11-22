/*
 * The lines of other forms that take this form's results. Each returns
 * undefined when Form 8839 does not file, so the caller keeps the reason the
 * line had before Form 8839 had rules.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import { unsupported, type Unsupported } from "../../types.js";
import { form1040Line1f } from "./partIII.js";
import {
  creditLimitOf,
  form8839Files,
  partIIIOf,
  partIIOf,
  SOCIAL_SECURITY_GAP,
  socialSecurityWithExclusion,
  type Info8839,
  type LineReader,
} from "./results.js";

type Received = { value: number | Unsupported | undefined } | undefined;

/* The evaluator passes every form the merged FilingInfo, which holds this form's slots. */
const asInfo = (info: BaseFilingInfo) => info as Info8839;

function received<R extends object>(
  info: BaseFilingInfo,
  result: R | Unsupported | undefined,
  pick: (part: R) => number | undefined,
): Received {
  if (!form8839Files(asInfo(info))) return undefined;
  if (result === undefined || "unsupported" in result) return { value: result };
  return { value: pick(result) };
}

/* Form 1040 line 1f: Form 8839 line 31 (irs-1040-inst-2025::sec::line-1f::b01). */
export function line1fFrom8839(form: LineReader, info: BaseFilingInfo): Received {
  return received(info, partIIIOf(form, asInfo(info)), (part) => form1040Line1f(part.line31));
}

/* Form 1040 line 30: Form 8839 line 13 (the blank form, line 13). */
export function line30From8839(form: LineReader, info: BaseFilingInfo): Received {
  return received(info, partIIOf(form, asInfo(info)), (part) => part.line13);
}

/* Schedule 3 line 6c: Form 8839 line 18 (the blank form, line 18). */
export function line6cFrom8839(form: LineReader, info: BaseFilingInfo): Received {
  return received(info, creditLimitOf(form, asInfo(info)), (limit) => limit.line18);
}

/* Form 1040 line 6b's gap when the Pub. 915 worksheet applies; undefined otherwise. */
export function socialSecurityGapFrom8839(info: BaseFilingInfo): Unsupported | undefined {
  return socialSecurityWithExclusion(asInfo(info)) ? unsupported(SOCIAL_SECURITY_GAP) : undefined;
}
