/*
 * Form 7218 arithmetic (federal/7218/lines.ts): the instructions' applicable
 * amount example, the emissions factor table of a published secondary source
 * (CRS In Focus IF12502, Table 1, base amounts before inflation), and limit
 * tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type { CleanFuelSale } from "../../../../src/facts/index.js";
import { centsText, tenthsText } from "../../../../src/federal/7218/cells.js";
import {
  applicableAmountOf,
  BASE_AMOUNTS,
  certifiedOf,
  emissionsFactorOf,
  isTransportationFuel,
  line25Of,
  line3Of,
  qualifiedGallonsOf,
  rowCreditOf,
} from "../../../../src/federal/7218/lines.js";

const isGap = (value: unknown) => (value as { unsupported?: boolean })?.unsupported === true;

const sale = (overrides: Partial<CleanFuelSale>): CleanFuelSale => ({
  fuelType: "Ethanol",
  sustainableAviationFuel: false,
  feedstock: "Corn",
  emissionsRate: 25,
  gallons: 1000,
  ...overrides,
});

describe("Instructions for Form 7218, Applicable Amount example (applicable-amount::b01, ::b02)", () => {
  it("2025 factor 1.0611: 21 cents, $1.06, 37 cents and $1.86", () => {
    expect(applicableAmountOf(false, false)).toBe(0.21);
    expect(applicableAmountOf(false, true)).toBe(1.06);
    expect(applicableAmountOf(true, false)).toBe(0.37);
    expect(applicableAmountOf(true, true)).toBe(1.86);
  });
});

describe("CRS IF12502 Table 1: emissions factor and credit per gallon at the base amounts", () => {
  const table: Array<[number, number, number, number, number, number]> = [
    // rate, factor, non-aviation without / with wage rules, aviation without / with
    [0, 1.0, 0.2, 1.0, 0.35, 1.75],
    [10, 0.8, 0.16, 0.8, 0.28, 1.4],
    [25, 0.5, 0.1, 0.5, 0.18, 0.88],
    [40, 0.2, 0.04, 0.2, 0.07, 0.35],
    [50, 0.0, 0.0, 0.0, 0.0, 0.0],
  ];
  it.each(table)("%d kg per mmBTU", (rate, factor, nonSaf, nonSafWage, saf, safWage) => {
    expect(emissionsFactorOf(rate)).toBe(factor);
    const perGallon = (base: number) => rowCreditOf(emissionsFactorOf(rate), 1, base);
    expect(perGallon(BASE_AMOUNTS.nonSaf.withoutWageRules)).toBe(nonSaf);
    expect(perGallon(BASE_AMOUNTS.nonSaf.withWageRules)).toBe(nonSafWage);
    // 0.5 × $0.35 = $0.175 and 0.5 × $1.75 = $0.875: to the nearest cent (usc-26-2025::sec::s45z::a-5).
    expect(perGallon(BASE_AMOUNTS.saf.withoutWageRules)).toBe(saf);
    expect(perGallon(BASE_AMOUNTS.saf.withWageRules)).toBe(safWage);
  });
});

describe("Column (e): the nearest multiple of 0.1 (part-iii-clean-aviation-and::b01)", () => {
  it("rounds 0.56 up, 0.25 half up, 0.04 to 0", () => {
    expect(emissionsFactorOf(22)).toBe(0.6);
    expect(emissionsFactorOf(37.5)).toBe(0.3);
    expect(emissionsFactorOf(48)).toBe(0);
    expect(emissionsFactorOf(47.5)).toBe(0.1);
  });

  it("a 2025 rate below zero gives a factor above 1 (the floor starts after 2025)", () => {
    expect(emissionsFactorOf(-40)).toBe(1.8);
  });

  it("prints with one decimal", () => {
    expect([tenthsText(1), tenthsText(0.6), tenthsText(0)]).toEqual(["1.0", "0.6", "0.0"]);
    expect([centsText(0.21), centsText(1.1), centsText(2)]).toEqual(["0.21", "1.10", "2.00"]);
  });
});

describe("Transportation fuel: no more than 50 kg (transportation-fuel::b01)", () => {
  it("50 qualifies, 50.1 does not", () => {
    expect(isTransportationFuel(50)).toBe(true);
    expect(isTransportationFuel(50.1)).toBe(false);
  });
});

describe("Column (f): registered at the time of production (line-5b::b01)", () => {
  it("a letter dated on or before January 1, 2025 covers every 2025 gallon", () => {
    expect(qualifiedGallonsOf(sale({}), "2024-11-20")).toBe(1000);
    expect(qualifiedGallonsOf(sale({}), "2025-01-01")).toBe(1000);
  });

  it("the June 30, 2025 example: only the gallons produced on or after it", () => {
    const june = sale({ gallonsProducedBeforeRegistration: 400 });
    expect(qualifiedGallonsOf(june, "2025-06-30")).toBe(600);
  });

  it("waits for the gallons before a 2025 letter, and stops when they are more than sold", () => {
    expect(qualifiedGallonsOf(sale({}), "2025-06-30")).toBeUndefined();
    const over = sale({ gallonsProducedBeforeRegistration: 1200 });
    expect(isGap(qualifiedGallonsOf(over, "2025-06-30"))).toBe(true);
  });

  it("a letter dated after 2025 covers none of the year's gallons", () => {
    expect(qualifiedGallonsOf(sale({}), "2026-01-15")).toBe(0);
  });
});

describe("SAF certification (sustainable-aviation-fuel-saf::b01)", () => {
  it("non-SAF needs none; SAF waits for the answer", () => {
    expect(certifiedOf(sale({}))).toBe(true);
    expect(certifiedOf(sale({ sustainableAviationFuel: true }))).toBeUndefined();
    const certified = sale({ sustainableAviationFuel: true, unrelatedPartyCertification: false });
    expect(certifiedOf(certified)).toBe(false);
  });
});

describe("Column (h), line 25 and Part II line 3", () => {
  it("keeps each row's cents and rounds the total once", () => {
    const rows = [rowCreditOf(0.6, 4321, 1.06), rowCreditOf(0.6, 4321, 1.06)];
    expect(rows).toEqual([2748.16, 2748.16]);
    expect(line25Of(rows)).toBe(5496);
  });

  it("a row is never more than its gallons times the highest 2025 amount", () => {
    for (const rate of [0, 12, 25, 33, 49]) {
      const credit = rowCreditOf(emissionsFactorOf(rate), 10000, applicableAmountOf(true, true));
      expect(credit).toBeLessThanOrEqual(10000 * 1.86);
    }
  });

  it("line 3 adds lines 1 and 2", () => {
    expect(line3Of(51678, 3200)).toBe(54878);
    expect(line3Of(0, 0)).toBe(0);
  });
});
