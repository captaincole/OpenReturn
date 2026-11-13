/* Source: 2025 Form 1040 instructions, IRA Deduction Worksheet—Schedule 1, Line 20. */

import { describe, expect, it } from "vitest";
import {
  iraDeduction,
  type IraDeductionInputs,
} from "../../../../src/federal/schedule-1/iraDeduction.js";

const base: IraDeductionInputs = {
  status: "single",
  contributions: 7000,
  coveredByPlan: true,
  age50OrOlder: false,
  livedApartAllYear: undefined,
  totalIncome: 50000,
  otherAdjustments: 0,
  wagesAndAlimony: 50000,
  selfEmploymentEarnings: 0,
};

describe("IRA Deduction Worksheet", () => {
  it.each([
    ["not covered: the full limit", { coveredByPlan: false, totalIncome: 500000 }, 7000],
    ["covered, $10,000 or more under line 2", {}, 7000],
    ["covered, in the phase-out: 70%, up to the next $10", { totalIncome: 83000 }, 4200],
    ["covered, over line 2", { totalIncome: 89000 }, 0],
    [
      "MFS lived with the spouse: $10,000",
      { status: "married_filing_separately", livedApartAllYear: false, totalIncome: 5000 },
      3500,
    ],
    [
      "MFS lived apart: as single",
      { status: "married_filing_separately", livedApartAllYear: true },
      7000,
    ],
    ["limited to compensation", { wagesAndAlimony: 1500 }, 1500],
    ["at least $200 in the phase-out", { totalIncome: 88900 }, 200],
  ])("%s", (_, overrides, deduction) => {
    expect(iraDeduction({ ...base, ...overrides } as IraDeductionInputs)).toBe(deduction);
  });
  it("waits for the MFS lived-apart answer", () => {
    expect(iraDeduction({ ...base, status: "married_filing_separately" })).toBeUndefined();
  });
});
