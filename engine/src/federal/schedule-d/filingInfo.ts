import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8949FilingInfo } from "../8949/filingInfo.js";

export interface ScheduleDFilingInfo
  extends BaseFilingInfo, Pick<Form8949FilingInfo, "form8949BoxTotals"> {}
