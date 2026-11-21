/*
 * Form 3903 lines from the published example (Pub. 521 for 2017, whose lines 1–5
 * are the 2025 lines) and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  STANDARD_MILEAGE_RATE_2025,
  excessReimbursements,
  form3903Lines,
  movingExpenseDeduction,
  namesBothVehicleMethods,
  travelExpenses,
} from "../../../../src/federal/3903/lines.js";

describe("Form 3903, published example", () => {
  /*
   * Pub. 521 (2017), Illustrated Example, Tom and Peggy Smith: personal effects
   * $8,000; 2,200 miles at the 2017 rate of 17 cents ($374) and $180 lodging
   * (meals of $320 left out); $7,354 in W-2 box 12 code P. Lines 1–5:
   * 8,000; 554; 8,554; 7,354; Yes, 1,200.
   */
  it("Pub. 521 (2017) Tom and Peggy Smith: line 2 is 554 at 17 cents a mile", () => {
    expect(travelExpenses({ vehicleMiles: 2200, lodging: 180 }, 0.17)).toBe(554);
  });

  it("Pub. 521 (2017) Tom and Peggy Smith: lines 1–5 are 8,000; 554; 8,554; 7,354; 1,200", () => {
    expect(
      form3903Lines({ householdGoods: 8000, travel: 554, governmentReimbursements: 7354 }),
    ).toEqual({
      line1: 8000,
      line2: 554,
      line3: 8554,
      line4: 7354,
      line5Yes: true,
      line5: 1200,
      excessReimbursement: undefined,
    });
  });
});

describe("Form 3903 line 2", () => {
  it("2025 mileage is 21 cents a mile", () => {
    expect(STANDARD_MILEAGE_RATE_2025).toBe(0.21);
    expect(travelExpenses({ vehicleMiles: 1000 })).toBeCloseTo(210, 10);
  });

  it("parking fees and tolls add under either vehicle method", () => {
    expect(travelExpenses({ vehicleGasAndOil: 140, parkingAndTolls: 12 })).toBe(152);
    expect(travelExpenses({ vehicleMiles: 100, parkingAndTolls: 12 })).toBeCloseTo(33, 10);
  });

  it("fares and lodging with no vehicle", () => {
    expect(travelExpenses({ fares: 640.25, lodging: 210 })).toBe(850.25);
  });

  it("no travel parts is 0", () => {
    expect(travelExpenses({})).toBe(0);
  });

  it("both vehicle methods are flagged; one is not", () => {
    expect(namesBothVehicleMethods({ vehicleMiles: 10, vehicleGasAndOil: 5 })).toBe(true);
    expect(namesBothVehicleMethods({ vehicleMiles: 10 })).toBe(false);
    expect(namesBothVehicleMethods({ vehicleGasAndOil: 5 })).toBe(false);
  });
});

describe("Form 3903 limits", () => {
  it("each amount line rounds to the nearest dollar, and line 3 adds the rounded lines", () => {
    const lines = form3903Lines({
      householdGoods: 100.5,
      travel: 200.49,
      governmentReimbursements: 0.5,
    });
    expect([lines.line1, lines.line2, lines.line3, lines.line4]).toEqual([101, 200, 301, 1]);
  });

  it("line 3 one dollar more than line 4: Yes, line 5 is 1", () => {
    const lines = form3903Lines({ householdGoods: 501, travel: 0, governmentReimbursements: 500 });
    expect([lines.line5Yes, lines.line5, lines.excessReimbursement]).toEqual([true, 1, undefined]);
  });

  it("line 3 equal to line 4: No, no deduction and no income", () => {
    const lines = form3903Lines({
      householdGoods: 400,
      travel: 100,
      governmentReimbursements: 500,
    });
    expect([lines.line5Yes, lines.line5, lines.excessReimbursement]).toEqual([
      false,
      undefined,
      undefined,
    ]);
  });

  it("line 4 more than line 3: No, the excess goes to Form 1040 line 1h", () => {
    const lines = form3903Lines({
      householdGoods: 400,
      travel: 100,
      governmentReimbursements: 750,
    });
    expect([lines.line5Yes, lines.line5, lines.excessReimbursement]).toEqual([
      false,
      undefined,
      250,
    ]);
  });

  it("no reimbursement: line 5 equals line 3", () => {
    const lines = form3903Lines({ householdGoods: 1200, travel: 300, governmentReimbursements: 0 });
    expect([lines.line4, lines.line5]).toEqual([0, 1500]);
  });

  it("on Yes, line 4 + line 5 = line 3, and line 5 is never negative", () => {
    for (const reimbursement of [0, 10, 999, 1000, 1001, 5000]) {
      const lines = form3903Lines({
        householdGoods: 700,
        travel: 300,
        governmentReimbursements: reimbursement,
      });
      if (lines.line5Yes) expect(lines.line4 + (lines.line5 ?? 0)).toBe(lines.line3);
      expect(lines.line5 ?? 0).toBeGreaterThanOrEqual(0);
      expect(lines.excessReimbursement ?? 0).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Form 3903 allowances that are not income", () => {
  /*
   * Lines 1 and 2: "don't include any expenses that were reimbursed by an
   * allowance you don't have to include in your income" (line-1::b02,
   * line-2::b01). Line 4 leaves the dislocation allowance out (line-4::b01).
   */
  it("a $2,500 dislocation allowance comes off line 1 first: 500; 600; 1,100; 1,000; Yes, 100", () => {
    expect(
      form3903Lines({
        householdGoods: 3000,
        travel: 600,
        governmentReimbursements: 1000,
        excludedAllowances: 2500,
      }),
    ).toEqual({
      line1: 500,
      line2: 600,
      line3: 1100,
      line4: 1000,
      line5Yes: true,
      line5: 100,
      excessReimbursement: undefined,
    });
  });

  it("an allowance over line 1 takes the rest off line 2", () => {
    const lines = form3903Lines({
      householdGoods: 400,
      travel: 600,
      governmentReimbursements: 0,
      excludedAllowances: 700,
    });
    expect([lines.line1, lines.line2, lines.line3, lines.line5]).toEqual([0, 300, 300, 300]);
  });

  it("an allowance over both lines leaves them at 0 and is not Form 1040 line 1h income", () => {
    const lines = form3903Lines({
      householdGoods: 400,
      travel: 100,
      governmentReimbursements: 0,
      excludedAllowances: 2500,
    });
    expect([lines.line1, lines.line2, lines.line3, lines.line5Yes]).toEqual([0, 0, 0, false]);
    expect(lines.excessReimbursement).toBeUndefined();
  });

  it("no allowance stated changes nothing", () => {
    const amounts = { householdGoods: 3000, travel: 600, governmentReimbursements: 1000 };
    expect(form3903Lines(amounts)).toEqual(form3903Lines({ ...amounts, excludedAllowances: 0 }));
    expect(form3903Lines(amounts).line5).toBe(2600);
  });
});

describe("Totals of every Form 3903", () => {
  const yes = form3903Lines({ householdGoods: 1000, travel: 0, governmentReimbursements: 400 });
  const no = form3903Lines({ householdGoods: 100, travel: 0, governmentReimbursements: 300 });
  const other = form3903Lines({ householdGoods: 250, travel: 0, governmentReimbursements: 0 });

  it("Schedule 1 line 14 adds every line 5; blank when none has one", () => {
    expect(movingExpenseDeduction([yes, no, other])).toBe(850);
    expect(movingExpenseDeduction([no])).toBeUndefined();
    expect(movingExpenseDeduction([])).toBeUndefined();
  });

  it("Form 1040 line 1h adds every excess; blank when none has one", () => {
    expect(excessReimbursements([yes, no])).toBe(200);
    expect(excessReimbursements([yes])).toBeUndefined();
  });
});
