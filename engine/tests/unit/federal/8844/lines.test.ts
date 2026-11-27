/*
 * Form 8844 arithmetic. The instructions publish no example with numbers
 * (corpus search and a web search, 2026-11-27), so these are the stated rules
 * and their limits: the qualification tests, the $15,000 limit and its
 * reduction for work opportunity credit wages, the 20% rate, and the split
 * of line 2 among the businesses that paid the wages.
 */

import { describe, expect, it } from "vitest";
import type { EmpowermentZoneEmployeeFactValue } from "../../../../src/facts/index.js";
import {
  CREDIT_RATE,
  WAGE_LIMIT_PER_EMPLOYEE,
  countedWagesOf,
  creditByEmployer,
  isQualifiedZoneEmployee,
  line1Of,
  line2Of,
  line4Of,
  wageLimitOf,
} from "../../../../src/federal/8844/lines.js";

const employee = (
  value: Partial<EmpowermentZoneEmployeeFactValue> = {},
): EmpowermentZoneEmployeeFactValue => ({
  name: "Test Employee",
  employerKey: "business.test",
  zone: "Fresno, CA",
  livesAndWorksInZone: true,
  fivePercentOwner: false,
  relatedToTaxpayer: false,
  excludedBusiness: false,
  employedAtLeast90Days: true,
  zoneWages: 10000,
  ...value,
});

describe("Form 8844 constants", () => {
  it("are the 2025 amounts of the instructions (general-instructions::b01)", () => {
    expect(WAGE_LIMIT_PER_EMPLOYEE).toBe(15000);
    expect(CREDIT_RATE).toBe(0.2);
  });
});

describe("a qualified zone employee (empowerment-zones::b02, qualified-zone-employees::b01 to ::b03)", () => {
  it("qualifies when every test is met", () => {
    expect(isQualifiedZoneEmployee(employee())).toBe(true);
  });

  it.each([
    ["does not live and work in the zone", { livesAndWorksInZone: false }],
    ["is a 5% owner", { fivePercentOwner: true }],
    ["is a relative or dependent", { relatedToTaxpayer: true }],
    ["works at an excluded business", { excludedBusiness: true }],
    ["worked fewer than 90 days", { employedAtLeast90Days: false }],
  ])("does not qualify when the employee %s", (_, change) => {
    expect(isQualifiedZoneEmployee(employee(change))).toBe(false);
    expect(countedWagesOf(employee(change))).toBe(0);
  });

  it.each(["misconduct", "disability"] as const)(
    "an early termination for %s lifts the 90-day rule (qualified-zone-employees::b03)",
    (reason) => {
      const shortStay = employee({ employedAtLeast90Days: false, earlyTermination: reason });
      expect(isQualifiedZoneEmployee(shortStay)).toBe(true);
      expect(countedWagesOf(shortStay)).toBe(10000);
    },
  );
});

describe("the $15,000 limit (specific-instructions::b01)", () => {
  it("counts wages up to the limit, never more", () => {
    expect(countedWagesOf(employee({ zoneWages: 14999 }))).toBe(14999);
    expect(countedWagesOf(employee({ zoneWages: 15000 }))).toBe(15000);
    expect(countedWagesOf(employee({ zoneWages: 15001 }))).toBe(15000);
    expect(countedWagesOf(employee({ zoneWages: 80000 }))).toBe(15000);
  });

  it("is reduced by the wages used for the work opportunity credit", () => {
    expect(wageLimitOf(undefined)).toBe(15000);
    expect(wageLimitOf(6000)).toBe(9000);
    expect(countedWagesOf(employee({ zoneWages: 21000, workOpportunityCreditWages: 6000 }))).toBe(
      9000,
    );
    expect(countedWagesOf(employee({ zoneWages: 4000, workOpportunityCreditWages: 6000 }))).toBe(0);
  });

  it("leaves the work opportunity credit wages out of the zone wages (usc-26-2025::sec::s1396::c)", () => {
    // Under the lowered limit, the zone wages less the work opportunity wages: 9,800.50 − 6,000.
    expect(countedWagesOf(employee({ zoneWages: 9800.5, workOpportunityCreditWages: 6000 }))).toBe(
      3800.5,
    );
    // Above it, the limit decides: min(21,000 − 6,000, 15,000 − 6,000) = 9,000.
    expect(countedWagesOf(employee({ zoneWages: 21000, workOpportunityCreditWages: 6000 }))).toBe(
      9000,
    );
  });

  it("is never below 0 when the work opportunity credit wages are $15,000 or more", () => {
    expect(wageLimitOf(15000)).toBe(0);
    expect(wageLimitOf(20000)).toBe(0);
    expect(countedWagesOf(employee({ workOpportunityCreditWages: 20000 }))).toBe(0);
  });
});

describe("lines 1, 2 and 4", () => {
  it("line 1 keeps the cents of each employee and rounds the total once", () => {
    expect(line1Of([15000, 9800.5, 3400])).toBe(28201);
    expect(line1Of([0.4, 0.4])).toBe(1);
    expect(line1Of([])).toBe(0);
  });

  it("line 2 is 20% of line 1, to the nearest dollar", () => {
    expect(line2Of(28201)).toBe(5640);
    expect(line2Of(15000)).toBe(3000);
    expect(line2Of(3)).toBe(1);
    expect(line2Of(0)).toBe(0);
  });

  it("line 2 is never more than $3,000 for each qualified employee", () => {
    const wages = [80000, 15000, 40000].map((zoneWages) => countedWagesOf(employee({ zoneWages })));
    expect(line2Of(line1Of(wages))).toBe(3 * 3000);
  });

  it("line 4 adds lines 2 and 3", () => {
    expect(line4Of(5640, 1200)).toBe(6840);
    expect(line4Of(5640, 0)).toBe(5640);
  });
});

describe("line 2 among the employers (line-2::b01)", () => {
  it("splits line 2 by the counted wages, in whole dollars that add to line 2", () => {
    const split = creditByEmployer(
      7960,
      new Map([
        ["business.a", 24800.5],
        ["farm.b", 15000],
      ]),
    );
    expect([...split.values()]).toEqual([4960, 3000]);
    expect([...split.values()].reduce((total, share) => total + share, 0)).toBe(7960);
  });

  it("gives one employer all of line 2", () => {
    expect([...creditByEmployer(5640, new Map([["business.a", 28200.5]])).values()]).toEqual([
      5640,
    ]);
  });

  it("gives 0 to an employer with no counted wages", () => {
    const split = creditByEmployer(
      3000,
      new Map([
        ["business.a", 15000],
        ["business.b", 0],
      ]),
    );
    expect([...split.values()]).toEqual([3000, 0]);
  });
});
