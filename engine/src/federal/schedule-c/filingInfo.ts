import type { BusinessFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface ScheduleCFilingInfo extends BaseFilingInfo {
  /* One Schedule C per business (instructions: a separate Schedule C for each business). */
  businesses?: BusinessFactValue[];
  /* Which business this copy is for (renderCopies sets it); absent means the first. */
  scheduleCCopyIndex?: number;
}
