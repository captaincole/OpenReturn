/*
 * One fact per rental real estate or royalty property (Schedule E Part I), plus
 * three answers for the whole return. The taxpayer states these answers; Cade
 * records a property with the record-rental tool, whose schema checks the
 * amounts. readRentalFacts checks them again, because a fact can also be written
 * by hand. Form 8582 reads the passive activity answers.
 */

import { isActivityDepreciation, type ActivityDepreciation } from "./depreciation.js";

type FactRow = { key: string; value: unknown; category: string };

/* Schedule E line 1b, "Type of Property", codes 1–8. */
export type RentalPropertyType =
  | "single_family" // 1
  | "multi_family" // 2
  | "vacation_short_term" // 3
  | "commercial" // 4
  | "land" // 5
  | "royalties" // 6
  | "self_rental" // 7
  | "other"; // 8

/* Schedule E lines 5–19, one amount each. */
export interface RentalExpenses {
  advertising?: number; // 5
  autoAndTravel?: number; // 6
  cleaningAndMaintenance?: number; // 7
  commissions?: number; // 8
  insurance?: number; // 9
  legalAndProfessional?: number; // 10
  managementFees?: number; // 11
  mortgageInterest?: number; // 12 (paid to banks, etc.)
  otherInterest?: number; // 13
  repairs?: number; // 14
  supplies?: number; // 15
  taxes?: number; // 16
  utilities?: number; // 17
  depreciationOrDepletion?: number; // 18 (Form 4562)
  other?: number; // 19
  otherDescription?: string; // 19 (list)
}

/*
 * How a royalty counts under the passive activity rules. Most royalties are
 * portfolio income (not on Form 8582). A royalty from a trade or business is
 * passive unless the owner materially participated in it.
 */
export type RoyaltyActivityKind = "portfolio" | "passive" | "nonpassive";

export interface RentalFactValue {
  /* On a joint return, whose property it is. */
  owner?: "taxpayer" | "spouse" | "joint";
  /* Line 1b. */
  propertyType: RentalPropertyType;
  /* Line 1b, type 8: the statement that describes the property. */
  otherTypeDescription?: string;
  /* Line 1a. A royalty property may have no street address. */
  address?: { street: string; city: string; state: string; zip: string };
  /* Line 2: days rented at fair rental value, and days of personal use. */
  fairRentalDays?: number;
  personalUseDays?: number;
  /* Line 2: the spouses elect to treat it as a qualified joint venture. */
  qualifiedJointVenture?: boolean;
  /* Line 3. */
  rentsReceived?: number;
  /* Line 4. */
  royaltiesReceived?: number;
  expenses?: RentalExpenses;
  /* Line 18 through Form 4562 (assets placed in service in 2025); expenses.depreciationOrDepletion is then left out. */
  depreciation?: ActivityDepreciation;
  /* Form 8582: the owner actively participated (the $25,000 special allowance). */
  activeParticipation?: boolean;
  /* Form 8582 and Schedule E line 43: the owner materially participated. */
  materiallyParticipated?: boolean;
  /* Schedule E line 21 and Form 6198: all of the investment is at risk. */
  allInvestmentAtRisk?: boolean;
  /* Form 8582: losses from this activity not allowed in earlier years. */
  priorYearUnallowedLoss?: number;
  /* Form 8582 Part IV column (c): the owner also actively participated in the year that loss arose. */
  activeParticipationWhenLossArose?: boolean;
  /* Form 8582: the average period of customer use, in days (a stay of 7 days or less is not a rental activity). */
  averageCustomerUseDays?: number;
  /* Form 8582: the owner sold or disposed of the entire interest this year. */
  disposedOfEntirely?: boolean;
  /* Royalties only: how the royalty counts under the passive activity rules. */
  royaltyActivity?: RoyaltyActivityKind;
  /* Form 8995-A: the property is a trade or business for the QBI deduction. */
  qualifiedBusiness?: boolean;
  /*
   * Form 8960 line 4b: the property is a section 162 trade or business. Not the
   * QBI answer, which can be yes through the Rev. Proc. 2019-38 safe harbor alone.
   */
  tradeOrBusiness?: boolean;
  /* Form 8995-A: a specified service trade or business. */
  specifiedService?: boolean;
  /* Form 8995-A line 4: W-2 wages paid for the property. */
  w2WagesPaid?: number;
  /* Form 8995-A line 7: UBIA of qualified property. */
  qualifiedPropertyUbia?: number;
}

const RENTAL_CATEGORY = "rental";
const PROPERTY_PREFIX = "rental.property.";

/* Answers for the whole return, category rental. */
export const RENTAL_KEYS = {
  /* Schedule E line A: made payments that would require Form 1099 (boolean). */
  paymentsRequire1099: "rental.payments_require_1099",
  /* Schedule E line B: filed the required Forms 1099 (boolean). */
  filedRequired1099s: "rental.filed_required_1099s",
  /*
   * The taxpayer, or on a joint return the spouse, qualified as a real estate
   * professional (Schedule E line 43; Form 8582 instructions) (boolean).
   */
  realEstateProfessional: "rental.real_estate_professional",
} as const;

/*
 * The key holds an id that Cade chooses once for the property (record-rental),
 * not its address, so a correction to any field updates the same fact.
 */
export function makeRentalFactKey(propertyId: string): string {
  return `${PROPERTY_PREFIX}${propertyId}`;
}

export function isRentalFactKey(key: string): boolean {
  return key.startsWith(PROPERTY_PREFIX) && key.split(".").length === 3;
}

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isDays = (value: unknown): boolean =>
  value === undefined || (Number.isInteger(value) && (value as number) >= 0);

const AMOUNT_FIELDS = [
  "rentsReceived",
  "royaltiesReceived",
  "priorYearUnallowedLoss",
  "w2WagesPaid",
  "qualifiedPropertyUbia",
] as const;

function isRental(value: unknown): value is RentalFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fields = value as Record<string, unknown>;
  const expenses = (fields.expenses ?? {}) as Record<string, unknown>;
  const { otherDescription, ...expenseAmounts } = expenses;
  return (
    typeof fields.propertyType === "string" &&
    AMOUNT_FIELDS.every((field) => isAmount(fields[field])) &&
    isDays(fields.fairRentalDays) &&
    isDays(fields.personalUseDays) &&
    isAmount(fields.averageCustomerUseDays) &&
    typeof expenses === "object" &&
    (otherDescription === undefined || typeof otherDescription === "string") &&
    Object.values(expenseAmounts).every(isAmount) &&
    isActivityDepreciation(fields.depreciation)
  );
}

/* Each rental fact whose amounts are numbers; a malformed one is left out and listed. */
export function readRentalFacts(facts: ReadonlyArray<FactRow>): {
  properties: Array<{ key: string; value: RentalFactValue }>;
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (fact) => fact.category === RENTAL_CATEGORY && isRentalFactKey(fact.key),
  );
  return {
    properties: rows
      .filter((row) => isRental(row.value))
      .map((row) => ({ key: row.key, value: row.value as RentalFactValue })),
    malformedKeys: rows.filter((row) => !isRental(row.value)).map((row) => row.key),
  };
}

export type RentalOwner = "taxpayer" | "spouse" | "joint";

export function rentalOwnerOf(property: RentalFactValue): RentalOwner {
  return property.owner ?? "taxpayer";
}

/*
 * The properties on this return. Filing jointly, every property. On any other
 * status, only the taxpayer's: a spouse's property belongs on the spouse's
 * return, and its key is in spouseKeys so a form can wait on it. A jointly
 * owned property on a separate return needs the taxpayer's share, which the
 * fact does not hold: it is listed in spouseKeys too.
 */
export function rentalsOnReturn(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): {
  properties: Array<{ key: string; value: RentalFactValue }>;
  spouseKeys: string[];
  malformedKeys: string[];
} {
  const { properties, malformedKeys } = readRentalFacts(facts);
  const offReturn = (property: { value: RentalFactValue }) =>
    !joint && rentalOwnerOf(property.value) !== "taxpayer";
  return {
    properties: properties.filter((property) => !offReturn(property)),
    spouseKeys: properties.filter(offReturn).map((property) => property.key),
    malformedKeys,
  };
}
