import type { PassiveLimitInfo } from "../../../federal/8582-cr/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Form3801FilingInfo } from "../3801/filingInfo.js";
import type { CaPassiveSource } from "./sources.js";

export interface Form3801CRFilingInfo extends BaseFilingInfo {
  /* The worksheet rows, in the order of the facts; empty when the form does not file. */
  caPassiveCreditSources?: CaPassiveSource[];
}

/*
 * What the form reads besides its rows: line 10 takes federal modified AGI
 * as federal Form 8582-CR line 10 builds it (its slots), and line 6 the
 * California passive activities of FTB 3801 when that form does not file.
 */
export type Form3801CRInfo = Form3801CRFilingInfo &
  PassiveLimitInfo &
  Pick<Form3801FilingInfo, "form3801Figures">;
