import {
  lookupAdditionalStandardDeduction,
  lookupStandardDeduction,
} from "../../data/standardDeduction.js";
import type { Form1040FilingInfo } from "./filingInfo.js";

/*
 * 1040 inst. line 12e, Exception 2: MFS and the spouse itemizes → zero.
 * Exception 4 chart: one box per filer born before Jan 2, 1961. MANUAL EDIT:
 * the spouse box counts on joint returns only; blindness boxes are not modeled.
 */
export function standardDeduction(info: Form1040FilingInfo): number | undefined {
  if (info.filingStatus === "married_filing_separately") {
    if (info.spouseItemizesSeparately === undefined) return undefined;
    if (info.spouseItemizesSeparately) return 0;
  }
  if (!info.filingStatus || info.taxpayerBornBeforeJan2_1961 === undefined) return undefined;
  const base = lookupStandardDeduction("federal", 2025, info.filingStatus);
  const joint = info.filingStatus === "married_filing_jointly";
  if (joint && info.spouseBornBeforeJan2_1961 === undefined) return undefined;
  const boxes =
    (info.taxpayerBornBeforeJan2_1961 ? 1 : 0) + (joint && info.spouseBornBeforeJan2_1961 ? 1 : 0);
  const extra = lookupAdditionalStandardDeduction(2025, info.filingStatus);
  return base === undefined || extra === undefined ? undefined : base + boxes * extra;
}

/*
 * Line 14 adds 13b (Schedule 1-A line 38). While Schedule 1-A is filed but
 * line 38 is blank, line 14 waits: adding 0 would understate the deduction.
 */
export function awaitsSchedule1A(info: Form1040FilingInfo, line13b: unknown): boolean {
  return info.mustFile?.["schedule-1-a"]?.value === true && typeof line13b !== "number";
}
