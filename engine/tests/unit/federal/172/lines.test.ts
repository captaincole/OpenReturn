/*
 * Form 172 Part I as pure arithmetic. The published example is the
 * Worksheet 1 example of Pub. 536 (2022), whose Worksheet 1 has the same 24
 * lines as Form 172 Part I (no yearly amount enters the arithmetic except the
 * 2022 standard deduction, which is an input here).
 */

import { describe, expect, it } from "vitest";
import {
  CAPITAL_LOSS_LIMIT,
  nolAmount,
  partI,
  type PartIInputs,
} from "../../../../src/federal/172/lines.js";
import { unsupported } from "../../../../src/types.js";

const base = (changes: Partial<PartIInputs>): PartIInputs => ({
  agi: 0,
  deduction: 0,
  nonbusinessCapitalLosses: 0,
  nonbusinessCapitalGains: 0,
  nonbusinessDeductions: 0,
  nonbusinessIncome: 0,
  businessCapitalLosses: 0,
  businessCapitalGains: 0,
  scheduleDLoss: 0,
  section1202Exclusion: 0,
  marriedFilingSeparately: false,
  nolDeductionOtherYears: 0,
  ...changes,
});

describe("Pub. 536 (2022), Worksheet 1. Figuring Your NOL Example", () => {
  /*
   * Single; wages $1,225, interest $425, a $2,000 long-term gain on business
   * real estate, a $5,000 business loss, a $1,000 short-term loss on stock,
   * the $12,950 standard deduction. "Your NOL for 2022 $1,775."
   */
  const lines = partI(
    base({
      agi: 1225 + 425 + 2000 - 1000 - 5000,
      deduction: 12950,
      nonbusinessCapitalLosses: 1000,
      nonbusinessDeductions: 12950,
      nonbusinessIncome: 425,
      businessCapitalGains: 2000,
    }),
  );

  it("line 1: the deductions exceed income by $15,300", () => {
    expect(lines.line1).toBe(-15300);
  });

  it("disallows $13,525: the $1,000 nonbusiness capital loss and $12,525 of nonbusiness deductions", () => {
    expect(lines.line4).toBe(1000);
    expect(lines.line9).toBe(12525);
    expect(lines.line15).toBe(1000);
    // No loss on Schedule D line 16: lines 16 to 21 are skipped, line 22 is line 15.
    expect(lines.line16).toBeUndefined();
    expect(lines.line22).toBe(1000);
  });

  it("line 24: the NOL is $1,775", () => {
    expect(lines.line24).toBe(-1775);
    expect(nolAmount(lines)).toBe(1775);
  });
});

describe("Form 172 Part I rules", () => {
  it("stops at line 1 when the deduction does not exceed AGI (NOL Steps, Step 2)", () => {
    const lines = partI(base({ agi: 50000, deduction: 15750, nonbusinessIncome: 9000 }));
    expect(lines).toEqual({ line1: 34250 });
    expect(nolAmount(lines)).toBe(0);
  });

  it("line 10 is never more than line 5", () => {
    const lines = partI(
      base({
        agi: -10000,
        deduction: 15000,
        nonbusinessCapitalGains: 3000,
        nonbusinessIncome: 20000,
        nonbusinessDeductions: 15000,
      }),
    );
    expect(lines.line8).toBe(23000);
    expect(lines.line10).toBe(3000);
    expect(lines.line9).toBe(0);
  });

  it("business capital losses reach line 14 only beyond line 13", () => {
    const lines = partI(
      base({
        agi: -20000,
        deduction: 15000,
        businessCapitalLosses: 4000,
        businessCapitalGains: 1500,
        scheduleDLoss: 2500,
      }),
    );
    expect(lines.line13).toBe(1500);
    expect(lines.line14).toBe(2500);
    expect(lines.line15).toBe(2500);
    expect(lines.line19).toBe(2500);
    expect(lines.line20).toBe(0);
    expect(lines.line22).toBe(2500);
  });

  it("line 19 takes $1,500 when married filing separately, $3,000 otherwise", () => {
    const loss = {
      agi: -30000,
      deduction: 15000,
      nonbusinessCapitalLosses: 8000,
      scheduleDLoss: 8000,
    };
    expect(partI(base(loss)).line19).toBe(CAPITAL_LOSS_LIMIT);
    expect(partI(base({ ...loss, marriedFilingSeparately: true })).line19).toBe(1500);
    expect(partI(base({ ...loss, marriedFilingSeparately: true })).line22).toBe(1500);
  });

  it("line 22 adds back exactly the capital loss deduction of nonbusiness losses", () => {
    const lines = partI(
      base({ agi: -30000, deduction: 15000, nonbusinessCapitalLosses: 9000, scheduleDLoss: 9000 }),
    );
    expect(lines.line22).toBe(3000);
    expect(lines.line24).toBe(-30000 - 15000 + 3000);
  });

  it("line 24 is blank when the add-backs bring the result to zero or more", () => {
    const lines = partI(base({ agi: -1000, deduction: 14000, nonbusinessDeductions: 15000 }));
    expect(lines.line9).toBe(15000);
    expect(lines.line24).toBeUndefined();
  });

  it("adds back the NOL deduction from other years (line 23)", () => {
    const lines = partI(base({ agi: -20000, deduction: 15000, nolDeductionOtherYears: 5000 }));
    expect(lines.line24).toBe(-30000);
  });

  it("a gap on an input reaches every line that reads it and line 24", () => {
    const gap = unsupported("test gap");
    const lines = partI(base({ agi: -20000, deduction: 15000, nonbusinessIncome: gap }));
    expect(lines.line7).toBe(gap);
    expect(lines.line9).toBe(gap);
    expect(lines.line4).toBe(0);
    expect(lines.line24).toBe(gap);
    expect(nolAmount(lines)).toBe(gap);
  });
});
