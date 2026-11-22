/*
 * Form 2106: the employee business expenses of an Armed Forces reservist, a
 * qualified performing artist, a fee-basis state or local government official,
 * or an employee with impairment-related work expenses
 * (irs-2106-inst-2025::sec::general-instructions::b01). One fact per Form 2106:
 * one person, one occupation. The person states each amount from their records
 * (receipts, a mileage log); no information return carries them.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Who may use the form (irs-2106-inst-2025::sec::line-10::b01–b04). */
export type Form2106Qualification =
  | "armed_forces_reservist"
  | "qualified_performing_artist"
  | "fee_basis_official"
  | "impairment_related_work_expenses";

/*
 * Section D for an owned vehicle on the actual expense method
 * (irs-2106-inst-2025::sec::line-30::b01 through ::line-36::b01).
 */
export interface Form2106VehicleDepreciation {
  /* Line 30: cost or other basis, not reduced by earlier depreciation. */
  basis: number;
  /* A fully depreciated vehicle: line 28 is 0 and Section D stays blank (irs-pub-463-2025::sec::completing-form-2106::b04). */
  fullyDepreciated?: boolean;
  /* The chart column chosen on line 33: (a) 200% DB, (b) 150% DB, (c) straight line. */
  method: "200_db" | "150_db" | "straight_line";
  /*
   * A passenger automobile (6,000 pounds or less) has the line 36 limits. False:
   * an ambulance, hearse, taxi or a heavier vehicle (irs-2106-inst-2025::sec::line-36::b01).
   */
  subjectToPassengerAutomobileLimits: boolean;
  /* A sport utility vehicle of 6,001–14,000 pounds: section 179 cost at most $31,300 (line-31::b03). */
  heavySportUtilityVehicle?: boolean;
  /* 2025 vehicles: the part of the cost the person chooses to expense under section 179. */
  section179Cost?: number;
  /*
   * 2025 vehicles: the special depreciation allowance. "claimed" takes the rate
   * by acquisition date (100% after January 19, 2025, else 40%);
   * "elected_40_percent" is the election for 40% instead of 100%.
   */
  specialAllowance?: "claimed" | "elected_40_percent" | "elected_out" | "not_qualified";
  /* YYYY-MM-DD: when the vehicle was acquired (the special allowance rate). */
  acquiredDate?: string;
  /* Line 32: section 179 deduction and special allowance claimed in earlier years for this vehicle. */
  priorSection179AndSpecialAllowance?: number;
  /* The standard mileage rate in the first year: straight line over the useful life (line-33::b01). */
  standardMileageInFirstYear?: boolean;
  /* Sold or exchanged in 2025: the month, 1–12 (irs-2106-inst-2025::sec::line-34::b01). */
  disposedMonth?: number;
}

/* One vehicle column of Part II. */
export interface Form2106Vehicle {
  /* Line 11, YYYY-MM-DD: the date business use began (irs-2106-inst-2025::sec::line-11::b01). */
  placedInService: string;
  /* Line 12: miles driven in 2025, or after the change to business use. */
  totalMiles: number;
  /* Line 13: business miles, never commuting miles. */
  businessMiles: number;
  /* Converted to business use in 2025 with no earlier mileage: the months of business use (line-14::b01). */
  businessMonths?: number;
  /* Line 15: average daily round-trip commuting distance, in miles. */
  averageDailyCommute?: number;
  /* Line 16: commuting miles. Absent: commutingDays × line 15 (line-16::b01). */
  commutingMiles?: number;
  /* Days the vehicle was used to commute, when the commuting miles are not known. */
  commutingDays?: number;
  ownership: "owned" | "leased" | "employer_provided";
  /* Section B (standard mileage rate) or Section C (actual expenses). */
  method: "standard_mileage" | "actual_expenses";
  /* Line 23: gasoline, oil, repairs, insurance, tires, license plates; not property taxes or loan interest. */
  operatingExpenses?: number;
  /* Line 24a: rental or lease cost. */
  rentalCost?: number;
  /* Line 24b: the lease inclusion amount (Pub. 463 appendix), before the business-use percentage. */
  inclusionAmount?: number;
  /* Line 25: an employer-provided vehicle's annual lease value, when 100% of it is in W-2 box 1. */
  employerProvidedValue?: number;
  /* Section D: an owned vehicle on the actual expense method. */
  depreciation?: Form2106VehicleDepreciation;
}

/*
 * Line 7: reimbursements not in W-2 box 1, code L included
 * (irs-2106-inst-2025::sec::line-7::b01). A single payment that covers meals and
 * other expenses goes through the Reimbursement Allocation Worksheet.
 */
export interface Form2106Reimbursements {
  /* Clearly for expenses other than meals (column A). */
  otherThanMeals?: number;
  /* Clearly for meals (column B). */
  meals?: number;
  /* One payment to allocate: worksheet lines 1, 2 and 3. */
  singlePayment?: { amount: number; coveredExpenses: number; coveredMeals: number };
}

export interface EmployeeBusinessExpensesFactValue {
  owner: "taxpayer" | "spouse";
  /* The header's "Occupation in which you incurred expenses". */
  occupation: string;
  qualification: Form2106Qualification;
  /* Line 2: parking fees, tolls and transportation with no overnight travel; never commuting. */
  parkingTollsTransportation?: number;
  /* Line 3: lodging, airfare, car rental while away overnight; never meals. */
  overnightTravel?: number;
  /* The lodging inside line 3 (a reservist's per diem limit). */
  lodging?: number;
  /* Line 4: other job expenses (gifts, education, publications); never meals, taxes or interest. */
  otherExpenses?: number;
  /*
   * The impairment-related work expenses inside line 4, for a person whose
   * qualification is another one (irs-2106-inst-2025::sec::line-10::b04).
   */
  impairmentRelatedWorkExpenses?: number;
  /* Line 5: meals, actual or the standard meal allowance, at the full amount. */
  meals?: number;
  /* Subject to the Department of Transportation's hours of service limits: 80%, not 50% (irs-pub-463-2025::sec::completing-form-2106::b07). */
  hoursOfServiceLimits?: boolean;
  /* Absent: no reimbursement. */
  reimbursements?: Form2106Reimbursements;
  /* Part II: one entry per vehicle, at most two on one page. */
  vehicles?: Form2106Vehicle[];
  /* Lines 18–21. */
  vehicleAvailableOffDuty?: boolean;
  anotherVehicleAvailable?: boolean;
  hasEvidence?: boolean;
  evidenceIsWritten?: boolean;
  /* A reservist: the regular federal per diem for the reserve travel days, lodging and M&IE (line-10::b01). */
  federalPerDiemLodging?: number;
  federalPerDiemMeals?: number;
  /* A performing artist: employers in the performing arts that paid $200 or more each (line-10::b02). */
  performingArtsEmployersPaid200?: number;
  /* A performing artist: gross income from the performing arts. */
  performingArtsGrossIncome?: number;
  /* Married filing separately: lived apart from the spouse all of 2025 (line-10::b03). */
  livedApartFromSpouseAllYear?: boolean;
}

export interface EmployeeBusinessExpensesFact {
  key: string;
  value: EmployeeBusinessExpensesFactValue;
}

const EXPENSES_CATEGORY = "other";
const EXPENSES_PREFIX = "employee_business_expenses.";

export function makeEmployeeBusinessExpensesFactKey(slug: string): string {
  return `${EXPENSES_PREFIX}${slug}`;
}

export function isEmployeeBusinessExpensesFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === EXPENSES_PREFIX && parts[1] !== "";
}

/* Every Form 2106 fact, in the order recorded. */
export function getEmployeeBusinessExpensesFacts(
  facts: ReadonlyArray<FactRow>,
): EmployeeBusinessExpensesFact[] {
  return facts
    .filter(
      (row) => row.category === EXPENSES_CATEGORY && isEmployeeBusinessExpensesFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as EmployeeBusinessExpensesFactValue }));
}
