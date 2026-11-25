import type { Form1040FilingInfo } from "../../../federal/1040/filingInfo.js";
import type { Form4797FilingInfo } from "../../../federal/4797/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { ScheduleDCaFigures } from "./lines.js";

export interface ScheduleDCaFilingInfo
  extends
    BaseFilingInfo,
    Pick<Form1040FilingInfo, "capitalGainDistributionsNoScheduleD">,
    // MANUAL EDIT: lines 12a and 12b are a gap while federal Schedule D line 11 holds a Form 4797 gain.
    Pick<Form4797FilingInfo, "form4797" | "form4797Gap" | "form4797SummaryGap"> {
  /* Lines 1 to 9 and 11; present only when Schedule D (540) files. */
  scheduleDCaFigures?: ScheduleDCaFigures;
}
