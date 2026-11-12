/*
 * Schedule CA Part II and Form 540 line 18 outside the itemizing mode: with
 * the federal increased standard deduction a person completes Part II
 * (ca-540-sched-ca-inst-2025::sec::part-ii-adjustments-to-federal-itemized-deductions::b01);
 * Form 4684's gap carries through; otherwise they wait on Form 4684.
 */

import { unsupported, type Unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";

export const PART_II_BY_HAND =
  "With the federal increased standard deduction, federal Schedule A is not completed as if itemizing, so a person completes Schedule CA Part II.";

export function partIIUnsupported(
  info: Pick<ScheduleCaFilingInfo, "increasedStandardDeduction" | "disasterLossGap">,
): Unsupported | undefined {
  if (info.increasedStandardDeduction === true) return unsupported(PART_II_BY_HAND);
  return info.disasterLossGap ? unsupported(info.disasterLossGap) : undefined;
}
