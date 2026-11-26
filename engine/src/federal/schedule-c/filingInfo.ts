import type { BusinessFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface ScheduleCFilingInfo extends BaseFilingInfo {
  /* One Schedule C per business (instructions: a separate Schedule C for each business). */
  businesses?: BusinessFactValue[];
  /* The fact key of each business, in the same order (Form 4136 names a business by its key). */
  businessKeys?: string[];
  /* Which business this copy is for (renderCopies sets it); absent means the first. */
  scheduleCCopyIndex?: number;
}
