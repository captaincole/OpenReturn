/* Source: 2025 Form 1040 instructions (line 12d chart) and the 2025 540 booklet. */

import { describe, expect, it } from "vitest";
import {
  lookupAdditionalStandardDeduction,
  lookupStandardDeduction,
} from "../../../src/data/standardDeduction.js";

describe("lookupStandardDeduction — 2025", () => {
  it("federal: $15,750 / $31,500 / $23,625", () => {
    expect(lookupStandardDeduction("federal", 2025, "single")).toBe(15750);
    expect(lookupStandardDeduction("federal", 2025, "married_filing_separately")).toBe(15750);
    expect(lookupStandardDeduction("federal", 2025, "married_filing_jointly")).toBe(31500);
    expect(lookupStandardDeduction("federal", 2025, "qualifying_surviving_spouse")).toBe(31500);
    expect(lookupStandardDeduction("federal", 2025, "head_of_household")).toBe(23625);
  });

  it("CA: $5,706 single or MFS, $11,412 otherwise", () => {
    expect(lookupStandardDeduction("state-ca", 2025, "single")).toBe(5706);
    expect(lookupStandardDeduction("state-ca", 2025, "married_filing_separately")).toBe(5706);
    expect(lookupStandardDeduction("state-ca", 2025, "married_filing_jointly")).toBe(11412);
    expect(lookupStandardDeduction("state-ca", 2025, "qualifying_surviving_spouse")).toBe(11412);
    expect(lookupStandardDeduction("state-ca", 2025, "head_of_household")).toBe(11412);
  });

  it("is blank for an unknown year or jurisdiction, so the line blocks", () => {
    expect(lookupStandardDeduction("federal", 2024, "single")).toBeUndefined();
    expect(lookupStandardDeduction("state-ny", 2025, "single")).toBeUndefined();
  });
});

describe("lookupAdditionalStandardDeduction — 2025 (line 12d, per box)", () => {
  it("$2,000 for single and head of household, $1,600 for the married statuses", () => {
    expect(lookupAdditionalStandardDeduction(2025, "single")).toBe(2000);
    expect(lookupAdditionalStandardDeduction(2025, "head_of_household")).toBe(2000);
    expect(lookupAdditionalStandardDeduction(2025, "married_filing_jointly")).toBe(1600);
    expect(lookupAdditionalStandardDeduction(2025, "married_filing_separately")).toBe(1600);
    expect(lookupAdditionalStandardDeduction(2025, "qualifying_surviving_spouse")).toBe(1600);
  });

  it("is blank for an unknown year", () => {
    expect(lookupAdditionalStandardDeduction(2024, "single")).toBeUndefined();
  });
});
