/*
 * Schedule F income: Part I (cash method), Part III (accrual method) and line 9.
 * Each line is whole dollars; a line that the form defines as arithmetic on
 * other lines uses their rounded values. A line is undefined when nothing goes
 * on it, or while an answer it needs is missing (incomeWaits says which).
 */

import type { FarmFactValue } from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";

export const isAccrual = (farm: FarmFactValue) => farm.accountingMethod === "accrual";

/* A stated amount in whole dollars. */
const dollars = (amount: number | undefined) => roundDollars(amount);

/* A line that is another line less a part of it; blank when the line is. */
const less = (whole: number | undefined, ...parts: Array<number | undefined>) =>
  whole === undefined ? undefined : roundDollars(whole) - sum(...parts.map(dollars));

/* Line 1c: line 1a less line 1b (irs-pub-225-2025::sec::sales-of-farm-products::b01, the feeder calves). */
export function line1c(farm: FarmFactValue): number | undefined {
  if (farm.purchasedItemSales === undefined && farm.purchasedItemBasis === undefined) {
    return undefined;
  }
  return sum(dollars(farm.purchasedItemSales)) - sum(dollars(farm.purchasedItemBasis));
}

/*
 * Lines 3b and 38b: line 3a less the patronage dividends from buying personal
 * or family items, capital assets or depreciable assets, which go "on line 3a
 * only" (irs-1040sf-inst-2025::sec::lines-3a-and-3b::b01).
 */
export const cooperativeTaxable = (farm: FarmFactValue) =>
  less(farm.cooperativeDistributions, farm.cooperativeDistributionsNotTaxable);

/*
 * Lines 4b and 39b: "report only the taxable amount". The market gain is not
 * taxable when the farmer elected to report CCC loans as income
 * (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b01, ::b02; Pub. 225's Mike Green
 * example, irs-pub-225-2025::sec::market-gain::b03: $1,200 on line 4a, none on
 * line 4b), and cost-sharing payments excluded under section 126 are not
 * either. Undefined while the election is unanswered and a market gain is in.
 */
export function agriculturalTaxable(farm: FarmFactValue): number | undefined {
  if ((farm.marketGain ?? 0) > 0 && farm.cccLoanElection === undefined) return undefined;
  const marketGain = farm.cccLoanElection === true ? farm.marketGain : undefined;
  return less(farm.agriculturalProgramPayments, marketGain, farm.costShareExclusion);
}

/* Lines 5a and 40a: loans received in 2025, reported only under the election (::lines-4a-and-4b::b02). */
export const cccLoansReported = (farm: FarmFactValue) =>
  farm.cccLoanElection === true ? dollars(farm.cccLoansReported) : undefined;

/*
 * Lines 5c and 40c: without the election, the full amount forfeited; with it,
 * "you generally won't have an entry on line 5c. But if the amount forfeited is
 * different from your basis in the commodity, you may have an entry"
 * (::lines-4a-and-4b::b02, ::b03): the amount forfeited less the basis, when
 * the basis is stated and lower. Undefined while the election is unanswered.
 */
export function cccForfeitedTaxable(farm: FarmFactValue): number | undefined {
  const forfeited = dollars(farm.cccLoansForfeited);
  if (forfeited === undefined || farm.cccLoanElection === undefined) return undefined;
  if (farm.cccLoanElection === false) return forfeited;
  const basis = dollars(farm.cccForfeitedCommodityBasis);
  return basis === undefined || forfeited <= basis ? undefined : forfeited - basis;
}

/* Line 6b: the proceeds received in 2025, less those elected into 2026 (::lines-4a-and-4b::b03). */
export const cropInsuranceTaxable = (farm: FarmFactValue) =>
  less(farm.cropInsurance, farm.cropInsuranceDeferred);

/* Line 6c: the election to defer to 2026 is attached when some proceeds are deferred. */
export const defersCropInsurance = (farm: FarmFactValue) => (farm.cropInsuranceDeferred ?? 0) > 0;

/* An answer that the income lines wait on: the CCC loan election, when a line needs it. */
export function incomeWaits(farm: FarmFactValue): boolean {
  const needsElection =
    (farm.marketGain ?? 0) > 0 ||
    (farm.cccLoansForfeited ?? 0) > 0 ||
    (farm.cccLoansReported ?? 0) > 0;
  return needsElection && farm.cccLoanElection === undefined;
}

/* Line 9 for the cash method: lines 1c, 2, 3b, 4b, 5a, 5c, 6b, 6d, 7 and 8. */
function cashGrossIncome(farm: FarmFactValue): number | undefined {
  return sumOrBlank(
    line1c(farm),
    dollars(farm.productSales),
    cooperativeTaxable(farm),
    agriculturalTaxable(farm),
    cccLoansReported(farm),
    cccForfeitedTaxable(farm),
    cropInsuranceTaxable(farm),
    dollars(farm.cropInsuranceFrom2024),
    dollars(farm.customHireIncome),
    dollars(farm.otherIncome),
  );
}

/*
 * Line 37: sales of livestock, produce, grains and other products. Under the
 * accrual method, items bought for resale are sold from inventory, so their
 * sales are here too and their cost is on line 46.
 */
export function accrualSales(farm: FarmFactValue): number | undefined {
  return sumOrBlank(dollars(farm.productSales), dollars(farm.purchasedItemSales));
}

/* Line 44: lines 37, 38b, 39b, 40a, 40c, 41, 42 and 43. */
export function line44(farm: FarmFactValue): number | undefined {
  return sumOrBlank(
    accrualSales(farm),
    cooperativeTaxable(farm),
    agriculturalTaxable(farm),
    cccLoansReported(farm),
    cccForfeitedTaxable(farm),
    dollars(farm.cropInsurance),
    dollars(farm.customHireIncome),
    dollars(farm.otherIncome),
  );
}

/* Line 47: lines 45 and 46. */
export function line47(farm: FarmFactValue): number | undefined {
  const inventory = farm.inventory;
  return inventory === undefined
    ? undefined
    : roundDollars(inventory.beginning) + sum(dollars(inventory.purchases));
}

/*
 * The line 49 footnote: "If you use the unit-livestock-price method or the
 * farm-price method of valuing inventory and the amount on line 48 is larger
 * than the amount on line 47, subtract line 47 from line 48. Enter the result
 * on line 49. Add lines 44 and 49." (the form, Part III).
 */
export function footnoteApplies(farm: FarmFactValue): boolean {
  const inventory = farm.inventory;
  const valued = inventory?.method === "farm_price" || inventory?.method === "unit_livestock_price";
  return valued && inventory !== undefined && roundDollars(inventory.ending) > (line47(farm) ?? 0);
}

/* The line 49 footnote needs the valuation method when the ending inventory is the larger. */
export function inventoryMethodWaits(farm: FarmFactValue): boolean {
  const inventory = farm.inventory;
  return (
    isAccrual(farm) &&
    inventory !== undefined &&
    inventory.method === undefined &&
    roundDollars(inventory.ending) > (line47(farm) ?? 0)
  );
}

/* Line 49: line 47 less line 48, or line 48 less line 47 under the footnote. */
export function line49(farm: FarmFactValue): number | undefined {
  const line47Value = line47(farm);
  if (farm.inventory === undefined || line47Value === undefined) return undefined;
  if (inventoryMethodWaits(farm)) return undefined;
  const ending = roundDollars(farm.inventory.ending);
  return footnoteApplies(farm) ? ending - line47Value : line47Value - ending;
}

/* Line 50: line 44 less line 49, or plus it under the footnote; line 44 with no inventory. */
export function line50(farm: FarmFactValue): number | undefined {
  const line44Value = line44(farm) ?? 0;
  if (farm.inventory === undefined) return line44(farm);
  const line49Value = line49(farm);
  if (line49Value === undefined) return undefined;
  return footnoteApplies(farm) ? line44Value + line49Value : line44Value - line49Value;
}

/* Line 9 waits: the accounting method, the CCC loan election or the inventory method is missing. */
export const grossIncomeWaits = (farm: FarmFactValue) =>
  farm.accountingMethod === undefined || incomeWaits(farm) || inventoryMethodWaits(farm);

/*
 * Line 9, gross income: the cash lines added, or line 50 for the accrual
 * method (the form, line 9). Undefined while an answer the lines need is
 * missing (grossIncomeWaits), and when the farm states no income.
 */
export function grossIncome(farm: FarmFactValue): number | undefined {
  if (grossIncomeWaits(farm)) return undefined;
  if (isAccrual(farm)) return line50(farm);
  return cashGrossIncome(farm);
}
