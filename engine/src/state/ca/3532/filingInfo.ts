import type { CaHohMaritalStatus, LivedWithSpousePeriod } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { QualifyingPerson } from "./qualifyingPerson.js";

export interface Form3532FilingInfo extends BaseFilingInfo {
  /** Line 1: the stated marital status (filing_status.ca_hoh_marital_status). */
  hohMaritalStatus?: CaHohMaritalStatus;
  /** Line 1f: the periods the taxpayer lived with the spouse/RDP. */
  livedWithSpousePeriods?: LivedWithSpousePeriod[];
  /** Lines 2–5: the qualifying person, a dependent fact. */
  hohQualifyingPerson?: QualifyingPerson;
  /** Why the engine cannot name the qualifying person (lines 2–5 are then unsupported). */
  hohQualifyingPersonGap?: string;
}
