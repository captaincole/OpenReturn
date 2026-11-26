import type { Form8828FactLines } from "./filingInfo.js";
import { modifiedAgi, recaptureLines, type RecaptureLines } from "./lines.js";

export type PartII = RecaptureLines & { line15: number; line16: number };

/*
 * Lines 15 to 23 of one copy. Undefined after a loss on line 13 ("stop here"),
 * while Form 1040 line 11 is not figured, or with no line 16 or 20 (a gap).
 * Line 15 starts from AGI "as shown on line 11 of your Form 1040" and adds the
 * tax-exempt interest of line 2a (irs-8828-inst-2025::sec::line-15::b01).
 */
export function partIILines(
  lines: Form8828FactLines,
  agi: number | undefined,
  taxExemptInterest: number,
): PartII | undefined {
  const { gain, line16, line19, line20, gainIncludedInIncome } = lines;
  if (gain.line14 === undefined || agi === undefined) return undefined;
  if (line16 === undefined || line20 === undefined) return undefined;
  const line15 = modifiedAgi(agi, taxExemptInterest, gainIncludedInIncome);
  const recapture = recaptureLines({ line14: gain.line14, line15, line16, line19, line20 });
  return { ...recapture, line15, line16 };
}
