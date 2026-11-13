/* Source: 2025 Instructions for Form 8829, Part II. */

import { describe, expect, it } from "vitest";
import type { HomeOfficeActual } from "../../../../src/facts/index.js";
import { businessPercentage, form8829Figures } from "../../../../src/federal/8829/lines.js";

const office: HomeOfficeActual = {
  businessSquareFeet: 327,
  homeSquareFeet: 2950,
  allGrossIncomeFromHome: true,
  ownsHome: false,
  indirect: { insurance: 185, rent: 16000, repairsAndMaintenance: 1427, utilities: 4225 },
};

describe("Form 8829 for a renter", () => {
  it("prints line 3 with two decimals of a percent", () => {
    expect(businessPercentage(office)).toBe(0.1108);
  });
  it("allows the business share of the indirect expenses up to line 15", () => {
    const figures = form8829Figures(office, 10000);
    expect(figures.line24).toBe(2420);
    expect(figures.line36).toBe(2420);
    expect(figures.line43).toBe(0);
  });
  it("carries over operating expenses above the income limit", () => {
    const figures = form8829Figures(office, 1000);
    expect(figures.line27).toBe(1000);
    expect(figures.line36).toBe(1000);
    expect(figures.line43).toBe(1420);
  });
});
