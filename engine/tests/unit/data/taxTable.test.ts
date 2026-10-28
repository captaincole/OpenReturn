/* Source: 2025 Form 1040 instructions (Tax Table) and the 2025 540 booklet (CA Tax Table). */

import { describe, expect, it } from "vitest";
import { lookupCaRateSchedule } from "../../../src/data/caRateSchedule.js";
import { lookupRateSchedule } from "../../../src/data/rateSchedule.js";
import { lookupTax, supportedTableIds, type FilingStatus } from "../../../src/data/taxTable.js";

const STATUSES: FilingStatus[] = [
  "single",
  "married_filing_jointly",
  "married_filing_separately",
  "head_of_household",
  "qualifying_surviving_spouse",
];

function tax(tableId: string, income: number, status: FilingStatus): number {
  const r = lookupTax(tableId, income, status);
  if (!r.ok) throw new Error(r.message);
  return r.tax;
}

function outcome(tableId: string, income: number, status: FilingStatus = "single"): string {
  const r = lookupTax(tableId, income, status);
  return r.ok ? "ok" : r.reason;
}

describe("lookupTax — federal 2025", () => {
  it("reads the printed row for $84,550–$84,600", () => {
    expect(tax("federal-2025", 84554, "single")).toBe(13521);
    expect(tax("federal-2025", 84554, "married_filing_jointly")).toBe(9672);
    expect(tax("federal-2025", 84554, "married_filing_separately")).toBe(13521);
    expect(tax("federal-2025", 84554, "head_of_household")).toBe(11782);
    expect(tax("federal-2025", 84554, "qualifying_surviving_spouse")).toBe(9672);
  });

  it("reads the first rows: $0–$5 is 0, $5–$15 is 1", () => {
    expect(tax("federal-2025", 0, "single")).toBe(0);
    expect(tax("federal-2025", 4.99, "single")).toBe(0);
    expect(tax("federal-2025", 5, "single")).toBe(1);
  });

  it("rows are half-open: $84,600 belongs to the next row", () => {
    const r = lookupTax("federal-2025", 84600, "single");
    expect(r.ok && r.bracket).toEqual({ low: 84600, high: 84650 });
    expect(tax("federal-2025", 84600, "single")).toBe(13532);
  });

  it("hands off to the rate schedule at exactly $100,000", () => {
    expect(outcome("federal-2025", 99999.99)).toBe("ok");
    const r = lookupTax("federal-2025", 100000, "single");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe("out_of_range");
    expect(!r.ok && r.message).toMatch(/ceiling/);
    expect(() => lookupRateSchedule(2025, "single", 100000)).not.toThrow();
  });

  it("last row meets the rate schedule at $100,000", () => {
    // The table row is the tax at the row's midpoint; the schedule starts $25 later.
    for (const status of STATUSES) {
      const table = tax("federal-2025", 99975, status);
      const schedule = lookupRateSchedule(2025, status, 100000);
      expect(Math.abs(schedule - table), status).toBeLessThanOrEqual(0.37 * 25 + 1);
    }
  });
});

describe("lookupTax — CA 2025", () => {
  it("shares columns: single with MFS, MFJ with QSS", () => {
    // 99,951–100,000: 5,736 / 3,068 / 3,708 (540 booklet).
    expect(tax("ca-2025", 99960, "single")).toBe(5736);
    expect(tax("ca-2025", 99960, "married_filing_separately")).toBe(5736);
    expect(tax("ca-2025", 99960, "married_filing_jointly")).toBe(3068);
    expect(tax("ca-2025", 99960, "qualifying_surviving_spouse")).toBe(3068);
    expect(tax("ca-2025", 99960, "head_of_household")).toBe(3708);
  });

  it("rows are inclusive: $100,000 is in the last row, $100,001 is not", () => {
    const r = lookupTax("ca-2025", 100000, "single");
    expect(r.ok && r.bracket).toEqual({ low: 99951, high: 100000 });
    expect(outcome("ca-2025", 100001)).toBe("out_of_range");
    expect(() => lookupCaRateSchedule(2025, "single", 100001)).not.toThrow();
  });

  it("last row meets Schedules X, Y and Z just past $100,000", () => {
    for (const status of STATUSES) {
      const table = tax("ca-2025", 99975, status);
      const schedule = lookupCaRateSchedule(2025, status, 100001);
      expect(Math.abs(schedule - table), status).toBeLessThanOrEqual(0.093 * 26 + 1);
    }
  });

  it("starts at $1: callers handle a $0 taxable income themselves", () => {
    expect(tax("ca-2025", 1, "single")).toBe(0);
    expect(outcome("ca-2025", 0)).toBe("out_of_range");
  });
});

describe("lookupTax — errors", () => {
  it("rejects negative and non-finite income", () => {
    expect(outcome("federal-2025", -1)).toBe("out_of_range");
    expect(outcome("federal-2025", Number.NaN)).toBe("invalid_input");
    expect(outcome("federal-2025", Number.POSITIVE_INFINITY)).toBe("invalid_input");
  });

  it("names an unknown table", () => {
    const r = lookupTax("federal-1999", 50000, "single");
    expect(!r.ok && r.reason).toBe("table_not_supported");
    expect(!r.ok && r.message).toMatch(/federal-2025/);
  });

  it("lists the loaded tables", () => {
    expect(supportedTableIds()).toEqual(["ca-2025", "federal-2025"]);
  });
});
