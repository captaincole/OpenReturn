/* Source: 2025 Instructions for Schedule C, lines 13 and 27b (Form 4562). */

import { describe, expect, it } from "vitest";
import type { BusinessFactValue } from "../../../../src/facts/index.js";
import { netProfit, totalExpenses } from "../../../../src/federal/schedule-c/lines.js";

const business = (depreciation: BusinessFactValue["depreciation"]): BusinessFactValue => ({
  activity: "Consulting",
  grossReceipts: 5000,
  sellsGoods: false,
  materiallyParticipated: true,
  depreciation,
});

describe("Schedule C with Form 4562 answers", () => {
  it("figures a business that only amortizes costs that begin in 2025", () => {
    const amortizing = business({
      amortizedCosts: [
        {
          description: "Startup",
          beginsOn: "2025-01-01",
          amount: 1200,
          codeSection: "195",
          periodMonths: 12,
        },
      ],
    });
    expect(totalExpenses(amortizing)).toBe(1200);
    expect(netProfit(amortizing, [amortizing])).toBe(3800);
  });
  it("figures a business with only older amortization", () => {
    const older = business({ priorYearAmortization: 500 });
    expect(netProfit(older, [older])).toBe(4500);
  });
  it("figures a business with empty depreciation answers", () => {
    const empty = business({});
    expect(netProfit(empty, [empty])).toBe(5000);
  });
  it("waits while an asset waits for the acquisition answer", () => {
    const waiting = business({
      assets: [
        {
          description: "Laptop",
          placedInService: "2025-06-01",
          cost: 2000,
          recoveryClass: "5_year",
          method: "200DB",
          convention: "HY",
        },
      ],
    });
    expect(netProfit(waiting, [waiting])).toBeUndefined();
  });
});
