/*
 * Form 8396 lines from the published examples of Pub. 530 (2025) and limit
 * tests that need no source: the rate range, the $2,000 limit and its edge,
 * the credit limit, and Part II's carryforward order.
 */

import { describe, expect, it } from "vitest";
import type { MortgageCreditCertificateFactValue } from "../../../../src/facts/index.js";
import {
  certificateCredit,
  certifiedInterest,
  creditLimit,
  creditRateText,
  currentYearCredit,
  highRateLimit,
  line3Credit,
  partII,
  totalCredit,
} from "../../../../src/federal/8396/lines.js";

const certificate = (
  overrides: Partial<MortgageCreditCertificateFactValue>,
): MortgageCreditCertificateFactValue => ({
  issuerName: "Test Housing Agency",
  creditRatePercent: 20,
  certifiedIndebtedness: 100_000,
  originalLoanAmount: 100_000,
  interestPaid: 5_000,
  ...overrides,
});

const credit = (overrides: Partial<MortgageCreditCertificateFactValue>) =>
  certificateCredit(certificate(overrides));

describe("Form 8396, published examples (Pub. 530, 2025)", () => {
  /* irs-pub-530-2025::sec::figuring-the-credit::b01: $7,500 × 100,000 / 125,000 = $6,000. */
  it("Figuring the Credit: a loan larger than the certified indebtedness → line 1 $6,000", () => {
    expect(
      certifiedInterest(
        certificate({
          interestPaid: 7_500,
          certifiedIndebtedness: 100_000,
          originalLoanAmount: 125_000,
        }),
      ),
    ).toBe(6_000);
  });

  /*
   * irs-pub-530-2025::sec::dividing-the-credit::b01: 25% rate, certified $130,000,
   * loan $120,000. You (60%) paid $5,400 → $1,350, limited to $1,200. Your sibling
   * (40%) paid $3,600 → $900, limited to $800.
   */
  it("Dividing the Credit: you, 60% → line 3 $1,200", () => {
    expect(
      credit({
        creditRatePercent: 25,
        certifiedIndebtedness: 130_000,
        originalLoanAmount: 120_000,
        interestPaid: 5_400,
        ownershipShare: 0.6,
      }),
    ).toEqual({ line1: 5_400, line3: 1_200 });
  });

  it("Dividing the Credit: your sibling, 40% → line 3 $800", () => {
    expect(
      credit({
        creditRatePercent: 25,
        certifiedIndebtedness: 130_000,
        originalLoanAmount: 120_000,
        interestPaid: 3_600,
        ownershipShare: 0.4,
      }),
    ).toEqual({ line1: 3_600, line3: 800 });
  });

  /*
   * irs-pub-530-2025::sec::dividing-the-credit::b02, credit rate more than 20%:
   * the excess over the limit ($150, $100) never reaches a carryforward line.
   * With line 3 at the limit and enough tax, Part II is blank.
   */
  it("Credit rate more than 20%: the excess over the limit is not carried forward", () => {
    const inputs = { line3: 1_200, line4: 0, line5: 0, line6: 0 };
    expect(partII(inputs, currentYearCredit(totalCredit(inputs), 5_000))).toBeUndefined();
  });

  /*
   * irs-pub-530-2025::sec::dividing-the-credit::b02, Carryforward: tax $1,100,
   * no other credits, credit $1,700 → $600 carried forward (line 17).
   */
  it("Carryforward: tax $1,100, credit $1,700 → line 9 $1,100, line 17 $600", () => {
    const limit = creditLimit(1_100, 0);
    const inputs = { line3: 1_700, line4: 0, line5: 0, line6: 0 };
    const line9 = currentYearCredit(totalCredit(inputs), limit.line3);
    expect(limit).toEqual({ line1: 1_100, line2: 0, line3: 1_100 });
    expect(line9).toBe(1_100);
    expect(partII(inputs, line9)).toEqual({
      line10: 1_700,
      line11: 1_700,
      line12: 1_700,
      line13: 0,
      line14: 0,
      line15: 0,
      line16: 0,
      line17: 600,
    });
  });
});

describe("Form 8396 line 3 limits", () => {
  it("20% exactly multiplies with no $2,000 limit", () => {
    expect(credit({ creditRatePercent: 20, interestPaid: 15_000 })).toEqual({
      line1: 15_000,
      line3: 3_000,
    });
  });

  it("above 20% the credit is never more than $2,000", () => {
    expect(credit({ creditRatePercent: 20.5, interestPaid: 15_000 })).toEqual({
      line1: 15_000,
      line3: 2_000,
    });
  });

  it("above 20% and under the limit, line 1 × line 2 (nearest dollar)", () => {
    expect(credit({ creditRatePercent: 35, interestPaid: 4_321 })).toEqual({
      line1: 4_321,
      line3: 1_512,
    });
  });

  it("a loan no larger than the certified indebtedness counts all the interest", () => {
    expect(
      certifiedInterest(certificate({ originalLoanAmount: 90_000, interestPaid: 4_000 })),
    ).toBe(4_000);
  });

  it("the $2,000 limit divides by the ownership share; none means the whole limit", () => {
    expect(highRateLimit(certificate({ ownershipShare: 0.5 }))).toBe(1_000);
    expect(highRateLimit(certificate({}))).toBe(2_000);
  });

  it("a rate under 10% or over 50% is unsupported", () => {
    expect(credit({ creditRatePercent: 9.5 })).toMatchObject({ ok: false, unsupported: true });
    expect(credit({ creditRatePercent: 51 })).toMatchObject({ ok: false, unsupported: true });
    expect(credit({ creditRatePercent: 10 })).toEqual({ line1: 5_000, line3: 500 });
    expect(credit({ creditRatePercent: 50, interestPaid: 3_000 })).toEqual({
      line1: 3_000,
      line3: 1_500,
    });
  });

  it("a reissued certificate gives no more than the original one", () => {
    const original = { creditUnderOriginalCertificate: 900 };
    expect(line3Credit(certificate({ reissued: original }), 5_000)).toBe(900);
    expect(
      line3Credit(certificate({ reissued: { creditUnderOriginalCertificate: 1_400 } }), 5_000),
    ).toBe(1_000);
  });

  it("different rates in the year of refinancing need a statement: unsupported", () => {
    expect(
      credit({ reissued: { creditUnderOriginalCertificate: 900, ratesDifferThisYear: true } }),
    ).toMatchObject({ ok: false, unsupported: true });
  });

  it("line 2 prints the rate without its percent sign", () => {
    expect(creditRateText(certificate({ creditRatePercent: 22.5 }))).toBe("22.5");
  });
});

describe("Form 8396 credit limit and Part II", () => {
  it("worksheet line 3 is -0- when the other credits use the whole tax", () => {
    expect(creditLimit(900, 1_250)).toEqual({ line1: 900, line2: 1_250, line3: 0 });
    expect(creditLimit(900, 900).line3).toBe(0);
  });

  it("line 9 is never more than line 7 or line 8", () => {
    expect(currentYearCredit(1_000, 5_000)).toBe(1_000);
    expect(currentYearCredit(1_000, 400)).toBe(400);
  });

  it("line 7 adds lines 3 through 6", () => {
    expect(totalCredit({ line3: 1_000, line4: 100, line5: 200, line6: 300 })).toBe(1_600);
  });

  it("Part II is blank when line 9 equals line 7", () => {
    const inputs = { line3: 1_000, line4: 100, line5: 200, line6: 300 };
    expect(partII(inputs, 1_600)).toBeUndefined();
  });

  it("current year first: line 9 under line 3 carries 2025, 2024 and 2023 credits; 2022 expires", () => {
    const inputs = { line3: 2_000, line4: 300, line5: 450, line6: 600 };
    expect(partII(inputs, 1_200)).toEqual({
      line10: 2_300,
      line11: 3_350,
      line12: 2_300,
      line13: 1_050,
      line14: 600,
      line15: 450,
      line16: 450,
      line17: 800,
    });
  });

  it("line 9 past lines 3 and 4: the 2023 credit is used before the 2024 credit", () => {
    const inputs = { line3: 1_000, line4: 100, line5: 200, line6: 300 };
    const part = partII(inputs, 1_250);
    expect(part).toMatchObject({ line12: 1_250, line13: 350, line14: 300, line16: 50, line17: 0 });
  });

  it("the carryforwards never total more than line 7 less line 9", () => {
    const inputs = { line3: 700, line4: 250, line5: 400, line6: 900 };
    for (const line9 of [0, 300, 700, 950, 1_400, 2_000]) {
      const part = partII(inputs, line9)!;
      expect(part.line14 + part.line16 + part.line17).toBeLessThanOrEqual(
        totalCredit(inputs) - line9,
      );
    }
  });
});
