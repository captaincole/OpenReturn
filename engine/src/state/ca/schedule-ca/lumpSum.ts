/*
 * Line 5b, column B: the lump-sum distribution that Schedule G-1 taxes. The
 * schedule's tax "is added to the regular tax figured on your other income"
 * (ca-540-sched-g1-inst-2025::sec::a-purpose::b01), so the part it taxes leaves
 * California income. Federal AGI holds it on Form 1040 line 5b when Form 4972
 * does not file (irs-4972-form-2025::sec::how-to-report-the-distribution::b01).
 * The Schedule CA instructions do not name this adjustment (QUESTIONS.md of
 * Schedule G-1).
 */

import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";

/* The line's other adjustments (railroad Tier 2 benefits, the three-year rule) are not modeled. */
export const LINE_5B_SUBTRACTIONS_GAP =
  "CA pension/annuity subtraction adjustments (Tier 2 railroad retirement benefits, pre-1987 three-year rule) require RRB-1099-R and specialized pension scenario data not yet ingested.";

const FEDERAL_4972 = unsupported(
  "Federal Form 4972 also files, and it has no rules: the part of the lump-sum distribution that federal AGI leaves out is not known, so the California subtraction is not figured.",
);

export function line5bSubtractions(_: unknown, info: ScheduleCaFilingInfo) {
  const subtraction = info.scheduleG1CaSubtraction;
  if (subtraction === undefined) return unsupported(LINE_5B_SUBTRACTIONS_GAP);
  if (typeof subtraction !== "number") return subtraction;
  if (info.mustFile?.["form-4972"]?.value === true) return FEDERAL_4972;
  return subtraction > 0 ? subtraction : unsupported(LINE_5B_SUBTRACTIONS_GAP);
}
