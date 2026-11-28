/*
 * Parts II to IV of one facility's Form 7207: column (d) of each Part II row
 * from the facility's sales (components.ts names the source of each row), and
 * column (e) = (c) x (d) for every row the same way. Part III lists the
 * vessels of line 2a and Part IV the minerals of line 6a.
 */

import {
  CRITICAL_MINERALS,
  type AdvancedManufacturingFacilityFactValue,
  type CapacityComponent,
  type ComponentGroup,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import {
  INVERTER_CAPACITY,
  MINERAL_TOTAL_FIELD,
  PART_II_ROWS,
  VESSEL_ROWS,
  VESSEL_TOTAL_FIELD,
  mineralField,
  vesselField,
  type ComponentRow,
} from "./components.js";
import {
  aggregateCapacity,
  batteryAggregateCapacity,
  creditOfRow,
  dollarTotal,
  unitsSold,
} from "./lines.js";
import type { Cells } from "./partI.js";

type Facility = AdvancedManufacturingFacilityFactValue;
/* Column (d) of a row: blank when nothing was sold, or the gap that stops the row. */
type ColumnD = number | Unsupported | undefined;

const MORE_VESSELS_GAP = `More than ${VESSEL_ROWS} related offshore wind vessels need another Part III ("Attach additional Parts III", face Part III), which the engine does not print.`;

const INVERTER_GAP = (component: string, watts: number) =>
  `An inverter of ${watts} watts (ac) is not a ${component.split("_").join(" ")} by its capacity (irs-7207-inst-2025::sec::line-3-2::b01, ::b02): state it on the line its capacity fits.`;

/* The first group whose capacity is outside its inverter line's range (components.ts), or undefined. */
function misplacedInverter(
  component: CapacityComponent,
  groups: ReadonlyArray<ComponentGroup>,
): ComponentGroup | undefined {
  const range = INVERTER_CAPACITY[component];
  if (range === undefined) return undefined;
  return groups.find(
    ({ capacityEach }) =>
      (range.above !== undefined && capacityEach <= range.above) ||
      (range.from !== undefined && capacityEach < range.from) ||
      (range.atMost !== undefined && capacityEach > range.atMost),
  );
}

function capacityColumnD(facility: Facility, component: CapacityComponent): ColumnD {
  const groups = facility.capacitySales?.[component];
  if (groups === undefined || groups.length === 0) return undefined;
  const misplaced = misplacedInverter(component, groups);
  if (misplaced) return unsupported(INVERTER_GAP(component, misplaced.capacityEach));
  return aggregateCapacity(groups);
}

/* Part III's total, line 2a column (d); blank with no vessel. */
function vesselTotal(facility: Facility): ColumnD {
  const vessels = facility.vessels ?? [];
  if (vessels.length === 0) return undefined;
  if (vessels.length > VESSEL_ROWS) return unsupported(MORE_VESSELS_GAP);
  return dollarTotal(vessels.map((vessel) => vessel.salesPrice));
}

/* Part IV line 74, line 6a column (d); blank with no mineral. */
function mineralTotal(facility: Facility): ColumnD {
  const costs = Object.values(facility.criticalMineralCosts ?? {});
  return costs.length === 0 ? undefined : dollarTotal(costs);
}

function columnDOf(row: ComponentRow, facility: Facility): ColumnD {
  switch (row.kind) {
    case "capacity":
      return capacityColumnD(facility, row.component);
    case "units": {
      const units = facility.unitSales?.[row.component];
      return units === undefined ? undefined : unitsSold(units);
    }
    case "battery": {
      const groups = facility.batterySales?.[row.component];
      return groups === undefined || groups.length === 0
        ? undefined
        : batteryAggregateCapacity(row.component, groups);
    }
    case "vessels":
      return vesselTotal(facility);
    case "electrode_costs":
      return roundDollars(facility.electrodeActiveMaterialCosts);
    case "critical_minerals":
      return mineralTotal(facility);
    case "metallurgical_coal":
      /*
       * Metallurgical coal is an applicable critical mineral "For tax years
       * beginning after July 4, 2025" (irs-7207-inst-2025::sec::what-s-new::b01).
       * A 2025 individual return's tax year began January 1, 2025: line 6b is blank.
       */
      return undefined;
  }
}

/* Part III: one row per vessel, the first 49; "New or retrofitted" checks one box. */
function vesselCells(facility: Facility): Cells {
  const vessels = facility.vessels ?? [];
  const cells: Cells = {};
  vessels.slice(0, VESSEL_ROWS).forEach((vessel, index) => {
    const row = index + 1;
    cells[vesselField(row, "vessel_name")] = vessel.name;
    cells[vesselField(row, "vessel_purpose")] = vessel.purpose;
    cells[vesselField(row, "vessel_official_number")] = vessel.officialNumber;
    cells[vesselField(row, vessel.retrofitted ? "retrofitted" : "new")] = true;
    cells[vesselField(row, "sales_price")] = roundDollars(vessel.salesPrice);
  });
  const total = vesselTotal(facility);
  if (total !== undefined) cells[VESSEL_TOTAL_FIELD] = total;
  return cells;
}

/* Part IV: each mineral's costs, whole dollars, and line 74. */
function mineralCells(facility: Facility): Cells {
  const costs = facility.criticalMineralCosts ?? {};
  const cells: Cells = {};
  for (const mineral of CRITICAL_MINERALS) {
    const cost = costs[mineral];
    if (cost !== undefined) cells[mineralField(mineral)] = roundDollars(cost);
  }
  const total = mineralTotal(facility);
  if (total !== undefined) cells[MINERAL_TOTAL_FIELD] = total;
  return cells;
}

export interface FacilityRows {
  cells: Cells;
  /* Column (e) of every row that has one, for line 8a. */
  columnE: Array<number | Unsupported>;
}

/* Parts II to IV of one facility. */
export function facilityRows(facility: Facility): FacilityRows {
  const cells: Cells = { ...vesselCells(facility), ...mineralCells(facility) };
  const columnE: Array<number | Unsupported> = [];
  for (const row of PART_II_ROWS) {
    const columnD = columnDOf(row, facility);
    if (columnD === undefined) continue;
    const credit = typeof columnD === "number" ? creditOfRow(row.rate, columnD) : columnD;
    cells[`${row.field}_col_d`] = columnD;
    cells[`${row.field}_col_e`] = credit;
    columnE.push(credit);
  }
  return { cells, columnE };
}
