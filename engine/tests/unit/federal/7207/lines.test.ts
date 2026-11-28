/*
 * Form 7207's pure arithmetic: the five column (d) examples of the
 * instructions (column (e) is the form's (c) x (d)), the battery limits, and
 * the totals. The examples are named by their block id.
 */

import { describe, expect, it } from "vitest";
import { PART_II_ROWS } from "../../../../src/federal/7207/components.js";
import {
  BATTERY_CELL_MINIMUM_KWH,
  BATTERY_MODULE_MINIMUM_KWH,
  CAPACITY_TO_POWER_LIMIT,
  aggregateCapacity,
  batteryAggregateCapacity,
  countedKwhEach,
  creditOfRow,
  dollarTotal,
  line8a,
  unitsSold,
} from "../../../../src/federal/7207/lines.js";

const rateOf = (line: string) => PART_II_ROWS.find((row) => row.line === line)!.rate;

describe("Form 7207 instructions examples", () => {
  it("line-1-2::b03: 500 cells of 100 W and 1,500 of 200 W are 350,000 on line 1a", () => {
    const columnD = aggregateCapacity([
      { count: 500, capacityEach: 100 },
      { count: 1500, capacityEach: 200 },
    ]);
    expect(columnD).toBe(350000);
    expect(creditOfRow(rateOf("1a"), columnD)).toBe(14000);
  });

  it("line-1-2::b03: 300 modules of 100 W and 400 of 200 W are 110,000 on line 1e", () => {
    const columnD = aggregateCapacity([
      { count: 300, capacityEach: 100 },
      { count: 400, capacityEach: 200 },
    ]);
    expect(columnD).toBe(110000);
    expect(creditOfRow(rateOf("1e"), columnD)).toBe(7700);
  });

  it("line-2::b02: three blades each for 6 MW and 10 MW turbines are 48,000,000 on line 2b", () => {
    const columnD = aggregateCapacity([
      { count: 3, capacityEach: 6_000_000 },
      { count: 3, capacityEach: 10_000_000 },
    ]);
    expect(columnD).toBe(48_000_000);
    expect(creditOfRow(rateOf("2b"), columnD)).toBe(960000);
  });

  it("line-3-2::b03: 50 central inverters of 1,000 W and 100 of 2,500 W are 300,000 on line 3a", () => {
    const columnD = aggregateCapacity([
      { count: 50, capacityEach: 1000 },
      { count: 100, capacityEach: 2500 },
    ]);
    expect(columnD).toBe(300000);
    expect(creditOfRow(rateOf("3a"), columnD)).toBe(750);
  });

  it("line-5-2::b02: 50 cells of 12 kWh and 100 of 15 kWh are 2,100 kWh on line 5a", () => {
    // The example gives no discharge amount; 1 kW keeps each cell under the 100:1 limit.
    const columnD = batteryAggregateCapacity("battery_cell", [
      { count: 50, capacityKwhEach: 12, maxDischargeKwEach: 1 },
      { count: 100, capacityKwhEach: 15, maxDischargeKwEach: 1 },
    ]);
    expect(columnD).toBe(2100);
    expect(creditOfRow(rateOf("5a"), columnD)).toBe(73500);
  });
});

describe("Form 7207 column (c), the rates of section 45X(b)(1) and (b)(2)", () => {
  it("each Part II line carries the face's credit per unit", () => {
    const rates = Object.fromEntries(PART_II_ROWS.map((row) => [row.line, row.rate]));
    expect(rates).toEqual({
      "1a": 0.04,
      "1b": 12,
      "1c": 3,
      "1d": 0.4,
      "1e": 0.07,
      "1f": 0.87,
      "1g": 2.28,
      "2a": 0.1,
      "2b": 0.02,
      "2c": 0.05,
      "2d": 0.03,
      "2e": 0.02,
      "2f": 0.04,
      "3a": 0.0025,
      "3b": 0.015,
      "3c": 0.02,
      "3d": 0.065,
      "3e": 0.11,
      "3f": 0.11,
      "4a": 0.1,
      "5a": 35,
      "5b": 10,
      "5c": 45,
      "6a": 0.1,
      "6b": 0.025,
    });
  });
});

describe("Form 7207 battery limits (line-5-2::b01, ::b02)", () => {
  it("caps a cell's capacity at 100 times its maximum discharge", () => {
    const group = { count: 1, capacityKwhEach: 300, maxDischargeKwEach: 2 };
    expect(countedKwhEach("battery_cell", group)).toBe(CAPACITY_TO_POWER_LIMIT * 2);
  });

  it("at exactly 100:1 the capacity counts in full", () => {
    const group = { count: 1, capacityKwhEach: 200, maxDischargeKwEach: 2 };
    expect(countedKwhEach("battery_module_with_cells", group)).toBe(200);
  });

  it("caps a module with no cells too (the DECISION in lines.ts)", () => {
    const group = { count: 2, capacityKwhEach: 500, maxDischargeKwEach: 1 };
    expect(batteryAggregateCapacity("battery_module_without_cells", [group])).toBe(200);
  });

  it("a cell under 12 watt-hours is not an eligible component", () => {
    expect(
      countedKwhEach("battery_cell", {
        count: 1,
        capacityKwhEach: 0.011,
        maxDischargeKwEach: 1,
      }),
    ).toBe(0);
    expect(
      countedKwhEach("battery_cell", {
        count: 1,
        capacityKwhEach: BATTERY_CELL_MINIMUM_KWH,
        maxDischargeKwEach: 1,
      }),
    ).toBe(BATTERY_CELL_MINIMUM_KWH);
  });

  it("a module needs 7 kWh, or 1 kWh for a hydrogen fuel cell vehicle", () => {
    const small = { count: 1, capacityKwhEach: 6.9, maxDischargeKwEach: 1 };
    expect(countedKwhEach("battery_module_with_cells", small)).toBe(0);
    expect(countedKwhEach("battery_module_without_cells", small)).toBe(0);
    expect(
      countedKwhEach("battery_module_with_cells", { ...small, hydrogenFuelCellVehicle: true }),
    ).toBe(6.9);
    const edge = { count: 1, capacityKwhEach: BATTERY_MODULE_MINIMUM_KWH, maxDischargeKwEach: 1 };
    expect(countedKwhEach("battery_module_with_cells", edge)).toBe(7);
  });
});

describe("Form 7207 totals and rounding", () => {
  it("column (e) is whole dollars, the nearest dollar", () => {
    expect(creditOfRow(0.065, 7)).toBe(0); // 0.455
    expect(creditOfRow(0.065, 8)).toBe(1); // 0.52
    expect(creditOfRow(0.0025, 300)).toBe(1); // 0.75
  });

  it("column (d) keeps 3 places of a capacity, and float error does not show", () => {
    expect(aggregateCapacity([{ count: 3, capacityEach: 0.1 }])).toBe(0.3);
    expect(unitsSold(12.34567)).toBe(12.346);
  });

  it("a dollar total rounds each entry, then adds", () => {
    expect(dollarTotal([100.4, 100.4, 100.4])).toBe(300);
  });

  it("line 8a is the sum of column (e) and line 7", () => {
    expect(line8a([9600, 6000, 3600], undefined)).toBe(19200);
    expect(line8a([], 4200)).toBe(4200);
    expect(line8a([100], 50)).toBe(150);
  });

  it("a credit is never more than its rate times column (d), plus the rounding", () => {
    // roundDollars snaps to cents first, so 2.4975 is 2.50 and rounds up: at most 50.5 cents.
    const ROUNDING = 0.505;
    for (const row of PART_II_ROWS) {
      for (const columnD of [0, 1, 999, 123456.789]) {
        const credit = creditOfRow(row.rate, columnD);
        expect(credit).toBeGreaterThanOrEqual(0);
        expect(credit).toBeLessThanOrEqual(row.rate * columnD + ROUNDING);
      }
    }
  });
});
