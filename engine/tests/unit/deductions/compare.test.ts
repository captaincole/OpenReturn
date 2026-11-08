/*
 * Sources: irs-1040sa-inst-2025 (the 7.5% medical floor, the 2025 SALT cap);
 * ca-540-sched-ca-inst-2025 (state income tax taken out, no SALT cap, the 2%
 * floor on line 24, the line 29 worksheet).
 */

import { describe, expect, it } from "vitest";
import type { BranchId } from "../../../src/deductions/catalog.js";
import { compareDeductions, type ComparisonInput } from "../../../src/deductions/compare.js";

const input = (overrides: Partial<ComparisonInput>): ComparisonInput => ({
  amounts: {},
  estimated: new Set<BranchId>(),
  agi: 100000,
  filingStatus: "single",
  federalStandard: 15750,
  caStandard: 5706,
  ...overrides,
});

describe("compareDeductions", () => {
  it("Madison before her documents: itemizing wins, and only the gifts could flip it", () => {
    const result = compareDeductions(
      input({
        amounts: {
          state_income_tax: 8081,
          real_estate_tax: 2000,
          mortgage_interest: 8000,
          investment_interest: 1900,
          gifts_cash: 30000,
          medical: 8000,
        },
        estimated: new Set<BranchId>([
          "real_estate_tax",
          "mortgage_interest",
          "gifts_cash",
          "medical",
        ]),
        agi: 264765,
        filingStatus: "married_filing_jointly",
        federalStandard: 31500,
        caStandard: 11412,
      }),
    );
    expect(result.federal).toMatchObject({
      itemized: 49981,
      margin: 18481,
      recommendation: "itemize",
    });
    expect(result.federal.decidingBranches).toEqual(["gifts_cash"]);
    // California takes out the state income tax and itemizes whatever the estimates turn out to be.
    expect(result.ca).toMatchObject({
      itemized: 41900,
      recommendation: "itemize",
      decidingBranches: [],
    });
  });

  it("medical bills under 7.5% of AGI count for nothing", () => {
    const result = compareDeductions(input({ amounts: { medical: 7000 } }));
    expect(result.federal.itemized).toBe(0);
    expect(result.ca?.itemized).toBe(0);
    const over = compareDeductions(input({ amounts: { medical: 9500 } }));
    expect(over.federal.itemized).toBe(2000);
  });

  it("investment fees count in California above 2% of AGI, and never federally", () => {
    const result = compareDeductions(input({ amounts: { ca_investment_fees: 3000 } }));
    expect(result.federal.itemized).toBe(0);
    expect(result.ca?.itemized).toBe(1000);
  });

  it("the SALT cap binds federally; California takes no income tax and no cap", () => {
    const result = compareDeductions(
      // AGI under the CA line 29 threshold, so the worksheet does not reduce the CA total.
      input({ amounts: { state_income_tax: 30000, real_estate_tax: 15000 }, agi: 250000 }),
    );
    expect(result.federal.itemized).toBe(40000);
    expect(result.ca?.itemized).toBe(15000);
  });

  it("recommends the standard deduction when it is larger, and names the estimates that could flip it", () => {
    const result = compareDeductions(
      input({
        amounts: { state_income_tax: 5000, gifts_cash: 9000 },
        estimated: new Set<BranchId>(["gifts_cash"]),
      }),
    );
    expect(result.federal).toMatchObject({
      itemized: 14000,
      margin: -1750,
      recommendation: "standard",
    });
    expect(result.federal.decidingBranches).toEqual(["gifts_cash"]);
  });

  it("reduces California's total above the AGI threshold with the line 29 worksheet", () => {
    // 15,000 less the smaller of 80% of it (12,000) or 6% of AGI over 252,203 (2,868).
    const result = compareDeductions(input({ amounts: { real_estate_tax: 15000 }, agi: 300000 }));
    expect(result.ca?.itemized).toBe(12132);
  });

  it("never names a branch a return does not deduct as deciding it", () => {
    // State income tax is an estimate before the W-2 arrives; California takes none of it.
    const result = compareDeductions(
      input({
        amounts: { state_income_tax: 12000, real_estate_tax: 6000, mortgage_interest: 10000 },
        estimated: new Set<BranchId>(["state_income_tax"]),
        agi: 150000,
      }),
    );
    expect(result.ca).toMatchObject({ itemized: 16000, decidingBranches: [] });
  });

  it("has no California comparison without a 540", () => {
    expect(compareDeductions(input({ caStandard: undefined })).ca).toBeUndefined();
  });
});
