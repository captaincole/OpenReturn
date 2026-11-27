import type { CaLambraIncomeLine, CaLambraNolCarryover } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/* Items B to H and Worksheet I, Section A, as stated; a field is undefined while it waits. */
export interface LambraBusiness {
  businessName?: string;
  businessAddress?: string;
  lambraName?: string;
  /* True: a sole proprietor who completes items E to H; false: an investor (items A to D). */
  operatesBusiness: boolean;
  principalBusinessActivityCode?: string;
  employees?: number;
  grossReceipts?: number;
  totalAssets?: number;
  /* Worksheet I, Section A line 4 (FTB 3807 line 2); undefined when no Section A is stated. */
  apportionment?: number;
}

/* One Worksheet I, Section B row with its column (b) settled. */
export interface LambraIncomeRow {
  line: CaLambraIncomeLine;
  amount: number;
  percentage: number;
}

/*
 * FTB 3807 reads its inputs here. Schedule P (540), Form 540 lines 43 to 45,
 * Schedule S line 2 and Schedule CA (540) line 9b3 read the form's lines
 * through the form accessor (creditUsed.ts).
 */
export interface Form3807FilingInfo extends BaseFilingInfo {
  /* The business; undefined while it waits or when the form does not file. */
  lambraBusiness?: LambraBusiness;
  /* Worksheet I, Section B line 14; undefined while a row or Section A waits. */
  lambraBusinessIncome?: number;
  /* Schedule Z line 8B column (b), as stated; undefined while it waits. */
  lambraHiringCarryover?: number;
  /* Schedule Z line 9B column (b), as stated; undefined while it waits. */
  lambraSalesUseCarryover?: number;
  /* Worksheet II lines 8a to 8m, as stated; undefined while it waits. */
  lambraNolCarryovers?: CaLambraNolCarryover[];
}
