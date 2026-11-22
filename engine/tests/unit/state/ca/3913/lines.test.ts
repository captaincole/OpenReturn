/*
 * FTB 3913 lines from the published examples (the FTB distance test; Pub. 521
 * for 2017, whose Form 3903 lines 1–5 are FTB 3913's lines) and limit tests that
 * need no source.
 */

import { describe, expect, it } from "vitest";
import {
  CA_STANDARD_MILEAGE_RATE_2025,
  DISTANCE_TEST_MILES,
  caTravelExpenses,
  distanceTestLine3,
  form3913Lines,
  meetsDistanceTest,
  scheduleCaLine14Addition,
  scheduleCaLine1hAddition,
  type MoveForm,
} from "../../../../../src/state/ca/3913/lines.js";

const PUB_521_2017_RATE = 0.17;

describe("FTB 3913, published examples", () => {
  /*
   * ca-3913-inst-2025::sec::distance-test::b01: "if your old workplace was 3
   * miles from your old home, your new workplace must be at least 53 miles
   * from that home."
   */
  it("FTB 3913 instructions distance test: 3 miles to the old workplace needs 53 to the new one", () => {
    expect(meetsDistanceTest(53, 3)).toBe(true);
    expect(meetsDistanceTest(52, 3)).toBe(false);
  });

  // Pub. 521 (2017): old main job location 3 miles away, new one 60: "57 miles farther", meets the test.
  it("Pub. 521 (2017) distance example: 60 − 3 = 57 miles meets the test", () => {
    expect(distanceTestLine3(60, 3)).toBe(57);
    expect(meetsDistanceTest(60, 3)).toBe(true);
  });

  /*
   * Pub. 521 (2017), Josh and Robyn: 1,100 miles at 17 cents ($187), $40
   * tolls, $150 lodging, a $400 plane ticket: $777.
   */
  it("Pub. 521 (2017) Josh and Robyn: line 2 is 777 at 17 cents a mile", () => {
    expect(
      caTravelExpenses(
        { vehicleMiles: 1100, parkingAndTolls: 40, lodging: 150, fares: 400 },
        PUB_521_2017_RATE,
      ),
    ).toBe(777);
  });

  /*
   * Pub. 521 (2017), Illustrated Example, Tom and Peggy: personal effects
   * $8,000; 2,200 miles at 17 cents ($374) and $180 lodging; $7,354 paid that
   * is not in box 1. Lines 1–5: 8,000; 554; 8,554; 7,354; Yes, 1,200.
   */
  it("Pub. 521 (2017) Tom and Peggy: lines 1–5 are 8,000; 554; 8,554; 7,354; 1,200", () => {
    const travel = caTravelExpenses({ vehicleMiles: 2200, lodging: 180 }, PUB_521_2017_RATE);
    expect(travel).toBe(554);
    expect(form3913Lines({ householdGoods: 8000, travel, governmentReimbursements: 7354 })).toEqual(
      {
        line1: 8000,
        line2: 554,
        line3: 8554,
        line4: 7354,
        line5Yes: true,
        line5: 1200,
        excessReimbursement: undefined,
      },
    );
  });
});

describe("FTB 3913, stated rules and limits", () => {
  it("the 2025 mileage rate is 21 cents (what-s-new::b01)", () => {
    expect(CA_STANDARD_MILEAGE_RATE_2025).toBe(0.21);
    expect(caTravelExpenses({ vehicleMiles: 1000 })).toBeCloseTo(210, 10);
  });

  it("the distance test edge: exactly 50 miles meets it, 49.9 does not", () => {
    expect(meetsDistanceTest(62, 12)).toBe(true);
    expect(meetsDistanceTest(61.9, 12)).toBe(false);
    expect(DISTANCE_TEST_MILES).toBe(50);
  });

  it("no old workplace: line 2 of the worksheet is 0", () => {
    expect(distanceTestLine3(50, undefined)).toBe(50);
    expect(meetsDistanceTest(50, undefined)).toBe(true);
  });

  it("worksheet line 3 is never below 0", () => {
    expect(distanceTestLine3(10, 40)).toBe(0);
  });

  it("line 3 equals line 1 + line 2, and line 5 equals line 3 − line 4 on Yes", () => {
    const lines = form3913Lines({
      householdGoods: 7257.75,
      travel: 319.2,
      governmentReimbursements: 1200.4,
    });
    expect(lines.line3).toBe(lines.line1 + lines.line2);
    expect(lines.line5).toBe(lines.line3 - lines.line4);
    expect(lines.line5).toBeLessThanOrEqual(lines.line3);
  });

  it("line 3 equal to line 4: No, no deduction, no excess (line-5::b01)", () => {
    const lines = form3913Lines({
      householdGoods: 1500,
      travel: 500,
      governmentReimbursements: 2000,
    });
    expect(lines.line5Yes).toBe(false);
    expect(lines.line5).toBeUndefined();
    expect(lines.excessReimbursement).toBeUndefined();
  });

  it("line 4 more than line 3: No, the excess is line 4 − line 3", () => {
    const lines = form3913Lines({
      householdGoods: 1940.3,
      travel: 46.9,
      governmentReimbursements: 3000,
    });
    expect([lines.line1, lines.line2, lines.line3, lines.line4]).toEqual([1940, 47, 1987, 3000]);
    expect(lines.line5Yes).toBe(false);
    expect(lines.excessReimbursement).toBe(1013);
  });

  /*
   * Lines 1 and 2 leave out "any expenses that were reimbursed by an allowance
   * you do not have to include in your income" (line-2::b01, storage-fees::b01),
   * and line 4 leaves out "any part of a dislocation allowance" (line-4::b01).
   * Movers $2,500, lodging $300, a $400 dislocation allowance, nothing else paid.
   */
  it("a dislocation allowance comes off line 1 and stays off line 4", () => {
    const lines = form3913Lines({
      householdGoods: 2500,
      travel: 300,
      governmentReimbursements: 0,
      excludedAllowances: 400,
    });
    expect([lines.line1, lines.line2, lines.line3, lines.line4]).toEqual([2100, 300, 2400, 0]);
    expect([lines.line5Yes, lines.line5]).toEqual([true, 2400]);
  });

  it("one dollar over line 4 is Yes with a $1 deduction", () => {
    const lines = form3913Lines({
      householdGoods: 2001,
      travel: 0,
      governmentReimbursements: 2000,
    });
    expect([lines.line5Yes, lines.line5]).toEqual([true, 1]);
  });
});

describe("Schedule CA (540) amounts", () => {
  const yes = form3913Lines({ householdGoods: 5000, travel: 400, governmentReimbursements: 0 });
  const no = form3913Lines({ householdGoods: 1000, travel: 0, governmentReimbursements: 1600 });
  const forms = (...list: MoveForm[]) => list;

  it("line 14 column C adds line 5 of each non-military form", () => {
    expect(scheduleCaLine14Addition(forms({ military: false, lines: yes }))).toBe(5400);
  });

  it("line 1h column C adds the excess of each non-military form", () => {
    expect(scheduleCaLine1hAddition(forms({ military: false, lines: no }))).toBe(600);
  });

  it("a military form has no California adjustment (line-5::b01)", () => {
    const military = forms({ military: true, lines: yes }, { military: true, lines: no });
    expect(scheduleCaLine14Addition(military)).toBeUndefined();
    expect(scheduleCaLine1hAddition(military)).toBeUndefined();
  });

  it("the totals equal the sum of the parts", () => {
    const list = forms(
      { military: false, lines: yes },
      { military: false, lines: yes },
      { military: false, lines: no },
    );
    expect(scheduleCaLine14Addition(list)).toBe(10800);
    expect(scheduleCaLine1hAddition(list)).toBe(600);
  });
});
