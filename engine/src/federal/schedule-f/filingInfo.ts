import type { FarmFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface ScheduleFFilingInfo extends BaseFilingInfo {
  /* One Schedule F per farm, each with its fact key (Form 6198 names the fact it waits on). */
  farms?: Array<{ key: string; value: FarmFactValue }>;
  /* Which farm this copy is for (renderCopies sets it); absent means the first. */
  scheduleFCopyIndex?: number;
}
