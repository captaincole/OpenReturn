/*
 * Form 2210 Part I, Schedule AI and the Part II boxes as pure arithmetic:
 * thresholds, limits and the rules the instructions state.
 */

import { describe, expect, it } from "vitest";
import { dayNumber, DUE_DATES_2025 } from "../../../../src/federal/2210/dates.js";
import { form2210, type Form2210Inputs } from "../../../../src/federal/2210/form.js";
import { partILines, type PartIInputs } from "../../../../src/federal/2210/partI.js";
import {
  scheduleAILines,
  type AnnualizedColumnInputs,
} from "../../../../src/federal/2210/scheduleAI.js";
import {
  annualizedSelfEmploymentTax,
  netEarningsFromProfit,
} from "../../../../src/federal/2210/scheduleAIPartII.js";

const partIBase: PartIInputs = {
  taxAfterCredits: 20000,
  otherTaxes: 2000,
  refundableCredits: 500,
  withholding: 8000,
  priorYearTax: 15000,
  priorYearAgi: 120000,
  marriedFilingSeparately: false,
};

describe("Form 2210 Part I", () => {
  it("lines 1–9: line 4 combines 1, 2 and 3; line 9 is the smaller of 5 and 8", () => {
    expect(partILines(partIBase)).toEqual({
      line1: 20000,
      line2: 2000,
      line3: 500,
      line4: 21500,
      line5: 19350,
      line6: 8000,
      line7: 13500,
      line8: 15000,
      line9: 15000,
      line9MoreThanLine6: true,
    });
  });

  it("line 4 under $1,000 stops the form; $1,000 does not", () => {
    const stop = partILines({
      ...partIBase,
      taxAfterCredits: 999,
      otherTaxes: 0,
      refundableCredits: 0,
    });
    expect(stop.line5).toBeUndefined();
    const go = partILines({
      ...partIBase,
      taxAfterCredits: 1000,
      otherTaxes: 0,
      refundableCredits: 0,
      withholding: 0,
    });
    expect(go.line5).toBe(900);
  });

  it("line 7 under $1,000 stops before line 8", () => {
    const lines = partILines({ ...partIBase, withholding: 20501 });
    expect(lines.line7).toBe(999);
    expect(lines.line8).toBeUndefined();
    expect(lines.line9MoreThanLine6).toBeUndefined();
  });

  it("110% of the 2024 tax only above $150,000 of 2024 AGI (line-19::b02)", () => {
    expect(partILines({ ...partIBase, priorYearAgi: 150000 }).line8).toBe(15000);
    expect(partILines({ ...partIBase, priorYearAgi: 150001 }).line8).toBe(16500);
  });

  it("married filing separately: 110% above $75,000", () => {
    const mfs = { ...partIBase, marriedFilingSeparately: true };
    expect(partILines({ ...mfs, priorYearAgi: 75000 }).line8).toBe(15000);
    expect(partILines({ ...mfs, priorYearAgi: 75001 }).line8).toBe(16500);
  });

  it("no 12-month 2024 return: line 8 blank and line 9 is line 5 (line-19::b03)", () => {
    const lines = partILines({ ...partIBase, priorYearTax: undefined });
    expect(lines.line8).toBeUndefined();
    expect(lines.line9).toBe(lines.line5);
  });

  it("no 2024 tax: line 9 is 0, so no penalty (exceptions-to-the-penalty::b01)", () => {
    const lines = partILines({ ...partIBase, priorYearTax: 0 });
    expect(lines.line9).toBe(0);
    expect(lines.line9MoreThanLine6).toBe(false);
  });
});

describe("Form 2210 Schedule AI Part II", () => {
  it("column (d) is Schedule SE: 12.4% up to the wage base left, and 2.9%", () => {
    const lines = annualizedSelfEmploymentTax(
      { netEarnings: 41558, socialSecurityWages: 24000 },
      3,
    );
    expect(lines).toEqual({
      line28: 41558,
      line30: 24000,
      line31: 152100,
      line33: 5153,
      line35: 1205,
      line36: 6358,
    });
  });

  it("wages above the prorated limit leave line 31 at 0 and only the Medicare part", () => {
    const lines = annualizedSelfEmploymentTax(
      { netEarnings: 10000, socialSecurityWages: 50000 },
      0,
    );
    expect(lines.line31).toBe(0);
    expect(lines.line33).toBe(0);
    expect(lines.line36).toBe(1160);
  });

  it("line 28: net profit × 92.35%; under $400 is 0 (line-28::b01)", () => {
    expect(netEarningsFromProfit(2000)).toBe(1847);
    expect(netEarningsFromProfit(433)).toBe(400);
    expect(netEarningsFromProfit(432)).toBe(0);
  });
});

const column = (
  agi: number,
  extra: Partial<AnnualizedColumnInputs> = {},
): AnnualizedColumnInputs => ({
  adjustedGrossIncome: agi,
  itemizedDeductions: 0,
  standardDeduction: 15750,
  qbiDeduction: 0,
  qualifiedDividends: 0,
  netCapitalGain: 0,
  otherTaxes: 0,
  credits: 0,
  selfEmployment: { netEarnings: 0, socialSecurityWages: 0 },
  ...extra,
});

describe("Form 2210 Schedule AI Part I", () => {
  const even = [column(25000), column(41667), column(66667), column(100000)];

  it("even income: each line 27 is near the regular installment", () => {
    const lines = scheduleAILines({
      columns: even,
      itemizes: false,
      filingStatus: "single",
      requiredAnnualPayment: 12000,
    });
    expect(lines.map((each) => each.line3)).toEqual([100000, 100001, 100001, 100000]);
    expect(lines[0].line4).toBe(0);
    expect(lines[0].line6).toBeUndefined();
    expect(lines.every((each) => each.line27 <= each.line26)).toBe(true);
    expect(lines.every((each) => each.line27 <= each.line23)).toBe(true);
  });

  it("the installments never add up to more than 90% of the year's tax (column (d) line 21)", () => {
    const lines = scheduleAILines({
      columns: [column(5000), column(9000), column(80000), column(100000)],
      itemizes: false,
      filingStatus: "single",
      requiredAnnualPayment: 20000,
    });
    const total = lines.reduce((sum, each) => sum + each.line27, 0);
    expect(total).toBeLessThanOrEqual(lines[3].line21);
    expect(lines[1].line22).toBe(lines[0].line27);
    expect(lines[0].line22).toBeUndefined();
    expect(lines[0].line25).toBeUndefined();
  });

  it("itemized deductions are annualized and compared with the full standard deduction", () => {
    const lines = scheduleAILines({
      columns: [
        column(20000, { itemizedDeductions: 3000 }),
        column(30000, { itemizedDeductions: 8000 }),
        column(40000),
        column(60000, { itemizedDeductions: 16000 }),
      ],
      itemizes: true,
      filingStatus: "single",
      requiredAnnualPayment: 6000,
    });
    expect([lines[0].line6, lines[0].line8]).toEqual([12000, 15750]);
    expect([lines[1].line6, lines[1].line8]).toEqual([19200, 19200]);
    expect(lines[3].line8).toBe(16000);
  });

  it("line 19 is never below 0 and line 13 never below 0", () => {
    const lines = scheduleAILines({
      columns: [column(1000, { credits: 5000 }), column(2000), column(3000), column(4000)],
      itemizes: false,
      filingStatus: "single",
      requiredAnnualPayment: 0,
    });
    expect(lines[0].line11).toBeLessThan(0);
    expect(lines[0].line13).toBe(0);
    expect(lines[0].line19).toBe(0);
  });
});

const dueDay = (index: number) => DUE_DATES_2025[index];
const formBase: Form2210Inputs = {
  partI: { ...partIBase, withholding: 4000 },
  jointReturn2025: false,
  jointReturn2024: false,
  estimatedPayments: [{ day: dueDay(3), amount: 12000 }],
};

describe("Form 2210 Part II boxes", () => {
  it("no box applies: the IRS figures the penalty, so nothing is figured here", () => {
    const result = form2210(formBase);
    expect(result.boxes).toEqual({ a: false, b: false, c: false, d: false, e: false });
    expect(result.figured).toBeUndefined();
  });

  it("box A: waive the whole penalty, page 1 only", () => {
    const result = form2210({ ...formBase, waiver: { request: "entire", amount: 0 } });
    expect(result.boxes.a).toBe(true);
    expect(result.figured).toBeUndefined();
  });

  it("box B: line 19 is the penalty less the waived part, never below 0", () => {
    const part = form2210({ ...formBase, waiver: { request: "part", amount: 50 } });
    const full = part.figured?.worksheet.penalty as number;
    expect(part.boxes.b).toBe(true);
    expect(part.figured?.line19).toBe(full - 50);
    const all = form2210({ ...formBase, waiver: { request: "part", amount: full + 100 } });
    expect(all.figured?.line19).toBe(0);
  });

  it("box D only when withholding by date lowers the penalty", () => {
    const early = [{ day: dayNumber("2025-01-31") as number, amount: 4000 }];
    expect(form2210({ ...formBase, datedWithholding: early }).boxes.d).toBe(true);
    const late = [{ day: dayNumber("2025-12-31") as number, amount: 4000 }];
    const result = form2210({ ...formBase, datedWithholding: late });
    expect(result.boxes.d).toBe(false);
    expect(result.figured).toBeUndefined();
  });

  it("box E: a joint return in one year only and line 8 smaller than line 5", () => {
    expect(form2210({ ...formBase, jointReturn2025: true }).boxes.e).toBe(true);
    const higher = { ...formBase.partI, priorYearTax: 30000 };
    expect(form2210({ ...formBase, partI: higher, jointReturn2025: true }).boxes.e).toBe(false);
    expect(form2210({ ...formBase, jointReturn2024: true, jointReturn2025: true }).boxes.e).toBe(
      false,
    );
  });

  it("line 9 not more than line 6: no penalty and no box A–D", () => {
    const covered = { ...formBase.partI, withholding: 16000 };
    const result = form2210({
      ...formBase,
      partI: covered,
      waiver: { request: "part", amount: 10 },
    });
    expect(result.partI.line9MoreThanLine6).toBe(false);
    expect(result.boxes.b).toBe(false);
  });
});
