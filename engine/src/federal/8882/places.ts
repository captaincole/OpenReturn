/*
 * Where an expenditure's part of Form 8882 line 7 comes off: the 2025 asset
 * that the property's cost is in (Form 4562 column (c): "subtract any credits
 * and deductions allocable to the property ... Credit for employer-provided
 * childcare facilities and services", irs-4562-inst-2025::sec::section-b::b08,
 * ::b09), or the Schedule C expense that deducts it. Each check says why the
 * engine cannot take the part off; undefined when it can.
 */

import type { BusinessFactValue } from "../../facts/kinds/business.js";
import type {
  ChildcareDeductionLine,
  ChildcareExpenditureFactValue,
} from "../../facts/kinds/childcareCredit.js";
import { roundDollars } from "../../money.js";

interface Placed {
  key: string;
  value: ChildcareExpenditureFactValue;
  business: BusinessFactValue;
}

const FULL_BUSINESS_USE = 100;

/* One name for each place, so the parts that come off the same place add up first. */
export function placeOf({ key, value }: Placed): string {
  if (value.notPlacedInService === true) return `${value.businessKey}|not placed|${key}`;
  if (value.asset !== undefined) return `${value.businessKey}|asset|${value.asset}`;
  if (value.otherExpense !== undefined) return `${value.businessKey}|other|${value.otherExpense}`;
  return `${value.businessKey}|line|${value.deductedOn}`;
}

/*
 * The facility property's asset: one 2025 asset of the business's
 * depreciation with that description, wholly business use, with no section
 * 179 election (the order of the two reductions is not in the instructions),
 * and a cost at least the credit taken off it. Property not placed in service
 * in 2025 has nothing to lower this year.
 */
export function assetGap(placed: Placed, total: number): string | undefined {
  const { key, value, business } = placed;
  if (value.notPlacedInService === true) return undefined;
  const matches = (business.depreciation?.assets ?? []).filter(
    (each) => each.description === value.asset,
  );
  if (matches.length !== 1) {
    return `The childcare facility property ${key} names the asset "${value.asset}", which is not exactly one asset placed in service in 2025 in the depreciation of ${value.businessKey}: its basis must be reduced by the credit (irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01).`;
  }
  const [asset] = matches;
  if ((asset.businessUsePercent ?? FULL_BUSINESS_USE) !== FULL_BUSINESS_USE) {
    return `The childcare facility asset "${value.asset}" is not wholly business use, and the engine takes the credit off the basis only of an asset used wholly in the business.`;
  }
  if ((asset.section179Elected ?? 0) > 0) {
    return `The childcare facility asset "${value.asset}" has a section 179 election, and the instructions do not say whether the credit lowers the basis before or after the section 179 deduction.`;
  }
  if (total > roundDollars(asset.cost)) {
    return `The credit allocable to the childcare facility asset "${value.asset}" ($${total}) is more than its cost.`;
  }
  return undefined;
}

/*
 * A deductible expenditure's Schedule C expense: a line that holds at least
 * the credit taken off it, after the credits Forms 5884 and 8846 take off the
 * same line, or one Part V expense with that description.
 */
export function deductionGap(
  placed: Placed,
  total: number,
  taken: (businessKey: string, line: string) => number,
): string | undefined {
  const { value, business } = placed;
  if (value.otherExpense !== undefined) {
    const entries = (business.otherExpenses ?? []).filter(
      (each) => each.description === value.otherExpense,
    );
    if (entries.length !== 1) {
      return `The childcare expenditure ${placed.key} names the other expense "${value.otherExpense}", which is not exactly one Part V expense of ${value.businessKey}.`;
    }
    if (total > roundDollars(entries[0].amount)) {
      return `The credit allocable to the other expense "${value.otherExpense}" ($${total}) is more than the expense.`;
    }
    return undefined;
  }
  const line = value.deductedOn as ChildcareDeductionLine;
  const left = (business.expenses?.[line] ?? 0) - taken(value.businessKey, line);
  if (total > roundDollars(left)) {
    return `The credit allocable to the ${line} of ${value.businessKey} ($${total}) is more than the amount the business deducts there ($${roundDollars(left)}), which holds the expenditures the credit reduces (irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01).`;
  }
  return undefined;
}
