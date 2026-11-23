import type { RentalFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import type { PassiveK1Activities } from "../8582/activities.js";
import type { PassThroughEntity } from "../passThrough/items.js";
import type { LimitContext } from "../passThrough/limits.js";

/* Part I has three columns; a fourth property needs a second Schedule E (not modeled). */
export type PropertyColumn = "a" | "b" | "c";

/* One rental or royalty property on this return: a column of Part I. */
export interface RentalProperty {
  factKey: string;
  column: PropertyColumn;
  value: RentalFactValue;
  /* Form 8582: a passive activity; undefined while an answer is missing. */
  passive?: boolean;
}

/* Line 22 reads Form 8582's parts; the MFS caution reads living apart (the 1040 resolver fills it). */
export interface ScheduleEFilingInfo
  extends BaseFilingInfo, Pick<Form1040FilingInfo, "livedApartFromSpouseAllYear"> {
  /* Part I columns A–C, in fact order; undefined with no property. */
  rentalProperties?: RentalProperty[];
  /* More properties than Part I's three columns. */
  rentalPropertiesOverflow?: boolean;
  /* Line A. */
  rentalPaymentsRequire1099?: boolean;
  /* Line B. */
  rentalFiled1099s?: boolean;
  /* Line 43 and Form 8582: the taxpayer or spouse qualified as a real estate professional. */
  realEstateProfessional?: boolean;
  /* Part I is in use: a rental or royalty fact is on the return or waits (line 41 then waits on line 26). */
  partIInUse?: boolean;
  /*
   * Parts II and III: the K-1s on this return, in fact order (passThrough/items.ts).
   * Part II rows take the S corporations and partnerships; Part III the estates and trusts.
   */
  passThroughEntities?: PassThroughEntity[];
  /* What the loss limits read besides the items (passThrough/receipts.ts, limitContextOf). */
  passThroughLimitContext?: LimitContext;
  /*
   * Form 8582 Part V's K-1 rows (passThrough/form8582Rows.ts); line 22 and Form
   * 8582 read them with the properties. Undefined with no partnership K-1.
   */
  passiveK1Activities?: PassiveK1Activities;
}
