/*
 * Form 7207's arithmetic, pure: column (d) of each Part II row, column (e) =
 * (c) x (d), the Part III and Part IV totals, and line 8a. Column (e) and the
 * dollar columns are whole dollars (CLAUDE.md, nearest dollar); a capacity or
 * quantity in column (d) is not money and keeps 3 places (QUESTIONS.md).
 */

import type { BatteryComponent, BatteryGroup, ComponentGroup } from "../../facts/index.js";
import { roundDollars, roundToPlaces, sum } from "../../money.js";

/* Column (d) when it is a capacity or a count of units: 3 places (QUESTIONS.md). */
export const QUANTITY_PLACES = 3;

/*
 * "Aggregate capacity is determined by multiplying the number of eligible
 * components sold during the tax year ... by the wattage capacity of each
 * respective component" (irs-7207-inst-2025::sec::line-1-2::b03), and the same
 * for wind components (line-2::b02) and inverters (line-3-2::b03).
 */
export function aggregateCapacity(groups: ReadonlyArray<ComponentGroup>): number {
  return roundToPlaces(
    sum(...groups.map((group) => group.count * group.capacityEach)),
    QUANTITY_PLACES,
  );
}

/* "The capacity must not exceed a capacity-to-power ratio of 100:1" (line-5-2::b01, ::b02; 45X(b)(4)(A)). */
export const CAPACITY_TO_POWER_LIMIT = 100;
/* A battery cell is "capable of storing at least 12 watt-hours of energy" (line-5-2::b01): 0.012 kWh. */
export const BATTERY_CELL_MINIMUM_KWH = 0.012;
/* A battery module has "an aggregate capacity of not less than 7 kilowatt-hours" (line-5-2::b01). */
export const BATTERY_MODULE_MINIMUM_KWH = 7;
/* "(or, in the case of a module for a hydrogen fuel cell vehicle, not less than 1 kilowatt-hour)". */
export const HYDROGEN_VEHICLE_MODULE_MINIMUM_KWH = 1;

function minimumKwh(component: BatteryComponent, group: BatteryGroup): number {
  if (component === "battery_cell") return BATTERY_CELL_MINIMUM_KWH;
  return group.hydrogenFuelCellVehicle === true
    ? HYDROGEN_VEHICLE_MODULE_MINIMUM_KWH
    : BATTERY_MODULE_MINIMUM_KWH;
}

/*
 * The capacity one battery cell or module counts for: 0 below the minimum (it
 * is not an eligible component), else its capacity, at most 100 times its
 * maximum discharge amount.
 *
 * DECISION (2026-11-27, by the author): the 100:1 limit applies to a battery
 * module that does not use battery cells (line 5c) too. The instructions say
 * "For purposes of computing the credit amount for a battery module using
 * battery cells, the capacity must not exceed a capacity-to-power ratio of
 * 100:1" (irs-7207-inst-2025::sec::line-5-2::b02) and name no limit for a
 * module with no cells; the form's column (b) prints "(limitations apply; see
 * instructions)" for all of lines 5a to 5c (irs-7207-face-2025, Part II line
 * 5), and the regulation applies the limit to "a battery cell or battery
 * module" (cfr-26-2025::sec::s1.45x-3::e-5, the credit amount of both module
 * kinds, s1.45x-3::e-4-iii). The engine follows the form face: one rule for
 * the three rows, and the instructions do not say a module with no cells is
 * free of it.
 */
export function countedKwhEach(component: BatteryComponent, group: BatteryGroup): number {
  if (group.capacityKwhEach < minimumKwh(component, group)) return 0;
  return Math.min(group.capacityKwhEach, CAPACITY_TO_POWER_LIMIT * group.maxDischargeKwEach);
}

/* Lines 5a to 5c, column (d): "the number of eligible components produced and sold by the capacity of each" (line-5-2::b02). */
export function batteryAggregateCapacity(
  component: BatteryComponent,
  groups: ReadonlyArray<BatteryGroup>,
): number {
  const each = groups.map((group) => group.count * countedKwhEach(component, group));
  return roundToPlaces(sum(...each), QUANTITY_PLACES);
}

/* Lines 1b to 1d, 1f, 1g: "the number of solar energy component units sold" in column (b)'s unit (line-1-2::b03). */
export const unitsSold = (units: number): number => roundToPlaces(units, QUANTITY_PLACES);

/* A dollar column of several amounts: each entry whole dollars, then added (Part III, Part IV line 74). */
export const dollarTotal = (amounts: ReadonlyArray<number>): number =>
  sum(...amounts.map((amount) => roundDollars(amount)));

/* Column (e): "column (c) multiplied by column (d)", whole dollars (face Part II). */
export const creditOfRow = (rate: number, columnD: number): number => roundDollars(rate * columnD);

/*
 * Line 8a: "Add amounts in column (e), lines 1 through 7"
 * (irs-7207-face-2025, Part II line 8a). Line 7 is the credit from
 * pass-through entities, on its own separate form (line-7::b01).
 */
export const line8a = (columnE: ReadonlyArray<number>, line7: number | undefined): number =>
  sum(...columnE, line7);
