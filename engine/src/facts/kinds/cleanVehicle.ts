/*
 * Form 8936 and Schedule A (Form 8936): clean vehicle credits. One fact per
 * vehicle placed in service in the tax year ("Complete a separate Schedule A
 * (Form 8936) for each clean vehicle", irs-8936-inst-2025::sec::general-instructions::b01).
 * The dealer's seller report (time-of-sale report) prints the VIN, the date of
 * sale, the sales price, the maximum credit and any credit transferred
 * (irs-8936-inst-2025::sec::new-clean-vehicle-certification-and::b01, b02;
 * previously-owned-clean-vehicle-2::b01, b02). The yes/no answers are the
 * taxpayer's.
 *
 * Next to the vehicles, a few answers for the whole return: the 2024 filing
 * status and the 2024 additions to modified AGI (Form 8936 lines 3b–3e and 5),
 * Puerto Rico income excluded in 2025 (line 1b), whether someone can claim the
 * taxpayer as a dependent (Schedule A line 13g), and credits from a Schedule K-1
 * (Form 8936 lines 7 and 20). The 2024 AGI itself is PRIOR_YEAR_KEYS.federalAgi.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Schedule A lines 5, 6 and 7: which credit the vehicle is for. */
export type CleanVehicleKind = "new" | "previously_owned" | "commercial";

export interface CleanVehicleFactValue {
  /* Schedule A lines 1a–1c: model year, make and model. */
  modelYear: number;
  make: string;
  model: string;
  /* Line 2: the 17-character VIN. */
  vin: string;
  /* Line 3: the date the taxpayer took possession, YYYY-MM-DD (irs-8936-inst-2025::sec::line-3::b01). */
  placedInServiceDate: string;
  /*
   * Lines 5–7: "acquired" is the date a written binding contract is entered into
   * and a payment is made, YYYY-MM-DD (irs-8936-inst-2025::sec::what-s-new::b01).
   */
  acquiredDate: string;
  kind: CleanVehicleKind;
  /* Line 4a: the credit transferred to the dealer, from the seller report. Absent: no transfer (No). */
  creditTransferredToDealer?: number;
  /* Lines 8a and 13a: resold within 30 days of the placed-in-service date. */
  resoldWithin30Days?: boolean;
  /*
   * Lines 8e, 13f and 18c: acquired for use (or, for a new or commercial
   * vehicle, to lease to others) and not for resale; false for a leased vehicle.
   */
  acquiredForUse: boolean;
  /* New vehicle, line 9: the tentative credit, the maximum credit on the seller report (line-9::b01). */
  tentativeCredit?: number;
  /* New vehicle, line 10: the business/investment use percentage, 0 to 100; 0 for personal use only. */
  businessUsePercent?: number;
  /*
   * New vehicle, line 10: the months of business use when the use changed in the
   * year; line 10 is the percentage times the months, divided by 12
   * (irs-8936-inst-2025::sec::line-10::b02). Absent: the whole year.
   */
  businessUseMonths?: number;
  /* Previously owned, line 14: the sales price on the seller report. */
  salesPrice?: number;
  /* Previously owned, line 13d: a previously owned clean vehicle credit claimed for a vehicle bought in the 3 years before. */
  claimedUsedCreditInPrior3Years?: boolean;
  /* Commercial, line 18b: of a character subject to depreciation. */
  depreciable?: boolean;
  /* Commercial, line 18d: also powered in part by a gasoline or diesel engine. */
  poweredByGasOrDiesel?: boolean;
  /* Commercial, line 18e: the gross vehicle weight rating, in pounds. */
  grossVehicleWeightRating?: number;
  /* Commercial, line 19: cost or other basis. */
  basis?: number;
  /* Commercial, line 20: the section 179 deduction claimed for the vehicle on Form 4562 Part I. Absent: none. */
  section179Deduction?: number;
  /* Commercial, line 23: the incremental cost (the 2025 safe harbor is $7,500 for most vehicles under 14,000 pounds). */
  incrementalCost?: number;
}

export interface CleanVehicleFact {
  key: string;
  value: CleanVehicleFactValue;
}

/* Form 8936 lines 3b–3e: amounts from the 2024 return. Each is optional: absent means none. */
export interface CleanVehiclePriorYearAdditions {
  puertoRicoExcluded?: number;
  form2555Line45?: number;
  form2555Line50?: number;
  form4563Line15?: number;
}

/* Form 8936 lines 7 and 20: credits from Schedules K-1 (Form 1065 box 15, Form 1120-S box 13). */
export interface CleanVehicleK1Credits {
  /* Code AY: new clean vehicle credit. */
  newVehicleCodeAY?: number;
  /* Code AZ: qualified commercial clean vehicle credit. */
  commercialCodeAZ?: number;
}

export const CLEAN_VEHICLE_KEYS = {
  /* Form 8936 line 5: the filing status of the 2024 return. */
  priorYearFilingStatus: "clean_vehicle_credit.prior_year_filing_status",
  /* Form 8936 lines 3b–3e (CleanVehiclePriorYearAdditions). */
  priorYearMagiAdditions: "clean_vehicle_credit.prior_year_magi_additions",
  /* Form 8936 line 1b: income from Puerto Rico excluded in 2025, a number. */
  puertoRicoExcludedIncome: "clean_vehicle_credit.puerto_rico_excluded_income",
  /* Schedule A line 13g: someone can claim the taxpayer as a dependent, a boolean. */
  claimableAsDependent: "clean_vehicle_credit.claimable_as_dependent",
  /* Form 8936 lines 7 and 20 (CleanVehicleK1Credits). */
  k1Credits: "clean_vehicle_credit.k1_credits",
} as const;

const VEHICLE_CATEGORY = "other";
const VEHICLE_PREFIX = "clean_vehicle.";

export function makeCleanVehicleFactKey(vehicleSlug: string): string {
  return `${VEHICLE_PREFIX}${vehicleSlug}`;
}

export function isCleanVehicleFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === VEHICLE_PREFIX && parts[1] !== "";
}

/* Every vehicle fact, in the order recorded: the order of the Schedules A. */
export function getCleanVehicleFacts(facts: ReadonlyArray<FactRow>): CleanVehicleFact[] {
  return facts
    .filter((row) => row.category === VEHICLE_CATEGORY && isCleanVehicleFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CleanVehicleFactValue }));
}
