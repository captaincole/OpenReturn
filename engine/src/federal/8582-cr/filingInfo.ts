import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8582FilingInfo } from "../8582/filingInfo.js";
import type { MagiInfo } from "../8582/magi.js";
import type { Form8834FilingInfo } from "../8834/filingInfo.js";

/*
 * What Form 8582-CR reads besides the lines of other forms: the inputs of
 * Form 8582's modified AGI (lines 10 and 22), its K-1 activities, the MFS
 * caution's answer (lines 6, 13 and 25) and the prior year unallowed
 * qualified electric vehicle credits (Form 8834). Form 3800 reads the same
 * slots, since it figures the allowed passive credit with this form's rules.
 */
export type PassiveLimitInfo = BaseFilingInfo &
  MagiInfo &
  Pick<Form8582FilingInfo, "passiveK1Activities" | "livedApartFromSpouseAllYear"> &
  Pick<Form8834FilingInfo, "electricVehiclePassiveCarryovers">;

export interface Form8582CRFilingInfo extends BaseFilingInfo {}
