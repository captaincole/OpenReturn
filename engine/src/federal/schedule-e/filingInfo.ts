import type { RentalFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

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

export interface ScheduleEFilingInfo extends BaseFilingInfo {
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
}
