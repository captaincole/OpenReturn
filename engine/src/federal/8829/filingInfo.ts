import type { BusinessFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8829FilingInfo extends BaseFilingInfo {
  /* The businesses with a home office by actual expenses: one Form 8829 each. */
  form8829Businesses?: BusinessFactValue[];
  /* Which business this copy is for (renderCopies sets it); absent means the first. */
  form8829CopyIndex?: number;
}
