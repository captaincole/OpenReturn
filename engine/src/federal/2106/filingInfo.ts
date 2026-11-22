import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form2106PartI } from "./lines.js";
import type { VehicleLines } from "./vehicle.js";

/* One printed Form 2106. */
export interface Form2106Copy {
  owner: "taxpayer" | "spouse";
  occupation: string;
  partI: Form2106PartI;
  /* Part II columns (a) and (b). */
  vehicles: VehicleLines[];
  line22?: number;
  /* Lines 18–21, as the person answers them. */
  vehicleAvailableOffDuty?: boolean;
  anotherVehicleAvailable?: boolean;
  hasEvidence?: boolean;
  evidenceIsWritten?: boolean;
}

/* Every filed Form 2106's results, for the forms that take them. */
export interface Form2106Totals {
  /* Schedule 1 line 12: reservists (limited) and fee-basis officials. */
  scheduleOne: number;
  /* Schedule 1 line 12: qualified performing artists who pass tests 1–3; test 4 (AGI) is the line's. */
  performingArts: number;
  /* Schedule A line 16: impairment-related work expenses. */
  impairment: number;
  /* Form 1040 line 1a: line 7 more than line 6 in column A. */
  excessReimbursement: number;
  /* A line 28 depreciation amount on any form (Schedule CA line 12 columns B and C). */
  depreciation: boolean;
}

export interface Form2106FilingInfo extends BaseFilingInfo {
  /* The one Form 2106 the engine prints; undefined with none or with a gap. */
  form2106?: Form2106Copy;
  /* Why the printed form's lines are unsupported. */
  form2106Gap?: string;
  form2106Totals?: Form2106Totals;
  /* Why the totals cannot be figured. */
  form2106TotalsGap?: string;
}
