import type { CaPriorYearAmtExclusionsFactValue } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/* FTB 3510 reads the stated 2024 figures; Part II reads Form 540 and Schedule P (540). */
export interface Form3510FilingInfo extends BaseFilingInfo {
  /* Line 28: the 2024 California AMT. */
  caPriorYearAmt?: number;
  /* Line 31: the AMT credit carried from 2024. */
  caPriorYearAmtCreditCarryover?: number;
  /* Part I: the 2024 Schedule P figures; undefined while they wait or are not complete. */
  caPriorYearAmtExclusions?: CaPriorYearAmtExclusionsFactValue;
}
