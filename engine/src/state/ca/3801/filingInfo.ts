import type { Form8582FilingInfo } from "../../../federal/8582/filingInfo.js";
import type { MagiInfo } from "../../../federal/8582/magi.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Form3801Figures } from "./formScope.js";

/*
 * Line 6 takes federal Form 8582 line 6 (magi.ts reads its slots); line 5 and
 * Parts IV and V read living apart; the federal amounts on Side 2 read Schedule
 * E's properties and Form 8582's rows.
 */
export interface Form3801FilingInfo
  extends
    BaseFilingInfo,
    MagiInfo,
    Pick<
      Form8582FilingInfo,
      "livedApartFromSpouseAllYear" | "rentalPropertiesOverflow" | "passiveK1Activities"
    > {
  /* The California figures (formScope.ts); undefined on a return with no California form. */
  form3801Figures?: Form3801Figures;
}
