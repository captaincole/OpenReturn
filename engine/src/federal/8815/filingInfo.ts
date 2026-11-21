import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Line6Worksheet, PhaseOutLimits } from "./lines.js";

/* One row of line 1: column (a) and the two lines of column (b). */
export interface Line1Row {
  studentName: string;
  institutionName: string;
  institutionAddress: string;
}

export interface SavingsBondExclusion {
  rows: Line1Row[];
  /* Lines 2 and 3, whole dollars. */
  line2: number;
  line3: number;
  /* The Line 6 Worksheet over the qualified bonds; undefined when none was cashed. */
  worksheet?: Line6Worksheet;
  /* Line 10 and the line 12 divisor; undefined while the filing status is missing or married filing separately. */
  limits?: PhaseOutLimits;
  marriedFilingSeparately: boolean;
  /* Why the engine cannot figure line 9 (line9Gaps.ts); lines 9 and 11–14 are unsupported then. */
  line9Gap?: string;
}

export interface Form8815FilingInfo extends BaseFilingInfo {
  savingsBondExclusion?: SavingsBondExclusion;
}
