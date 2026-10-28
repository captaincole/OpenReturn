import {
  lookupAdditionalStandardDeduction,
  lookupStandardDeduction,
} from "../../data/standardDeduction.js";
import type { Form1040FilingInfo } from "./filingInfo.js";

/*
 * 1040 inst. line 12e, Exception 2: MFS and the spouse itemizes → zero.
 * The blindness and spouse boxes of line 12d are not modeled.
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
 * The senior deduction (Schedule 1-A → line 13b) is not modeled, so line 14
 * stays blank for a filer who may claim it. MFS filers cannot.
 */
export function mayClaimSeniorDeduction(info: Form1040FilingInfo): boolean {
  return (
    info.taxpayerBornBeforeJan2_1961 === true && info.filingStatus !== "married_filing_separately"
  );
}
