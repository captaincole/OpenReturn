import type { CaNolCarryoverRow } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { ScheduleDCaFigures } from "../schedule-d-ca/lines.js";

/* What FTB 3805V reads besides other forms' lines; resolve3805VInfo fills it. */
export interface Form3805VFigures {
  /* Part III line 2: last year's rows with a carryover, in the order stated; [] when none. */
  priorRows: CaNolCarryoverRow[];
  /*
   * Schedule D (540) lines 1 to 11 figured from the return's sales, also when
   * Schedule D (540) does not file (lines 4, 5, 13, 14, 18 and 19).
   */
  capital: ScheduleDCaFigures;
  /* A business loss on the return comes from a K-1 (Part III line 4 column (b) names the entity). */
  lossFromPassThrough: boolean;
  /* Why the engine cannot fill the form on this return (Form 540NR), else undefined. */
  gap?: string;
}

export interface Form3805VFilingInfo extends BaseFilingInfo {
  /* Undefined when FTB 3805V does not file. */
  form3805v?: Form3805VFigures;
}
