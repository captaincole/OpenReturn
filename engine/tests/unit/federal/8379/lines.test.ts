/*
 * Form 8379 arithmetic. No IRS text works the form with numbers; the tests take
 * the amounts the instructions print (the line 15 worksheet) and the rules each
 * line states.
 */

import { describe, expect, it } from "vitest";
import {
  ADDITIONAL_STANDARD_DEDUCTION_2025,
  MAX_SOCIAL_SECURITY_TAX_2025,
  additionalMedicareWithholding,
  hasExcessSocialSecurity,
  otherSpouseShare,
  partOneLines,
  standardDeductionShares,
  type PartOneAnswers,
} from "../../../../src/federal/8379/lines.js";

describe("line 15, the standard deduction worksheet (irs-8379-inst-2025::sec::basic-standard-deduction::b01)", () => {
  it("prints $1,600 for each 2025 box checked for age or blindness", () => {
    expect(ADDITIONAL_STANDARD_DEDUCTION_2025).toBe(1600);
  });

  it("splits the basic standard deduction in half with no box checked", () => {
    expect(standardDeductionShares(31500, 0, 0)).toEqual({ injured: 15750, other: 15750 });
  });

  it("worksheet line 3: the injured spouse's box goes to column (b) only", () => {
    // Form 1040 chart, joint, one box: $33,100 (irs-1040-inst-2025::sec::single-1::b01).
    expect(standardDeductionShares(33100, 1, 0)).toEqual({ injured: 17350, other: 15750 });
  });

  it("worksheet line 5: the other spouse's boxes go to column (c) only", () => {
    expect(standardDeductionShares(34700, 0, 2)).toEqual({ injured: 15750, other: 18950 });
  });

  it("four boxes: each column takes half the basic and its own two boxes", () => {
    // Form 1040 chart, joint, four boxes: $37,900.
    expect(standardDeductionShares(37900, 2, 2)).toEqual({ injured: 18950, other: 18950 });
  });

  it("a dependent's basic amount (line 4c of the dependents worksheet) that is odd rounds column (b) and keeps the total", () => {
    const shares = standardDeductionShares(3151, 0, 0);
    expect(shares).toEqual({ injured: 1576, other: 1575 });
    expect(shares.injured + shares.other).toBe(3151);
  });

  it("columns (b) and (c) always add to column (a)", () => {
    for (const [total, injured, other] of [
      [31500, 0, 0],
      [33100, 1, 0],
      [33100, 0, 1],
      [36300, 1, 2],
      [12345, 1, 1],
    ]) {
      const shares = standardDeductionShares(total!, injured!, other!);
      expect(shares.injured + shares.other).toBe(total);
    }
  });
});

describe("column (c)", () => {
  it("is column (a) less column (b) (irs-8379-face-2025::sec::face-part-iii::b01)", () => {
    expect(otherSpouseShare(68000, 46000)).toBe(22000);
    expect(otherSpouseShare(4300, 150)).toBe(4150);
    expect(otherSpouseShare(-2000, 1000)).toBe(-3000);
  });
});

describe("line 19, each spouse's part of Form 8959 line 24", () => {
  it("is box 6 less 1.45% of box 5 on that spouse's W-2s", () => {
    // 250,000 × 1.45% = 3,625; 4,000 − 3,625 = 375.
    expect(additionalMedicareWithholding(4000, 250000)).toBe(375);
  });

  it("is never below 0", () => {
    expect(additionalMedicareWithholding(600, 46000)).toBe(0);
  });

  it("rounds each line as Form 8959 does", () => {
    // 3,625.40 → 3,625; 210,010 × 1.45% = 3,045.145 → 3,045.
    expect(additionalMedicareWithholding(3625.4, 210010)).toBe(580);
  });
});

describe("line 19, excess social security tax (irs-1040-inst-2025::sec::line-11-2::b01)", () => {
  it("needs more than one employer", () => {
    expect(hasExcessSocialSecurity([11000])).toBe(false);
  });

  it("needs more than $10,918.20 in all", () => {
    expect(MAX_SOCIAL_SECURITY_TAX_2025).toBe(10918.2);
    expect(hasExcessSocialSecurity([6000, 4918.2])).toBe(false);
    expect(hasExcessSocialSecurity([6000, 4918.21])).toBe(true);
  });

  it("is false with no W-2", () => {
    expect(hasExcessSocialSecurity([])).toBe(false);
  });
});

const injured: PartOneAnswers = {
  joint: true,
  offsetForOtherSpouseDebt: true,
  legallyObligated: false,
};

describe("Part I (irs-8379-face-2025::sec::face-part-i::b01 to ::b03)", () => {
  it("stops at line 2 for a return that is not joint", () => {
    expect(partOneLines({ joint: false })).toEqual({ answers: { 2: false }, partII: false });
  });

  it("stops at line 3 when no debt of the other spouse takes the overpayment", () => {
    expect(partOneLines({ joint: true, offsetForOtherSpouseDebt: false })).toEqual({
      answers: { 2: true, 3: false },
      partII: false,
    });
  });

  it("stops at line 4 when the injured spouse owes the debt too", () => {
    const lines = partOneLines({
      joint: true,
      offsetForOtherSpouseDebt: true,
      legallyObligated: true,
    });
    expect(lines).toEqual({ answers: { 2: true, 3: true, 4: true }, partII: false });
  });

  it("line 5 Yes skips lines 6 to 9", () => {
    const lines = partOneLines({ ...injured, communityProperty: true, madePayments: false });
    expect(lines).toEqual({ answers: { 2: true, 3: true, 4: false, 5: true }, partII: true });
  });

  it("line 6 Yes skips lines 7 to 9", () => {
    const lines = partOneLines({ ...injured, communityProperty: false, madePayments: true });
    expect(lines).toEqual({
      answers: { 2: true, 3: true, 4: false, 5: false, 6: true },
      partII: true,
    });
  });

  it("line 8 Yes skips line 9", () => {
    const lines = partOneLines({
      ...injured,
      communityProperty: false,
      madePayments: false,
      earnedIncome: true,
      claimedEicOrActc: true,
    });
    expect(lines).toMatchObject({ answers: { 7: true, 8: true }, partII: true });
    expect("waitsOn" in lines || 9 in lines.answers).toBe(false);
  });

  it("line 7 No skips line 8 and goes to line 9", () => {
    const lines = partOneLines({
      ...injured,
      communityProperty: false,
      madePayments: false,
      earnedIncome: false,
      claimedEicOrActc: true,
      claimedRefundableCredit: true,
    });
    expect(lines).toEqual({
      answers: { 2: true, 3: true, 4: false, 5: false, 6: false, 7: false, 9: true },
      partII: true,
    });
  });

  it("line 9 No stops: not an injured spouse", () => {
    const lines = partOneLines({
      ...injured,
      communityProperty: false,
      madePayments: false,
      earnedIncome: true,
      claimedEicOrActc: false,
      claimedRefundableCredit: false,
    });
    expect(lines).toMatchObject({ answers: { 8: false, 9: false }, partII: false });
  });

  it("waits on the first answer it reaches that is missing", () => {
    expect(partOneLines({ joint: true })).toEqual({ waitsOn: "offsetForOtherSpouseDebt" });
    expect(partOneLines({ ...injured, communityProperty: false })).toEqual({
      waitsOn: "madePayments",
    });
  });

  it("does not wait on an answer of a line it skips", () => {
    expect(partOneLines({ ...injured, communityProperty: true })).toMatchObject({ partII: true });
  });
});
