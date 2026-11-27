/*
 * Form 8881 arithmetic (lines.ts). The instructions publish no example with
 * numbers (irs-8881-inst-2025), so these are the stated rules and their edges:
 * each limit, each threshold, each year of each credit period, and totals
 * that equal their parts.
 */

import { describe, expect, it } from "vitest";
import {
  line6e2Text,
  line6eOf,
  line9Of,
  ownCredits,
  part3Of,
  section1Of,
  section2Of,
  type ContributionsInput,
  type StartupCostsInput,
} from "../../../../src/federal/8881/lines.js";

const startup = (overrides: Partial<StartupCostsInput> = {}): StartupCostsInput => ({
  creditYear: 1,
  employeesBeforeFirstCreditYear: 10,
  qualifiedCosts: 4_000,
  eligibleNonHighlyCompensated: 8,
  ...overrides,
});

const contributions = (overrides: Partial<ContributionsInput> = {}): ContributionsInput => ({
  planYear: 1,
  precedingYearEmployees: 20,
  employees: [],
  ...overrides,
});

describe("Section 1, the startup costs credit (lines A to 5)", () => {
  it("1–50 employees take line 1 on line 2; line 5 is the smaller of lines 2 and 4", () => {
    const lines = section1Of(startup());
    expect(lines).toEqual({
      lineA: 10,
      line1: 4_000,
      line2: 4_000,
      line3Employees: 8,
      line3: 2_000,
      line4: 2_000,
      line5: 2_000,
    });
  });

  it("50 employees on line A is the 100% employer; 51 takes 50% of line 1", () => {
    expect(section1Of(startup({ employeesBeforeFirstCreditYear: 50 }))?.line2).toBe(4_000);
    expect(section1Of(startup({ employeesBeforeFirstCreditYear: 51 }))?.line2).toBe(2_000);
    expect(section1Of(startup({ employeesBeforeFirstCreditYear: 100 }))?.line2).toBe(2_000);
  });

  it("an employer with more than 100 employees on line A is not eligible", () => {
    expect(section1Of(startup({ employeesBeforeFirstCreditYear: 101 }))).toBeUndefined();
  });

  it("line 4 is at least $500 and at most $5,000", () => {
    expect(section1Of(startup({ eligibleNonHighlyCompensated: 1 }))?.line4).toBe(500);
    expect(section1Of(startup({ eligibleNonHighlyCompensated: 2 }))?.line4).toBe(500);
    expect(section1Of(startup({ eligibleNonHighlyCompensated: 3 }))?.line4).toBe(750);
    expect(section1Of(startup({ eligibleNonHighlyCompensated: 20 }))?.line4).toBe(5_000);
    expect(section1Of(startup({ eligibleNonHighlyCompensated: 21 }))?.line4).toBe(5_000);
  });

  it("the credit is never more than $5,000, nor more than line 2", () => {
    const big = section1Of(startup({ qualifiedCosts: 40_000, eligibleNonHighlyCompensated: 90 }));
    expect(big?.line5).toBe(5_000);
    const small = section1Of(startup({ qualifiedCosts: 300.49 }));
    expect(small?.line1).toBe(300);
    expect(small?.line5).toBe(300);
  });

  it("the first credit year and the 2 after it only", () => {
    expect(section1Of(startup({ creditYear: 3 }))?.line5).toBe(2_000);
    expect(section1Of(startup({ creditYear: 4 }))).toBeUndefined();
  });
});

describe("Section 2, the employer contributions credit (lines 6a to 6g)", () => {
  const employees = [
    { contributions: 800, wages: 40_000 },
    { contributions: 1_000, wages: 30_000 },
    { contributions: 1_500, wages: 60_000 },
    { contributions: 5_000, wages: 70_000 },
    { contributions: 900, wages: 105_000 },
    { contributions: 900, wages: 105_001 },
  ];

  it("line 6b takes employees at or under $1,000, line 6c the rest up to $1,000; over $105,000 of wages counts nowhere", () => {
    const lines = section2Of(contributions({ employees }));
    expect(lines?.line6b).toBe(2_700);
    expect(lines?.line6c).toBe(2_000);
    expect(lines?.line6d).toBe(4_700);
    expect(lines?.line6e).toBeUndefined();
    expect(lines?.line6f).toBe(4_700);
    expect(lines?.line6g).toBe(4_700);
  });

  it("line 6c includes up to $1,000, $1,000, $1,334, $2,000 and $4,000 by the year of the plan (line-6c::b01)", () => {
    const one = [{ contributions: 5_000, wages: 50_000 }];
    const line6c = (planYear: number) =>
      section2Of(contributions({ planYear, employees: one }))?.line6c;
    expect([1, 2, 3, 4, 5].map(line6c)).toEqual([1_000, 1_000, 1_334, 2_000, 4_000]);
  });

  it("line 6g applies 100%, 100%, 75%, 50% and 25%; each employee's credit stays near $1,000", () => {
    const one = [{ contributions: 5_000, wages: 50_000 }];
    const line6g = (planYear: number) =>
      section2Of(contributions({ planYear, employees: one }))?.line6g;
    // Year 3: $1,334 x 75% = $1,000.50, which rounds to $1,001 (QUESTIONS.md).
    expect([1, 2, 3, 4, 5].map(line6g)).toEqual([1_000, 1_000, 1_001, 1_000, 1_000]);
  });

  it("no credit after the fifth year of the plan", () => {
    expect(section2Of(contributions({ planYear: 6, employees }))).toBeUndefined();
  });

  it("line 6b keeps each employee's cents and rounds the total; blank with no such employee", () => {
    const cents = [
      { contributions: 300.3, wages: 20_000 },
      { contributions: 300.3, wages: 20_000 },
    ];
    expect(section2Of(contributions({ employees: cents }))?.line6b).toBe(601);
    const large = [{ contributions: 1_200, wages: 20_000 }];
    const lines = section2Of(contributions({ employees: large }));
    expect(lines?.line6b).toBeUndefined();
    expect(lines?.line6d).toBe(1_000);
  });

  it("line 6c is 0, not blank, with no employee above $1,000", () => {
    const small = [{ contributions: 400, wages: 20_000 }];
    expect(section2Of(contributions({ employees: small }))?.line6c).toBe(0);
  });
});

describe("line 6e, the phase-in above 50 employees", () => {
  it("50 employees on line 6a skip line 6e; 51 reduce by 2%", () => {
    expect(line6eOf(50, 10_000)).toBeUndefined();
    expect(line6eOf(51, 10_000)).toEqual({
      excessEmployees: 1,
      reductionHundredths: 2,
      reduction: 200,
      afterReduction: 9_800,
    });
  });

  it("100 employees reduce line 6d to 0, and more never below 0", () => {
    expect(line6eOf(100, 10_000)?.afterReduction).toBe(0);
    expect(line6eOf(120, 10_000)?.afterReduction).toBe(0);
  });

  it("line 6e(3) rounds to the dollar; line 6f takes line 6e(4)", () => {
    const lines = section2Of(
      contributions({
        precedingYearEmployees: 58,
        employees: [{ contributions: 6_619, wages: 20_000 }],
      }),
    );
    expect(lines?.line6e?.reduction).toBe(160);
    expect(lines?.line6f).toBe(840);
    expect(line6eOf(58, 6_619)?.reduction).toBe(1_059);
  });

  it("line 6e(2) prints as a decimal", () => {
    expect(line6e2Text(2)).toBe("0.02");
    expect(line6e2Text(16)).toBe("0.16");
    expect(line6e2Text(100)).toBe("1.00");
  });
});

describe("Part II, the auto-enrollment credit (line 9)", () => {
  it("$500 in the first credit year and the 2 after it; blank otherwise", () => {
    expect([1, 2, 3, 4].map(line9Of)).toEqual([500, 500, 500, undefined]);
    expect(line9Of(undefined)).toBeUndefined();
  });
});

describe("Part III, the military spouse participation credit (lines 12 and 13)", () => {
  it("$200 for each military spouse, plus contributions up to $300 each", () => {
    const spouses = [
      { participationYear: 1, contributions: 250 },
      { participationYear: 3, contributions: 900 },
      { participationYear: 2, contributions: 0 },
    ];
    expect(part3Of(spouses, 40)).toEqual({ line12Employees: 3, line12: 600, line13: 550 });
  });

  it("a spouse past the 3 years of participation does not count", () => {
    expect(part3Of([{ participationYear: 4, contributions: 300 }], 40)).toBeUndefined();
  });

  it("no credit with more than 100 employees in the preceding tax year", () => {
    const spouses = [{ participationYear: 1, contributions: 300 }];
    expect(part3Of(spouses, 100)?.line12).toBe(200);
    expect(part3Of(spouses, 101)).toBeUndefined();
  });

  it("each spouse's credit is at most $500", () => {
    const lines = part3Of([{ participationYear: 1, contributions: 10_000 }], 5);
    expect(sumOfLines(lines)).toBe(500);
  });
});

const sumOfLines = (lines: ReturnType<typeof part3Of>) =>
  (lines?.line12 ?? 0) + (lines?.line13 ?? 0);

describe("the credits by Form 3800 row equal their lines", () => {
  it("1j is lines 5 and 6g, 1dd line 9, 1ee lines 12 and 13", () => {
    const section1 = section1Of(startup());
    const section2 = section2Of(
      contributions({ employees: [{ contributions: 700, wages: 30_000 }] }),
    );
    const part3 = part3Of([{ participationYear: 1, contributions: 100 }], 10);
    expect(ownCredits({ section1, section2, line9: 500, part3 })).toEqual({
      partI: 2_700,
      partII: 500,
      partIII: 300,
    });
    expect(ownCredits({})).toEqual({ partI: 0, partII: 0, partIII: 0 });
  });
});
