/* Source: 2025 540 booklet p.75 (rate schedules and its worked example). */

import { describe, expect, it } from "vitest";
import { CA_RATE_SCHEDULES_2025, lookupCaRateSchedule } from "../../../src/data/caRateSchedule.js";

describe("lookupCaRateSchedule — 2025", () => {
  it("booklet example: MFJ $125,000 → 3,974.82 + 8% × 9,916 = 4,768.10", () => {
    expect(lookupCaRateSchedule(2025, "married_filing_jointly", 125000)).toBeCloseTo(4768.1, 2);
  });
  it("single $731,959 → 38,638.27 + 11.3% × 286,188 = 70,977.51", () => {
    expect(lookupCaRateSchedule(2025, "single", 731959)).toBeCloseTo(70977.51, 2);
  });
  it("MFS uses Schedule X, QSS uses Schedule Y", () => {
    expect(lookupCaRateSchedule(2025, "married_filing_separately", 500000)).toBe(
      lookupCaRateSchedule(2025, "single", 500000),
    );
    expect(lookupCaRateSchedule(2025, "qualifying_surviving_spouse", 500000)).toBe(
      lookupCaRateSchedule(2025, "married_filing_jointly", 500000),
    );
  });
  it("every printed base = previous base + previous rate × bracket width (catches typos)", () => {
    for (const [name, rows] of Object.entries(CA_RATE_SCHEDULES_2025)) {
      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1];
        const expected = prev.base + prev.rate * (rows[i].overMin - prev.overMin);
        expect(Math.abs(rows[i].base - expected), `${name} row ${i}`).toBeLessThan(0.011);
        expect(rows[i].overMin, `${name} row ${i} edge`).toBe(prev.overMax);
      }
    }
  });
  it("throws at or below $100,000 (Tax Table range)", () => {
    expect(() => lookupCaRateSchedule(2025, "single", 100000)).toThrow(/Tax Table/);
  });
});
