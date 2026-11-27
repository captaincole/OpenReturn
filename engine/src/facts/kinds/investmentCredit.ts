/*
 * Form 3468, the investment credit. "Complete a separate Form 3468 to claim an
 * investment credit for each facility or property" (irs-3468-inst-2025::sec::general-instructions::b01):
 * one property fact is one Form 3468, with its Part I answers and the part
 * that figures its credit (Part II to VII). The taxpayer states each answer;
 * an owner of a pass-through entity states them from the entity's statement
 * (irs-3468-inst-2025::sec::specific-instructions::b02).
 *
 * A patron's unused credit allocated from a cooperative is one cooperative
 * fact per cooperative; the engine prints them, with the K-1 codes P to U, on
 * one separate Form 3468 headed "Unused Investment Credit from Cooperatives"
 * (general-instructions::b02, ::b03).
 */

import type { CreditTransfer, PassiveCreditActivity } from "./generalBusinessCredit.js";

type FactRow = { key: string; value: unknown; category: string };

/* Part I lines 7 to 11: each answer as the boxes print it. */
export type NetOutputAnswer = "yes" | "no" | "not_applicable";
/* Line 8: 8a (section 48C), 8b (sections 48 and 48E), 8c No, 8d Not applicable. */
export type PrevailingWageAnswer = "yes_48c" | "yes_48_48e" | "no" | "not_applicable";
/* Lines 9 and 10: the 10% box (a), the 2% box (b), or No (c). */
export type BonusAnswer = "ten_percent" | "two_percent" | "no";
/* Line 11a to 11d. */
export type LowIncomeCategory =
  "low_income_community" | "indian_land" | "residential_building" | "economic_benefit";

export interface LowIncomeAllocation {
  category: LowIncomeCategory;
  /* Line 11e: the section 48(e) or 48E(h) control number. */
  controlNumber: string;
}

/* Line 12: the nameplate or storage capacity; absent means 12e, Not applicable. */
export interface FacilityCapacity {
  solar?: { dcKw: number; acKw: number; trackingDevice?: boolean };
  windAcKw?: number;
  other?: { type: string; kw: number; current: "ac" | "dc" };
  storage?: { powerKw: number; storageKwh: number; thermal: boolean };
}

/* Line 13: a lessee's credit under a section 48(d) election (irs-3468-inst-2025::sec::line-13::b01). */
export interface LesseeElection {
  lessorName: string;
  lessorAddress: string;
  propertyDescription: string;
  /* Line 13d. */
  amountTreatedAsAcquired: number;
  /* Line 13e: the income inclusion under Regulations section 1.50-1. */
  incomeInclusion: number;
}

/* Part I: the facility or property (irs-3468-inst-2025::sec::part-i-information-on-qualified::b02). */
export interface InvestmentCreditFacility {
  /* Line 1: the IRS-issued registration number; a transfer or elective payment names its own. */
  registrationNumber?: string;
  /* Line 2a, Part VI Section M only. */
  emissions?: { valueOrRate: string; doeControlNumber?: string };
  /* Line 2b, Part V Section A only: a provisional emissions rate petition. */
  provisionalEmissionsRate?: {
    valueFromDoe: boolean;
    lcaModel: boolean;
    doeControlNumber?: string;
  };
  /* Line 3a: "solar", "rehabilitation", and so on. */
  propertyType: string;
  /* Line 3b: only when the owner is not the filer. */
  owner?: { name: string; tin: string };
  /* Line 3c. */
  address?: string;
  /* Line 3d: decimal degrees, north and east positive. */
  coordinates?: { latitude: number; longitude: number };
  /* Line 3e: qualified interconnection property is in the basis. */
  interconnectionProperty?: boolean;
  /* Line 4, YYYY-MM-DD: the beginning of construction (physical work test or 5% safe harbor). */
  constructionBegan: string;
  /* Line 5, YYYY-MM-DD. */
  placedInService: string;
  /* Line 6. */
  expansionOfExistingFacility?: boolean;
  /* Line 7: the net output is less than 1 MW ac or equivalent thermal energy. */
  netOutputUnder1Mw?: NetOutputAnswer;
  prevailingWage?: PrevailingWageAnswer;
  domesticContent?: BonusAnswer;
  energyCommunity?: BonusAnswer;
  /* Line 11: an allocation of capacity limitation, or "no" (11g). */
  lowIncome?: LowIncomeAllocation | "no";
  capacity?: FacilityCapacity;
  lessee?: LesseeElection;
}

/* The cumulative financing the credit reduction divides: Part V line 6a, Part VI line 28a. */
export interface CreditFinancing {
  /* Tax-exempt bond or subsidized energy financing proceeds, this year and all prior years. */
  proceeds: number;
  /* Additions to the facility's capital account, this year and all prior years. */
  capitalAccountAdditions: number;
}

/*
 * Part II: each qualified investment (lines 1a to 5a); absent means none. Each
 * is the basis after the reduction for subsidized energy financing or private
 * activity bonds: $100,000 with $20,000 so financed is $80,000
 * (irs-3468-inst-2025::sec::part-ii-qualifying-advanced-coal::b02). Every
 * basis on this fact is after the at-risk reduction for nonqualified
 * nonrecourse financing (at-risk-limit-for-individuals-and::b01).
 */
export interface CoalGasificationInvestment {
  integratedGasification?: number;
  advancedCoal?: number;
  advancedCoalSequestration?: number;
  gasificationSequestration?: number;
  otherGasification?: number;
}

export interface AdvancedEnergyInvestment {
  /* Line 1a. */
  qualifiedInvestment: number;
  /* Line 1d. */
  allocationControlNumber: string;
  /* Line 1e. */
  energyCommunityCensusTract: boolean;
}

export interface AdvancedManufacturingInvestment {
  /* Line 1a. */
  facility: "semiconductor" | "semiconductor_equipment";
  /* Line 1b. */
  basis: number;
}

export interface CleanElectricityInvestment {
  /* Section A line 1a; absent with a storage technology only. */
  facilityBasis?: number;
  /* Line 1b: qualified fuel cell property under section 48(c)(1) (line-1b-3::b02). */
  fuelCell?: boolean;
  /* Line 1i: the capacity limitation in the allocation letter, kW. */
  allocatedCapacityKw?: number;
  /* Section B line 3a. */
  storageBasis?: number;
  /* Line 6a; absent when no subsidized energy financing or private activity bond financed it. */
  financing?: CreditFinancing;
}

/* Part VI: one energy property, in its section (A to M). */
export type EnergyProperty =
  | { section: "geothermal"; basis: number }
  | {
      section: "solar";
      basis: number;
      /* Solar energy 1 or 2 (illumination, electrochromic glass), or 3 (electricity, heat). */
      kind: "illumination" | "electricity_or_heat";
      /* Line 3e, kW dc. */
      allocatedCapacityKwDc?: number;
    }
  | {
      section: "fuel_cell";
      /* Lines 5a and 5c: basis after 2005 and before October 4, 2008, and its kW. */
      before2008?: { basis: number; capacityKw: number };
      /* Lines 5f and 5o. */
      after2008?: { basis: number; capacityKw: number };
    }
  | { section: "microturbine"; basis: number; capacityKw: number }
  | {
      section: "combined_heat_and_power";
      basis: number;
      capacity: { megawatts: number } | { horsepower: number };
    }
  | { section: "small_wind"; basis: number; allocatedCapacityKw?: number }
  | { section: "waste_energy_recovery"; basis: number }
  | { section: "geothermal_heat_pump"; basis: number }
  | {
      section: "energy_storage";
      basis: number;
      /* Installed with a solar or wind property that has a low-income allocation (lines 17d to 17j). */
      withLowIncomeFacility?: { facility: "solar" | "wind"; allocatedCapacityKw: number };
    }
  | { section: "biogas"; basis: number }
  | { section: "microgrid_controller"; basis: number }
  | {
      section: "investment_credit_facility";
      basis: number;
      /* A wind facility under section 45(d)(1): only it takes lines 23d to 23j. */
      windFacility: boolean;
      allocatedCapacityKw?: number;
    }
  | {
      section: "clean_hydrogen";
      basis: number;
      /* Section 45V(b)(2)(A) to (D): lines 25a, 25d, 25g, 25j. */
      tier: "a" | "b" | "c" | "d";
    };

export interface EnergyInvestment {
  property: EnergyProperty;
  /* Line 28a; absent when no tax-exempt bond financed it. */
  financing?: CreditFinancing;
}

/* Part VII (irs-3468-inst-2025::sec::part-vii-rehabilitation-credit-under::b01 to ::line-1m::b02). */
export interface RehabilitationInvestment {
  /* Line 1a, and line 1b's NPS number when true. */
  priorConservationDeduction: boolean;
  priorNpsNumber?: string;
  /* Line 1c: the section 47(d)(5) progress expenditure election. */
  progressExpenditureElection?: boolean;
  /* Line 1d, YYYY-MM-DD. */
  measuringPeriod: { begin: string; end: string };
  /* Line 1e. */
  adjustedBasis: number;
  /* Line 1f. */
  expendituresInMeasuringPeriod: number;
  /* Line 1g: the qualified rehabilitation expenditures of the building. */
  qualifiedExpenditures: number;
  /* Line 1k(i), (iii). */
  npsProjectNumber?: string;
  certificationDate?: string;
  /* Line 1m: 30 months after the original claim, while the certification has not come. */
  certificationDeadline?: string;
}

export type InvestmentCreditPart =
  | { part: "advanced_coal_gasification"; investment: CoalGasificationInvestment }
  | { part: "advanced_energy"; investment: AdvancedEnergyInvestment }
  | { part: "advanced_manufacturing"; investment: AdvancedManufacturingInvestment }
  | { part: "clean_electricity"; investment: CleanElectricityInvestment }
  | { part: "energy"; investment: EnergyInvestment }
  | { part: "rehabilitation"; investment: RehabilitationInvestment };

export interface InvestmentCreditPropertyFactValue {
  facility: InvestmentCreditFacility;
  credit: InvestmentCreditPart;
  /* From an activity that is passive for the taxpayer: Form 3800 column (d), Form 8582-CR. */
  passive: boolean;
  passiveActivity?: PassiveCreditActivity;
  /* The originating pass-through entity's EIN (Part I line 11f, Part III line 1f, Part VII line 1k(ii)). */
  passThroughEin?: string;
  /*
   * The K-1 fact whose box 15 code E (qualified rehabilitation expenditures,
   * rental real estate) this property figures: that K-1 item then reaches Form
   * 3800 through this Form 3468 (irs-1065k1-inst-2025::sec::box-15-credits::b03).
   */
  k1Key?: string;
  /* A section 6418 transfer of the credit (Parts III, V, VI). */
  transfer?: CreditTransfer;
  /* The section 48D(d) elective payment election (Part IV). */
  electivePayment?: { amount: number; registrationNumber: string };
}

export interface InvestmentCreditPropertyFact {
  key: string;
  value: InvestmentCreditPropertyFactValue;
}

/* The unused credits one cooperative allocated to the patron, by part; absent means none. */
export interface CooperativeCreditAmounts {
  advancedCoalGasification?: number;
  advancedEnergy?: number;
  advancedManufacturing?: number;
  cleanElectricity?: number;
  energy?: number;
  rehabilitation?: number;
}

export interface CooperativeInvestmentCreditFactValue {
  cooperativeName: string;
  cooperativeEin: string;
  credits: CooperativeCreditAmounts;
  passive: boolean;
  passiveActivity?: PassiveCreditActivity;
}

export interface CooperativeInvestmentCreditFact {
  key: string;
  value: CooperativeInvestmentCreditFactValue;
}

const CREDIT_CATEGORY = "other";
const PROPERTY_PREFIX = "investment_credit.property.";
const COOPERATIVE_PREFIX = "investment_credit.cooperative.";

export const makeInvestmentCreditPropertyFactKey = (slug: string) => `${PROPERTY_PREFIX}${slug}`;
export const makeCooperativeInvestmentCreditFactKey = (slug: string) =>
  `${COOPERATIVE_PREFIX}${slug}`;

const hasSlug = (key: string, prefix: string) =>
  key.startsWith(prefix) && key.length > prefix.length && !key.slice(prefix.length).includes(".");

export const isInvestmentCreditPropertyFactKey = (key: string) => hasSlug(key, PROPERTY_PREFIX);
export const isCooperativeInvestmentCreditFactKey = (key: string) =>
  hasSlug(key, COOPERATIVE_PREFIX);

/* Every property fact, in the order recorded: the order of the Forms 3468. */
export function getInvestmentCreditPropertyFacts(
  facts: ReadonlyArray<FactRow>,
): InvestmentCreditPropertyFact[] {
  return facts
    .filter((row) => row.category === CREDIT_CATEGORY && isInvestmentCreditPropertyFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as InvestmentCreditPropertyFactValue }));
}

/* Every cooperative fact, in the order recorded. */
export function getCooperativeInvestmentCreditFacts(
  facts: ReadonlyArray<FactRow>,
): CooperativeInvestmentCreditFact[] {
  return facts
    .filter(
      (row) => row.category === CREDIT_CATEGORY && isCooperativeInvestmentCreditFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as CooperativeInvestmentCreditFactValue }));
}
