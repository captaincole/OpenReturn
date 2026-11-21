import type { Form1040FilingInfo } from "../../../federal/1040/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { ScheduleDCaFigures } from "./lines.js";

export interface ScheduleDCaFilingInfo
  extends BaseFilingInfo, Pick<Form1040FilingInfo, "capitalGainDistributionsNoScheduleD"> {
  /* Lines 1 to 9 and 11; present only when Schedule D (540) files. */
  scheduleDCaFigures?: ScheduleDCaFigures;
}
