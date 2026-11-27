/*
 * FTB 3805Z, the former enterprise zone (EZ) carryovers. The zones were
 * repealed on January 1, 2014: no new EZ credit or loss arises, but a hiring
 * credit, a sales or use tax credit and an EZ net operating loss (NOL) left
 * over from earlier years can still be used "to the extent of tax on business
 * income or business income attributable to the former EZ"
 * (ca-3805z-booklet-2025::sec::ez-incentives::b01).
 *
 * No 2025 document prints these amounts. The taxpayer states them from last
 * year's FTB 3805Z and from the business's own records (the booklet's
 * worksheets are kept, not attached: "Keep all completed worksheets",
 * ca-3805z-booklet-2025::sec::how-to-claim-deductions-and-credit-carryovers::b02).
 *
 * Four facts: the business in the former zone (items B to H, Worksheet I), the
 * hiring credit carryover, the sales or use tax credit carryover, and the EZ
 * NOL carryovers by the year the loss began.
 */

/* Worksheet I, Section B: the line of a row (ca-3805z-booklet-2025::sec::section-b-income-or-loss-apportionment-2::b02 to ::b06). */
export type CaEnterpriseZoneIncomeLine =
  /* Line 1: wages from the company in the former zone. */
  | "wages"
  /* Line 2: the employee business expenses of that job, a negative amount. */
  | "employee_business_expenses"
  /* Line 4: a pass-through entity's trade or business income from its Schedule K-1. */
  | "pass_through"
  /* Lines 6 to 9: the taxpayer's own trade or business. */
  | "schedule_c"
  | "schedule_e"
  | "schedule_f"
  | "other_business"
  /* Lines 11 and 12: business gains and losses. */
  | "schedule_d"
  | "schedule_d1";

/* One Worksheet I, Section B row. */
export interface CaEnterpriseZoneIncomeItem {
  line: CaEnterpriseZoneIncomeLine;
  /* The employer, entity or activity, for the worksheet the taxpayer keeps. */
  description?: string;
  /*
   * Column (a): the California amount, as adjusted on Schedule CA (540)
   * (ca-3805z-booklet-2025::sec::part-iii-taxpayer-s-trade-or-business::b01).
   * A loss or an expense is negative.
   */
  amount: number;
  /*
   * Column (b), a decimal (0.5 for 50%). Wages and their expenses: "the
   * percentage of time they worked within the former EZ"
   * (ca-3805z-booklet-2025::sec::part-i-individual-income-and-expense-items::b01).
   * A pass-through row: the entity's EZ apportionment percentage from its
   * K-1 (ca-3805z-booklet-2025::sec::part-ii-pass-through-income-or-loss::b02).
   * The taxpayer's own business rows take Worksheet I, Section A line 4
   * instead; a share stated on them is used only when Section A is not stated.
   */
  zoneShare?: number;
}

/*
 * Worksheet I, Section A: the business's property and payroll in California
 * (column (a)) and in the former zone (column (b))
 * (ca-3805z-booklet-2025::sec::property-factor-2::b01).
 */
export interface CaEnterpriseZoneApportionment {
  /*
   * "If the business operates solely within a single former EZ and all its
   * property and payroll are solely within that single former EZ, enter 100%"
   * (ca-3805z-booklet-2025::sec::instructions-for-worksheet-i-income-or-loss-apportionment::b01).
   * The amounts below are then not needed.
   */
  entirelyWithinZone: boolean;
  /* Line 1: the average yearly value of owned property at original cost. */
  ownedPropertyCalifornia?: number;
  ownedPropertyZone?: number;
  /* Line 1, rented property: the net annual rent, which the engine values at eight times (ca-3805z-booklet-2025::sec::apportionment::b02). */
  netAnnualRentCalifornia?: number;
  netAnnualRentZone?: number;
  /* Line 2: wages, salaries, commissions and other compensation of employees. */
  payrollCalifornia?: number;
  payrollZone?: number;
}

export interface CaEnterpriseZoneBusinessFactValue {
  /* Item B. */
  businessName: string;
  /* Item C: the actual location, one line. */
  businessAddress: string;
  /* Item D: one of the former zones (ca-3805z-booklet-2025::sec::repealed-zones::b01). */
  zoneName: string;
  /*
   * "For corporations, estates, trusts, exempt organizations, and sole
   * proprietors who operate a business in the former EZ, complete items A
   * through H. Investors of pass-through entities, complete items A through D"
   * (ca-3805z-booklet-2025::sec::form-ftb-3805z-instructions-for-items-a-through-h::b01).
   */
  role: "operator" | "investor";
  /* Item E: the six-digit principal business activity code (Schedule C line B), or the SIC code for the Long Beach zone. */
  activityCode?: string;
  /* Item F. */
  employeesInZone?: number;
  /* Item G. */
  grossReceipts?: number;
  /* Item H. */
  totalAssetValue?: number;
  /* Worksheet I, Section A, for an operator. */
  apportionment?: CaEnterpriseZoneApportionment;
  /* Worksheet I, Section B, every row. An empty list: no business income from the former zone. */
  incomeItems: CaEnterpriseZoneIncomeItem[];
  /*
   * The business is a disregarded entity (a single member LLC). The credit
   * used is then limited to the tax with its income less the tax without it
   * (ca-3805z-booklet-2025::sec::other-limitations::b01), which the engine
   * does not figure.
   */
  throughDisregardedEntity?: boolean;
}

/* Worksheet II, lines 8a to 8m: one EZ NOL carryover by the year it began. */
export interface CaEnterpriseZoneNolCarryover {
  /* 2001 to 2013: the zones produced no loss after 2013. */
  yearOfLoss: number;
  /* Column (b): last year's Worksheet II column (e), a positive amount. */
  amount: number;
}

export const CA_ENTERPRISE_ZONE_KEYS = {
  /* A CaEnterpriseZoneBusinessFactValue. */
  business: "ca_enterprise_zone.business",
  /*
   * Schedule Z line 8B column (b): "the total prior year credit carryover from
   * prior year's Schedule Z, Part II", line 8B column (g)
   * (ca-3805z-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01).
   * A number; 0 when none.
   */
  hiringCreditCarryover: "prior_year.ca_enterprise_zone_hiring_credit_carryover",
  /* Schedule Z line 9B column (b), last year's line 9B column (g). A number; 0 when none. */
  salesTaxCreditCarryover: "prior_year.ca_enterprise_zone_sales_tax_credit_carryover",
  /* Worksheet II column (b): a list of CaEnterpriseZoneNolCarryover. An empty list: none. */
  nolCarryovers: "prior_year.ca_enterprise_zone_nol_carryovers",
} as const;

/* The first and last years of Worksheet II lines 8a to 8m. */
export const ENTERPRISE_ZONE_FIRST_LOSS_YEAR = 2001;
export const ENTERPRISE_ZONE_LAST_LOSS_YEAR = 2013;

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function isNolCarryover(value: unknown): value is CaEnterpriseZoneNolCarryover {
  const row = value as Partial<CaEnterpriseZoneNolCarryover> | null;
  return (
    typeof row === "object" && row !== null && isAmount(row.yearOfLoss) && isAmount(row.amount)
  );
}

/* The stated NOL rows; undefined when the answer is not recorded or not a list of rows. */
export function readCaEnterpriseZoneNolCarryovers(
  value: unknown,
): CaEnterpriseZoneNolCarryover[] | undefined {
  if (!Array.isArray(value) || !value.every(isNolCarryover)) return undefined;
  return value;
}
