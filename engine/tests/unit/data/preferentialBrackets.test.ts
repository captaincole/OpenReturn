import { describe, expect, it } from "vitest";
import { lookupPreferentialBrackets } from "../../../src/data/preferentialBrackets.js";

describe("lookupPreferentialBrackets — 2025 federal", () => {
  it("single — $48,350 / $533,400", () => {
    const brackets = lookupPreferentialBrackets(2025, "single");
    expect(brackets.zeroRateCeiling).toBe(48350);
    expect(brackets.fifteenRateCeiling).toBe(533400);
  });
  it("married_filing_jointly — $96,700 / $600,050", () => {
    const brackets = lookupPreferentialBrackets(2025, "married_filing_jointly");
    expect(brackets.zeroRateCeiling).toBe(96700);
    expect(brackets.fifteenRateCeiling).toBe(600050);
  });
  it("married_filing_separately — $48,350 / $300,000", () => {
    const brackets = lookupPreferentialBrackets(2025, "married_filing_separately");
    expect(brackets.zeroRateCeiling).toBe(48350);
    expect(brackets.fifteenRateCeiling).toBe(300000);
  });
  it("head_of_household — $64,750 / $566,700", () => {
    const brackets = lookupPreferentialBrackets(2025, "head_of_household");
    expect(brackets.zeroRateCeiling).toBe(64750);
    expect(brackets.fifteenRateCeiling).toBe(566700);
  });
  it("qualifying_surviving_spouse — same as MFJ", () => {
    const brackets = lookupPreferentialBrackets(2025, "qualifying_surviving_spouse");
    expect(brackets.zeroRateCeiling).toBe(96700);
    expect(brackets.fifteenRateCeiling).toBe(600050);
  });

  it("throws on unknown tax year", () => {
    expect(() => lookupPreferentialBrackets(2099, "single")).toThrow(
      /No preferential-rate brackets/,
    );
  });
});
