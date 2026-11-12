import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import type { Schedule1FilingInfo } from "../schedule-1/filingInfo.js";
import type { ScheduleEFilingInfo } from "../schedule-e/filingInfo.js";

/* Parts IV and V read Schedule E's properties; the MFS caution reads living apart. */
export interface Form8582FilingInfo
  extends
    BaseFilingInfo,
    Pick<ScheduleEFilingInfo, "rentalProperties" | "rentalPropertiesOverflow">,
    Pick<Form1040FilingInfo, "livedApartFromSpouseAllYear">,
    // MANUAL EDIT: line 6 waits for a business's Schedule 1 line 3, as line 10 does.
    Pick<Schedule1FilingInfo, "hasBusiness"> {
  // MANUAL EDIT: line 6. W-2 box 12 code T total; undefined with none.
  adoptionBenefits?: number;
}
