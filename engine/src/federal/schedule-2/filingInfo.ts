import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form4137FilingInfo } from "../4137/filingInfo.js";
import type { Form5329FilingInfo } from "../5329/filingInfo.js";

/*
 * Line 5 adds a second Form 4137 (a spouse's) from its filers. Line 8 reads
 * Form 5329 Part I for each person, and whether the form files.
 */
export interface Schedule2FilingInfo
  extends
    BaseFilingInfo,
    Pick<Form4137FilingInfo, "form4137Filers">,
    Pick<Form5329FilingInfo, "earlyDistributionPeople" | "earlyDistributionTaxWithoutForm"> {}
