/*
 * An upper bound on Form 6252's income this year, for Form 8960's Who Must File
 * (8960/mustFile.ts). Line 24 is at most line 22 (the gross profit percentage is
 * at most 1), and line 22 is at most this year's payments plus line 20 (at most
 * the debt the buyer assumed, line 6). Line 35 is at most the related party's
 * amount realized (line 30). So the sum of the three never misses the income.
 */

import { readInstallmentSaleFacts } from "../../facts/index.js";
import { sum } from "../../money.js";

type FactRow = { key: string; value: unknown; category: string };

export function form6252IncomeUpperBound(facts: ReadonlyArray<FactRow>): number {
  return sum(
    ...readInstallmentSaleFacts(facts).sales.map(({ value }) =>
      sum(
        value.paymentsThisYear,
        value.liabilitiesAssumed,
        value.relatedParty?.secondDisposition?.amountRealized,
      ),
    ),
  );
}

/*
 * An installment sale's gain is a gain from the disposition of property:
 * investment income for Form 8960 line 5a, unless worksheet line 2(d) takes it
 * out (a business sale's property used in a non-section 1411 trade or business,
 * 8960/line5b.ts).
 */
export function hasInvestmentInstallmentSale(facts: ReadonlyArray<FactRow>): boolean {
  return readInstallmentSaleFacts(facts).sales.some(
    ({ value }) => value.use === "capital_asset" || value.nonSection1411TradeOrBusiness !== true,
  );
}
