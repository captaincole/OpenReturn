/*
 * Form 6765's pure arithmetic. The instructions publish no example with
 * numbers (search of 2026-11-27, .scratch evidence), so each test is a rule
 * of the form or its instructions, with its block id, and the limits.
 */

import { describe, expect, it } from "vitest";
import type { ResearchCreditFactValue } from "../../../../src/facts/index.js";
import { deductionReductionOf, researchFiguresOf } from "../../../../src/federal/6765/figures.js";
import {
  carryforwardWorksheet,
  fixedBasePercentage,
  isEligibleSmallBusiness,
  line28Of,
  line34Of,
  line36Of,
  payrollElectionGap,
  percentageText,
  regularCredit,
  simplifiedCredit,
} from "../../../../src/federal/6765/lines.js";
import {
  applicableContractResearch,
  paidByCategory,
  sectionFFromExpenses,
  sectionGOf,
} from "../../../../src/federal/6765/qualifiedExpenses.js";
import { placeReduction } from "../../../../src/federal/6765/reduction.js";

/* The facts-layer gap: a reason the bindings turn into an unsupported result. */
const isGap = (value: unknown) => typeof (value as { gap?: string })?.gap === "string";

const base: ResearchCreditFactValue = {
  businessKey: "business.lab",
  reducedCreditElection: false,
  controlledGroup: false,
  method: "alternative_simplified",
  expenses: { wages: 300_000 },
  businessComponentCount: 2,
  grossReceiptsPriorYears: [1_000_000, 1_000_000, 1_000_000, 1_000_000],
  priorThreeYearsQres: [150_000, 180_000, 210_000],
  acquiredOrDisposed: false,
  newExpenseCategories: false,
};

describe("Form 6765 line 6, the fixed-base percentage (line-6::b02, ::b03)", () => {
  it("an existing company divides its 1984 to 1988 QREs by its gross receipts, rounded to four places", () => {
    const rate = fixedBasePercentage({
      kind: "existing",
      qualifiedResearchExpenses1984To1988: 123_456,
      grossReceipts1984To1988: 4_000_000,
    });
    // 0.030864 → 0.0309.
    expect(rate).toBe(0.0309);
    expect(percentageText(rate as number)).toBe("3.09");
  });

  it("is never more than 16%", () => {
    const rate = fixedBasePercentage({
      kind: "existing",
      qualifiedResearchExpenses1984To1988: 500_000,
      grossReceipts1984To1988: 1_000_000,
    });
    expect(rate).toBe(0.16);
  });

  it("a start-up's first 5 years with QREs take 3%", () => {
    for (const yearWithQres of [1, 3, 5]) {
      expect(fixedBasePercentage({ kind: "start_up", yearWithQres })).toBe(0.03);
    }
  });

  it("the 6th year divides the 4th and 5th years' ratio by 6", () => {
    const rate = fixedBasePercentage({
      kind: "start_up",
      yearWithQres: 6,
      baseYears: [
        { qualifiedResearchExpenses: 90_000, grossReceipts: 1_000_000 },
        { qualifiedResearchExpenses: 150_000, grossReceipts: 1_400_000 },
      ],
    });
    // 240,000 / 2,400,000 = 0.10; / 6 = 0.016667 → 0.0167.
    expect(rate).toBe(0.0167);
  });

  it("the divisors of the 7th to 10th years are 3, 2, 1.5 and 1.2, and the 11th year takes 5 years as they are", () => {
    const years = (count: number) =>
      Array.from({ length: count }, () => ({
        qualifiedResearchExpenses: 60_000,
        grossReceipts: 1_000_000,
      }));
    expect(fixedBasePercentage({ kind: "start_up", yearWithQres: 7, baseYears: years(2) })).toBe(
      0.02,
    );
    expect(fixedBasePercentage({ kind: "start_up", yearWithQres: 8, baseYears: years(3) })).toBe(
      0.03,
    );
    expect(fixedBasePercentage({ kind: "start_up", yearWithQres: 9, baseYears: years(4) })).toBe(
      0.04,
    );
    expect(fixedBasePercentage({ kind: "start_up", yearWithQres: 10, baseYears: years(5) })).toBe(
      0.05,
    );
    expect(fixedBasePercentage({ kind: "start_up", yearWithQres: 14, baseYears: years(5) })).toBe(
      0.06,
    );
  });

  it("a start-up year with the wrong number of base years is a gap", () => {
    const rate = fixedBasePercentage({
      kind: "start_up",
      yearWithQres: 8,
      baseYears: [{ qualifiedResearchExpenses: 1, grossReceipts: 10 }],
    });
    expect(isGap(rate)).toBe(true);
  });
});

describe("Form 6765 Section A, the regular credit", () => {
  const inputs = {
    energyConsortia: 5_000,
    qres: 418_000,
    fixedBase: 0.0384,
    grossReceiptsPriorYears: [1_800_000, 2_000_000, 2_200_000, 2_400_000],
    reduced: false,
  };

  it("follows lines 7 to 13 of the form", () => {
    const lines = regularCredit(inputs);
    expect(lines.line7).toBe(2_100_000);
    expect(lines.line8).toBe(80_640);
    expect(lines.line9).toBe(337_360);
    expect(lines.line10).toBe(209_000);
    expect(lines.line11).toBe(209_000);
    expect(lines.line12).toBe(214_000);
    expect(lines.line13).toBe(42_800);
  });

  it("line 11 takes line 9 when it is the smaller", () => {
    const lines = regularCredit({ ...inputs, fixedBase: 0.16, energyConsortia: undefined });
    // 2,100,000 × 16% = 336,000; 418,000 − 336,000 = 82,000 < 209,000.
    expect(lines.line9).toBe(82_000);
    expect(lines.line11).toBe(82_000);
    expect(lines.line12).toBe(82_000);
  });

  it("line 9 is never below 0", () => {
    const lines = regularCredit({ ...inputs, qres: 50_000, fixedBase: 0.16 });
    expect(lines.line9).toBe(0);
    expect(lines.line11).toBe(0);
  });

  it("the section 280C election takes 15.8% of line 12 (line-13::b01)", () => {
    expect(regularCredit({ ...inputs, reduced: true }).line13).toBe(33_812);
  });
});

describe("Form 6765 Section B, the alternative simplified credit", () => {
  const inputs = {
    energyConsortia: 4_000,
    qres: 787_000,
    priorThreeYearsQres: [250_000, 420_000, 560_000],
    reduced: false,
  };

  it("follows lines 14 to 26 of the form", () => {
    const lines = simplifiedCredit(inputs);
    expect(lines.line18).toBe(4_000);
    expect(lines.line19).toBe(800);
    expect(lines.line21).toBe(1_230_000);
    expect(lines.line22).toBe(205_000);
    expect(lines.line23).toBe(582_000);
    expect(lines.line24).toBe(81_480);
    expect(lines.line25).toBe(82_280);
    expect(lines.line26).toBe(82_280);
  });

  it("the section 280C election takes 79% of line 25 (line-26::b01)", () => {
    expect(simplifiedCredit({ ...inputs, reduced: true }).line26).toBe(65_001);
  });

  it("a prior year with no QREs skips lines 22 and 23, and line 24 is 6% of line 20", () => {
    const lines = simplifiedCredit({ ...inputs, priorThreeYearsQres: [0, 420_000, 560_000] });
    expect(lines.line21).toBe(980_000);
    expect(lines.line22).toBeUndefined();
    expect(lines.line23).toBeUndefined();
    expect(lines.line24).toBe(47_220);
  });

  it("line 23 is never below 0", () => {
    const lines = simplifiedCredit({ ...inputs, qres: 100_000, energyConsortia: undefined });
    expect(lines.line23).toBe(0);
    expect(lines.line24).toBe(0);
    expect(lines.line18).toBeUndefined();
    expect(lines.line25).toBe(0);
  });
});

describe("Form 6765 Sections F and G", () => {
  it("contract research counts 100%, 75% or 65% by who did it (line-45::b01, ::b02)", () => {
    expect(
      applicableContractResearch({
        energyResearch: 8_000,
        researchConsortium: 20_000,
        other: 40_000,
      }),
    ).toBe(49_000);
    expect(applicableContractResearch(undefined)).toBeUndefined();
  });

  it("Section F adds lines 42 to 45; line 46 stays blank and line 47 is line 45", () => {
    const lines = sectionFFromExpenses({
      wages: 640_000,
      supplies: 70_000,
      computerRental: 12_000,
      contractResearch: { other: 100_000 },
    });
    expect(lines).toEqual({
      line42: 640_000,
      line43: 70_000,
      line44: 12_000,
      line45: 65_000,
      line47: 65_000,
      line48: 787_000,
    });
  });

  it("Section G lists the components by QREs, largest first, the aggregate entry last, and totals equal their rows", () => {
    const sectionG = sectionGOf([
      { name: "Aggregate", aggregate: true, directResearchWages: 90_000 },
      { name: "Small", type: "process", directResearchWages: 10_000 },
      {
        name: "Large",
        type: "product",
        directResearchWages: 50_000,
        supplies: 5_000,
        contractResearch: { other: 1_000 },
      },
    ]);
    expect(sectionG.rows.map((row) => row.name)).toEqual([
      "Large",
      "Small",
      "Aggregate Business Components",
    ]);
    expect(sectionG.rows[0]).toMatchObject({
      line53: 50_000,
      line54: 5_000,
      line56: 650,
      type: "Product",
    });
    expect(sectionG.rows[2]?.type).toBeUndefined();
    expect(sectionG.total).toMatchObject({
      line50: 150_000,
      line53: 150_000,
      line54: 5_000,
      line56: 650,
    });
    expect(sectionG.attachments).toBeUndefined();
  });

  it("a 16th component goes on Total from attachments, and Total still adds every row", () => {
    const components = Array.from({ length: 17 }, (_, index) => ({
      name: `C${index}`,
      directResearchWages: 1_000 * (index + 1),
    }));
    const sectionG = sectionGOf(components);
    expect(sectionG.rows).toHaveLength(15);
    // The two smallest, 1,000 and 2,000.
    expect(sectionG.attachments?.line50).toBe(3_000);
    expect(sectionG.total.line50).toBe(153_000);
  });
});

describe("Form 6765 line 28 and the section 280C reduction", () => {
  it("line 28 subtracts line 27 and is never below 0", () => {
    expect(line28Of(42_800, 1_500)).toBe(41_300);
    expect(line28Of(1_000, 1_500)).toBe(0);
    expect(line28Of(1_000, undefined)).toBe(1_000);
  });

  it("without the election the deduction goes down by line 28; with it, by nothing", () => {
    // ASC: 300,000 − 90,000 = 210,000 × 14% = 29,400.
    expect(deductionReductionOf(base)).toBe(29_400);
    expect(deductionReductionOf({ ...base, reducedCreditElection: true })).toBeUndefined();
  });

  it("the reduction comes off wages, then supplies, computer rental and contract labor, each by what was paid", () => {
    const paid = paidByCategory(
      {
        wages: 10_000,
        supplies: 5_000,
        computerRental: 2_000,
        contractResearch: { other: 20_000 },
      },
      undefined,
    );
    const placed = placeReduction(
      { wages: 50_000, supplies: 30_000, rentVehiclesMachinery: 10_000, contractLabor: 40_000 },
      25_000,
      paid,
    );
    expect(placed.expenses).toMatchObject({
      wages: 40_000,
      supplies: 25_000,
      rentVehiclesMachinery: 8_000,
      contractLabor: 32_000,
    });
    expect(placed.left).toBe(0);
  });

  it("a reduction the lines cannot hold leaves a remainder", () => {
    const paid = paidByCategory({ wages: 10_000 }, undefined);
    const placed = placeReduction({ wages: 6_000 }, 8_000, paid);
    expect(placed.expenses.wages).toBe(0);
    expect(placed.left).toBe(2_000);
  });

  it("a controlled group member's credit is a gap (member-of-controlled-group-of::b01)", () => {
    const figures = researchFiguresOf({ ...base, controlledGroup: true });
    expect(isGap(figures.creditGap)).toBe(true);
    expect(isGap(figures.line28)).toBe(true);
    expect(deductionReductionOf({ ...base, controlledGroup: true })).toBeUndefined();
  });

  it("the reduced credit election with no QREs figures no credit (item-a-section-280c-election::b01)", () => {
    const figures = researchFiguresOf({
      ...base,
      expenses: undefined,
      reducedCreditElection: true,
    });
    expect(figures.simplified).toBeUndefined();
    expect(figures.line28).toBeUndefined();
  });
});

describe("Form 6765 Section D, the payroll tax election", () => {
  const election = {
    amount: 600_000,
    grossReceipts: 4_000_000,
    firstYearWithGrossReceipts: 2022,
    priorElections: 0,
  };

  it("line 34 is at most $500,000 (line-34::b01)", () => {
    expect(line34Of(election)).toBe(500_000);
    expect(line34Of({ ...election, amount: 20_000 })).toBe(20_000);
  });

  it("a qualified small business has less than $5 million of gross receipts and none before 2021", () => {
    expect(payrollElectionGap(election)).toBeUndefined();
    expect(payrollElectionGap({ ...election, firstYearWithGrossReceipts: 2021 })).toBeUndefined();
    expect(payrollElectionGap({ ...election, grossReceipts: 5_000_000 })).toBeDefined();
    expect(payrollElectionGap({ ...election, firstYearWithGrossReceipts: 2020 })).toBeDefined();
    expect(payrollElectionGap({ ...election, priorElections: 5 })).toBeDefined();
    expect(payrollElectionGap({ ...election, priorElections: 4 })).toBeUndefined();
  });

  it("the carryforward worksheet subtracts line 38 and the carrybacks, never below 0", () => {
    expect(carryforwardWorksheet({ partIILine36: 65_001, partIILine38: 56_541 })).toBe(8_460);
    expect(
      carryforwardWorksheet({
        partILine6: 3_000,
        partIILine36: 10_000,
        partIILine38: 9_000,
        partILine5: 1_000,
      }),
    ).toBe(3_000);
    expect(carryforwardWorksheet({ partIILine36: 1_000, partIILine38: 4_000 })).toBe(0);
  });

  it("line 36 is the smallest of lines 28, 34 and 35", () => {
    expect(line36Of(65_001, 20_000, 8_460)).toBe(8_460);
    expect(line36Of(15_000, 20_000, 18_000)).toBe(15_000);
    expect(line36Of(65_001, 20_000, 30_000)).toBe(20_000);
  });

  it("an eligible small business averages the last 3 years at $50 million or less", () => {
    expect(isEligibleSmallBusiness([90_000_000, 50_000_000, 50_000_000, 50_000_000])).toBe(true);
    expect(isEligibleSmallBusiness([50_000_000, 50_000_000, 50_000_003])).toBe(false);
  });
});
