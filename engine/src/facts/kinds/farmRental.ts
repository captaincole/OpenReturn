/*
 * Form 4835: one fact per farm a landowner (or sub-lessor) rents out for crop or
 * livestock shares, when the owner did not materially participate for
 * self-employment tax purposes (irs-4835-inst-2025::sec::purpose-of-form::b01).
 * One fact is one Form 4835. The landowner states each amount from the farm's
 * records: the crop share sales, the Forms 1099-PATR, 1099-G, CCC-1099-G,
 * 1099-A and 1099-MISC box 9 the farm received, and the expenses. A cash rent
 * fixed per acre is not a farm rental here: it goes on Schedule E Part I.
 * Every amount is a positive number; a field left out means none.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Part II lines 8 to 29, one amount each, as paid in 2025. */
export interface FarmRentalExpenses {
  carAndTruck?: number; // 8
  chemicals?: number; // 9
  /* Line 10 before the 25% limit: this year's soil and water conservation expenses under an approved plan. */
  conservation?: number; // 10
  customHire?: number; // 11
  /* Line 12: depreciation and section 179 from Form 4562, not claimed elsewhere. */
  depreciation?: number; // 12
  employeeBenefits?: number; // 13
  feed?: number; // 14
  fertilizersAndLime?: number; // 15
  freightAndTrucking?: number; // 16
  gasolineFuelAndOil?: number; // 17
  insurance?: number; // 18 (other than health)
  mortgageInterest?: number; // 19a (paid to banks, etc.)
  otherInterest?: number; // 19b
  /* Line 20: labor hired, less the employment credits. */
  laborHired?: number; // 20
  pensionAndProfitSharing?: number; // 21
  /* Line 22a: the business part of the rent for vehicles, machinery and equipment. */
  rentVehiclesMachineryEquipment?: number; // 22a
  rentOther?: number; // 22b (land, animals, etc.)
  repairsAndMaintenance?: number; // 23
  seedsAndPlants?: number; // 24
  storageAndWarehousing?: number; // 25
  supplies?: number; // 26
  taxes?: number; // 27
  utilities?: number; // 28
  veterinaryBreedingMedicine?: number; // 29
}

/* Lines 30a to 30g: an expense no other line lists, in the owner's words. */
export interface FarmRentalOtherExpense {
  description: string;
  amount: number;
}

export interface FarmRentalFactValue {
  /* On a joint return, whose farm it is. Absent: the taxpayer's. */
  owner?: "taxpayer" | "spouse" | "joint";
  /* The farm's name or place, for the reader; no line prints it. */
  farmName?: string;
  /* Employer ID number, only when the owner has one (irs-4835-inst-2025::sec::specific-instructions::b01). */
  ein?: string;
  /* Line A: the owner actively participated (management decisions, an interest of 10% or more). */
  activelyParticipated?: boolean;
  /* Line 1: crop and livestock shares converted to money or its equivalent in 2025 (line-1::b01). */
  productionIncome?: number;
  /* Line 2a: total distributions from cooperatives on Form(s) 1099-PATR. */
  cooperativeDistributions?: number;
  /*
   * In line 2a, not line 2b: patronage dividends from buying personal or family
   * items, capital assets or depreciable assets (irs-1040sf-inst-2025::sec::lines-3a-and-3b::b01).
   */
  cooperativeDistributionsNotTaxable?: number;
  /* Line 3a: all agricultural program payments (Form 1099-G box 7, Form CCC-1099-G). */
  agriculturalProgramPayments?: number;
  /* The market gain on a CCC loan repaid for less than the loan, part of line 3a. */
  marketGain?: number;
  /* Part of line 3a excluded from income: cost-sharing payments under the section 126 exclusion. */
  excludedCostSharing?: number;
  /*
   * The owner reports CCC loans as income in the year received (the election,
   * irs-pub-225-2025::sec::market-assistance-loans::b01). It decides whether the
   * market gain is taxable (line 3b) and how a forfeited loan is reported (line 4c).
   */
  cccLoanElection?: boolean;
  /* Line 4a: CCC loans received in 2025 and reported as income under the election. */
  cccLoansReportedUnderElection?: number;
  /* Line 4b: the full amount of CCC loans forfeited (Form 1099-A). */
  cccLoansForfeited?: number;
  /* With the election: the basis in the forfeited commodity. Absent: the forfeited amount (no gain). */
  forfeitedCommodityBasis?: number;
  /* Line 5a: crop insurance proceeds and federal crop disaster payments received in 2025. */
  cropInsuranceReceived?: number;
  /* The part of line 5a the owner elects to include in 2026 income (line 5c, the statement). */
  cropInsuranceDeferredTo2026?: number;
  /* Line 5d: proceeds received in 2024 and deferred to 2025. */
  cropInsuranceDeferredFrom2024?: number;
  /* Line 6: other farm rental income, such as a fuel tax credit or refund, or machinery rented with the land. */
  otherIncome?: number;
  expenses?: FarmRentalExpenses;
  /* Line 10: conservation expenses carried from earlier years because of the 25% limit. */
  conservationCarryover?: number;
  /*
   * Line 10's limit: gains from sales of draft, breeding or dairy livestock of this
   * farm (Form 4797), part of gross income from farming (irs-pub-225-2025::sec::assessment-for-depreciable::b07).
   */
  breedingLivestockGains?: number;
  /* Lines 30a to 30g, in the order printed. */
  otherExpenses?: FarmRentalOtherExpense[];
  /* Line 30g, in parentheses: the costs the owner must capitalize under section 263A (part-ii::b01). */
  capitalizedCosts263A?: number;
  /* Form 8582: losses from this farm rental not allowed in earlier years. */
  priorYearUnallowedLoss?: number;
  /* Line 34: all of the investment in the farm rental is at risk (34a); false is 34b. */
  allInvestmentAtRisk?: boolean;
  /* A real estate professional only: materially participated in this activity under the passive activity rules. */
  materiallyParticipated?: boolean;
}

export interface FarmRentalFact {
  key: string;
  value: FarmRentalFactValue;
}

const FARM_RENTAL_CATEGORY = "rental";
const FARM_RENTAL_PREFIX = "farm_rental.";

/* The key holds an id that Cade chooses once for the farm, so a correction updates the same fact. */
export function makeFarmRentalFactKey(farmId: string): string {
  return `${FARM_RENTAL_PREFIX}${farmId}`;
}

export function isFarmRentalFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === FARM_RENTAL_PREFIX && parts[1] !== "";
}

/* Every farm rental fact, in the order recorded. */
export function getFarmRentalFacts(facts: ReadonlyArray<FactRow>): FarmRentalFact[] {
  return facts
    .filter((row) => row.category === FARM_RENTAL_CATEGORY && isFarmRentalFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as FarmRentalFactValue }));
}
