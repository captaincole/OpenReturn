/*
 * Form 7207, the advanced manufacturing production credit (section 45X): one
 * fact per facility that produced eligible components in the United States
 * and sold them in 2025 ("File a separate Form 7207 for each facility",
 * irs-7207-inst-2025::sec::general-instructions::b01). The taxpayer states
 * each sale from the facility's production and sales records; no information
 * return reports them. Each amount is for eligible components only: produced
 * in the United States, sold to an unrelated person (or under the section
 * 45X(a)(3)(B) election), with no component produced with property of a
 * section 48C project (special-rules::b01, ::b02; line-6::b01).
 *
 * A credit from a partnership, S corporation, estate or trust is not a fact of
 * this kind: it is the K-1's box 15 or box 13 code V (code D on a Form 1041
 * K-1), which Form 3800 line 1b and Form 7207 line 7 read.
 */

import type { CreditTransfer, PassiveCreditActivity } from "./generalBusinessCredit.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * The components whose column (d) is the number sold times the capacity of
 * each (irs-7207-inst-2025::sec::line-1-2::b03, line-2::b02, line-3-2::b03):
 * direct current watts for a cell or module (lines 1a, 1e), the rated watts of
 * the wind turbine the component is designed for (lines 2b to 2f), alternating
 * current watts for an inverter (lines 3a to 3f).
 */
export type CapacityComponent =
  | "pv_cell"
  | "solar_module"
  | "blade"
  | "nacelle"
  | "tower"
  | "fixed_platform_foundation"
  | "floating_platform_foundation"
  | "central_inverter"
  | "utility_inverter"
  | "commercial_inverter"
  | "residential_inverter"
  | "microinverter"
  | "distributed_wind_inverter";

/* The components counted in the unit of column (b): square meters (1b, 1d) or kilograms (1c, 1f, 1g). */
export type UnitComponent =
  | "photovoltaic_wafer"
  | "solar_grade_polysilicon"
  | "polymeric_backsheet"
  | "torque_tube"
  | "structural_fastener";

/* Lines 5a to 5c (irs-7207-inst-2025::sec::line-5-2::b01, ::b02). */
export type BatteryComponent =
  "battery_cell" | "battery_module_with_cells" | "battery_module_without_cells";

/* A group of components sold that share one capacity: "500 100-watt thin film photovoltaic cells". */
export interface ComponentGroup {
  count: number;
  /* The capacity of each, in the unit column (b) names for the line. */
  capacityEach: number;
}

/* A group of battery cells or modules sold that share one capacity and one maximum discharge. */
export interface BatteryGroup {
  count: number;
  /* The capacity of each, kilowatt-hours. */
  capacityKwhEach: number;
  /* The maximum discharge amount of each, kilowatts: the capacity-to-power ratio's divisor (line-5-2::b02). */
  maxDischargeKwEach: number;
  /* A module for a hydrogen fuel cell vehicle: eligible from 1 kilowatt-hour, not 7 (line-5-2::b01). */
  hydrogenFuelCellVehicle?: boolean;
}

/* One related offshore wind vessel sold this year: one row of Part III (line-2::b01). */
export interface OffshoreWindVessel {
  name: string;
  purpose: string;
  officialNumber: string;
  /* Retrofitted for offshore wind; false for a vessel purpose-built new. */
  retrofitted: boolean;
  salesPrice: number;
}

/*
 * The applicable critical minerals of Part IV, in the order of its lines 1 to
 * 73 (irs-7207-face-2025, Part IV; irs-7207-inst-2025::sec::line-6-2::b01 to
 * ::b05, other-minerals::b01). Each costs entry is the costs the taxpayer
 * incurred to produce that mineral, sold this year.
 */
// prettier-ignore
export const CRITICAL_MINERALS = [
  "aluminum_from_bauxite", "aluminum_purified", "antimony_trisulfide", "antimony_purified",
  "arsenic_purified", "barite_purified", "beryllium_master_alloy", "beryllium_purified",
  "bismuth_purified", "cerium_oxide", "cerium_purified", "cesium_formate_carbonate",
  "cesium_purified", "chromium_ferrochromium", "chromium_purified", "cobalt_sulfate",
  "cobalt_purified", "dysprosium_iron_alloy", "dysprosium_purified", "erbium_purified",
  "europium_oxide", "europium_purified", "fluorspar_calcium_fluoride", "fluorspar_purified",
  "gadolinium_oxide", "gadolinium_purified", "gallium_purified", "germanium_tetrachloride",
  "germanium_purified", "graphite_purified", "hafnium_purified", "holmium_purified",
  "indium_tin_oxide", "indium_oxide", "indium_purified", "iridium_purified",
  "lanthanum_purified", "lithium_carbonate_hydroxide", "lithium_purified", "lutetium_purified",
  "magnesium_purified", "manganese_sulphate", "manganese_purified",
  "neodymium_praseodymium_oxide", "neodymium_oxide", "neodymium_purified", "nickel_sulphate",
  "nickel_purified", "niobium_ferronibium", "niobium_purified", "palladium_purified",
  "platinum_purified", "praseodymium_purified", "rhodium_purified", "rubidium_purified",
  "ruthenium_purified", "samarium_purified", "scandium_purified", "tantalum_purified",
  "tellurium_cadmium_telluride", "tellurium_purified", "terbium_purified", "thulium_purified",
  "tin_low_alpha_purity", "tin_low_alpha_emission", "titanium_purified", "tungsten_converted",
  "vanadium_converted", "ytterbium_purified", "yttrium_oxide_purified", "yttrium_purified",
  "zinc_purified", "zirconium_purified",
] as const;

export type CriticalMineral = (typeof CRITICAL_MINERALS)[number];

export interface AdvancedManufacturingFacilityFactValue {
  /* Line 2, YYYY-MM-DD. */
  placedInService: string;
  /* Line 3a. */
  address?: string;
  /* Line 3b: only when the owner is not the filer. */
  owner?: { name: string; tin: string };
  /* Line 4: decimal degrees, north and east positive. */
  coordinates?: { latitude: number; longitude: number };
  /* Line 5: the section 45X(a)(3)(B) election to treat sales to related persons as sales to unrelated persons. */
  relatedPersonElection: boolean;
  /*
   * Line 6: the components include property produced at a facility for which a
   * section 48C credit is claimed. Yes means the stated sales leave out every
   * component produced with that property, as the records must show (line-6::b01).
   */
  section48cProperty: boolean;
  capacitySales?: Partial<Record<CapacityComponent, ComponentGroup[]>>;
  /* Square meters or kilograms sold, by component. */
  unitSales?: Partial<Record<UnitComponent, number>>;
  batterySales?: Partial<Record<BatteryComponent, BatteryGroup[]>>;
  /* Line 4a: the costs incurred to produce the electrode active materials sold (line-4-2::b01). */
  electrodeActiveMaterialCosts?: number;
  /* Part III, line 2a. */
  vessels?: OffshoreWindVessel[];
  /* Part IV lines 1 to 73, line 6a. */
  criticalMineralCosts?: Partial<Record<CriticalMineral, number>>;
  /* From an activity that is passive for the taxpayer: Form 3800 column (d), Form 8582-CR. */
  passive: boolean;
  passiveActivity?: PassiveCreditActivity;
  /* A section 6418 transfer of all or part of the credit (credit-transfers::b01). */
  transfer?: CreditTransfer;
  /* The section 6417(d)(1)(D) election to treat the credit as a payment of tax (electing-taxpayers::b01). */
  electivePayment?: { registrationNumber: string };
}

export interface AdvancedManufacturingFacilityFact {
  key: string;
  value: AdvancedManufacturingFacilityFactValue;
}

const FACILITY_CATEGORY = "self_employment";
const FACILITY_PREFIX = "advanced_manufacturing_facility.";

export function makeAdvancedManufacturingFacilityFactKey(slug: string): string {
  return `${FACILITY_PREFIX}${slug}`;
}

export function isAdvancedManufacturingFacilityFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === FACILITY_PREFIX && parts[1] !== "";
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isListOf = (value: unknown, each: (item: unknown) => boolean): boolean =>
  value === undefined || (Array.isArray(value) && value.every(each));

const isMapOf = (value: unknown, each: (item: unknown) => boolean): boolean =>
  value === undefined || (isRecord(value) && Object.values(value).every(each));

const isComponentGroup = (value: unknown): boolean =>
  isRecord(value) && isAmount(value.count) && isAmount(value.capacityEach);

const isBatteryGroup = (value: unknown): boolean =>
  isRecord(value) &&
  isAmount(value.count) &&
  isAmount(value.capacityKwhEach) &&
  isAmount(value.maxDischargeKwEach) &&
  (value.hydrogenFuelCellVehicle === undefined ||
    typeof value.hydrogenFuelCellVehicle === "boolean");

const isVessel = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.name === "string" &&
  typeof value.purpose === "string" &&
  typeof value.officialNumber === "string" &&
  typeof value.retrofitted === "boolean" &&
  isAmount(value.salesPrice);

const isGroups =
  (each: (item: unknown) => boolean) =>
  (value: unknown): boolean =>
    isListOf(value, each);

function isFacility(value: unknown): value is AdvancedManufacturingFacilityFactValue {
  if (!isRecord(value)) return false;
  return (
    typeof value.placedInService === "string" &&
    typeof value.relatedPersonElection === "boolean" &&
    typeof value.section48cProperty === "boolean" &&
    typeof value.passive === "boolean" &&
    isMapOf(value.capacitySales, isGroups(isComponentGroup)) &&
    isMapOf(value.unitSales, isAmount) &&
    isMapOf(value.batterySales, isGroups(isBatteryGroup)) &&
    (value.electrodeActiveMaterialCosts === undefined ||
      isAmount(value.electrodeActiveMaterialCosts)) &&
    isListOf(value.vessels, isVessel) &&
    isMapOf(value.criticalMineralCosts, isAmount)
  );
}

/* Every facility fact, in the order recorded (the order of the Forms 7207); a malformed one is left out and listed. */
export function readAdvancedManufacturingFacilityFacts(facts: ReadonlyArray<FactRow>): {
  facilities: AdvancedManufacturingFacilityFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === FACILITY_CATEGORY && isAdvancedManufacturingFacilityFactKey(row.key),
  );
  return {
    facilities: rows
      .filter((row) => isFacility(row.value))
      .map((row) => ({ key: row.key, value: row.value as AdvancedManufacturingFacilityFactValue })),
    malformedKeys: rows.filter((row) => !isFacility(row.value)).map((row) => row.key),
  };
}
