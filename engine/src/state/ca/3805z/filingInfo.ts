import type {
  CaEnterpriseZoneIncomeItem,
  CaEnterpriseZoneNolCarryover,
} from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { SectionAAmounts } from "./lines.js";

/* The business fact once every answer the form reads is in (resolveInfo.ts). */
export interface EnterpriseZoneBusiness {
  name: string;
  address: string;
  zoneName: string;
  role: "operator" | "investor";
  /* Items E to H: an operator's only. */
  activityCode?: string;
  employeesInZone?: number;
  grossReceipts?: number;
  totalAssetValue?: number;
  /* Worksheet I, Section A: the amounts, "entirely_within_zone", or undefined for an investor. */
  sectionA?: SectionAAmounts | "entirely_within_zone";
  incomeItems: CaEnterpriseZoneIncomeItem[];
  throughDisregardedEntity: boolean;
}

/* What FTB 3805Z reads. A field is undefined while its answer waits. */
export interface EnterpriseZoneInputs {
  business?: EnterpriseZoneBusiness;
  /* Schedule Z line 8B column (b). */
  hiringCarryover?: number;
  /* Schedule Z line 9B column (b). */
  salesTaxCarryover?: number;
  /* Worksheet II column (b). */
  nolCarryovers?: CaEnterpriseZoneNolCarryover[];
}

/*
 * FTB 3805Z reads its inputs here. Schedule P (540), Form 540 lines 43 to 45,
 * Schedule S, FTB 3801-CR and FTB 3804-CR read the credit it lets the return
 * use through creditUsed.ts.
 */
export interface Form3805ZFilingInfo extends BaseFilingInfo {
  /* Undefined when the form does not file. */
  enterpriseZone?: EnterpriseZoneInputs;
}
