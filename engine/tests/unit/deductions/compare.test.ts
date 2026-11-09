/*
 * The comparison judges totals the forms computed (Schedule A line 17,
 * Schedule CA line 29); the forms' own tests cover the tax math. The
 * integration tests run real passes.
 */

import { describe, expect, it } from "vitest";
import { compareDeductions, type ComparisonInput } from "../../../src/deductions/compare.js";

const input = (overrides: Partial<ComparisonInput>): ComparisonInput => ({
  totals: { federal: 49981, ca: 41900 },
  standards: { federal: 31500, ca: 11412 },
  whatIfs: [],
  ...overrides,
});

describe("compareDeductions", () => {
  it("itemizes where the total is over the standard deduction", () => {
    const result = compareDeductions(input({}));
    expect(result.federal).toMatchObject({
      itemized: 49981,
      standard: 31500,
      margin: 18481,
      recommendation: "itemize",
      decidingItems: [],
    });
    expect(result.ca).toMatchObject({ margin: 30488, recommendation: "itemize" });
  });

  it("recommends the standard deduction at a tie: itemizing must win", () => {
    const result = compareDeductions(input({ totals: { federal: 31500 } }));
    expect(result.federal?.recommendation).toBe("standard");
  });

  it("names an item deciding when its 0 or its double flips the result on that return", () => {
    const result = compareDeductions(
      input({
        whatIfs: [
          // Gifts at 0 drop federal under the standard deduction; California still itemizes.
          {
            id: "gifts_cash",
            totals: [
              { federal: 19981, ca: 12000 },
              { federal: 79981, ca: 71900 },
            ],
          },
          {
            id: "medical",
            totals: [
              { federal: 49981, ca: 41900 },
              { federal: 57981, ca: 49900 },
            ],
          },
        ],
      }),
    );
    expect(result.federal?.decidingItems).toEqual(["gifts_cash"]);
    expect(result.ca?.decidingItems).toEqual([]);
  });

  it("names an item deciding when its double makes itemizing win", () => {
    const result = compareDeductions(
      input({
        totals: { federal: 14000 },
        standards: { federal: 15750 },
        whatIfs: [{ id: "gifts_cash", totals: [{ federal: 5000 }, { federal: 23000 }] }],
      }),
    );
    expect(result.federal).toMatchObject({ margin: -1750, recommendation: "standard" });
    expect(result.federal?.decidingItems).toEqual(["gifts_cash"]);
  });

  it("leaves out a return whose total waits, and California without a 540", () => {
    const result = compareDeductions(
      input({ totals: { ca: 41900 }, standards: { federal: 31500 } }),
    );
    expect(result).toEqual({});
  });
});
