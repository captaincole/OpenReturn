/*
 * Form 4972 lines from the two filled-in Forms 4972 of Pub. 575 (2024) (the 2025
 * Pub. 575 no longer has them: irs-pub-575-2025::sec::lump-sum-distributions::b01)
 * and limit tests that need no source. The Tax Rate Schedule is the same in
 * 2024 and 2025 (irs-4972-form-2025::sec::tax-rate-schedule::b01).
 */

import { describe, expect, it } from "vitest";
import { form4972Lines } from "../../../../src/federal/4972/form.js";
import {
  DEATH_BENEFIT_EXCLUSION_LIMIT,
  MINIMUM_ALLOWANCE_CAP,
  TAX_RATE_SCHEDULE,
  scheduleTax,
  type LumpSumAmounts,
  type LumpSumChoices,
} from "../../../../src/federal/4972/lines.js";
import { minimumAllowance, tenYearTax } from "../../../../src/federal/4972/partIII.js";

const amounts = (value: Partial<LumpSumAmounts>): LumpSumAmounts => ({
  taxableAmount: 0,
  capitalGain: 0,
  netUnrealizedAppreciation: 0,
  annuityValue: 0,
  recipientShare: 1,
  annuityShare: 1,
  ...value,
});

const choices = (value: Partial<LumpSumChoices>): LumpSumChoices => ({
  capitalGainElection: false,
  tenYearOption: true,
  includeNua: false,
  deathBenefitExclusion: 0,
  federalEstateTax: 0,
  ...value,
});

describe("Form 4972, published examples (Pub. 575 (2024))", () => {
  /*
   * Example 1, Robert C. Smith: box 2a $150,000, box 3 $10,000. He makes the
   * capital gain election and uses the 10-year tax option; tax $24,270.
   */
  it("Example 1, Robert C. Smith: lines 6 to 30", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 150_000, capitalGain: 10_000 }),
      choices({ capitalGainElection: true }),
    );
    expect(lines.partII).toEqual({ line6: 10_000, line7: 2_000 });
    expect(lines.partIII).toMatchObject({
      line8: 140_000,
      line9: undefined,
      line10: 140_000,
      line11: 0,
      line12: 140_000,
      allowance: undefined,
      line17: 140_000,
      line18: undefined,
      line19: 140_000,
      annuity: undefined,
      line23: 14_000,
      line24: 2_227,
      line25: 22_270,
      annuityTax: undefined,
      line29: 22_270,
    });
    expect(lines.line30).toBe(24_270);
    expect(lines.tax).toBe(24_270);
  });

  /*
   * Example 2, Mary Brown: box 2a $160,000, box 8 $10,000, 10-year tax option
   * only; tax $28,070. The publication prints line 10 as 140,000, a misprint:
   * its line 12 (170,000) is line 10 + line 11, so line 10 is 160,000.
   */
  it("Example 2, Mary Brown: an annuity on line 11 (lines 20 to 28)", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 160_000, annuityValue: 10_000 }),
      choices({}),
    );
    expect(lines.partII).toBeUndefined();
    expect(lines.partIII).toMatchObject({
      line8: 160_000,
      line10: 160_000,
      line11: 10_000,
      line12: 170_000,
      line17: 170_000,
      line19: 170_000,
      // Printed .0588; line 21 is blank because lines 13 to 16 are.
      annuity: { line20: 0.0588, line21: undefined, line22: 10_000 },
      line23: 17_000,
      line24: 2_917,
      line25: 29_170,
      annuityTax: { line26: 1_000, line27: 110, line28: 1_100 },
      line29: 28_070,
    });
    expect(lines.line30).toBe(28_070);
  });
});

describe("Form 4972, Tax Rate Schedule (lines 24 and 27)", () => {
  it("each bracket starts where the one below it ends", () => {
    TAX_RATE_SCHEDULE.slice(1).forEach((row, index) => {
      const below = TAX_RATE_SCHEDULE[index];
      expect(below.base + below.rate * (row.over - below.over)).toBeCloseTo(row.base, 6);
      expect(scheduleTax(row.over)).toBeCloseTo(row.base, 6);
    });
  });

  it("0 or less is 0; 11% at the bottom; 50% at the top", () => {
    expect(scheduleTax(0)).toBe(0);
    expect(scheduleTax(-5)).toBe(0);
    expect(scheduleTax(1_000)).toBeCloseTo(110, 6);
    expect(scheduleTax(100_000)).toBeCloseTo(31_116 + 0.5 * (100_000 - 85_790), 6);
  });

  it("lines 23 to 25: 10% of the amount, the rounded tax, times 10", () => {
    // 4,379.2 rounds to 4,379; 260.50 + 14% × 2,109 = 555.76 rounds to 556.
    expect(tenYearTax(43_792)).toEqual({ tenth: 4_379, tax: 556, times10: 5_560 });
  });
});

describe("Form 4972, minimum distribution allowance (lines 13 to 16)", () => {
  it("$70,000 or more skips lines 13 to 16", () => {
    expect(minimumAllowance(70_000)).toBeUndefined();
    expect(minimumAllowance(140_000)).toBeUndefined();
  });

  it("$20,000 or less: half of line 12, nothing taken back", () => {
    expect(minimumAllowance(10_000)).toEqual({
      line13: 5_000,
      line14: 0,
      line15: 0,
      line16: 5_000,
    });
    expect(minimumAllowance(20_000)).toEqual({
      line13: MINIMUM_ALLOWANCE_CAP,
      line14: 0,
      line15: 0,
      line16: MINIMUM_ALLOWANCE_CAP,
    });
  });

  it("the allowance falls to 0 at $70,000 and is never negative", () => {
    expect(minimumAllowance(50_360)).toEqual({
      line13: 10_000,
      line14: 30_360,
      line15: 6_072,
      line16: 3_928,
    });
    expect(minimumAllowance(69_999)?.line16).toBe(0);
    for (let line12 = 0; line12 < 70_000; line12 += 1_250) {
      const allowance = minimumAllowance(line12)!;
      expect(allowance.line16).toBeGreaterThanOrEqual(0);
      expect(allowance.line16).toBeLessThanOrEqual(MINIMUM_ALLOWANCE_CAP);
      expect(allowance.line16).toBe(allowance.line13 - allowance.line15);
    }
  });
});

describe("Form 4972, Part II alone and its worksheets", () => {
  it("Part II only: the tax is line 7, and Part III and line 30 are blank", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 80_000, capitalGain: 12_345 }),
      choices({ capitalGainElection: true, tenYearOption: false }),
    );
    expect(lines.partII).toEqual({ line6: 12_345, line7: 2_469 });
    expect([lines.partIII, lines.line30, lines.tax]).toEqual([undefined, undefined, 2_469]);
  });

  it("the capital gain election with no box 3 completes no Part II", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 30_000 }),
      choices({ capitalGainElection: true }),
    );
    expect(lines.partII).toBeUndefined();
    expect(lines.partIII?.line8).toBe(30_000);
  });

  it("NUA without Part II: line 8 is box 2a plus box 6", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 40_000, capitalGain: 4_000, netUnrealizedAppreciation: 7_500 }),
      choices({ includeNua: true }),
    );
    expect(lines.nua).toBeUndefined();
    expect(lines.partIII?.line8).toBe(47_500);
  });

  it("NUA with Part II: the worksheet splits box 6 (lines E and F), line 6 is line G", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 40_000, capitalGain: 4_000, netUnrealizedAppreciation: 7_500 }),
      choices({ capitalGainElection: true, includeNua: true }),
    );
    expect(lines.nua).toEqual({
      lineA: 4_000,
      lineB: 40_000,
      lineC: 0.1,
      lineD: 7_500,
      lineE: 750,
      lineF: 6_750,
      lineG: 4_750,
    });
    expect(lines.partII?.line6).toBe(4_750);
    // Line 8: 40,000 − 4,000 + line F.
    expect(lines.partIII?.line8).toBe(42_750);
  });

  it("estate tax with no exclusion: worksheet lines A to C only; the rest on line 18", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 100_000, capitalGain: 25_000 }),
      choices({ capitalGainElection: true, federalEstateTax: 8_000 }),
    );
    expect(lines.deathBenefit).toEqual({ lineA: 25_000, lineB: 100_000, lineC: 0.25 });
    // 8,000 × 0.25 = 2,000 off the gain; 6,000 on line 18.
    expect(lines.partII?.line6).toBe(23_000);
    expect(lines.partIII?.line18).toBe(6_000);
  });

  it("estate tax without Part II: all of it on line 18", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 100_000, capitalGain: 25_000 }),
      choices({ federalEstateTax: 8_000 }),
    );
    expect([lines.deathBenefit, lines.partIII?.line18]).toEqual([undefined, 8_000]);
  });

  it("the death benefit exclusion is at most $5,000", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 100_000 }),
      choices({ deathBenefitExclusion: 7_500 }),
    );
    expect(lines.partIII?.line9).toBe(DEATH_BENEFIT_EXCLUSION_LIMIT);
    expect(lines.partIII?.line10).toBe(95_000);
  });

  it("with Part II the exclusion splits: line E reduces the gain, D − E is line 9", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 100_000, capitalGain: 25_000 }),
      choices({ capitalGainElection: true, deathBenefitExclusion: 5_000 }),
    );
    expect(lines.deathBenefit).toEqual({
      lineA: 25_000,
      lineB: 100_000,
      lineC: 0.25,
      lineD: 5_000,
      lineE: 1_250,
      lineF: 23_750,
    });
    expect(lines.partII?.line6).toBe(23_750);
    expect(lines.partIII?.line9).toBe(3_750);
    // The two parts add back to the exclusion.
    expect((lines.deathBenefit?.lineE ?? 0) + (lines.partIII?.line9 ?? 0)).toBe(5_000);
  });
});

describe("Form 4972, multiple recipients (Steps 1 to 5)", () => {
  it("Step 2 without Part II: box 2a and box 8 grossed up, line 29 is the box 9a part", () => {
    const lines = form4972Lines(
      amounts({
        taxableAmount: 40_000,
        annuityValue: 4_000,
        recipientShare: 0.4,
        annuityShare: 0.4,
      }),
      choices({ deathBenefitExclusion: 5_000 }),
    );
    const three = lines.partIII!;
    // Line 8 = 40,000 / 40%; line 9 the full exclusion; line 11 = 4,000 / 40%.
    expect([three.line8, three.line9, three.line11, three.line12]).toEqual([
      100_000, 5_000, 10_000, 105_000,
    ]);
    const difference = three.line25 - (three.annuityTax?.line28 ?? 0);
    expect(three.multipleRecipients).toEqual({
      lineA: difference,
      lineB: 0.4,
      lineC: Math.round(difference * 0.4),
    });
    expect(three.line29).toBe(three.multipleRecipients?.lineC);
  });

  it("Step 2 with Part II: (box 2a − box 3) / box 9a; line 9 is the full exclusion less its line C part", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 40_000, capitalGain: 8_000, recipientShare: 0.5 }),
      choices({ capitalGainElection: true, deathBenefitExclusion: 5_000 }),
    );
    // Worksheet line D is her share: 5,000 × 50%; C = 8,000 / 40,000.
    expect(lines.deathBenefit).toEqual({
      lineA: 8_000,
      lineB: 40_000,
      lineC: 0.2,
      lineD: 2_500,
      lineE: 500,
      lineF: 7_500,
    });
    expect(lines.partIII?.line8).toBe(64_000);
    expect(lines.partIII?.line9).toBe(4_000);
  });
});

describe("Form 4972, limits", () => {
  it("line 30 is line 7 plus line 29; lines 19 and 29 are never negative", () => {
    const lines = form4972Lines(
      amounts({ taxableAmount: 6_000, capitalGain: 1_000, annuityValue: 50_000 }),
      choices({ capitalGainElection: true, federalEstateTax: 60_000 }),
    );
    const three = lines.partIII!;
    expect(three.line19).toBeGreaterThanOrEqual(0);
    expect(three.line29).toBeGreaterThanOrEqual(0);
    expect(lines.line30).toBe((lines.partII?.line7 ?? 0) + three.line29);
  });

  it("the siuan scenario by hand: every branch at once", () => {
    const lines = form4972Lines(
      amounts({
        taxableAmount: 46_000,
        capitalGain: 5_520,
        netUnrealizedAppreciation: 6_000,
        annuityValue: 9_000,
      }),
      choices({
        capitalGainElection: true,
        includeNua: true,
        deathBenefitExclusion: 5_000,
        federalEstateTax: 3_000,
      }),
    );
    expect(lines.partII).toEqual({ line6: 5_280, line7: 1_056 });
    expect(lines.partIII).toMatchObject({
      line8: 45_760,
      line9: 4_400,
      line17: 46_432,
      line18: 2_640,
      line19: 43_792,
      annuity: { line20: 0.1787, line21: 702, line22: 8_298 },
      line29: 4_650,
    });
    expect(lines.line30).toBe(5_706);
  });
});
