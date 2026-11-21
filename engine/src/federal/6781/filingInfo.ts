import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Line1Row } from "./lines.js";

export interface Form6781FilingInfo extends BaseFilingInfo {
  // Line 1: one row per section 1256 fact, in fact order (amounts not yet rounded).
  section1256Rows?: Line1Row[];
}
