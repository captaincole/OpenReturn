/* Source: 2025 Instructions for Schedule E, line 18 (Form 4562). */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import { netIncomeOrLoss } from "../../../../src/federal/schedule-e/lines.js";

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
