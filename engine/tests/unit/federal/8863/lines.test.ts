/*
 * Form 8863 arithmetic (federal/8863/lines.ts and refund.ts): the published
 * examples with numbers (.scratch evidence: Pub. 970 chapters 2 and 3, the
 * Form 8863 instructions), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type { EducationAcademicPeriod } from "../../../../src/facts/index.js";
import {
  adjustedExpenses,
  americanOpportunityLines,
  creditLimitLines,
  decimalText,
  partIILines,
  partILines,
  phaseOutDecimal,
} from "../../../../src/federal/8863/lines.js";
import { ageGroupOf, refundOutcome } from "../../../../src/federal/8863/refund.js";

const period = (paid: number, extra: Partial<EducationAcademicPeriod> = {}) => ({
  description: "Fall 2025",
  tuitionAndFeesPaid: paid,
  taxFreeAssistance: 0,
  ...extra,
});

/* One student's American opportunity credit through Part I, line 7. */
const aocCredit = (expenses: number, magi: number, joint: boolean) =>
  partILines(americanOpportunityLines(expenses).line30, magi, joint, true).line7;

describe("Pub. 970 chapter 2 examples (American opportunity credit)", () => {
  it("Jack and Kay: $4,300 of expenses, MAGI $70,000 joint → $2,500 (figuring-the-credit::b01)", () => {
    expect(
      americanOpportunityLines(adjustedExpenses([period(4300)], "american_opportunity")),
    ).toEqual({ line27: 4000, line28: 2000, line29: 500, line30: 2500 });
    expect(aocCredit(4300, 70000, true)).toBe(2500);
  });

  it("phase-out: $5,000 of expenses, MAGI $165,000 joint → $1,875 (magi-for-the-american::b02)", () => {
    const lines = partILines(2500, 165000, true, true);
    expect([lines.room, lines.range, lines.decimal, lines.line7]).toEqual([
      15000, 20000, 0.75, 1875,
    ]);
  });

  it("recapture example: $7,000 → $2,500; refigured on $3,000 → $2,250 (adjustments-to-qualified-education::b06)", () => {
    expect(americanOpportunityLines(4000).line30).toBe(2500);
    expect(americanOpportunityLines(3000).line30).toBe(2250);
  });

  it("Joan: a $2,000 scholarship excluded leaves $1,000; included leaves $3,000 (b08, b09)", () => {
    expect(adjustedExpenses([period(3000, { taxFreeAssistance: 2000 })], "lifetime_learning")).toBe(
      1000,
    );
    expect(adjustedExpenses([period(3000)], "lifetime_learning")).toBe(3000);
  });

  it("Bill Ex. 1: $5,600 of expenses, tax $2,585 → line 8 $1,000, line 19 $1,500 (b12, b13)", () => {
    const partI = partILines(americanOpportunityLines(5600).line30, 39250, false, true);
    expect([partI.line7, partI.line8, partI.line9]).toEqual([2500, 1000, 1500]);
    const worksheet = creditLimitLines(0, partI.line9!, 2585, []);
    expect(worksheet.line7).toBe(1500);
    expect(2585 - worksheet.line7 - partI.line8!).toBe(85);
  });

  it("Bill Ex. 2 and 3: a $5,600 scholarship excluded → $0; $1,600 of it tax free → $2,500 (b14)", () => {
    expect(
      adjustedExpenses([period(5600, { taxFreeAssistance: 5600 })], "american_opportunity"),
    ).toBe(0);
    expect(americanOpportunityLines(0)).toEqual({ line27: 0, line28: 0, line29: 0, line30: 0 });
    const adjusted = adjustedExpenses(
      [period(5600, { taxFreeAssistance: 1600 })],
      "american_opportunity",
    );
    expect(americanOpportunityLines(adjusted).line30).toBe(2500);
  });

  it("Jane: $500 adjusted, tax $51 → $200 refundable and $51 nonrefundable (b15, b16)", () => {
    const partI = partILines(americanOpportunityLines(500).line30, 24125, false, true);
    expect([partI.line7, partI.line8, partI.line9]).toEqual([500, 200, 300]);
    expect(creditLimitLines(0, partI.line9!, 51, []).line7).toBe(51);
  });

  it("Jane: $6,000, $4,000 and $2,000 adjusted against tax $603, $403 and $201 (b16, b17)", () => {
    const cases: Array<[number, number, number, number]> = [
      [6000, 603, 1000, 603],
      [4000, 403, 1000, 403],
      [2000, 201, 800, 201],
    ];
    for (const [adjusted, tax, refundable, nonrefundable] of cases) {
      const partI = partILines(americanOpportunityLines(adjusted).line30, 27000, false, true);
      expect(partI.line8).toBe(refundable);
      expect(creditLimitLines(0, partI.line9!, tax, []).line7).toBe(nonrefundable);
    }
  });
});

describe("Form 8863 instructions examples", () => {
  it("Example 1: a $5,000 Pell grant on $5,000 of expenses → $0 (adjusted-qualified-education::b05)", () => {
    expect(
      adjustedExpenses([period(5000, { taxFreeAssistance: 5000 })], "american_opportunity"),
    ).toBe(0);
  });

  it("Example 2: $1,000 of Pell tax free → $4,000; refundable $1,000, nonrefundable $1,500 (b05, b06)", () => {
    const adjusted = adjustedExpenses(
      [period(5000, { taxFreeAssistance: 1000 })],
      "american_opportunity",
    );
    expect(adjusted).toBe(4000);
    const partI = partILines(americanOpportunityLines(adjusted).line30, 30000, false, true);
    expect([partI.line8, partI.line9]).toEqual([1000, 1500]);
  });

  it("credit recapture: $8,000 → LLC $1,600; less the $1,400 refund → $1,320 (b10, b11)", () => {
    expect(partIILines(8000, 50000, true).line18).toBe(1600);
    expect(adjustedExpenses([period(8000, { refunds: 1400 })], "lifetime_learning")).toBe(6600);
    expect(partIILines(6600, 50000, true).line18).toBe(1320);
  });

  it("prepaid tuition: $2,000 paid in December 2025 for January 2026 counts in 2025 (prepaid-expenses::b01)", () => {
    const periods = [period(2000, { description: "Winter 2026 (paid December 2025)" })];
    expect(adjustedExpenses(periods, "lifetime_learning")).toBe(2000);
  });
});

describe("Pub. 970 chapter 3 examples (lifetime learning credit)", () => {
  it("Bruce and Toni: $5,000, MAGI $75,000 joint → $1,000 (figuring-the-credit-2::b01)", () => {
    expect(partIILines(5000, 75000, true).line18).toBe(1000);
  });

  it("phase-out: $6,600, MAGI $161,000 joint → $1,320 × 0.95 = $1,254 (magi-for-the-lifetime::b02)", () => {
    const lines = partIILines(6600, 161000, true);
    expect([lines.line12, lines.phase?.decimal, lines.line18]).toEqual([1320, 0.95, 1254]);
  });

  it("recapture: $9,300 → $1,860; refigured on $6,400 → $1,280 (adjustments-to-qualified-education-2::b08)", () => {
    expect(partIILines(9300, 40000, false).line18).toBe(1860);
    expect(partIILines(6400, 40000, false).line18).toBe(1280);
  });

  it("Judy: three payments $4,500 → $900, tax $1,547 → $647; $1,500 scholarship excluded → $600 (b13–b15)", () => {
    const paid = [period(700), period(1900), period(1900, { description: "Spring 2026" })];
    const adjusted = adjustedExpenses(paid, "lifetime_learning");
    const credit = creditLimitLines(partIILines(adjusted, 30600, false).line18, 0, 1547, []).line7;
    expect([adjusted, credit, 1547 - credit]).toEqual([4500, 900, 647]);
    const excluded = [period(700), period(1900, { taxFreeAssistance: 1500 }), period(1900)];
    expect(partIILines(adjustedExpenses(excluded, "lifetime_learning"), 30600, false).line18).toBe(
      600,
    );
  });
});

describe("limits", () => {
  it("line 27 never passes $4,000 and line 30 never passes $2,500", () => {
    for (const adjusted of [0, 1, 1999, 2000, 2001, 3999, 4000, 4001, 50000]) {
      const lines = americanOpportunityLines(adjusted);
      expect(lines.line27).toBeLessThanOrEqual(4000);
      expect(lines.line30).toBeLessThanOrEqual(2500);
      expect(lines.line30).toBe(lines.line28 === 0 ? lines.line27 : 2000 + lines.line29);
    }
  });

  it("line 11 never passes $10,000, so line 18 never passes $2,000", () => {
    expect(partIILines(25000, 0, false)).toMatchObject({
      line11: 10000,
      line12: 2000,
      line18: 2000,
    });
  });

  it("line 8 + line 9 = line 7, and line 8 is 40% of line 7", () => {
    const lines = partILines(2500, 85000, false, true);
    expect(lines.line8! + lines.line9!).toBe(lines.line7);
    expect([lines.line7, lines.line8]).toEqual([1250, 500]);
  });

  it("the line 7 box: no line 8, line 9 = line 7", () => {
    const lines = partILines(2500, 50000, false, false);
    expect([lines.line7Box, lines.line7, lines.line8, lines.line9]).toEqual([
      true,
      2500,
      undefined,
      2500,
    ]);
  });

  it("the phase-out edges: single $80,000 → 1.000, $85,000 → 0.500, $90,000 → stop", () => {
    expect(partILines(2500, 80000, false, true).decimal).toBe(1);
    expect(partILines(2500, 85000, false, true)).toMatchObject({ decimal: 0.5, line7: 1250 });
    const stopped = partILines(2500, 90000, false, true);
    expect([stopped.room, stopped.credit, stopped.line7]).toEqual([0, false, undefined]);
    expect(partILines(2500, 95000, false, true).room).toBe(0);
  });

  it("the joint edges: $160,000 → 1.000, $179,999 → 0.000 rounded, $180,000 → line 18 is 0", () => {
    expect(partIILines(10000, 160000, true).phase?.decimal).toBe(1);
    expect(partIILines(10000, 179999, true)).toMatchObject({ line18: 0 });
    expect(partIILines(10000, 180000, true)).toMatchObject({ line18: 0, phase: { credit: false } });
  });

  it("line 10 zero skips lines 11–17 and puts 0 on line 18", () => {
    expect(partIILines(0, 50000, false)).toEqual({ line10: 0, line18: 0 });
  });

  it("line 6 rounds to three places", () => {
    expect(phaseOutDecimal(3333, 10000)).toBe(0.333);
    expect(phaseOutDecimal(6667, 20000)).toBe(0.333);
    expect(phaseOutDecimal(6675, 10000)).toBe(0.668);
    expect(decimalText(0.425)).toEqual({ whole: "0", fraction: "425" });
    expect(decimalText(1)).toEqual({ whole: "1", fraction: "000" });
  });

  it("the worksheet: line 7 is the smaller of line 3 and line 6, never below 0", () => {
    expect(creditLimitLines(600, 900, 5000, [1000, 200]).line7).toBe(1500);
    expect(creditLimitLines(600, 900, 1000, [400, undefined]).line7).toBe(600);
    expect(creditLimitLines(600, 900, 500, [800]).line7).toBe(0);
  });

  it("a period's refund or assistance above its expenses gives 0 for that period only", () => {
    const periods = [period(1000, { taxFreeAssistance: 1500 }), period(2000)];
    expect(adjustedExpenses(periods, "american_opportunity")).toBe(2000);
  });

  it("course materials count for the American opportunity credit only; cents round once", () => {
    const periods = [period(1000.4, { courseMaterialsPaid: 250.3 }), period(500.4)];
    expect(adjustedExpenses(periods, "american_opportunity")).toBe(1751);
    expect(adjustedExpenses(periods, "lifetime_learning")).toBe(1501);
  });
});

describe("line 7: the refundable part (line-7::b02, b03)", () => {
  it("ages at the end of 2025, a January 1 birthday the day before", () => {
    expect(ageGroupOf("01/01/2002")).toBe("24_or_older");
    expect(ageGroupOf("01/02/2002")).toBe("over_18_under_24");
    expect(ageGroupOf("01/01/2007")).toBe("over_18_under_24");
    expect(ageGroupOf("01/02/2007")).toBe("age_18");
    expect(ageGroupOf("01/01/2008")).toBe("age_18");
    expect(ageGroupOf("01/02/2008")).toBe("under_18");
    expect(ageGroupOf(undefined)).toBeUndefined();
  });

  it("a joint return or a filer 24 or older is refundable with no question", () => {
    expect(refundOutcome(true, "05/05/2010", undefined).kind).toBe("refundable");
    expect(refundOutcome(false, "05/05/1990", undefined).kind).toBe("refundable");
  });

  it("over 18: not a full-time student is refundable; else support, then a parent", () => {
    const dob = "06/01/2004";
    expect(refundOutcome(false, dob, undefined)).toEqual({ kind: "waits", for: "fullTimeStudent" });
    expect(refundOutcome(false, dob, { fullTimeStudent: false }).kind).toBe("refundable");
    expect(refundOutcome(false, dob, { fullTimeStudent: true })).toEqual({
      kind: "waits",
      for: "earnedIncomeLessThanHalfOfSupport",
    });
    const all = { fullTimeStudent: true, earnedIncomeLessThanHalfOfSupport: true };
    expect(refundOutcome(false, dob, { ...all, parentAlive: true }).kind).toBe("not_refundable");
    expect(refundOutcome(false, dob, { ...all, parentAlive: false }).kind).toBe("refundable");
    expect(
      refundOutcome(false, dob, { fullTimeStudent: true, earnedIncomeLessThanHalfOfSupport: false })
        .kind,
    ).toBe("refundable");
  });

  it("age 18 skips the student question; under 18 goes straight to the parent question", () => {
    expect(refundOutcome(false, "06/01/2007", undefined)).toEqual({
      kind: "waits",
      for: "earnedIncomeLessThanHalfOfSupport",
    });
    expect(refundOutcome(false, "06/01/2009", { parentAlive: true }).kind).toBe("not_refundable");
    expect(refundOutcome(false, undefined, undefined)).toEqual({
      kind: "waits",
      for: "date_of_birth",
    });
  });
});
