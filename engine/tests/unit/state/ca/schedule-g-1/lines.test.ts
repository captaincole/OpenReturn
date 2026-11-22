/*
 * Schedule G-1 arithmetic. The 2025 California instructions publish no example
 * with numbers. Pub. 575 (2012), pages 22 to 25
 * (https://www.irs.gov/pub/irs-prior/p575--2012.pdf), fills two federal Forms
 * 4972: their lines 6 to 23 follow the same rules as Schedule G-1 lines 6 to
 * 24, which do not depend on a year's rates. Their tax lines use the
 * federal 1986 rates and 20%, so only the lines before the tax are checked.
 */

import { describe, expect, it } from "vitest";
import {
  ALLOWANCE_CUTOFF,
  ALLOWANCE_LIMIT,
  TEN_YEAR_RATE_SCHEDULE,
  amountTaxedOnScheduleG1,
  line21Ratio,
  minimumDistributionAllowance,
  nuaWorksheet,
  scheduleG1Lines,
  scheduleG1Tax,
  tenYearScheduleTax,
  type ScheduleG1Inputs,
} from "../../../../../src/state/ca/schedule-g-1/lines.js";

const inputs = (values: Partial<ScheduleG1Inputs>): ScheduleG1Inputs => ({
  capitalGainElection: false,
  tenYearAveraging: true,
  includeNua: false,
  taxableAmount: 0,
  capitalGain: 0,
  nua: 0,
  annuityPercent: 100,
  distributionPercent: 100,
  ...values,
});

describe("Pub. 575 (2012) examples, the lines before the tax", () => {
  it("Example 1, Robert C. Smith: box 2a $150,000, box 3 $10,000, both elections", () => {
    const lines = scheduleG1Lines(
      inputs({ capitalGainElection: true, taxableAmount: 150000, capitalGain: 10000 }),
    );
    expect(lines.line6).toBe(10000);
    // California's rate is 5.5%, not the federal 20% ($2,000 on Form 4972 line 7).
    expect(lines.line7).toBe(550);
    const partIII = lines.partIII!;
    expect(partIII.line8).toBe(140000);
    expect(partIII.line10).toBe(140000);
    expect(partIII.line11).toBeUndefined();
    expect(partIII.line12).toBe(140000);
    expect(partIII.line13).toBeUndefined();
    expect(partIII.line16).toBeUndefined();
    expect(partIII.line17).toBe(140000);
    expect(partIII.line18).toBe(14000);
    expect(partIII.annuity).toBeUndefined();
    expect(partIII.line27).toBe(partIII.line20);
  });

  it("Example 2, Mary Brown: box 2a $160,000, an annuity of $10,000, 10-year averaging only", () => {
    const lines = scheduleG1Lines(inputs({ taxableAmount: 160000, annuityValue: 10000 }));
    expect(lines.line6).toBe(0);
    expect(lines.line7).toBe(0);
    const partIII = lines.partIII!;
    expect(partIII.line8).toBe(160000);
    expect(partIII.line11).toBe(10000);
    expect(partIII.line12).toBe(170000);
    expect(partIII.line16).toBeUndefined();
    expect(partIII.line17).toBe(170000);
    expect(partIII.line18).toBe(17000);
    // Form 4972 line 20 shows .0588; Schedule G-1 line 21 rounds to three places.
    expect(partIII.annuity).toMatchObject({
      line21: 0.059,
      line22: 0,
      line23: 10000,
      line24: 1000,
    });
  });
});

describe("Tax Rate Schedule for Part III", () => {
  it("each row's tax is the row above at its top amount", () => {
    TEN_YEAR_RATE_SCHEDULE.slice(1).forEach((row) => {
      expect(tenYearScheduleTax(row.over)).toBeCloseTo(row.base, 6);
    });
  });

  it("starts at 1% and ends at 11%", () => {
    expect(tenYearScheduleTax(0)).toBe(0);
    expect(tenYearScheduleTax(1000)).toBeCloseTo(10, 6);
    expect(tenYearScheduleTax(30000)).toBeCloseTo(1450.9 + 0.11 * 2910, 6);
  });
});

describe("line 21", () => {
  it("follows the instructions' examples: .4434 is .443, .4445 is .445", () => {
    expect(line21Ratio(4434, 10000)).toBe(0.443);
    expect(line21Ratio(4445, 10000)).toBe(0.445);
  });

  it("carries four places before it rounds: .44449 is .4444, then .444", () => {
    expect(line21Ratio(44449, 100000)).toBe(0.444);
  });
});

describe("minimum distribution allowance, lines 13 to 16", () => {
  it("is half of line 12 up to $20,000", () => {
    expect(minimumDistributionAllowance(8000)).toEqual({
      line13: 4000,
      line14: 0,
      line15: 0,
      line16: 4000,
    });
    expect(minimumDistributionAllowance(20000)?.line16).toBe(ALLOWANCE_LIMIT);
  });

  it("phases out to 0 just under $70,000 and is skipped at $70,000", () => {
    expect(minimumDistributionAllowance(69999)).toEqual({
      line13: 10000,
      line14: 49999,
      line15: 10000,
      line16: 0,
    });
    expect(minimumDistributionAllowance(ALLOWANCE_CUTOFF)).toBeUndefined();
  });

  it("is never below 0 nor above $10,000", () => {
    for (let line12 = 0; line12 < ALLOWANCE_CUTOFF; line12 += 997) {
      const line16 = minimumDistributionAllowance(line12)!.line16;
      expect(line16).toBeGreaterThanOrEqual(0);
      expect(line16).toBeLessThanOrEqual(ALLOWANCE_LIMIT);
    }
  });
});

describe("worksheets and recipients", () => {
  it("Death Benefit Worksheet: the exclusion splits between line 6 and line 9", () => {
    const lines = scheduleG1Lines(
      inputs({
        capitalGainElection: true,
        taxableAmount: 30000,
        capitalGain: 6000,
        deathBenefitExclusion: 5000,
      }),
    );
    // A 6,000; B 30,000; C .200; E 1,000; F 5,000.
    expect(lines.line6).toBe(5000);
    expect(lines.line7).toBe(275);
    expect(lines.partIII).toMatchObject({ line8: 24000, line9: 4000, line10: 20000 });
    expect(lines.partIII).toMatchObject({ line16: 10000, line17: 10000, line18: 1000 });
    expect(lines.partIII).toMatchObject({ line19: 10, line20: 100, line27: 100, line28: 375 });
  });

  it("the whole exclusion goes on line 9 without the capital gain election", () => {
    const lines = scheduleG1Lines(inputs({ taxableAmount: 30000, deathBenefitExclusion: 5000 }));
    expect(lines.partIII).toMatchObject({ line8: 30000, line9: 5000, line10: 25000 });
  });

  it("NUA Worksheet: box 6 splits into a capital gain and an ordinary part", () => {
    const nua = inputs({
      capitalGainElection: true,
      includeNua: true,
      taxableAmount: 50000,
      capitalGain: 10000,
      nua: 20000,
    });
    expect(nuaWorksheet(nua)).toEqual({ lineE: 4000, lineF: 16000, lineG: 14000 });
    const lines = scheduleG1Lines(nua);
    expect(lines.line6).toBe(14000);
    expect(lines.partIII?.line8).toBe(56000);
    const ordinaryOnly = scheduleG1Lines({ ...nua, capitalGainElection: false });
    expect(ordinaryOnly.line6).toBe(0);
    expect(ordinaryOnly.partIII?.line8).toBe(70000);
  });

  it("Pub. 1005: a California taxable amount splits by box 3 over box 2a", () => {
    const lines = scheduleG1Lines(
      inputs({
        capitalGainElection: true,
        taxableAmount: 40000,
        capitalGain: 8000,
        californiaTaxableAmount: 36000,
      }),
    );
    expect(lines.line6).toBe(7200);
    expect(lines.partIII?.line8).toBe(28800);
  });

  it("a shared distribution: line 8 grows by box 9a, line 28 takes the share back", () => {
    const lines = scheduleG1Lines(inputs({ taxableAmount: 40000, distributionPercent: 50 }));
    expect(lines.partIII).toMatchObject({ line8: 80000, line12: 80000, line17: 80000 });
    // 87.30 + 3% of 1,890 = 144.00.
    expect(lines.partIII).toMatchObject({ line18: 8000, line19: 144, line20: 1440 });
    expect(lines.partIII).toMatchObject({ line27: 1440, line28: 720 });
  });

  it("line 11 divides box 8 by its percentage", () => {
    const lines = scheduleG1Lines(
      inputs({ taxableAmount: 20000, annuityValue: 3000, annuityPercent: 25 }),
    );
    expect(lines.partIII?.line11).toBe(12000);
  });
});

describe("totals and the two parts", () => {
  const both = inputs({
    capitalGainElection: true,
    taxableAmount: 52000,
    capitalGain: 6000,
    annuityValue: 12000,
  });

  it("each line is its parts (the tuon scenario's amounts)", () => {
    const lines = scheduleG1Lines(both);
    const partIII = lines.partIII!;
    const annuity = partIII.annuity!;
    expect(lines.line7).toBe(330);
    expect(partIII.line10).toBe(partIII.line8 - (partIII.line9 ?? 0));
    expect(partIII.line12).toBe(partIII.line10 + partIII.line11!);
    expect(partIII.line16).toBe(partIII.line13! - partIII.line15!);
    expect(partIII.line17).toBe(partIII.line12 - partIII.line16!);
    expect(partIII.line20).toBe(partIII.line19 * 10);
    expect(annuity.line23).toBe(partIII.line11! - annuity.line22);
    expect(annuity.line26).toBe(annuity.line25 * 10);
    expect(partIII.line27).toBe(partIII.line20 - annuity.line26);
    expect(partIII.line28).toBe(partIII.line27 + lines.line7);
    expect(scheduleG1Tax(lines)).toBe(970);
  });

  it("without Part III, Form 540 line 34 takes line 7", () => {
    const lines = scheduleG1Lines({ ...both, tenYearAveraging: false });
    expect(lines.partIII).toBeUndefined();
    expect(scheduleG1Tax(lines)).toBe(330);
  });

  it("California income loses only the part the schedule taxes", () => {
    expect(amountTaxedOnScheduleG1(both)).toBe(52000);
    expect(amountTaxedOnScheduleG1({ ...both, tenYearAveraging: false })).toBe(6000);
    expect(amountTaxedOnScheduleG1({ ...both, capitalGainElection: false })).toBe(52000);
  });
});
