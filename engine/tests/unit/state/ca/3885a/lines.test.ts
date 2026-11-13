/* Source: 2025 Instructions for form FTB 3885A. */

import { describe, expect, it } from "vitest";
import type { ActivityDepreciation } from "../../../../../src/facts/index.js";
import {
  californiaAdjustment,
  form3885AFigures,
  mustFile3885A,
} from "../../../../../src/state/ca/3885a/lines.js";

const fiveYear: ActivityDepreciation = {
  assets: [
    {
      description: "Equipment",
      placedInService: "2025-01-01",
      cost: 10000,
      recoveryClass: "5_year",
      method: "200DB",
      convention: "HY",
    },
  ],
};

describe("FTB 3885A", () => {
  it("takes no special allowance for California", () => {
    const figures = form3885AFigures(fiveYear);
    expect(figures.line6).toBe(2000);
    expect(figures.line7).toBe(5200);
    expect(figures.line8b).toBe(3200);
    expect(figures.line8a).toBeUndefined();
  });
  it("goes to Schedule CA column C when California is less", () => {
    expect(californiaAdjustment(fiveYear)).toEqual({ subtraction: 0, addition: 3200 });
  });
  it("is not filed when California and federal agree", () => {
    expect(mustFile3885A({ priorYearMacrs: 1000 })).toBe(false);
    expect(mustFile3885A({ priorYearMacrs: 1000, californiaPriorYearDepreciation: 900 })).toBe(
      true,
    );
  });
});

describe("FTB 3885A with one side empty", () => {
  it("takes line 13 as 0 when only California has amortization", () => {
    const figures = form3885AFigures({ californiaPriorYearAmortization: 300 });
    expect(figures.line12).toBe(300);
    expect(figures.line13).toBe(0);
    expect(figures.line14a).toBe(300);
  });
  it("takes line 7 as 0 when only California has older depreciation", () => {
    const figures = form3885AFigures({ californiaPriorYearDepreciation: 400 });
    expect(figures.line7).toBe(0);
    expect(figures.line8a).toBe(400);
  });
  it("waits while Form 4562 waits for the acquisition answer", () => {
    const june = { ...fiveYear.assets![0]!, placedInService: "2025-06-01" };
    expect(form3885AFigures({ assets: [june] }).line7).toBeUndefined();
    expect(californiaAdjustment({ assets: [june] })).toBeUndefined();
  });
});

describe("FTB 3885A amortization with cents", () => {
  it("agrees with Form 4562 when the amounts are the same", () => {
    const costs: ActivityDepreciation = {
      amortizedCosts: [
        {
          description: "a",
          beginsOn: "2025-03-03",
          amount: 200.6,
          codeSection: "195",
          periodMonths: 12,
        },
        {
          description: "b",
          beginsOn: "2025-05-05",
          amount: 400.6,
          codeSection: "195",
          periodMonths: 12,
        },
      ],
      priorYearAmortization: 100.4,
    };
    const figures = form3885AFigures(costs);
    expect(figures.line12).toBe(figures.line13);
    expect(mustFile3885A(costs)).toBe(false);
  });
});
