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
