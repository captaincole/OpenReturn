/*
 * The rows of Form 7207 Part II as one table (irs-7207-face-2025, Part II; the
 * rates of column (c) are section 45X(b)(1) and (b)(2)). Every row computes
 * column (e) the same way, column (c) times column (d); the kind says where
 * column (d) comes from. A row's fields are `<field>_col_d` and `<field>_col_e`
 * in catalog.json.
 */

import type {
  BatteryComponent,
  CapacityComponent,
  CriticalMineral,
  UnitComponent,
} from "../../facts/index.js";
import { CRITICAL_MINERALS } from "../../facts/index.js";

export type ComponentRow =
  | { line: string; field: string; rate: number; kind: "capacity"; component: CapacityComponent }
  | { line: string; field: string; rate: number; kind: "units"; component: UnitComponent }
  | { line: string; field: string; rate: number; kind: "battery"; component: BatteryComponent }
  | { line: string; field: string; rate: number; kind: "vessels" }
  | { line: string; field: string; rate: number; kind: "electrode_costs" }
  | { line: string; field: string; rate: number; kind: "critical_minerals" }
  | { line: string; field: string; rate: number; kind: "metallurgical_coal" };

const capacity = (line: string, field: string, rate: number, component: CapacityComponent) =>
  ({ line, field, rate, kind: "capacity", component }) as const;
const units = (line: string, field: string, rate: number, component: UnitComponent) =>
  ({ line, field, rate, kind: "units", component }) as const;
const battery = (line: string, field: string, rate: number, component: BatteryComponent) =>
  ({ line, field, rate, kind: "battery", component }) as const;

/* Lines 1a to 6b, in form order. Page 1 of the catalog is "0.part2.", page 2 is "1.line.". */
export const PART_II_ROWS: ReadonlyArray<ComponentRow> = [
  // irs-7207-inst-2025::sec::line-1-2::b01 to ::b03
  capacity("1a", "0.part2.1a_thin_film_pv_cell", 0.04, "pv_cell"),
  units("1b", "0.part2.1b_photovoltaic_wafer", 12, "photovoltaic_wafer"),
  units("1c", "0.part2.1c_solar_grade_polysilicon", 3, "solar_grade_polysilicon"),
  units("1d", "0.part2.1d_polymeric_backsheet", 0.4, "polymeric_backsheet"),
  capacity("1e", "0.part2.1e_solar_module", 0.07, "solar_module"),
  units("1f", "0.part2.1f_torque_tube", 0.87, "torque_tube"),
  units("1g", "0.part2.1g_structural_fastener", 2.28, "structural_fastener"),
  // irs-7207-inst-2025::sec::line-2::b01, ::b02: 10% of the Part III total; the rest per rated watt
  { line: "2a", field: "0.part2.2a_offshore_wind_vessel", rate: 0.1, kind: "vessels" },
  capacity("2b", "0.part2.2b_blade", 0.02, "blade"),
  capacity("2c", "0.part2.2c_nacelle", 0.05, "nacelle"),
  capacity("2d", "0.part2.2d_tower", 0.03, "tower"),
  capacity("2e", "0.part2.2e_fixed_platform_foundation", 0.02, "fixed_platform_foundation"),
  capacity("2f", "0.part2.2f_floating_platform_foundation", 0.04, "floating_platform_foundation"),
  // irs-7207-inst-2025::sec::line-3-2::b01 to ::b03
  capacity("3a", "1.line.3a_central_inverter", 0.0025, "central_inverter"),
  capacity("3b", "1.line.3b_utility_inverter", 0.015, "utility_inverter"),
  capacity("3c", "1.line.3c_commercial_inverter", 0.02, "commercial_inverter"),
  capacity("3d", "1.line.3d_residential_inverter", 0.065, "residential_inverter"),
  capacity("3e", "1.line.3e_microinverter", 0.11, "microinverter"),
  capacity("3f", "1.line.3f_distributed_wind_inverter", 0.11, "distributed_wind_inverter"),
  // irs-7207-inst-2025::sec::line-4-2::b01: 10% of the costs incurred
  { line: "4a", field: "1.line.4a_electrode_active_materials", rate: 0.1, kind: "electrode_costs" },
  // irs-7207-inst-2025::sec::line-5-2::b01, ::b02
  battery("5a", "1.line.5a_battery_cell", 35, "battery_cell"),
  battery("5b", "1.line.5b_battery_module_with_cells", 10, "battery_module_with_cells"),
  battery("5c", "1.line.5c_battery_module_without_cells", 45, "battery_module_without_cells"),
  // irs-7207-inst-2025::sec::line-6-2::b01, other-minerals::b01: 10% of Part IV line 74
  {
    line: "6a",
    field: "1.line.6a_applicable_critical_minerals",
    rate: 0.1,
    kind: "critical_minerals",
  },
  // irs-7207-inst-2025::sec::what-s-new::b01: 2.5%, for tax years beginning after July 4, 2025
  { line: "6b", field: "1.line.6b_metallurgical_coal", rate: 0.025, kind: "metallurgical_coal" },
];

/*
 * The inverter lines' capacity of each inverter, alternating current watts
 * (irs-7207-inst-2025::sec::line-3-2::b01, ::b02): central more than
 * 1,000 kW; utility more than 125 kW and not more than 1,000 kW; commercial
 * 20 kW to 125 kW; residential not more than 20 kW; a microinverter not more
 * than 650 W; a distributed wind inverter a rated output of not more than
 * 150 kW. Undefined is no bound; `above` excludes its bound, `from` includes it.
 */
export const INVERTER_CAPACITY: Readonly<
  Partial<Record<CapacityComponent, { above?: number; from?: number; atMost?: number }>>
> = {
  central_inverter: { above: 1_000_000 },
  utility_inverter: { above: 125_000, atMost: 1_000_000 },
  commercial_inverter: { from: 20_000, atMost: 125_000 },
  residential_inverter: { atMost: 20_000 },
  microinverter: { atMost: 650 },
  distributed_wind_inverter: { atMost: 150_000 },
};

/* Part III prints 49 vessels; more need another Part III (face Part III). */
export const VESSEL_ROWS = 49;

export const vesselField = (row: number, widget: string) => `2.part3.row${row}_${widget}`;
export const VESSEL_TOTAL_FIELD = "2.part3.total_sales_prices";

/* Part IV line n's field: lines 1 to 50 are on page 4 of the form, 51 to 73 on page 5. */
const LAST_LINE_ON_PAGE_4 = 50;

export function mineralField(mineral: CriticalMineral): string {
  const line = CRITICAL_MINERALS.indexOf(mineral) + 1;
  return line <= LAST_LINE_ON_PAGE_4
    ? `3.part4.${line}_${mineral}_cost`
    : `4.part4.${line}_${mineral}_costs`;
}

export const MINERAL_TOTAL_FIELD = "4.part4.74_total_costs";

/* Lines 7 and 8 (face Part II lines 7, 8a to 8c). */
export const LINE_7_FIELD = "1.line.7_credit_from_other_entities";
export const LINE_8A_FIELD = "1.line.8a_total_credit";
export const LINE_8B_FIELD = "1.line.8b_allocated_to_beneficiaries";
export const LINE_8C_FIELD = "1.line.8c_estate_trust_credit";
