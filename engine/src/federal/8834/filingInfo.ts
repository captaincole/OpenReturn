import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Carryover } from "../3800/credits.js";

export interface Form8834FilingInfo extends BaseFilingInfo {
  /*
   * The prior year unallowed qualified electric vehicle credits, one for each
   * passive activity: Form 8582-CR column (b) of Worksheet 1 or 4. Form
   * 8582-CR adds them to Form 3800's passive sources (8582-cr/form.ts), and
   * line 1 is the part it allows.
   */
  electricVehiclePassiveCarryovers?: Carryover[];
}
