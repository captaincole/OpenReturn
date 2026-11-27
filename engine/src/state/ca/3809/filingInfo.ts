import type { CaTtaBusinessFactValue, CaTtaIncomeItem } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { ApportionmentInputs, NolRow } from "./lines.js";

/*
 * The stated inputs of FTB 3809, checked. A field is undefined while its
 * answer waits or is not complete.
 */
export interface TtaInputs {
  business?: CaTtaBusinessFactValue;
  /* Worksheet I, Section A; asked of an operator only. */
  apportionment?: ApportionmentInputs;
  /* Worksheet I, Section B. */
  incomeItems?: CaTtaIncomeItem[];
  /* Schedule Z line 8B column (b). */
  hiringCarryover?: number;
  /* Schedule Z line 9B column (b). */
  salesCarryover?: number;
  /* Worksheet II column (b), the rows above 0. */
  nolRows?: NolRow[];
}

/*
 * FTB 3809 reads its inputs here. Form 540 lines 43 to 45, Schedule P (540)
 * Section B2, Schedule S line 2, FTB 3801-CR and FTB 3804-CR read the credit
 * carryovers here too (creditUsed.ts), and Schedule CA (540) line 9b3 reads
 * the form's line 3b.
 */
export interface Form3809FilingInfo extends BaseFilingInfo {
  /* Undefined when the form does not file. */
  tta?: TtaInputs;
}
