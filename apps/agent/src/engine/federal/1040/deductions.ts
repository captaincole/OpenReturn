/*
 * Form 1040 lines 12e and 14 rules (2025 instructions): the standard
 * deduction, and when the senior deduction blocks line 14.
 */

import {
  lookupAdditionalStandardDeduction,
  lookupStandardDeduction,
} from "../../data/standardDeduction.js";
import type { Form1040FilingInfo } from "./filingInfo.js";

/*
 * Line 12e when the filer does not itemize. Undefined blocks the line.
 * Exception 2: MFS and the spouse itemizes → zero, even when born before
 * 1961. A line 12d box (born before January 2, 1961) adds the amount from
 * the chart; blindness and the spouse boxes are not modeled.
 */
export function standardDeduction(info: Form1040FilingInfo): number | undefined {
  if (info.filingStatus === "married_filing_separately") {
    if (info.spouseItemizesSeparately === undefined) return undefined;
    if (info.spouseItemizesSeparately) return 0;
  }
  if (!info.filingStatus || info.taxpayerBornBeforeJan2_1961 === undefined) return undefined;
  const base = lookupStandardDeduction("federal", 2025, info.filingStatus);
  const boxes = info.taxpayerBornBeforeJan2_1961 ? 1 : 0;
  const extra = lookupAdditionalStandardDeduction(2025, info.filingStatus);
  return base === undefined || extra === undefined ? undefined : base + boxes * extra;
}

/*
 * A filer born before January 2, 1961 who is not MFS may qualify for the
 * enhanced deduction for seniors (Schedule 1-A → line 13b, up to $6,000),
 * which is not modeled. Line 14 stays blank for them. MFS filers cannot
 * claim it.
 */
export function mayClaimSeniorDeduction(info: Form1040FilingInfo): boolean {
  return (
    info.taxpayerBornBeforeJan2_1961 === true && info.filingStatus !== "married_filing_separately"
  );
}
