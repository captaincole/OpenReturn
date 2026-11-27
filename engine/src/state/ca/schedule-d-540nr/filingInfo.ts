import type { Form1040FilingInfo } from "../../../federal/1040/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { ScheduleD540NRFigures } from "./lines.js";

export interface ScheduleD540NRFilingInfo
  extends BaseFilingInfo, Pick<Form1040FilingInfo, "capitalGainDistributionsNoScheduleD"> {
  /* Lines 1 to 9 and 11, and the gaps; present only when Schedule D (540NR) files. */
  scheduleD540NRFigures?: ScheduleD540NRFigures;
}
