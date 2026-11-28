/*
 * Form 8941 arithmetic (src/federal/8941/lines.ts): the published examples with
 * numbers, each test named by its source, and the limits that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  CREDIT_RATE,
  FTE_LIMIT,
  WAGE_LIMIT,
  WAGE_PHASEOUT_LINE,
  adjustedAveragePremium,
  averageAnnualWages,
  creditLines,
  ftePhaseout,
  fullTimeEquivalents,
  hoursOfService,
  line16Of,
  wagePhaseout,
  type WorksheetEmployee,
} from "../../../../src/federal/8941/lines.js";

/* `count` employees with the same hours, wages and premiums. */
const staff = (
  count: number,
  hours: number,
  wages: number,
  premiums?: { paid: number; average: number },
): WorksheetEmployee[] =>
  Array.from({ length: count }, () => ({
    hours,
    wages,
    premiums: premiums && {
      employerPremiumsPaid: premiums.paid,
      adjustedAveragePremium: premiums.average,
    },
  }));

describe("published examples", () => {
  it("instructions Example 3: $60 a week for 52 weeks is $3,120; for 10 weeks $600 (employer-premiums-paid::b03)", () => {
    expect(60 * 52).toBe(3_120);
    expect(60 * 10).toBe(600);
  });

  it("instructions Example 4: the average premium limit is $2,964 for the year and $570 for 10 pay periods (column-a-enrolled-individuals::b04)", () => {
    // 60% of a $5,200 plan; the rating area's employee-only average is $4,940.
    expect(adjustedAveragePremium(3_120, 4_940, 5_200)).toBe(2_964);
    expect(adjustedAveragePremium(600, 4_940, 5_200)).toBe(570);
  });

  it("instructions, eligible small employers: 48 half-time employees are 24 FTEs (eligible-small-employers::b02)", () => {
    expect(fullTimeEquivalents(48 * 1_040)).toBe(24);
  });

  it("Worksheet 2: 2.99 rounds down to 2; Worksheet 3: $2,999 rounds down to $2,000", () => {
    expect(fullTimeEquivalents(2.99 * 2_080)).toBe(2);
    expect(averageAnnualWages(2_999, 1)).toBe(2_000);
  });

  it("26 CFR 1.45R-3(b)(2) Example 1: premiums under the average premium limit count in full ($19,500)", () => {
    // 6 employee-only at $2,000 of $4,000 (average $5,000); 5 dependent at $1,500 of $3,000 (average $4,000).
    const employeeOnly = adjustedAveragePremium(2_000, 5_000, 4_000);
    const dependent = adjustedAveragePremium(1_500, 4_000, 3_000);
    const rows = [
      ...staff(5, 2_080, 23_000, { paid: 3_500, average: employeeOnly + dependent }),
      ...staff(1, 2_080, 23_000, { paid: 2_000, average: employeeOnly }),
      ...staff(3, 2_080, 23_000),
    ];
    const lines = creditLines(rows, 0);
    expect(lines.line4).toBe(19_500);
    expect(lines.line6).toBe(19_500);
  });

  it("26 CFR 1.45R-3(b)(2) Example 2: premiums above the limit count at the average ($25,000)", () => {
    const employeeOnly = adjustedAveragePremium(3_000, 5_000, 6_000);
    const dependent = adjustedAveragePremium(2_500, 4_000, 5_000);
    expect(employeeOnly).toBe(2_500);
    expect(dependent).toBe(2_000);
    const rows = [
      ...staff(5, 2_080, 23_000, { paid: 5_500, average: employeeOnly + dependent }),
      ...staff(1, 2_080, 23_000, { paid: 3_000, average: employeeOnly }),
      ...staff(3, 2_080, 23_000),
    ];
    const lines = creditLines(rows, 0);
    expect(lines.line4).toBe(30_500);
    expect(lines.line5).toBe(25_000);
    expect(lines.line6).toBe(25_000);
  });

  it("26 CFR 1.45R-3(c)(3) Example 1: 9 FTEs, $23,000 of wages, $72,000 of premiums give $36,000", () => {
    const lines = creditLines(staff(9, 2_080, 23_000, { paid: 8_000, average: 9_000 }), 0);
    expect(lines).toMatchObject({ line2: 9, line3: 23_000, line4: 72_000, line7: 36_000 });
    expect(lines.line8).toBe(36_000);
    expect(lines.line9).toBe(36_000);
    expect(lines.line12).toBe(36_000);
  });

  it("26 CFR 1.45R-3(c)(3) Example 2: 12 FTEs and $30,000 of wages in a $25,000 year take $6,400 and $9,600 off $48,000", () => {
    const line8 = ftePhaseout(48_000, 12);
    expect(48_000 - line8).toBe(6_400);
    expect(wagePhaseout(48_000, line8, 30_000, 25_000)).toBe(32_000);
  });

  it("26 CFR 1.45R-3(d)(4) Example 3: the credit is held to the net premium payment ($20 of $35)", () => {
    // $20 by the employer and $50 by the state to the insurer: $70 counts on line 4, and line 10 takes the $50.
    const lines = creditLines(staff(1, 2_080, 23_000, { paid: 70, average: 100 }), 50);
    expect(lines.line7).toBe(35);
    expect(lines.line11).toBe(20);
    expect(lines.line12).toBe(20);
  });

  it("IRS Q&A 15 (calculating the credit): 4 employee-only and 5 family employees count $40,000 of $47,000", () => {
    const employeeOnly = adjustedAveragePremium(3_000, 5_000, 6_000);
    const family = adjustedAveragePremium(7_000, 12_000, 14_000);
    const rows = [
      ...staff(4, 2_080, 23_000, { paid: 3_000, average: employeeOnly }),
      ...staff(5, 2_080, 23_000, { paid: 7_000, average: family }),
    ];
    const lines = creditLines(rows, 0);
    expect(lines.line4).toBe(47_000);
    expect(lines.line5).toBe(40_000);
    expect(lines.line6).toBe(40_000);
  });
});

describe("limits and edges", () => {
  it("Worksheet 1 column (b) takes at most 2,080 hours, and 0 for a seasonal employee", () => {
    expect(hoursOfService(2_300, false)).toBe(2_080);
    expect(hoursOfService(1_500, false)).toBe(1_500);
    expect(hoursOfService(900, true)).toBe(0);
  });

  it("an FTE count below one is entered as 1", () => {
    expect(fullTimeEquivalents(0)).toBe(1);
    expect(fullTimeEquivalents(1_000)).toBe(1);
  });

  it("25 FTEs or more: lines 3 to 11 are skipped and line 12 is 0", () => {
    const lines = creditLines(staff(FTE_LIMIT, 2_080, 30_000, { paid: 5_000, average: 6_000 }), 0);
    expect(lines.line2).toBe(25);
    expect(lines.line3).toBeUndefined();
    expect(lines.line4).toBeUndefined();
    expect(lines.line12).toBe(0);
    expect(lines.line13).toBeUndefined();
    expect(lines.line14).toBeUndefined();
  });

  it("24 FTEs keep 1/15 of line 7", () => {
    const lines = creditLines(staff(24, 2_080, 30_000, { paid: 5_000, average: 6_000 }), 0);
    expect(lines.line7).toBe(60_000);
    expect(lines.line8).toBe(4_000);
  });

  it("$67,000 of average wages or more: lines 4 to 11 are skipped and line 12 is 0", () => {
    const lines = creditLines(staff(5, 2_080, WAGE_LIMIT, { paid: 5_000, average: 6_000 }), 0);
    expect(lines.line3).toBe(67_000);
    expect(lines.line4).toBeUndefined();
    expect(lines.line12).toBe(0);
  });

  it("$66,000 of average wages keeps a small credit: 1 − 32,700 / 33,300 of line 7", () => {
    const lines = creditLines(staff(5, 2_080, 66_000, { paid: 4_000, average: 6_000 }), 0);
    expect(lines.line7).toBe(10_000);
    expect(lines.line9).toBe(10_000 - 9_820);
  });

  it("10 FTEs and $33,000 of wages are the last amounts with no phaseout", () => {
    expect(ftePhaseout(9_000, 10)).toBe(9_000);
    expect(ftePhaseout(9_000, 11)).toBe(8_400);
    expect(wagePhaseout(9_000, 9_000, WAGE_PHASEOUT_LINE)).toBe(9_000);
    expect(wagePhaseout(9_000, 9_000, 34_000)).toBe(9_000 - 189);
  });

  it("both phaseouts never take line 9 below 0", () => {
    const line8 = ftePhaseout(30_000, 24);
    expect(wagePhaseout(30_000, line8, 60_000)).toBe(0);
  });

  it("the credit is never more than 50% of line 6, and line 12 never more than line 11", () => {
    const lines = creditLines(staff(4, 2_080, 25_000, { paid: 6_000, average: 5_000 }), 15_000);
    expect(lines.line7).toBe((lines.line6 ?? 0) * CREDIT_RATE);
    expect(lines.line11).toBe(9_000);
    expect(lines.line12).toBe(9_000);
    expect(lines.line12).toBeLessThanOrEqual(lines.line9 ?? 0);
  });

  it("state subsidies above line 4 leave line 11 and line 12 at 0, and lines 13 and 14 are skipped", () => {
    const lines = creditLines(staff(2, 2_080, 25_000, { paid: 3_000, average: 4_000 }), 7_000);
    expect(lines.line11).toBe(0);
    expect(lines.line12).toBe(0);
    expect(lines.line13).toBeUndefined();
    expect(lines.line14).toBeUndefined();
  });

  it("line 13 counts the enrolled employees and line 14 their FTEs", () => {
    const rows = [
      ...staff(3, 2_080, 30_000, { paid: 4_000, average: 5_000 }),
      ...staff(1, 1_000, 15_000, { paid: 2_000, average: 2_500 }),
      ...staff(2, 2_080, 30_000),
    ];
    const lines = creditLines(rows, 0);
    expect(lines.line1).toBe(6);
    expect(lines.line13).toBe(4);
    expect(lines.line14).toBe(3);
  });

  it("line 16 adds lines 12 and 15", () => {
    expect(line16Of(19_711, 1_850)).toBe(21_561);
    expect(line16Of(undefined, 1_850)).toBe(1_850);
  });
});
