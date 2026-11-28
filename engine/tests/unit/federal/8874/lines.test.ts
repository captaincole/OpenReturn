/*
 * Form 8874's pure arithmetic (federal/8874/lines.ts): the credit year of each
 * credit allowance date, the 5% and 6% rates, column (f), the rows of line 1
 * and line 3. The published examples are the IRS Audit Technique Guide for the
 * New Markets Tax Credit (LMSB-04-0510-016, May 2010), page 3; their logic does
 * not depend on a yearly amount.
 */

import { describe, expect, it } from "vitest";
import {
  CREDIT_ALLOWANCE_DATES,
  SEE_ATTACHED,
  creditAllowanceDateIn,
  creditOf,
  creditYearOf,
  form8874LinesOf,
  hasCreditAllowanceDateIn,
  line1RowsOf,
  line3Of,
  ratePercentOf,
  rowOf,
  type NewMarketsInvestment,
} from "../../../../src/federal/8874/lines.js";

const isGap = (value: unknown) => (value as { unsupported?: boolean } | undefined)?.unsupported;

const credits = (amount: number) =>
  Array.from({ length: CREDIT_ALLOWANCE_DATES }, (_, index) =>
    creditOf(amount, ratePercentOf(index + 1)),
  );
const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

const investment = (changes: Partial<NewMarketsInvestment> = {}): NewMarketsInvestment => ({
  key: "new_markets_investment.test",
  cdeName: "Test CDE LLC",
  cdeAddress: "1 Test Street, Austin, TX 78701",
  cdeEin: "00-0000001",
  investmentDate: "2023-07-01",
  amount: 100000,
  passive: false,
  ...changes,
});

describe("IRS Audit Technique Guide, New Markets Tax Credit (May 2010), page 3", () => {
  it("Example 1: $2 million gives $100,000 for years 1 to 3 and $120,000 for years 4 to 7, $780,000 in all", () => {
    const yearly = credits(2000000);
    expect(yearly).toEqual([100000, 100000, 100000, 120000, 120000, 120000, 120000]);
    expect(total(yearly)).toBe(780000);
  });

  it("Example 2: $1 million gives $150,000 over three years and $240,000 over four, $390,000 in all", () => {
    const yearly = credits(1000000);
    expect(total(yearly.slice(0, 3))).toBe(150000);
    expect(total(yearly.slice(3))).toBe(240000);
    expect(total(yearly)).toBe(390000);
  });
});

describe("credit allowance dates", () => {
  it("counts the year of the initial investment as year 1", () => {
    expect(creditYearOf("2025-03-14")).toBe(1);
    expect(creditYearOf("2019-07-22")).toBe(7);
  });

  it("has a 2025 date for an investment made from 2019 through 2025, and none outside", () => {
    expect(hasCreditAllowanceDateIn("2019-01-01")).toBe(true);
    expect(hasCreditAllowanceDateIn("2025-12-31")).toBe(true);
    expect(hasCreditAllowanceDateIn("2018-12-31")).toBe(false);
    expect(hasCreditAllowanceDateIn("2026-01-01")).toBe(false);
  });

  it("is the anniversary in 2025; February 29 falls on February 28", () => {
    expect(creditAllowanceDateIn("2023-07-01")).toBe("2025-07-01");
    expect(creditAllowanceDateIn("2024-02-29")).toBe("2025-02-28");
    expect(creditAllowanceDateIn("2020-02-29", 2028)).toBe("2028-02-29");
  });
});

describe("column (e) and column (f)", () => {
  it("is 5 through the third year and 6 from the fourth", () => {
    expect(ratePercentOf(1)).toBe(5);
    expect(ratePercentOf(3)).toBe(5);
    expect(ratePercentOf(4)).toBe(6);
    expect(ratePercentOf(7)).toBe(6);
  });

  it("multiplies column (d) in whole dollars and rounds to the nearest dollar", () => {
    const row = rowOf(investment({ amount: 33333.5, investmentDate: "2024-01-15" }));
    expect(row?.amount).toBe(33334);
    // 33,334 × 5% = 1,666.70.
    expect(row?.credit).toBe(1667);
  });

  it("is never more than 6% of the investment, and the seven years add to 39%", () => {
    for (const amount of [1, 999, 12345, 2000000]) {
      for (const year of [1, 2, 3, 4, 5, 6, 7]) {
        expect(creditOf(amount, ratePercentOf(year))).toBeLessThanOrEqual(amount * 0.06 + 0.5);
      }
    }
    expect(total(credits(100000))).toBe(39000);
  });
});

describe("rowOf: an investment held on its 2025 credit allowance date", () => {
  it("fills every column", () => {
    expect(rowOf(investment())).toEqual({
      key: "new_markets_investment.test",
      nameAndAddress: "Test CDE LLC, 1 Test Street, Austin, TX 78701",
      ein: "00-0000001",
      investmentDate: "2023-07-01",
      amount: 100000,
      ratePercent: 5,
      credit: 5000,
    });
  });

  it("has no row when sold before the date, and a row when sold on or after it", () => {
    expect(rowOf(investment({ disposedOn: "2025-06-30" }))).toBeUndefined();
    expect(rowOf(investment({ disposedOn: "2025-07-01" }))?.credit).toBe(5000);
    expect(rowOf(investment({ disposedOn: "2025-12-31" }))?.credit).toBe(5000);
    expect(rowOf(investment({ disposedOn: "2024-12-31" }))).toBeUndefined();
  });

  it("has no row after a recapture event of an earlier year, and a gap for one in 2025", () => {
    expect(rowOf(investment({ recaptureEventOn: "2024-03-01" }))).toBeUndefined();
    const row = rowOf(investment({ recaptureEventOn: "2025-09-01" }));
    expect(row?.amount).toBe(100000);
    expect(isGap(row?.credit)).toBe(true);
  });

  it("keeps a 2025 recapture event after the seventh date but within 7 years of issue, as a gap", () => {
    // Issued 2018-09-01: the seventh credit allowance date is 2024-09-01, and the 7 years run to 2025-09-01.
    const row = rowOf(investment({ investmentDate: "2018-09-01", recaptureEventOn: "2025-03-01" }));
    expect(row?.amount).toBe(100000);
    expect(row?.ratePercent).toBeUndefined();
    expect(isGap(row?.credit)).toBe(true);
    const lines = form8874LinesOf(
      [investment({ investmentDate: "2018-09-01", recaptureEventOn: "2025-03-01" })],
      undefined,
    );
    expect(isGap(lines.line3)).toBe(true);
  });

  it("has no row for a 2025 event on or after the seventh anniversary of issue", () => {
    expect(
      rowOf(investment({ investmentDate: "2018-09-01", recaptureEventOn: "2025-09-01" })),
    ).toBeUndefined();
    expect(
      rowOf(investment({ investmentDate: "2017-06-01", recaptureEventOn: "2025-03-01" })),
    ).toBeUndefined();
    expect(rowOf(investment({ investmentDate: "2018-09-01" }))).toBeUndefined();
  });

  it("has no row before the first date or after the seventh", () => {
    expect(rowOf(investment({ investmentDate: "2018-07-01" }))).toBeUndefined();
    expect(rowOf(investment({ investmentDate: "2026-01-02" }))).toBeUndefined();
  });

  it("prints only the name when the address is missing", () => {
    expect(rowOf(investment({ cdeAddress: undefined }))?.nameAndAddress).toBe("Test CDE LLC");
  });
});

describe("line 1 rows and line 3", () => {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      ...rowOf(investment({ key: `k${index}` }))!,
      key: `k${index}`,
    }));

  it("prints six investments in six rows", () => {
    expect(line1RowsOf(rows(6))).toHaveLength(6);
    expect(line3Of(rows(6), 1180)).toBe(31180);
  });

  it("puts a seventh on an attached statement: row 6 says 'See attached' and is a gap", () => {
    const printed = line1RowsOf(rows(7));
    expect(printed).toHaveLength(6);
    expect(printed[5].nameAndAddress).toBe(SEE_ATTACHED);
    expect(isGap(printed[5].credit)).toBe(true);
    expect(isGap(line3Of(printed, undefined))).toBe(true);
  });

  it("adds lines 1 and 2, and is blank with neither", () => {
    expect(line3Of([], 1180)).toBe(1180);
    expect(line3Of([], undefined)).toBeUndefined();
  });

  it("is the total of its parts", () => {
    const lines = form8874LinesOf(
      [
        investment({ key: "a", investmentDate: "2025-03-14", amount: 40000 }),
        investment({ key: "b", investmentDate: "2022-11-15", amount: 120000 }),
        investment({ key: "c", investmentDate: "2018-05-05", amount: 30000 }),
      ],
      1180,
    );
    expect(lines.rows.map((row) => row.credit)).toEqual([2000, 7200]);
    expect(lines.investments.map((row) => row.key)).toEqual(["a", "b"]);
    expect(lines.line3).toBe(2000 + 7200 + 1180);
  });
});
