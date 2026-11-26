/*
 * Schedule F arithmetic, pure: the published examples by their source, then
 * limit tests that need no source (a total equals its parts, each edge).
 */

import { describe, expect, it } from "vitest";
import type { FarmFactValue } from "../../../../src/facts/index.js";
import {
  carAndTruckExpenses,
  conservationCarriedForward,
  conservationDeduction,
  employeeBenefits,
  laborHired,
  otherExpenseRow,
  otherExpensesOverflow,
  totalExpenses,
} from "../../../../src/federal/schedule-f/expenses.js";
import {
  accrualSales,
  agriculturalTaxable,
  cccForfeitedTaxable,
  cccLoansReported,
  cooperativeTaxable,
  cropInsuranceTaxable,
  defersCropInsurance,
  grossIncome,
  line1c,
  line44,
  line47,
  line49,
  line50,
} from "../../../../src/federal/schedule-f/income.js";
import {
  FARM_GAPS,
  farmIncomeGap,
  netFarmProfit,
  profitBeforeLossRules,
} from "../../../../src/federal/schedule-f/lines.js";

const cash = (fields: Partial<FarmFactValue> = {}): FarmFactValue => ({
  activity: "Beef cattle",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: false,
  ...fields,
});

const accrual = (fields: Partial<FarmFactValue> = {}) =>
  cash({ accountingMethod: "accrual", ...fields });

describe("Pub. 225 examples", () => {
  it("feeder calves: 1a 25,000, 1b 20,000, 1c 5,000 (sales-of-farm-products::b01)", () => {
    const farm = cash({ purchasedItemSales: 25000, purchasedItemBasis: 20000 });
    expect(line1c(farm)).toBe(5000);
    expect(grossIncome(farm)).toBe(5000);
  });

  it("Mike Green, included MAL: market gain on 4a, not on 4b (market-gain::b03)", () => {
    const farm = cash({
      agriculturalProgramPayments: 1200,
      marketGain: 1200,
      cccLoanElection: true,
    });
    expect(agriculturalTaxable(farm)).toBe(0);
    // The gain from the sale: $5,200 less the $4,000 basis (the published "$5,000" is a misprint).
    expect(line1c(cash({ purchasedItemSales: 5200, purchasedItemBasis: 4000 }))).toBe(1200);
  });

  it("Mike Green, excluded MAL: the market gain is income (excluded-mal-as-in-example-1-mike::b01)", () => {
    const farm = cash({
      agriculturalProgramPayments: 1200,
      marketGain: 1200,
      cccLoanElection: false,
    });
    expect(agriculturalTaxable(farm)).toBe(1200);
  });

  it("25% limit: $85,000 plus $15,000 of breeding livestock gains gives $25,000 (assessment-for-depreciable::b08)", () => {
    const farm = cash({
      productSales: 85000,
      conservation: { expenses: 30000, livestockGains: 15000 },
    });
    expect(conservationDeduction(farm)).toBe(25000);
    expect(conservationCarriedForward(farm)).toBe(5000);
  });

  it("carryover: $32,000 of gross income, $10,000 of expenses: $8,000 now, $2,000 later (::b08, ::b09)", () => {
    const farm = cash({ productSales: 32000, conservation: { expenses: 10000 } });
    expect(conservationDeduction(farm)).toBe(8000);
    expect(conservationCarriedForward(farm)).toBe(2000);
  });

  it("crop insurance deferred to 2026: all on 6a, none on 6b, box 6c (use-form-w-4v...::b02)", () => {
    const farm = cash({ cropInsurance: 18000, cropInsuranceDeferred: 18000 });
    expect(cropInsuranceTaxable(farm)).toBe(0);
    expect(defersCropInsurance(farm)).toBe(true);
  });

  it("standard mileage: 70 cents a mile plus parking and tolls (line-10::b01)", () => {
    const farm = cash({
      vehicles: [{ businessMiles: 4000, standardMileageRate: true, parkingAndTolls: 35.5 }],
    });
    expect(carAndTruckExpenses(farm)).toBe(2836);
  });
});

describe("income lines", () => {
  it("3b leaves out patronage dividends on personal or capital purchases", () => {
    const farm = cash({ cooperativeDistributions: 2400, cooperativeDistributionsNotTaxable: 400 });
    expect(cooperativeTaxable(farm)).toBe(2000);
  });

  it("4b waits for the CCC election when a market gain is in 4a", () => {
    expect(
      agriculturalTaxable(cash({ agriculturalProgramPayments: 900, marketGain: 300 })),
    ).toBeUndefined();
    expect(
      grossIncome(cash({ agriculturalProgramPayments: 900, marketGain: 300 })),
    ).toBeUndefined();
  });

  it("4b leaves out excluded cost-sharing payments", () => {
    expect(
      agriculturalTaxable(cash({ agriculturalProgramPayments: 5000, costShareExclusion: 1500 })),
    ).toBe(3500);
  });

  it("5a only under the election; 5c the forfeited amount without it", () => {
    expect(cccLoansReported(cash({ cccLoanElection: true, cccLoansReported: 7000 }))).toBe(7000);
    expect(cccLoansReported(cash({ cccLoanElection: false }))).toBeUndefined();
    expect(cccForfeitedTaxable(cash({ cccLoanElection: false, cccLoansForfeited: 6000 }))).toBe(
      6000,
    );
  });

  it("5c under the election: none, unless the basis is lower than the amount forfeited", () => {
    expect(
      cccForfeitedTaxable(cash({ cccLoanElection: true, cccLoansForfeited: 6000 })),
    ).toBeUndefined();
    expect(
      cccForfeitedTaxable(
        cash({ cccLoanElection: true, cccLoansForfeited: 6000, cccForfeitedCommodityBasis: 5200 }),
      ),
    ).toBe(800);
  });

  it("line 9 adds every right-column line, a hedging loss on line 8 included", () => {
    const farm = cash({
      purchasedItemSales: 3000,
      purchasedItemBasis: 2000,
      productSales: 50000,
      cooperativeDistributions: 1000,
      agriculturalProgramPayments: 2000,
      cccLoanElection: true,
      cccLoansReported: 4000,
      cropInsurance: 3000,
      cropInsuranceFrom2024: 500,
      customHireIncome: 1500,
      otherIncome: -700,
    });
    expect(grossIncome(farm)).toBe(1000 + 50000 + 1000 + 2000 + 4000 + 3000 + 500 + 1500 - 700);
  });

  it("rounds each line before adding (nearest dollar)", () => {
    expect(grossIncome(cash({ productSales: 100.5, customHireIncome: 100.49 }))).toBe(201);
  });

  it("line 9 waits for the accounting method", () => {
    expect(grossIncome(cash({ accountingMethod: undefined, productSales: 100 }))).toBeUndefined();
  });
});

describe("Part III, accrual", () => {
  const farm = accrual({
    productSales: 90000,
    purchasedItemSales: 10000,
    cooperativeDistributions: 500,
    cropInsurance: 2000,
    inventory: { beginning: 30000, purchases: 12000, ending: 25000, method: "cost" },
  });

  it("44 adds 37 to 43; 47 is 45 + 46; 49 is 47 − 48; 50 is 44 − 49 and line 9", () => {
    expect(accrualSales(farm)).toBe(100000);
    expect(line44(farm)).toBe(102500);
    expect(line47(farm)).toBe(42000);
    expect(line49(farm)).toBe(17000);
    expect(line50(farm)).toBe(85500);
    expect(grossIncome(farm)).toBe(85500);
  });

  it("the footnote: unit-livestock-price with line 48 over 47 adds the difference", () => {
    const grown = accrual({
      productSales: 40000,
      inventory: { beginning: 20000, ending: 26000, method: "unit_livestock_price" },
    });
    expect(line49(grown)).toBe(6000);
    expect(line50(grown)).toBe(46000);
  });

  it("the same increase at cost: line 49 is negative, line 50 the same total", () => {
    const grown = accrual({
      productSales: 40000,
      inventory: { beginning: 20000, ending: 26000, method: "cost" },
    });
    expect(line49(grown)).toBe(-6000);
    expect(line50(grown)).toBe(46000);
  });

  it("waits for the valuation method when line 48 is larger", () => {
    const grown = accrual({ productSales: 40000, inventory: { beginning: 20000, ending: 26000 } });
    expect(line49(grown)).toBeUndefined();
    expect(grossIncome(grown)).toBeUndefined();
  });

  it("no inventory: line 50 is line 44", () => {
    expect(line50(accrual({ productSales: 5000 }))).toBe(5000);
  });
});

describe("expenses", () => {
  it("15 and 22 take off the credits, never below 0", () => {
    const farm = cash({
      expenses: { employeeBenefitPrograms: 3000, laborHired: 40000 },
      smallEmployerHealthCredit: 800,
      employmentCredits: 2400,
    });
    expect(employeeBenefits(farm)).toBe(2200);
    expect(laborHired(farm)).toBe(37600);
    expect(laborHired(cash({ expenses: { laborHired: 100 }, employmentCredits: 500 }))).toBe(0);
  });

  it("33 equals its parts; 32f is the 263A capitalization, negative", () => {
    const farm = cash({
      productSales: 100000,
      expenses: { feed: 10000, seedsAndPlants: 2000, depreciation: 3000 },
      newDepreciableProperty: false,
      otherExpenses: [{ description: "Advertising", amount: 400 }],
      section263ACapitalized: 1500,
      conservation: { expenses: 1000 },
    });
    expect(otherExpenseRow(farm, 1)).toEqual({ description: "Advertising", amount: 400 });
    expect(otherExpenseRow(farm, 6)).toEqual({ description: "263A", amount: -1500 });
    expect(otherExpenseRow(farm, 2)).toBeUndefined();
    expect(totalExpenses(farm)).toBe(10000 + 2000 + 3000 + 400 - 1500 + 1000);
  });

  it("rows that do not fit 32a to 32f overflow; five fit next to a 263A row", () => {
    const rows = (count: number) =>
      Array.from({ length: count }, (_, index) => ({ description: `Item ${index}`, amount: 10 }));
    expect(otherExpensesOverflow(cash({ otherExpenses: rows(6) }))).toBe(false);
    expect(otherExpensesOverflow(cash({ otherExpenses: rows(7) }))).toBe(true);
    expect(otherExpensesOverflow(cash({ otherExpenses: rows(5), section263ACapitalized: 1 }))).toBe(
      false,
    );
    expect(otherExpensesOverflow(cash({ otherExpenses: rows(6), section263ACapitalized: 1 }))).toBe(
      true,
    );
  });

  it("the conservation limit is never below 0 (a loss on line 9)", () => {
    const farm = cash({
      purchasedItemSales: 1000,
      purchasedItemBasis: 3000,
      conservation: { expenses: 500 },
    });
    expect(conservationDeduction(farm)).toBe(0);
  });
});

describe("line 34", () => {
  const loss = (fields: Partial<FarmFactValue>) =>
    cash({ productSales: 20000, expenses: { feed: 30000 }, ...fields });

  it("a profit is line 9 less line 33", () => {
    const farm = cash({ productSales: 20000, expenses: { feed: 5000 } });
    expect(netFarmProfit(farm)).toEqual({ kind: "amount", amount: 15000 });
  });

  it("a loss with box 36a is the loss", () => {
    expect(netFarmProfit(loss({ allInvestmentAtRisk: true }))).toEqual({
      kind: "amount",
      amount: -10000,
    });
  });

  it("a loss waits for box 36", () => {
    expect(netFarmProfit(loss({}))).toEqual({ kind: "waits" });
  });

  it("box 36b with no amounts at risk waits on Form 6198", () => {
    expect(netFarmProfit(loss({ allInvestmentAtRisk: false }))).toEqual({ kind: "waits" });
  });

  it("box 36b: Form 6198 allows the loss up to the amount at risk", () => {
    const farm = loss({
      allInvestmentAtRisk: false,
      atRisk: { simplified: { adjustedBasisAtStart: 4000 } },
    });
    expect(profitBeforeLossRules(farm)).toBe(-10000);
    expect(netFarmProfit(farm)).toEqual({ kind: "amount", amount: -4000 });
  });

  it("line E No is a passive farm: a gap", () => {
    expect(netFarmProfit(cash({ materiallyParticipated: false, productSales: 100 }))).toEqual({
      kind: "gap",
      reason: FARM_GAPS.passive,
    });
  });

  it("line 14 with 2025 property needs Form 4562: a gap", () => {
    const farm = cash({
      productSales: 100,
      expenses: { depreciation: 50 },
      newDepreciableProperty: true,
    });
    expect(netFarmProfit(farm)).toEqual({ kind: "gap", reason: FARM_GAPS.form4562 });
  });

  it("contradicting answers are a gap", () => {
    expect(farmIncomeGap(accrual({ purchasedItemBasis: 10 }))).toBe(FARM_GAPS.accrualBasis);
    expect(farmIncomeGap(accrual({ cropInsurance: 10, cropInsuranceDeferred: 10 }))).toBe(
      FARM_GAPS.accrualDeferral,
    );
    expect(farmIncomeGap(cash({ inventory: { beginning: 1, ending: 1 } }))).toBe(
      FARM_GAPS.cashInventory,
    );
    expect(farmIncomeGap(cash({ cccLoanElection: false, cccLoansReported: 1 }))).toBe(
      FARM_GAPS.election,
    );
    expect(
      farmIncomeGap(cash({ cooperativeDistributions: 1, cooperativeDistributionsNotTaxable: 2 })),
    ).toBe(FARM_GAPS.parts);
  });
});
