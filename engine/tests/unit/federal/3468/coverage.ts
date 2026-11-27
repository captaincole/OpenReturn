/*
 * A set of made-up Form 3468 facts that, together, fill every field of the
 * form at least once: each part and section, every Part I box, both branches
 * of every low-income bonus, and the cooperatives' form.
 */

import {
  makeCooperativeInvestmentCreditFactKey,
  makeInvestmentCreditPropertyFactKey,
  type EnergyProperty,
  type InvestmentCreditFacility,
  type InvestmentCreditPart,
  type InvestmentCreditPropertyFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { FACILITY } from "./fixtures.js";

let count = 0;
const row = (key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: "form-3468-coverage",
  taxYear: 2025,
  category: "other",
  key,
  value,
  sourceNote: "test",
  createdAt: "2026-11-27T00:00:00Z",
});

function property(
  credit: InvestmentCreditPart,
  facility: Partial<InvestmentCreditFacility> = {},
  rest: Partial<InvestmentCreditPropertyFactValue> = {},
): TaxFactRow {
  count += 1;
  const value = { facility: { ...FACILITY, ...facility }, credit, passive: false, ...rest };
  return row(makeInvestmentCreditPropertyFactKey(`coverage-${count}`), value);
}

const energy = (
  property: EnergyProperty,
  financing?: { proceeds: number; capitalAccountAdditions: number },
) => ({ part: "energy", investment: { property, financing } }) as const;

/* Part I answers that print every box across the copies. */
const BONUSES: Partial<InvestmentCreditFacility> = {
  netOutputUnder1Mw: "yes",
  prevailingWage: "yes_48_48e",
  domesticContent: "ten_percent",
  energyCommunity: "two_percent",
  expansionOfExistingFacility: false,
};
const lowIncome = (
  category: "low_income_community" | "indian_land" | "residential_building" | "economic_benefit",
) => ({ lowIncome: { category, controlNumber: `C-${category}` } }) as const;
const SOLAR_CAPACITY = { capacity: { solar: { dcKw: 100, acKw: 90, trackingDevice: true } } };
const WIND_CAPACITY = { capacity: { windAcKw: 100 } };

const PART_I_EXTRAS: Partial<InvestmentCreditFacility> = {
  registrationNumber: "REG-COVERAGE",
  owner: { name: "Coverage Owner LLC", tin: "00-0003470" },
  address: "1 Test Road, Waco, TX 76701",
  coordinates: { latitude: -1.5, longitude: 120.25 },
  interconnectionProperty: true,
  expansionOfExistingFacility: true,
  provisionalEmissionsRate: { valueFromDoe: true, lcaModel: true, doeControlNumber: "DOE-1" },
  lessee: {
    lessorName: "Lessor Co",
    lessorAddress: "2 Test Road",
    propertyDescription: "Turbine",
    amountTreatedAsAcquired: 1_000,
    incomeInclusion: 100,
  },
};

export const COVERAGE_PROPERTIES: TaxFactRow[] = [
  property({
    part: "advanced_coal_gasification",
    investment: {
      integratedGasification: 1,
      advancedCoal: 1,
      advancedCoalSequestration: 1,
      gasificationSequestration: 1,
      otherGasification: 1,
    },
  }),
  property(
    {
      part: "advanced_energy",
      investment: {
        qualifiedInvestment: 1_000,
        allocationControlNumber: "48C",
        energyCommunityCensusTract: true,
      },
    },
    { prevailingWage: "yes_48c" },
    { passThroughEin: "00-0003471" },
  ),
  property(
    {
      part: "advanced_energy",
      investment: {
        qualifiedInvestment: 1_000,
        allocationControlNumber: "48C",
        energyCommunityCensusTract: false,
      },
    },
    { prevailingWage: "not_applicable" },
  ),
  property({
    part: "advanced_manufacturing",
    investment: { facility: "semiconductor", basis: 1_000 },
  }),
  property({
    part: "advanced_manufacturing",
    investment: { facility: "semiconductor_equipment", basis: 1_000 },
  }),
  property(
    {
      part: "clean_electricity",
      investment: {
        facilityBasis: 1_000,
        allocatedCapacityKw: 50,
        storageBasis: 1_000,
        financing: { proceeds: 1, capitalAccountAdditions: 10 },
      },
    },
    { ...BONUSES, ...PART_I_EXTRAS, ...lowIncome("residential_building"), ...SOLAR_CAPACITY },
    { passThroughEin: "00-0003472" },
  ),
  property(
    { part: "clean_electricity", investment: { facilityBasis: 1_000, allocatedCapacityKw: 100 } },
    {
      ...BONUSES,
      ...lowIncome("economic_benefit"),
      capacity: { other: { type: "Hydro", kw: 100, current: "ac" } },
    },
  ),
  property(
    { part: "clean_electricity", investment: { storageBasis: 1_000 } },
    {
      netOutputUnder1Mw: "no",
      domesticContent: "two_percent",
      energyCommunity: "ten_percent",
      capacity: {
        other: { type: "Battery", kw: 10, current: "dc" },
        storage: { powerKw: 10, storageKwh: 40, thermal: true },
      },
    },
  ),
  property(energy({ section: "geothermal", basis: 1_000 }), {
    ...BONUSES,
    netOutputUnder1Mw: "not_applicable",
    capacity: { storage: { powerKw: 1, storageKwh: 5, thermal: false } },
  }),
  property(
    energy({
      section: "solar",
      basis: 1_000,
      kind: "electricity_or_heat",
      allocatedCapacityKwDc: 50,
    }),
    { ...BONUSES, ...lowIncome("low_income_community"), ...SOLAR_CAPACITY },
  ),
  property(
    energy({
      section: "solar",
      basis: 1_000,
      kind: "electricity_or_heat",
      allocatedCapacityKwDc: 100,
    }),
    { ...BONUSES, ...lowIncome("indian_land"), ...SOLAR_CAPACITY },
  ),
  property(
    energy({
      section: "fuel_cell",
      before2008: { basis: 1_000, capacityKw: 1 },
      after2008: { basis: 1_000, capacityKw: 1 },
    }),
    BONUSES,
  ),
  property(energy({ section: "microturbine", basis: 1_000, capacityKw: 1 }), BONUSES),
  property(
    energy({ section: "combined_heat_and_power", basis: 1_000, capacity: { megawatts: 30 } }),
    BONUSES,
  ),
  property(energy({ section: "small_wind", basis: 1_000, allocatedCapacityKw: 50 }), {
    ...BONUSES,
    ...lowIncome("low_income_community"),
    ...WIND_CAPACITY,
  }),
  property(energy({ section: "small_wind", basis: 1_000, allocatedCapacityKw: 100 }), {
    ...BONUSES,
    ...lowIncome("low_income_community"),
    ...WIND_CAPACITY,
  }),
  property(energy({ section: "waste_energy_recovery", basis: 1_000 }), BONUSES),
  property(energy({ section: "geothermal_heat_pump", basis: 1_000 }), BONUSES),
  property(
    energy({
      section: "energy_storage",
      basis: 1_000,
      withLowIncomeFacility: { facility: "solar", allocatedCapacityKw: 50 },
    }),
    { ...BONUSES, ...lowIncome("low_income_community"), ...SOLAR_CAPACITY },
  ),
  property(
    energy({
      section: "energy_storage",
      basis: 1_000,
      withLowIncomeFacility: { facility: "wind", allocatedCapacityKw: 100 },
    }),
    { ...BONUSES, ...lowIncome("low_income_community"), ...WIND_CAPACITY },
  ),
  property(energy({ section: "biogas", basis: 1_000 }), BONUSES),
  property(energy({ section: "microgrid_controller", basis: 1_000 }), BONUSES),
  property(
    energy({
      section: "investment_credit_facility",
      basis: 1_000,
      windFacility: true,
      allocatedCapacityKw: 50,
    }),
    { ...BONUSES, ...lowIncome("low_income_community"), ...WIND_CAPACITY },
  ),
  property(
    energy({
      section: "investment_credit_facility",
      basis: 1_000,
      windFacility: true,
      allocatedCapacityKw: 100,
    }),
    { ...BONUSES, ...lowIncome("low_income_community"), ...WIND_CAPACITY },
  ),
  property(
    energy(
      { section: "clean_hydrogen", basis: 1_000, tier: "a" },
      { proceeds: 1, capitalAccountAdditions: 10 },
    ),
    { prevailingWage: "no", emissions: { valueOrRate: "3.0", doeControlNumber: "DOE-2" } },
  ),
  property(energy({ section: "clean_hydrogen", basis: 1_000, tier: "b" }), {
    prevailingWage: "no",
  }),
  property(energy({ section: "clean_hydrogen", basis: 1_000, tier: "c" }), {
    prevailingWage: "no",
  }),
  property(energy({ section: "clean_hydrogen", basis: 1_000, tier: "d" }), {
    prevailingWage: "no",
  }),
  property(
    {
      part: "rehabilitation",
      investment: {
        priorConservationDeduction: true,
        priorNpsNumber: "00000",
        progressExpenditureElection: true,
        measuringPeriod: { begin: "2023-07-01", end: "2025-06-30" },
        adjustedBasis: 1_000,
        expendituresInMeasuringPeriod: 10_000,
        qualifiedExpenditures: 10_000,
        npsProjectNumber: "NPS-1",
        certificationDate: "2025-08-01",
        certificationDeadline: "2027-10-15",
      },
    },
    {},
    { passThroughEin: "00-0003473" },
  ),
  property({
    part: "rehabilitation",
    investment: {
      priorConservationDeduction: false,
      measuringPeriod: { begin: "2023-07-01", end: "2025-06-30" },
      adjustedBasis: 1_000,
      expendituresInMeasuringPeriod: 10_000,
      qualifiedExpenditures: 10_000,
    },
  }),
  row(makeCooperativeInvestmentCreditFactKey("coverage"), {
    cooperativeName: "Coverage Cooperative",
    cooperativeEin: "00-0003474",
    credits: {
      advancedCoalGasification: 1,
      advancedEnergy: 1,
      advancedManufacturing: 1,
      cleanElectricity: 1,
      energy: 1,
      rehabilitation: 1,
    },
    passive: false,
  }),
];
