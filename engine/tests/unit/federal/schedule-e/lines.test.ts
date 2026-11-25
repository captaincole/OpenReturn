/* Source: 2025 Instructions for Schedule E, line 18 (Form 4562). */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import {
  line21Amount,
  netIncomeOrLoss,
  rentalLine21Gap,
} from "../../../../src/federal/schedule-e/lines.js";

const rental = (depreciation: RentalFactValue["depreciation"]): RentalFactValue => ({
  propertyType: "single_family",
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 12000,
  expenses: { insurance: 1000 },
  depreciation,
});

describe("Schedule E line 18 from Form 4562 answers", () => {
  it("leaves line 18 blank, and the total figured, with empty answers", () => {
    expect(netIncomeOrLoss(rental({}))).toBe(11000);
  });
  it("takes Form 4562 line 22 for a 2025 asset", () => {
    const asset = {
      description: "Appliances",
      placedInService: "2025-01-10",
      cost: 1000,
      recoveryClass: "5_year" as const,
      method: "200DB" as const,
      convention: "HY" as const,
    };
    // 40% allowance $400, then $600 × 20% = $120.
    expect(netIncomeOrLoss(rental({ assets: [asset] }))).toBe(11000 - 520);
  });
});

describe("Schedule E line 21 with some investment not at risk (irs-1040se-inst-2025::sec::line-21::b01)", () => {
  const losing = (allInvestmentAtRisk: boolean | undefined): RentalFactValue => ({
    ...rental({}),
    expenses: { insurance: 1000, repairs: 15000 },
    allInvestmentAtRisk,
  });

  it("makes a loss a gap, never the whole loss", () => {
    expect(rentalLine21Gap(losing(false))).toContain("Form 6198");
    expect(line21Amount(losing(false))).toBeUndefined();
  });

  it("takes the loss with all of the investment at risk, and waits without the answer", () => {
    expect(rentalLine21Gap(losing(true))).toBeUndefined();
    expect(line21Amount(losing(true))).toBe(-4000);
    expect(line21Amount(losing(undefined))).toBeUndefined();
  });

  it("takes a profit whatever the answer", () => {
    const profit = { ...rental({}), allInvestmentAtRisk: false };
    expect(rentalLine21Gap(profit)).toBeUndefined();
    expect(line21Amount(profit)).toBe(11000);
  });
});
