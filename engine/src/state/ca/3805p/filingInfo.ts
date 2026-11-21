import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { CaliforniaExclusion } from "./exceptions.js";

export type EarlyDistributionOwner = "taxpayer" | "spouse";

export interface Form3805pFilingInfo extends BaseFilingInfo {
  /**
   * Part I line 1: the taxable part (1099-R box 2a) of every early distribution
   * whose box 7 code claims no exception (not 2, 3 or 4), summed over the return.
   */
  earlyDistributionsInIncome?: number;
  /**
   * The part of line 3 from a SIMPLE IRA in its first two years (box 7 code S,
   * less the part an exception covers): taxed at 6%, not 2½%.
   */
  simpleIraEarlyDistributions?: number;
  /** Line 2: the part of line 1 an exception California allows covers, and its number. */
  earlyDistributionExclusion?: CaliforniaExclusion;
  /**
   * Whose early distributions line 1 holds: the form is per person
   * (ca-3805p-inst-2025::sec::b-who-must-file::b03). Undefined when there are
   * none, or when both spouses have one (two forms are needed).
   */
  earlyDistributionOwner?: EarlyDistributionOwner;
}
