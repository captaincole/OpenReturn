import { describe, expect, it } from "vitest";
import { caExemptionCreditsAfterLimit } from "../../../../src/engine/worksheets/caAgiLimitation.js";

const single = {
  filingStatus: "single" as const,
  personalCount: 1,
  personalAmount: 153,
  dependentCount: 0,
  dependentAmount: 0,
};

describe("caExemptionCreditsAfterLimit", () => {
  it("keeps the full credit at or under the threshold", () => {
    expect(caExemptionCreditsAfterLimit({ ...single, federalAgi: 252203 })).toBe(153);
  });

  it("takes $6 per $2,500 or part over the threshold", () => {
    expect(caExemptionCreditsAfterLimit({ ...single, federalAgi: 252204 })).toBe(147); // d = 1
    expect(caExemptionCreditsAfterLimit({ ...single, federalAgi: 257203 })).toBe(141); // d = 2
  });

  it("floors each part at zero", () => {
    expect(caExemptionCreditsAfterLimit({ ...single, federalAgi: 733836 })).toBe(0);
  });

  it("phases dependents separately, with $1,250 steps for MFS", () => {
    const r = caExemptionCreditsAfterLimit({
      filingStatus: "married_filing_separately",
      federalAgi: 252203 + 1250 * 3, // d = 3, e = 18
      personalCount: 1,
      personalAmount: 153,
      dependentCount: 2,
      dependentAmount: 950,
    });
    expect(r).toBe(153 - 18 + (950 - 36));
  });
});
