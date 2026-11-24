import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8621FilingInfo } from "../8621/filingInfo.js";
import type { Form8814FilingInfo } from "../8814/filingInfo.js";
import type { Receipt } from "../passThrough/receipts.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";

/* Line 7 reads Form 8814's totals; lines 5b and 6 read Form 8621's. */
export interface Form8960FilingInfo
  extends
    BaseFilingInfo,
    Pick<Form8814FilingInfo, "form8814Totals">,
    Pick<Form8621FilingInfo, "form8621Totals"> {
  /** Every Schedule C business has line G "Yes" (materially participated): its income is nonpassive. */
  scheduleCNonpassive?: boolean;
  /** Line 4b: the Schedule E Part I properties, when Schedule E files. */
  rentalProperties?: RentalProperty[];
  /** Line 9b: the part of the deducted Schedule A state and local taxes (line 5e, after the cap) allocated to NII (the taxpayer's answer). */
  stateLocalTaxAllocableToInvestmentIncome?: number;
  /** Line 10: additional deductions or modifications properly allocable to NII (the taxpayer's answer). */
  additionalModifications?: number;
  /** Line 4b: the K-1 trade or business items on Schedule E Part II (the schedule_e_part_ii route). */
  passThroughBusiness?: Receipt;
  /** Lines 7 and 13: each K-1's net investment income adjustment (Schedule K-1 (Form 1041) box 14 code H). */
  passThroughNetInvestmentAdjustment?: Receipt;
}
