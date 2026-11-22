/*
 * Form 8853 arithmetic: the published examples of the 2025 instructions
 * (Section C, Examples 1 and 2; lines 9a/9b, Examples 1–3) and limit tests.
 */

import { describe, expect, it } from "vitest";
import type { HsaDistributionFactValue } from "../../../../src/facts/index.js";
import {
  archerExceptionRule,
  exceptedPart,
  medicareAdvantageExceptionRule,
} from "../../../../src/federal/8853/exceptions.js";
import {
  additional20Tax,
  additional50TaxWorksheet,
  additionalTaxBase,
  distributionLines,
  line3Limitation,
  monthlyLimitation,
  partI,
  perDiemLines,
  taxableDistributions,
} from "../../../../src/federal/8853/lines.js";

describe("Section C, irs-8853-inst-2025 Example 1 (line-amount::b01)", () => {
  it("Alex alone: one 365-day period, $24,000 per diem, half his costs reimbursed", () => {
    expect(
      perDiemLines({ line20: 24000, periodDays: 365, serviceCosts: 54750, reimbursements: 27375 }),
    ).toEqual({
      line20: 24000,
      line21: 153300,
      line22: 54750,
      line23: 153300,
      line24: 27375,
      line25: 125925,
      line26: 0,
    });
  });
});

describe("Section C, Example 2 (line-amount-2::b01, line-amount-3::b01)", () => {
  it("Step 1: Alex's statement for the first period, 181 days", () => {
    expect(
      perDiemLines({ line20: 12000, periodDays: 181, serviceCosts: 27150, reimbursements: 13575 }),
    ).toEqual({
      line20: 12000,
      line21: 76020,
      line22: 27150,
      line23: 76020,
      line24: 13575,
      line25: 62445,
      line26: 0,
    });
  });

  it("Step 2: the aggregate statement for the second period, 184 days", () => {
    expect(
      perDiemLines({ line20: 63000, periodDays: 184, serviceCosts: 27600, reimbursements: 13800 }),
    ).toEqual({
      line20: 63000,
      line21: 77280,
      line22: 27600,
      line23: 77280,
      line24: 13800,
      line25: 63480,
      line26: 0,
    });
  });
});

describe("Section C limits", () => {
  it("line 23 takes the costs when they pass the per diem amount", () => {
    const result = perDiemLines({
      line20: 70000,
      periodDays: 100,
      serviceCosts: 60000,
      reimbursements: 0,
    });
    expect([result.line21, result.line23, result.line26]).toEqual([42000, 60000, 10000]);
  });

  it("line 26 is line 20 less line 25, never below 0", () => {
    const taxed = perDiemLines({
      line20: 54000,
      periodDays: 120,
      serviceCosts: 30000,
      reimbursements: 6000,
    });
    expect(taxed.line26).toBe(taxed.line20 - taxed.line25);
    const under = perDiemLines({
      line20: 1000,
      periodDays: 120,
      serviceCosts: 0,
      reimbursements: 0,
    });
    expect(under.line26).toBe(0);
  });

  it("line 25 is never below 0 (reimbursements above line 23)", () => {
    const result = perDiemLines({
      line20: 5000,
      periodDays: 1,
      serviceCosts: 300,
      reimbursements: 900,
    });
    expect([result.line23, result.line25, result.line26]).toEqual([420, 0, 5000]);
  });
});

describe("Line 3 Limitation Chart (start-here::b01, enter-0-on::b01, b02)", () => {
  const selfOnly = (months: number, annualDeductible: number) => ({
    months,
    coverage: "self-only" as const,
    annualDeductible,
  });
  const family = (months: number, annualDeductible: number) => ({
    months,
    coverage: "family" as const,
    annualDeductible,
  });

  it("self-only all year: 65% of the deductible", () => {
    expect(line3Limitation([selfOnly(12, 3600)])).toBe(2340);
  });

  it("family all year: 75% of the deductible", () => {
    expect(line3Limitation([family(12, 8000)])).toBe(6000);
  });

  it("married filing separately with family coverage: 37.5%, or the agreed share", () => {
    expect(line3Limitation([family(12, 8000)], 0.5)).toBe(3000);
    expect(line3Limitation([family(12, 8000)], 0.6)).toBe(3600);
  });

  it("months in Medicare or not eligible count -0-: six months of self-only", () => {
    expect(line3Limitation([selfOnly(6, 3600)])).toBe(1170);
  });

  it("a change of plan: the months add, then divide by 12", () => {
    // 4 × 1,950 + 8 × 4,500 = 43,800; / 12 = 3,650.
    expect(line3Limitation([selfOnly(4, 3000), family(8, 6000)])).toBe(3650);
  });

  it("the deductible range edges: inside counts, outside is not an HDHP", () => {
    expect(monthlyLimitation(selfOnly(1, 2850))).toBeCloseTo(1852.5);
    expect(monthlyLimitation(selfOnly(1, 4300))).toBeCloseTo(2795);
    expect(monthlyLimitation(selfOnly(1, 2849))).toBe(0);
    expect(monthlyLimitation(selfOnly(1, 4301))).toBe(0);
    expect(monthlyLimitation(family(1, 5700))).toBeCloseTo(4275);
    expect(monthlyLimitation(family(1, 8551))).toBe(0);
  });

  it("rounds the year's figure to the nearest dollar: 12 × 1,852.50 / 12", () => {
    expect(line3Limitation([selfOnly(12, 2850)])).toBe(1853);
  });
});

describe("Part I (how-to-complete-part-i::b01)", () => {
  it("line 5 is the smallest of lines 2, 3 and 4", () => {
    const base = { ownContributions: 2200, limitation: 2340, compensation: 142000 };
    expect(partI(base).line5).toBe(2200);
    expect(partI({ ...base, ownContributions: 3000 }).line5).toBe(2340);
    expect(partI({ ...base, compensation: 1500 }).line5).toBe(1500);
  });

  it("employer contributions: lines 1 and 2, skip 3 and 4, -0- on line 5", () => {
    expect(
      partI({
        employerContributions: 1800,
        ownContributions: 500,
        limitation: 2340,
        compensation: 90000,
      }),
    ).toEqual({ line1: 1800, line2: 500, line5: 0 });
  });

  it("line 1 is blank with no code R; line 5 waits while an answer is missing", () => {
    const result = partI({ ownContributions: 1000, compensation: 50000 });
    expect([result.line1, result.line3, result.line5]).toEqual([undefined, undefined, undefined]);
  });
});

describe("Part II and Section B arithmetic", () => {
  it("lines 6a–6c: the total, the rollovers, the difference", () => {
    expect(distributionLines([4850, 3000], 1000)).toEqual({
      gross: 7850,
      rolledOver: 1000,
      net: 6850,
    });
    expect(distributionLines([1200.4, 300.4])).toEqual({
      gross: 1501,
      rolledOver: undefined,
      net: 1501,
    });
  });

  it("lines 8 and 12: zero or less enters -0-", () => {
    expect(taxableDistributions(6850, 3950)).toBe(2900);
    expect(taxableDistributions(1000, 1500)).toBe(0);
  });
});

const distribution = (box3: string, owner?: "taxpayer" | "spouse"): HsaDistributionFactValue => ({
  payerName: "Trust",
  box1: 1000,
  box3,
  box5: "Archer MSA",
  owner,
});

describe("Lines 9a and 9b, irs-8853-inst-2025 Examples 1–3 (exceptions-to-the-additional-20-tax::b01, b02)", () => {
  const dob = (taxpayer?: string, spouse?: string) => (holder: "taxpayer" | "spouse") =>
    holder === "spouse" ? spouse : taxpayer;

  it("Example 1: the spouse (63) is the account holder: no box, 20% of line 8", () => {
    const rule = archerExceptionRule(
      [distribution("1", "spouse")],
      dob("1959-03-01", "1962-02-01"),
    );
    expect(rule).toEqual({ rule: "none" });
    const base = additionalTaxBase(2500, exceptedPart(2500, undefined, rule)!);
    expect([base.exceptionBox, additional20Tax(base.subject)]).toEqual([undefined, 500]);
  });

  it("Example 2: you are 65, your spouse 63: check the box, tax the spouse's part only", () => {
    const rule = archerExceptionRule(
      [distribution("1", "taxpayer"), distribution("1", "spouse")],
      dob("1958-06-01", "1962-02-01"),
    );
    expect(rule).toEqual({ rule: "ask" });
    // The taxpayer states that 1,800 of line 8 is his own (after 65): 20% of the spouse's 1,200.
    const base = additionalTaxBase(3000, exceptedPart(3000, 1800, rule)!);
    expect([base.exceptionBox, additional20Tax(base.subject)]).toEqual([true, 240]);
  });

  it("Example 3: you turned 65 during 2025: the facts cannot split line 8, so the part is asked", () => {
    const rule = archerExceptionRule([distribution("1")], dob("1960-05-20"));
    expect(rule).toEqual({ rule: "ask" });
    expect(exceptedPart(2000, undefined, rule)).toBeUndefined();
    const base = additionalTaxBase(2000, exceptedPart(2000, 1500, rule)!);
    expect([base.exceptionBox, additional20Tax(base.subject)]).toEqual([true, 100]);
  });

  it("a holder 65 by the end of 2024 (a January 1, 1960 birthday counts) has every distribution excepted", () => {
    expect(archerExceptionRule([distribution("1")], dob("1960-01-01"))).toEqual({ rule: "all" });
    expect(archerExceptionRule([distribution("1")], dob("1960-01-02"))).toEqual({ rule: "ask" });
    expect(archerExceptionRule([distribution("1")], dob("1961-01-02"))).toEqual({ rule: "none" });
  });

  it("a disability distribution (code 3) is excepted; a missing date of birth waits", () => {
    expect(archerExceptionRule([distribution("3")], dob())).toEqual({ rule: "all" });
    expect(archerExceptionRule([distribution("1", "spouse")], dob("1970-01-01"))).toEqual({
      rule: "waits",
      dobKey: "identity.spouse.dob",
    });
  });

  it("all excepted: the box is checked and the tax is 0", () => {
    const base = additionalTaxBase(1200, 1200);
    expect([base.exceptionBox, additional20Tax(base.subject)]).toEqual([true, 0]);
  });

  it("the excepted part is never more than line 8", () => {
    expect(additionalTaxBase(1000, 5000).subject).toBe(0);
  });

  it("9b rounds to the nearest dollar: 20% of 1,703 = 340.60", () => {
    expect(additional20Tax(1703)).toBe(341);
  });
});

describe("Lines 13a and 13b: the Additional 50% Tax Worksheet (additional-50-tax-worksheet-line-13b::b01, b02)", () => {
  it("no Medicare Advantage MSA on December 31, 2024: one-half of line 1", () => {
    expect(additional50TaxWorksheet({ subject: 2101, valueEndOf2024: 0 })?.line7).toBe(1051);
  });

  it("an account at the end of 2024: the worksheet lines 2–7", () => {
    expect(
      additional50TaxWorksheet({ subject: 2100, valueEndOf2024: 4000, annualDeductible: 6000 }),
    ).toEqual({
      line1: 2100,
      line2: 4000,
      line3: 6000,
      line4: 3600,
      line5: 400,
      line6: 1700,
      line7: 850,
    });
  });

  it("line 5 and line 6 enter -0- when zero or less", () => {
    const small = additional50TaxWorksheet({
      subject: 2000,
      valueEndOf2024: 3000,
      annualDeductible: 6000,
    });
    expect([small?.line5, small?.line7]).toEqual([0, 1000]);
    const large = additional50TaxWorksheet({
      subject: 2000,
      valueEndOf2024: 9000,
      annualDeductible: 6000,
    });
    expect([large?.line6, large?.line7]).toEqual([0, 0]);
  });

  it("every distribution excepted: -0- on line 13b (exceptions-to-the-additional-50-tax::b01)", () => {
    expect(additional50TaxWorksheet({ subject: 0 })?.line7).toBe(0);
  });

  it("waits for the year-end value, then for the deductible", () => {
    expect(additional50TaxWorksheet({ subject: 100 })).toBeUndefined();
    expect(additional50TaxWorksheet({ subject: 100, valueEndOf2024: 500 })).toBeUndefined();
  });

  it("the Medicare Advantage rule has no age exception: code 3 only", () => {
    const ma = (box3: string): HsaDistributionFactValue => ({
      ...distribution(box3),
      box5: "MA MSA",
    });
    expect(medicareAdvantageExceptionRule([ma("1")])).toEqual({ rule: "none" });
    expect(medicareAdvantageExceptionRule([ma("3")])).toEqual({ rule: "all" });
    expect(medicareAdvantageExceptionRule([ma("1"), ma("3")])).toEqual({ rule: "ask" });
  });
});
