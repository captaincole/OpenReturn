import type { CasualtyEventFact } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form4684FilingInfo extends BaseFilingInfo {
  /** One Form 4684 per casualty or theft event, in the order recorded. */
  casualtyEvents?: CasualtyEventFact[];
  /** The copy being filled: 0 for the first, which also carries lines 13–18. */
  form4684CopyIndex?: number;
}
