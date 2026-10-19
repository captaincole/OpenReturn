/*
 * Schedule H lines A–C and the parts they open (2025 Schedule H). Each
 * row is one household-employee situation.
 */

import { describe, expect, it } from "vitest";
import type {
  HouseholdEmployee,
  ScheduleHFilingInfo,
} from "../../../../../src/engine/federal/schedule-h/filingInfo.js";
import {
  lineA,
  lineAEmployees,
  lineB,
  lineC,
  lines7to9,
  partI,
} from "../../../../../src/engine/federal/schedule-h/lines.js";

const employee = (wages: number, withheld = 0): HouseholdEmployee => ({
  name: "Test Employee",
  socialSecurityWages: wages,
  medicareWages: wages,
  federalTaxWithheld: withheld,
});

const info = (employees: HouseholdEmployee[], paid1000?: boolean): ScheduleHFilingInfo => ({
  householdEmployees: employees,
  householdPaid1000InAQuarter: paid1000,
});

describe("Schedule H lines A–C", () => {
  it.each([
    // label, info, A, B, C, Part I, lines 7–9
    ["$2,800 in wages", info([employee(2800)]), true, undefined, undefined, true, true],
    ["$2,799, nothing withheld", info([employee(2799)], false), false, false, false, false, false],
    ["$2,000, $150 withheld", info([employee(2000, 150)]), false, true, undefined, false, true],
    ["$2,000, a $1,000 quarter", info([employee(2000)], true), false, false, true, false, false],
    ["$2,000, quarter not answered", info([employee(2000)]), false, false, undefined, false, false],
    ["no household employees", {}, undefined, undefined, undefined, false, false],
  ] as const)("%s", (_, i, a, b, c, part1, l7to9) => {
    expect([lineA(i), lineB(i), lineC(i), partI(i), lines7to9(i)]).toEqual([a, b, c, part1, l7to9]);
  });

  it("puts only the employees paid $2,800 or more on lines 1, 3, and 5", () => {
    const i = info([employee(3100), employee(1200, 50)]);
    expect(lineAEmployees(i).map((e) => e.socialSecurityWages)).toEqual([3100]);
  });

  it("counts Medicare wages toward the $2,800 when they are higher", () => {
    const e = { ...employee(0), medicareWages: 2800 };
    expect(lineA(info([e]))).toBe(true);
  });
});
