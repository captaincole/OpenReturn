import type { BaseFilingInfo } from "../../filingInfo.js";
import type { QbiFilingInfo } from "../qbi/filingInfo.js";

/*
 * The rows are Form 8995-A's Part I businesses; its resolver fills these slots.
 * A rental row reads its Schedule E property (passive, type, prior-year loss).
 */
export interface Form8995AScheduleCFilingInfo
  extends
    BaseFilingInfo,
    Pick<QbiFilingInfo, "qbiBusinesses" | "qbiScheduleSEFiled" | "rentalProperties"> {}
