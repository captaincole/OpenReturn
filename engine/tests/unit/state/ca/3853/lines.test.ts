/*
 * FTB 3853 arithmetic (src/state/ca/3853/lines.ts). Each published example
 * with numbers is a test named by its source; the rest are limit tests.
 */

import { describe, expect, it } from "vitest";
import { roundDollars } from "../../../../../src/money.js";
import {
  affordabilityThreshold,
  annualizedContribution,
  applicableFigure,
  applicableHouseholdIncome,
  bronzeAmountForHousehold,
  federalPovertyLine,
  filingThresholds,
  flatDollarAmount,
  ftb3803ChildMagi,
  isUnaffordable,
  marketplaceAnnualContribution,
  penaltyWithWorksheetA,
  penaltyWithoutWorksheetA,
  percentageIncomeAmount,
  worksheetA,
  type MonthXs,
} from "../../../../../src/state/ca/3853/lines.js";

const year = (month: MonthXs): MonthXs[] => Array.from({ length: 12 }, () => month);

describe("published examples", () => {
  it("Part II Example 1 (Lisa and Jason): Jake's FTB 3803 MAGI and the AGI threshold", () => {
    const jake = ftb3803ChildMagi(0, 1_400);
    expect(jake).toEqual({ magi: 1_400, counted: true });
    const income = applicableHouseholdIncome({
      caAgi: 36_000,
      caTaxExemptInterest: 0,
      membersMagi: [jake.magi],
    });
    expect(income).toBe(37_400);
    expect(filingThresholds("married_filing_jointly", 0, 3)?.agi).toBe(64_419);
    expect(income).toBeLessThan(64_419);
  });

  it("Part II Example 2 (Lisa and Jason): the gross income threshold is 73,595", () => {
    expect(filingThresholds("married_filing_jointly", 0, 3)?.grossIncome).toBe(73_595);
  });

  it("Jackie (example-1): 7.28% of 60,000 is 4,368, and 5,000 is unaffordable", () => {
    const threshold = affordabilityThreshold(60_000, 0);
    expect(roundTo(threshold)).toBe(4_368);
    expect(isUnaffordable(5_000, threshold)).toBe(true);
  });

  it("Sharon and Luke (example-2): 6,552; 4,000 is affordable, 12,000 is not", () => {
    const threshold = affordabilityThreshold(90_000, 0);
    expect(roundTo(threshold)).toBe(6_552);
    expect(isUnaffordable(4_000, threshold)).toBe(false);
    expect(isUnaffordable(12_000, threshold)).toBe(true);
  });

  it("Ethan (example-1-2): 5,000 less 1,700 is more than 2,184", () => {
    const threshold = affordabilityThreshold(30_000, 0);
    expect(roundTo(threshold)).toBe(2_184);
    expect(isUnaffordable(5_000 - 1_700, threshold)).toBe(true);
  });

  it("April (example-2-2): 5,000 is more than 2,257 (31,000 × 0.0728)", () => {
    const threshold = affordabilityThreshold(31_000, 0);
    // The example prints 2,256.80 as whole dollars.
    expect(roundDollars(threshold)).toBe(2_257);
    expect(isUnaffordable(5_000, threshold)).toBe(true);
  });

  it("federal poverty line table: 1 to 8 people, and 11 people adds 3 × 5,380", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(federalPovertyLine)).toEqual([
      15_060, 20_440, 25_820, 31_200, 36_580, 41_960, 47_340, 52_720,
    ]);
    expect(federalPovertyLine(11)).toBe(52_720 + 16_140);
  });

  it("Step 5 question 3: 4,524 / 9,048 / 13,572 / 18,096 / 22,620, five or more the same", () => {
    expect([1, 2, 3, 4, 5, 6].map(bronzeAmountForHousehold)).toEqual([
      4_524, 9_048, 13_572, 18_096, 22_620, 22_620,
    ]);
  });

  it("ftb.ca.gov health care mandate page: 2 adults, 1 child, 200,000 of income", () => {
    const threshold = filingThresholds("married_filing_jointly", 0, 1)?.grossIncome;
    expect(threshold).toBe(61_720);
    const percentage = percentageIncomeAmount(200_000, threshold!);
    expect(percentage).toBe(3_457);
    expect(flatDollarAmount(2, 1)).toBe(2_375);
    expect(penaltyWithoutWorksheetA(2, 1, percentage!).line5).toBe(3_457);
  });
});

describe("Federal Applicable Figure Table", () => {
  it("matches the printed rows at each edge", () => {
    const rows: Array<[number, number]> = [
      [149, 0],
      [150, 0],
      [151, 0.0004],
      [200, 0.02],
      [300, 0.06],
      [301, 0.0603],
      [302, 0.0605],
      [303, 0.0608],
      [351, 0.0728],
      [399, 0.0848],
      [400, 0.085],
      [450, 0.085],
    ];
    for (const [percent, figure] of rows) expect(applicableFigure(percent)).toBeCloseTo(figure, 10);
  });
});

describe("filing thresholds", () => {
  it("single, head of household and qualifying surviving spouse rows", () => {
    expect(filingThresholds("single", 0, 0)).toEqual({ grossIncome: 22_941, agi: 18_353 });
    expect(filingThresholds("head_of_household", 1, 2)).toEqual({
      grossIncome: 51_966,
      agi: 47_378,
    });
    expect(filingThresholds("qualifying_surviving_spouse", 0, 1)).toEqual({
      grossIncome: 38_774,
      agi: 34_186,
    });
    expect(filingThresholds("qualifying_surviving_spouse", 0, 0)).toBeUndefined();
  });

  it("joint rows by the number of spouses 65 or older; two or more dependents share a column", () => {
    expect(filingThresholds("married_filing_jointly", 1, 0)).toEqual({
      grossIncome: 53_537,
      agi: 44_361,
    });
    expect(filingThresholds("married_filing_jointly", 2, 5)).toEqual({
      grossIncome: 82_562,
      agi: 73_386,
    });
  });
});

describe("FTB 3803 child", () => {
  it("counts only when line 4 is more than 1,350; caps line 4 at 2,700", () => {
    expect(ftb3803ChildMagi(100, 1_350)).toEqual({ magi: 1_450, counted: false });
    expect(ftb3803ChildMagi(100, 1_351)).toEqual({ magi: 1_451, counted: true });
    expect(ftb3803ChildMagi(300, 9_000)).toEqual({ magi: 3_000, counted: true });
  });
});

describe("percentage income amount (Step 4)", () => {
  it("is blank at or under the threshold, 2.5% to the nearest dollar above it", () => {
    expect(percentageIncomeAmount(73_595, 73_595)).toBeUndefined();
    expect(percentageIncomeAmount(73_596, 73_595)).toBe(0);
    expect(percentageIncomeAmount(73_615, 73_595)).toBe(1); // 0.50 rounds up
    expect(percentageIncomeAmount(73_614, 73_595)).toBe(0); // 0.475 rounds down
  });
});

describe("flat dollar amount (Step 2)", () => {
  it("is never more than 2,850", () => {
    expect(flatDollarAmount(3, 0)).toBe(2_850);
    expect(flatDollarAmount(2, 1)).toBe(2_375);
    expect(flatDollarAmount(2, 3)).toBe(2_850);
    expect(flatDollarAmount(0, 1)).toBe(475);
  });
});

describe("Worksheets A and B", () => {
  it("a whole uniform year gives the same penalty as Step 2", () => {
    for (const [adults, children, percentage] of [
      [1, 0, 0],
      [2, 1, 3_457],
      [2, 3, 100],
      [1, 0, 50_000],
      [6, 2, 1_000],
    ]) {
      const months = year({ adults, children });
      expect(penaltyWithWorksheetA(months, percentage).line5).toBe(
        penaltyWithoutWorksheetA(adults, children, percentage).line5,
      );
    }
  });

  it("Worksheet A: line 1 caps at 5, line 5 at 2,850, line 7 rounds line 6 / 12", () => {
    const months: MonthXs[] = [
      { adults: 6, children: 0 },
      { adults: 0, children: 1 },
      ...Array.from({ length: 10 }, () => ({ adults: 0, children: 0 })),
    ];
    const sheet = worksheetA(months);
    expect(sheet.line1.slice(0, 2)).toEqual([5, 1]);
    expect(sheet.line5.slice(0, 2)).toEqual([2_850, 475]);
    expect(sheet.line6).toBe(3_325);
    expect(sheet.line7).toBe(277); // 277.08
    expect(sheet.line8).toBe(6);
  });

  it("Worksheet B leaves a month with no X out, and divides by 12", () => {
    const months: MonthXs[] = [
      { adults: 1, children: 0 },
      ...Array.from({ length: 11 }, () => ({ adults: 0, children: 0 })),
    ];
    const sheet = penaltyWithWorksheetA(months, 6_000);
    expect(sheet.line2).toBe(500);
    expect(sheet.line4).toBe(377);
    expect(sheet.line5).toBe(377);
  });

  it("the penalty is never more than the bronze amount, and never less than the flat amount's month share", () => {
    const months = year({ adults: 2, children: 0 });
    const capped = penaltyWithWorksheetA(months, 1_000_000);
    expect(capped.line5).toBe(capped.line4);
    expect(capped.line4).toBe(377 * 24);
    expect(penaltyWithWorksheetA(months, 0).line5).toBe(1_900);
  });
});

describe("affordability", () => {
  it("annualizes a part-year contribution (lines 1 to 4)", () => {
    expect(annualizedContribution(3_000, 6)).toBe(6_000);
    expect(annualizedContribution(5_000, 12)).toBe(5_000);
  });

  it("the threshold adds salary reduction premiums to the household income", () => {
    expect(roundTo(affordabilityThreshold(60_000, 2_000))).toBe(4_513.6);
  });

  it("Marketplace worksheet: under 100% of the poverty line there is no assistance", () => {
    const annual = marketplaceAnnualContribution({
      bronzeMonthlyPremium: 300,
      householdIncome: 10_000,
      nontaxableSocialSecurity: 0,
      householdSize: 1,
      slcspMonthlyPremium: 500,
      marriedFilingSeparately: false,
    });
    expect(annual).toBe(3_600);
  });

  it("Marketplace worksheet: assistance is the silver premium less the income share", () => {
    // 30,120 / 15,060 = 200% → 0.02; 30,120 × 0.02 / 12 = 50.20; 450 − 50.20 = 399.80
    const annual = marketplaceAnnualContribution({
      bronzeMonthlyPremium: 420,
      householdIncome: 30_120,
      nontaxableSocialSecurity: 0,
      householdSize: 1,
      slcspMonthlyPremium: 450,
      marriedFilingSeparately: false,
    });
    expect(annual).toBeCloseTo((420 - 399.8) * 12, 6);
  });

  it("Marketplace worksheet: never below 0, and a married filer filing separately uses line 1", () => {
    const base = {
      bronzeMonthlyPremium: 200,
      householdIncome: 30_120,
      nontaxableSocialSecurity: 0,
      householdSize: 1,
      slcspMonthlyPremium: 900,
      marriedFilingSeparately: false,
    };
    expect(marketplaceAnnualContribution(base)).toBe(0);
    expect(marketplaceAnnualContribution({ ...base, marriedFilingSeparately: true })).toBe(2_400);
  });
});

function roundTo(value: number): number {
  return Number(value.toFixed(2));
}
