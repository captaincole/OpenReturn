/*
 * Form 4136 arithmetic: the published examples with numbers, then limit tests
 * that need no source. Each example names its block id.
 */

import { describe, expect, it } from "vitest";
import { FUEL_TAX_LINES } from "../../../../src/facts/index.js";
import {
  actualFuelCost,
  amountOfCredit,
  claimCredit,
  claimRate,
  dollarsAndCents,
  gallonEquivalents,
  line17,
  schedule3Line12,
} from "../../../../src/federal/4136/lines.js";
import { FUEL_ROWS, fuelRowOf, rowsCarriedBy } from "../../../../src/federal/4136/rows.js";

const row = (line: string) => fuelRowOf(line)!;

describe("published examples", () => {
  it("instructions, line 11 type of use 5: 10,000 gallons of LPG is 7,391 GGE and $805.62", () => {
    // irs-4136-inst-2025::sec::line-11::b02
    const gge = gallonEquivalents(10000, row("11a").unitsPerEquivalent!.gallons!);
    expect(gge).toBe(7391);
    const rate = claimRate(row("11a"), 5, false);
    expect(rate).toBe(0.109);
    expect(amountOfCredit([claimCredit(rate, gge)])).toBe(805.62);
  });

  it("Pub. 225, the custom operator: 200 gallons of undyed diesel used on the farm, line 3b", () => {
    // irs-pub-225-2025::sec::fuels-used-in-farming::b06, b08: $.243 a gallon.
    expect(amountOfCredit([claimCredit(claimRate(row("3b"), 1, false), 200)])).toBe(48.6);
  });

  it("instructions, home kerosene on line 4a: gallons × $.243", () => {
    // irs-4136-inst-2025::sec::line-4::b02, step 3.
    expect(amountOfCredit([claimCredit(claimRate(row("4a"), 8, false), 150)])).toBe(36.45);
  });
});

describe("rates", () => {
  it("type of use 5 takes the bus rate only on a line that has one", () => {
    expect(claimRate(row("14a"), 5, false)).toBe(0.124);
    expect(claimRate(row("14a"), 2, false)).toBe(0.197);
    expect(claimRate(row("11g"), 5, false)).toBe(0.169);
    expect(claimRate(row("3d"), 5, false)).toBe(0.17);
  });

  it("line 13c kerosene taxed at $.244 claims $.243; any other line ignores the flag", () => {
    expect(claimRate(row("13c"), undefined, true)).toBe(0.243);
    expect(claimRate(row("13c"), undefined, false)).toBe(0.218);
    expect(claimRate(row("13b"), undefined, true)).toBe(0.243);
  });

  it("CNG and LNG convert by their own equivalents", () => {
    expect(gallonEquivalents(123570, row("11c").unitsPerEquivalent!.cubic_feet!)).toBe(1000);
    expect(gallonEquivalents(1710, row("11g").unitsPerEquivalent!.gallons!)).toBe(1000);
    expect(gallonEquivalents(566, row("11c").unitsPerEquivalent!.pounds!)).toBe(100);
  });
});

describe("the table", () => {
  it("has one row for every line a claim can name, and no other", () => {
    expect(FUEL_ROWS.map((each) => each.line)).toEqual([...FUEL_TAX_LINES]);
  });

  it("brackets join 1a-1c, 3a-3b, 4a-4b and 7a-7b; every other row carries itself", () => {
    expect(rowsCarriedBy("1c").map((each) => each.line)).toEqual(["1a", "1b", "1c"]);
    expect(rowsCarriedBy("3b").map((each) => each.line)).toEqual(["3a", "3b"]);
    expect(rowsCarriedBy("4b").map((each) => each.line)).toEqual(["4a", "4b"]);
    expect(rowsCarriedBy("7b").map((each) => each.line)).toEqual(["7a", "7b"]);
    const joined = new Set(["1a", "1b", "3a", "4a", "7a"]);
    for (const each of FUEL_ROWS) {
      if (!joined.has(each.line)) expect(each.carrier).toBe(each.line);
    }
  });

  it("a row prints its type of use or lists the allowed ones, never both", () => {
    for (const each of FUEL_ROWS) {
      expect(each.printedUse !== undefined && each.allowedUses !== undefined).toBe(false);
    }
  });
});

describe("limits", () => {
  it("a bracket's credit is the credits added, then rounded once to the cent", () => {
    const credits = [claimCredit(0.183, 1200), claimCredit(0.183, 800), claimCredit(0.183, 300)];
    expect(amountOfCredit(credits)).toBe(420.9);
    expect(amountOfCredit(credits)).toBe(amountOfCredit([claimCredit(0.183, 2300)]));
  });

  it("the fuel cost keeps its cents", () => {
    expect(actualFuelCost([4140, 2760, 1035.5])).toBe(7935.5);
  });

  it("line 17 is the rows added, and blank with no row", () => {
    expect(line17([420.9, 92, 805.62])).toBe(1318.52);
    expect(line17([])).toBeUndefined();
  });

  it("Schedule 3 line 12 rounds line 17 to the nearest dollar at the 50-cent edge", () => {
    expect(schedule3Line12(8366.32)).toBe(8366);
    expect(schedule3Line12(100.5)).toBe(101);
    expect(schedule3Line12(100.49)).toBe(100);
  });

  it("an amount splits into its dollars and two-digit cents", () => {
    expect(dollarsAndCents(805.62)).toEqual({ dollars: 805, cents: "62" });
    expect(dollarsAndCents(0.5)).toEqual({ dollars: 0, cents: "50" });
    expect(dollarsAndCents(17.05)).toEqual({ dollars: 17, cents: "05" });
    expect(dollarsAndCents(92)).toEqual({ dollars: 92, cents: "00" });
  });

  it("a credit is never more than the highest rate times the gallons", () => {
    const top = Math.max(...FUEL_ROWS.map((each) => each.rate));
    for (const each of FUEL_ROWS) {
      expect(claimCredit(claimRate(each, 5, true), 1000)).toBeLessThanOrEqual(top * 1000);
    }
  });
});
