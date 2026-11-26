/*
 * Schedule F line 34, the net farm profit or loss, from a farm fact: line 9
 * (income.ts) less line 33 (expenses.ts), then the at-risk rules for a loss.
 * The forms that need it before Schedule F is evaluated (Schedule 1 line 6,
 * Schedule SE line 1a, Form 461, the QBI forms) read it from here.
 */

import type { FarmFactValue } from "../../facts/index.js";
import { sum } from "../../money.js";
import { farmNeedsForm6198, figureFarmForm6198, SCHEDULE_F_LOSS } from "./atRisk.js";
import { depreciationWaits, totalExpenses } from "./expenses.js";
import { grossIncome, grossIncomeWaits, isAccrual } from "./income.js";

/* Line 34 as a result: an amount, waiting for an answer, or a case the engine does not handle. */
export type FarmResult =
  { kind: "amount"; amount: number } | { kind: "waits" } | { kind: "gap"; reason: string };

export const FARM_GAPS = {
  passive:
    "Line E is No: the farm is a passive activity. Its loss needs Form 8582 (irs-1040sf-inst-2025::sec::line-e::b02), and a profit may free prior-year passive losses and is net investment income; the engine does not figure a passive farm.",
  form4562:
    "The farm placed property in service in 2025, elected section 179 or began amortization: line 14 needs Form 4562 (irs-1040sf-inst-2025::sec::line-14::b02), which the engine does not fill for a farm.",
  accrualBasis:
    "Under the accrual method the cost of items bought for resale goes through inventory (line 46), not line 1b; the fact states a line 1b basis.",
  accrualDeferral:
    "The election to postpone crop insurance proceeds needs the cash method (irs-pub-225-2025::sec::use-form-w-4v-see-how-to-get-tax-help-for::b01); the fact defers proceeds under the accrual method.",
  cashInventory:
    "The fact gives an inventory, and inventory lines 45 to 49 are for the accrual method (irs-1040sf-inst-2025::sec::line-c::b01); a cash-method farm has none.",
  election:
    "The fact reports CCC loans under the election (line 5a) and also says no election was made.",
  parts:
    "A part is more than its whole: the not-taxable cooperative distributions, the market gain or cost-share exclusion, the deferred crop insurance or the CRP payments exceed the line they are part of.",
} as const;

const over = (part: number | undefined, whole: number | undefined) => (part ?? 0) > (whole ?? 0);

/* The answers contradict each other, so lines 9 and 34 cannot be figured; undefined when they agree. */
export function farmIncomeGap(farm: FarmFactValue): string | undefined {
  if (isAccrual(farm) && (farm.purchasedItemBasis ?? 0) > 0) return FARM_GAPS.accrualBasis;
  const deferral = (farm.cropInsuranceDeferred ?? 0) > 0 || (farm.cropInsuranceFrom2024 ?? 0) > 0;
  if (isAccrual(farm) && deferral) return FARM_GAPS.accrualDeferral;
  if (farm.accountingMethod === "cash" && farm.inventory !== undefined)
    return FARM_GAPS.cashInventory;
  if (farm.cccLoanElection === false && (farm.cccLoansReported ?? 0) > 0) return FARM_GAPS.election;
  const program = farm.agriculturalProgramPayments;
  if (
    over(farm.cooperativeDistributionsNotTaxable, farm.cooperativeDistributions) ||
    over(sum(farm.marketGain, farm.costShareExclusion), program) ||
    over(farm.cropInsuranceDeferred, farm.cropInsurance) ||
    over(farm.crpPaymentsWhileReceivingSocialSecurity, program)
  ) {
    return FARM_GAPS.parts;
  }
  return undefined;
}

/* Line 14 is a gap: the depreciation needs Form 4562. */
export const depreciationGap = (farm: FarmFactValue) =>
  farm.newDepreciableProperty === true && (farm.expenses?.depreciation ?? 0) > 0
    ? FARM_GAPS.form4562
    : undefined;

/* Lines 33 and 34 cannot be figured. */
export const farmGap = (farm: FarmFactValue) => farmIncomeGap(farm) ?? depreciationGap(farm);

/*
 * Line 9 less line 33, the profit or loss before the at-risk and passive loss
 * rules: Form 6198 line 1 for a farm with box 36b. A blank line counts as 0.
 * Undefined while line 9 or line 14 waits, or for a gap.
 */
export function profitBeforeLossRules(farm: FarmFactValue): number | undefined {
  if (farmGap(farm) || grossIncomeWaits(farm) || depreciationWaits(farm)) return undefined;
  return sum(grossIncome(farm)) - sum(totalExpenses(farm));
}

/* Box 36a or 36b is asked only for a loss (irs-1040sf-inst-2025::sec::line-36::b01). */
export const isLoss = (beforeLossRules: number | undefined) =>
  beforeLossRules !== undefined && beforeLossRules < 0;

/* Form 6198's allowed part of the farm's line 1 loss, or why it is not known. */
function atRiskResult(farm: FarmFactValue, beforeAtRisk: number, key?: string): FarmResult {
  const outcome = figureFarmForm6198(farm, beforeAtRisk, key);
  if (outcome.kind === "waiting") return { kind: "waits" };
  if (outcome.kind === "unsupported") return { kind: "gap", reason: outcome.reason };
  const allowed = outcome.figures.entries.find((entry) => entry.source === SCHEDULE_F_LOSS);
  return allowed?.allowed === undefined
    ? { kind: "waits" }
    : { kind: "amount", amount: allowed.allowed };
}

/*
 * Line 34 (irs-1040sf-inst-2025::sec::line-34::b01, ::line-36::b02, ::b03):
 * - a profit with line E Yes: line 9 less line 33;
 * - a loss with line E Yes and box 36a: "your remaining loss is your loss";
 * - box 36b: the loss Form 6198 allows (atRisk.ts); a profit goes through
 *   Form 6198 too, for the recapture of an amount at risk below zero;
 * - line E No: a passive farm, a gap (FARM_GAPS.passive).
 * The excess business loss limit does not change line 34: Form 461 adds the
 * excess back on Schedule 1 line 8p. Waits for line E, or for box 36 with a loss.
 */
export function netFarmProfit(farm: FarmFactValue, factKey?: string): FarmResult {
  const gap = farmGap(farm);
  if (gap) return { kind: "gap", reason: gap };
  const before = profitBeforeLossRules(farm);
  if (before === undefined || farm.materiallyParticipated === undefined) return { kind: "waits" };
  if (!farm.materiallyParticipated) return { kind: "gap", reason: FARM_GAPS.passive };
  if (farm.allInvestmentAtRisk === false) return atRiskResult(farm, before, factKey);
  if (!isLoss(before) || farm.allInvestmentAtRisk === true)
    return { kind: "amount", amount: before };
  return { kind: "waits" };
}

/* Line 34 as a number, or undefined while it waits or is a gap. */
export function farmNetProfitAmount(farm: FarmFactValue): number | undefined {
  const result = netFarmProfit(farm);
  return result.kind === "amount" ? result.amount : undefined;
}

/*
 * The most the farm can add to AGI, for Form 8960's Who Must File: line 9 less
 * line 33 when known, else every stated income amount above 0 (no expense).
 */
export function farmIncomeUpperBound(farm: FarmFactValue): number {
  const before = profitBeforeLossRules(farm);
  if (before !== undefined) return Math.max(0, before);
  return sum(
    farm.productSales,
    farm.purchasedItemSales,
    farm.cooperativeDistributions,
    farm.agriculturalProgramPayments,
    farm.cccLoansReported,
    farm.cccLoansForfeited,
    farm.cropInsurance,
    farm.cropInsuranceFrom2024,
    farm.customHireIncome,
    Math.max(0, farm.otherIncome ?? 0),
  );
}

/* Line 34 waits on Form 6198's amounts at risk: box 36b with a loss. */
export function farmAtRiskWaits(farm: FarmFactValue): boolean {
  const before = profitBeforeLossRules(farm);
  return (
    farmNeedsForm6198(farm, before) &&
    before !== undefined &&
    figureFarmForm6198(farm, before).kind === "waiting"
  );
}
