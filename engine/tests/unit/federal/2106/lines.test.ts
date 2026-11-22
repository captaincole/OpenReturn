/*
 * Form 2106 arithmetic: each published example with numbers (the 2025
 * instructions and Pub. 463 for 2025), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type {
  EmployeeBusinessExpensesFactValue,
  Form2106VehicleDepreciation,
} from "../../../../src/facts/index.js";
import {
  applicableLimit,
  chartRate,
  FIRST_YEAR_LIMIT_WITH_SPECIAL_ALLOWANCE,
  FIRST_YEAR_LIMIT_WITHOUT_SPECIAL_ALLOWANCE,
  line33Text,
  section179Deduction,
  sectionDLines,
  specialAllowanceWorksheet,
} from "../../../../src/federal/2106/depreciation.js";
import {
  allocateReimbursement,
  impairmentShare,
  partILines,
  reservistLimit,
} from "../../../../src/federal/2106/lines.js";
import {
  businessUseRatio,
  commutingMiles,
  line22,
  percentText,
  vehicleLines,
  type VehicleLines,
} from "../../../../src/federal/2106/vehicle.js";

const owned = (
  overrides: Partial<Form2106VehicleDepreciation> = {},
): Form2106VehicleDepreciation => ({
  basis: 15000,
  method: "200_db",
  subjectToPassengerAutomobileLimits: true,
  ...overrides,
});

describe("Form 2106, published examples", () => {
  it("Pub. 463 (2025) Reimbursement Allocation Worksheet: $7,000 → 0.529, $3,703 meals, $3,297 other", () => {
    // irs-pub-463-2025::sec::reimbursement-allocation-worksheet::b01
    expect(
      allocateReimbursement({ amount: 7000, coveredExpenses: 8500, coveredMeals: 4500 }),
    ).toEqual({ meals: 3703, otherThanMeals: 3297 });
  });

  it("Pub. 463 (2025) allocation example: line 7 is $8,297 in column A and $3,703 in column B", () => {
    // irs-pub-463-2025::sec::reimbursement-allocation-worksheet::b01: $5,000 airfare + $3,297.
    const lines = partILines({
      vehicleExpense: 4000,
      overnightTravel: 5500,
      meals: 4500,
      reimbursements: {
        otherThanMeals: 5000,
        singlePayment: { amount: 7000, coveredExpenses: 8500, coveredMeals: 4500 },
      },
      mealsRate: 0.5,
    });
    expect([lines.line7a, lines.line7b]).toEqual([8297, 3703]);
    // Line 8: 9,500 − 8,297 and 4,500 − 3,703; line 9B is 50% of 797.
    expect([lines.line8a, lines.line8b, lines.line9a, lines.line9b]).toEqual([
      1203, 797, 1203, 399,
    ]);
    expect(lines.line10).toBe(1602);
  });

  it("2106 instructions line 31 example: $25,000 section 179 basis, $20,200 limit, 75% → $15,150", () => {
    // irs-2106-inst-2025::sec::line-31::b02, b03
    expect(section179Deduction(owned({ basis: 25000, section179Cost: 25000 }), 0.75, 20200)).toBe(
      15150,
    );
  });

  it("2106 instructions line 31 example: with the special allowance, line 31 stays $15,150", () => {
    // The worksheet: line 6 is 15,150 − 15,150 = 0, so line 7 adds nothing to section 179.
    expect(
      specialAllowanceWorksheet({
        basis: 25000,
        businessUse: 0.75,
        section179: 15150,
        limit: 20200,
        rate: 1,
      }),
    ).toBe(15150);
  });

  it("Pub. 463 (2025) $15,000 used car, 60%, section 179, not qualified: $7,320 and $1,680 left", () => {
    // irs-pub-463-2025::sec::maximum-depreciation-deduction-for-3::b02–b04
    const lines = sectionDLines({
      depreciation: owned({
        basis: 15000,
        section179Cost: 15000,
        specialAllowance: "not_qualified",
      }),
      placedInService: "2025-09-04",
      businessUse: 0.6,
      ownerWages: 50000,
    });
    expect(lines).toMatchObject({ line31: 7320, line32: 1680, line36: 12200, line37: 7320 });
    // "You have reached your maximum depreciation deduction for 2025."
    expect(typeof lines !== "string" && lines.line38).toBe(7320);
  });

  it("Pub. 463 (2025) $17,500 car, May 2025, 40% business: $700, the lesser of $700 and $4,880", () => {
    // irs-pub-463-2025::sec::car-used-50-or-less-for-business::b02
    const lines = sectionDLines({
      depreciation: owned({
        basis: 17500,
        method: "straight_line",
        specialAllowance: "not_qualified",
      }),
      placedInService: "2025-05-15",
      businessUse: 0.4,
      ownerWages: 50000,
    });
    expect(lines).toMatchObject({
      line31: 0,
      line32: 7000,
      line33: "SL 10%",
      line34: 700,
      line37: 4880,
      line38: 700,
    });
  });

  it("Pub. 463 (2025) truck bought February 2024 for $9,200, 90% business in 2025, 200 DB 32%: $2,650", () => {
    // irs-pub-463-2025::sec::modified-accelerated-cost-recovery-system::b05, b06
    const lines = sectionDLines({
      depreciation: owned({ basis: 9200, subjectToPassengerAutomobileLimits: false }),
      placedInService: "2024-02-10",
      businessUse: 0.9,
      ownerWages: 50000,
    });
    expect(lines).toMatchObject({ line32: 8280, line33: "200 DB 32%", line34: 2650, line38: 2650 });
  });

  it("2106 instructions line 33 example: a car placed in service July 1, 2025, column (a) is 200 DB 20%", () => {
    // irs-2106-inst-2025::sec::line-33::b01
    const rate = chartRate(owned(), "2025-07-01", 0.8);
    expect(typeof rate !== "string" && line33Text(rate.method, rate.percent)).toBe("200 DB 20%");
  });

  it("Pub. 463 (2025) personal use first 6 months, then 12,000 of 15,000 miles: 40% business use", () => {
    // irs-pub-463-2025::sec::depreciation-deduction::b06; irs-2106-inst-2025::sec::line-14::b01
    const ratio = businessUseRatio({
      placedInService: "2025-07-01",
      totalMiles: 15000,
      businessMiles: 12000,
      businessMonths: 6,
      ownership: "owned",
      method: "standard_mileage",
    });
    expect([ratio, percentText(ratio)]).toEqual([0.4, "40.00"]);
  });

  it("Pub. 463 (2025) contractor: 12,000 of 20,000 miles is 60% business use", () => {
    // irs-pub-463-2025::sec::actual-car-expenses::b01
    expect(
      businessUseRatio({
        placedInService: "2023-01-01",
        totalMiles: 20000,
        businessMiles: 12000,
        ownership: "owned",
        method: "standard_mileage",
      }),
    ).toBe(0.6);
  });
});

describe("Form 2106, limit tests", () => {
  const column = (overrides: Partial<Parameters<typeof vehicleLines>[0]> = {}) =>
    vehicleLines(
      {
        placedInService: "2023-04-02",
        totalMiles: 10000,
        businessMiles: 6000,
        ownership: "leased",
        method: "actual_expenses",
        operatingExpenses: 2000,
        rentalCost: 4800,
        inclusionAmount: 20,
        ...overrides,
      },
      60000,
    ) as VehicleLines;

  it("line 24c is 24a − 24b, line 26 adds 23, 24c and 25, line 27 is 26 × line 14, line 29 is 27 + 28", () => {
    const lines = column();
    expect(lines.sectionC).toEqual({
      line23: 2000,
      line24a: 4800,
      line24b: 20,
      line24c: 4780,
      line25: undefined,
      line26: 6780,
      line27: 4068,
      line28: undefined,
      line29: 4068,
    });
  });

  it("line 17 is line 12 less lines 13 and 16, and line 16 comes from the days when not stated", () => {
    // irs-2106-inst-2025::sec::line-16::b01
    expect(
      commutingMiles({ ...column(), commutingDays: 200, averageDailyCommute: 14 } as never),
    ).toBe(2800);
    const lines = column({ averageDailyCommute: 14, commutingDays: 200 });
    expect([lines.line16, lines.line17]).toEqual([2800, 1200]);
  });

  it("line 22 is the standard-mileage vehicles' business miles × $0.70, rounded once", () => {
    const standard = (miles: number) =>
      column({ method: "standard_mileage", businessMiles: miles, ownership: "owned" });
    expect(line22([standard(1001), standard(1001)])).toBe(1401);
    expect(line22([column()])).toBeUndefined();
  });

  it("an employer-provided vehicle cannot use the standard mileage rate", () => {
    expect(typeof column({ method: "standard_mileage", ownership: "employer_provided" })).toBe(
      "string",
    );
  });

  it("line 8 is never below 0, and the column A excess goes to line 1a", () => {
    const lines = partILines({
      overnightTravel: 1000,
      meals: 600,
      reimbursements: { otherThanMeals: 1250 },
      mealsRate: 0.5,
    });
    expect([lines.line8a, lines.excessReimbursement, lines.line9b, lines.line10]).toEqual([
      0, 250, 300, 300,
    ]);
  });

  it("both columns of line 8 at 0: stop, lines 9 and 10 blank", () => {
    const lines = partILines({
      overnightTravel: 1000,
      meals: 600,
      reimbursements: { otherThanMeals: 1000, meals: 600 },
      mealsRate: 0.5,
    });
    expect([lines.line8a, lines.line8b, lines.line9a, lines.line10]).toEqual([
      0,
      0,
      undefined,
      undefined,
    ]);
  });

  it("line 9B is 80% under the hours of service limits", () => {
    expect(partILines({ meals: 1000, mealsRate: 0.8 }).line9b).toBe(800);
  });

  it("line 10 equals 9A + 9B", () => {
    const lines = partILines({ parkingTollsTransportation: 99.5, meals: 201, mealsRate: 0.5 });
    expect(lines.line10).toBe((lines.line9a ?? 0) + (lines.line9b ?? 0));
  });

  it("section 179 is 0 at 50% business use, and the heavy SUV cost is held to $31,300", () => {
    expect(
      section179Deduction(owned({ basis: 60000, section179Cost: 60000 }), 0.5, undefined),
    ).toBe(0);
    expect(
      section179Deduction(
        owned({ basis: 60000, section179Cost: 60000, heavySportUtilityVehicle: true }),
        1,
        undefined,
      ),
    ).toBe(31300);
  });

  it("line 38 is never more than line 37, and is line 35 with no limit", () => {
    const limited = sectionDLines({
      depreciation: owned({ basis: 80000, specialAllowance: "elected_out" }),
      placedInService: "2025-02-01",
      businessUse: 1,
      ownerWages: 90000,
    });
    expect(limited).toMatchObject({ line34: 16000, line36: 12200, line37: 12200, line38: 12200 });
    const unlimited = sectionDLines({
      depreciation: owned({
        basis: 80000,
        specialAllowance: "elected_out",
        subjectToPassengerAutomobileLimits: false,
      }),
      placedInService: "2025-02-01",
      businessUse: 1,
      ownerWages: 90000,
    });
    expect(unlimited).toMatchObject({ line36: undefined, line37: undefined, line38: 16000 });
  });

  it("line 36 for 2025 is $20,200 with the special allowance and $12,200 without", () => {
    expect(applicableLimit(2025, true, true)).toBe(FIRST_YEAR_LIMIT_WITH_SPECIAL_ALLOWANCE);
    expect(applicableLimit(2025, false, true)).toBe(FIRST_YEAR_LIMIT_WITHOUT_SPECIAL_ALLOWANCE);
    expect(applicableLimit(2024, false, true)).toBe(19800);
  });

  it("the special allowance is 100% after January 19, 2025, and 40% before", () => {
    const at = (acquiredDate: string) =>
      sectionDLines({
        depreciation: owned({ basis: 10000, specialAllowance: "claimed", acquiredDate }),
        placedInService: "2025-03-01",
        businessUse: 1,
        ownerWages: 90000,
      });
    expect(at("2025-01-20")).toMatchObject({ line31: 10000, line32: 0, line38: 10000 });
    expect(at("2025-01-19")).toMatchObject({
      line31: 4000,
      line32: 6000,
      line34: 1200,
      line38: 5200,
    });
  });

  it("a vehicle sold in 2025 takes half a year, or the quarter rate when placed in service Oct.–Dec.", () => {
    const sold = (placedInService: string, disposedMonth: number) =>
      sectionDLines({
        depreciation: owned({ basis: 10000, method: "straight_line", disposedMonth }),
        placedInService,
        businessUse: 1,
        ownerWages: 90000,
      });
    expect(sold("2023-05-01", 3)).toMatchObject({ line34: 1000 });
    expect(sold("2023-11-01", 5)).toMatchObject({ line34: 750 });
    expect(typeof sold("2025-03-01", 9)).toBe("string");
  });

  it("business use at 50% or less on a declining-balance car from an earlier year is a gap", () => {
    expect(typeof chartRate(owned(), "2022-06-01", 0.3)).toBe("string");
    expect(chartRate(owned(), "2025-06-01", 0.3)).toEqual({ method: "straight_line", percent: 10 });
  });

  it("section 179 above the owner's wages is a gap", () => {
    expect(
      typeof sectionDLines({
        depreciation: owned({
          basis: 30000,
          section179Cost: 30000,
          specialAllowance: "elected_out",
        }),
        placedInService: "2025-03-01",
        businessUse: 1,
        ownerWages: 5000,
      }),
    ).toBe("string");
  });
});

describe("Form 2106, where line 10 goes", () => {
  const fact = (
    overrides: Partial<EmployeeBusinessExpensesFactValue>,
  ): EmployeeBusinessExpensesFactValue => ({
    owner: "taxpayer",
    occupation: "County constable",
    qualification: "fee_basis_official",
    ...overrides,
  });

  it("impairment-related work expenses alone: all of line 10", () => {
    const lines = partILines({ otherExpenses: 3000, mealsRate: 0.5 });
    expect(
      impairmentShare(fact({ qualification: "impairment_related_work_expenses" }), lines),
    ).toBe(3000);
  });

  it("impairment expenses inside line 4: their share of column A after reimbursements", () => {
    const lines = partILines({
      otherExpenses: 4000,
      overnightTravel: 6000,
      reimbursements: { otherThanMeals: 2000 },
      mealsRate: 0.5,
    });
    // 8,000 × 3,000 / 10,000
    expect(impairmentShare(fact({ impairmentRelatedWorkExpenses: 3000 }), lines)).toBe(2400);
  });

  it("a reservist's limit: lodging and meals up to the per diem, vehicles up to $0.70 a mile", () => {
    const lines = partILines({
      vehicleExpense: 900,
      parkingTollsTransportation: 40,
      overnightTravel: 1500,
      meals: 1000,
      mealsRate: 0.5,
    });
    const vehicle = { line13: 1000, sectionC: { line29: 900 } } as VehicleLines;
    // lodging min(1,200, 1,000) + meals min(1,000, 800) × 50% + fares 300 + 40 + min(900, 700)
    expect(
      reservistLimit({
        lines,
        vehicles: [vehicle],
        lodging: 1200,
        meals: 1000,
        perDiemLodging: 1000,
        perDiemMeals: 800,
        mealsRate: 0.5,
      }),
    ).toBe(1000 + 400 + 300 + 40 + 700);
  });
});
