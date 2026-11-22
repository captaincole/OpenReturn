import type { BaseFilingInfo } from "../../filingInfo.js";
import type { RefundAccount } from "./accounts.js";

export interface Form8888FilingInfo extends BaseFilingInfo {
  /*
   * The accounts that split the refund, in the order of their lines; undefined
   * while the form waits for an answer (an account missing or not usable).
   */
  form8888Accounts?: RefundAccount[];
}
