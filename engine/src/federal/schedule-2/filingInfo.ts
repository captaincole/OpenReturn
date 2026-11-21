import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form5329FilingInfo } from "../5329/filingInfo.js";

/* Line 8 reads Form 5329 Part I for each person, and whether the form files. */
export interface Schedule2FilingInfo
  extends
    BaseFilingInfo,
    Pick<Form5329FilingInfo, "earlyDistributionPeople" | "earlyDistributionTaxWithoutForm"> {}
