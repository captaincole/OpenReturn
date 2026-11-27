/*
 * Form 5884 lines 1a to 4 as pure arithmetic. The form and its instructions
 * (Rev. March 2021) publish no example with numbers, so these are limit tests:
 * each wage limit, each hour threshold, the earlier-year part of a limit, and
 * the totals.
 */

import { describe, expect, it } from "vitest";
import {
  FIRST_YEAR_WAGE_LIMITS,
  SECOND_YEAR_WAGE_LIMIT,
  firstYearLineOf,
  line4Of,
  lines1To2,
  qualifiedFirstYearWages,
  qualifiedSecondYearWages,
  rateLineOf,
  type EmployeeWages,
  type TargetedGroup,
} from "../../../../src/federal/5884/lines.js";

const worker = (
  targetedGroup: TargetedGroup,
  hoursWorked: number,
  firstYearWages: number,
  more: Partial<EmployeeWages> = {},
): EmployeeWages => ({ targetedGroup, hoursWorked, firstYearWages, ...more });

describe("the wage limit of each targeted group (lines-1a-1b-and-1c::b01 to ::b04)", () => {
  const limits: Array<[TargetedGroup, number]> = [
    ["long_term_family_assistance", 10_000],
    ["veteran_snap", 6_000],
    ["veteran_unemployed_4_weeks", 6_000],
    ["veteran_disabled_recent_discharge", 12_000],
    ["veteran_unemployed_6_months", 14_000],
    ["veteran_disabled_unemployed_6_months", 24_000],
    ["summer_youth", 3_000],
    ["tanf", 6_000],
    ["ex_felon", 6_000],
    ["designated_community_resident", 6_000],
    ["vocational_rehabilitation", 6_000],
    ["snap", 6_000],
    ["ssi", 6_000],
    ["long_term_unemployment", 6_000],
  ];

  it.each(limits)("%s: wages above the limit count up to %i", (group, limit) => {
    expect(FIRST_YEAR_WAGE_LIMITS[group]).toBe(limit);
    expect(qualifiedFirstYearWages(worker(group, 500, limit + 2_500))).toBe(limit);
    expect(qualifiedFirstYearWages(worker(group, 500, limit - 1))).toBe(limit - 1);
  });

  it("every group has a limit", () => {
    expect(limits.map(([group]) => group).sort()).toEqual(
      Object.keys(FIRST_YEAR_WAGE_LIMITS).sort(),
    );
  });
});

describe("the hour thresholds (qualified-wages::b01, face-page-1::b01)", () => {
  it("fewer than 120 hours: no qualified wages, first or second year", () => {
    const employee = worker("long_term_family_assistance", 119, 4_000, { secondYearWages: 5_000 });
    expect(qualifiedFirstYearWages(employee)).toBe(0);
    expect(qualifiedSecondYearWages(employee)).toBe(0);
    expect(lines1To2([employee])).toEqual({ line2: 0 });
  });

  it("120 hours is line 1a; 399 hours is line 1a; 400 hours is line 1b", () => {
    expect(firstYearLineOf(worker("snap", 120, 1))).toBe("1a");
    expect(firstYearLineOf(worker("snap", 399, 1))).toBe("1a");
    expect(firstYearLineOf(worker("snap", 400, 1))).toBe("1b");
    expect(qualifiedFirstYearWages(worker("snap", 120, 2_000))).toBe(2_000);
  });

  it("the same wages give 25% on line 1a and 40% on line 1b", () => {
    expect(lines1To2([worker("snap", 399, 6_000)]).line2).toBe(1_500);
    expect(lines1To2([worker("snap", 400, 6_000)]).line2).toBe(2_400);
  });
});

describe("the limit over two tax years (lines-1a-1b-and-1c::b01)", () => {
  it("first-year wages an earlier return took into account use up the limit", () => {
    expect(
      qualifiedFirstYearWages(worker("tanf", 900, 4_000, { firstYearWagesEarlierYears: 3_500 })),
    ).toBe(2_500);
    expect(
      qualifiedFirstYearWages(worker("tanf", 900, 4_000, { firstYearWagesEarlierYears: 6_000 })),
    ).toBe(0);
    expect(
      qualifiedFirstYearWages(worker("tanf", 900, 4_000, { firstYearWagesEarlierYears: 7_000 })),
    ).toBe(0);
  });

  it("second-year wages: long-term family assistance recipients only, up to $10,000", () => {
    const recipient = worker("long_term_family_assistance", 1_000, 0, { secondYearWages: 12_000 });
    expect(qualifiedSecondYearWages(recipient)).toBe(SECOND_YEAR_WAGE_LIMIT);
    expect(qualifiedSecondYearWages({ ...recipient, secondYearWagesEarlierYears: 4_000 })).toBe(
      6_000,
    );
    expect(qualifiedSecondYearWages(worker("tanf", 1_000, 0, { secondYearWages: 12_000 }))).toBe(0);
  });
});

describe("lines 1a to 4", () => {
  it("each line totals its wages, rounds once, and multiplies by its rate", () => {
    const lines = lines1To2([
      worker("summer_youth", 300, 2_850.4),
      worker("snap", 250, 4_100.3),
      worker("tanf", 620, 9_200),
      worker("long_term_family_assistance", 1_820, 3_000, {
        firstYearWagesEarlierYears: 8_000,
        secondYearWages: 12_400,
      }),
    ]);
    // 2,850.40 + 4,100.30 = 6,950.70 → 6,951; × 25% = 1,737.75 → 1,738.
    expect(lines.line1a).toEqual({ wages: 6_951, credit: 1_738 });
    // 6,000 + 2,000 = 8,000 × 40%.
    expect(lines.line1b).toEqual({ wages: 8_000, credit: 3_200 });
    expect(lines.line1c).toEqual({ wages: 10_000, credit: 5_000 });
    expect(lines.line2).toBe(1_738 + 3_200 + 5_000);
  });

  it("a line with no wages is blank, and line 2 is 0 with none", () => {
    expect(lines1To2([])).toEqual({ line2: 0 });
    expect(lines1To2([worker("snap", 500, 1_000)]).line1a).toBeUndefined();
    expect(rateLineOf([0, 0], 0.4)).toBeUndefined();
  });

  it("the credit is never more than 40% of the largest limit, $9,600 for one employee", () => {
    const most = lines1To2([worker("veteran_disabled_unemployed_6_months", 5_000, 90_000)]);
    expect(most.line2).toBe(9_600);
    const ltfa = lines1To2([
      worker("long_term_family_assistance", 5_000, 50_000, { secondYearWages: 50_000 }),
    ]);
    expect(ltfa.line2).toBe(4_000 + 5_000);
  });

  it("line 4 adds line 3, blank counting 0 (face-page-1::b02)", () => {
    expect(line4Of(17_618, 1_200)).toBe(18_818);
    expect(line4Of(4_000, undefined)).toBe(4_000);
  });
});
