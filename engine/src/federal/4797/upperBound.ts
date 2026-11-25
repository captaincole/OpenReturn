/*
 * What Form 4797 adds to AGI, at most, from the sale facts alone: for Form
 * 8960's Who Must File (8960/mustFile.ts magiUpperBound). Lines 7 to 18b move
 * the amounts of lines 2, 10 and 24 between capital and ordinary income, but
 * keep their sum, so the bound is every sale's price plus depreciation less its
 * cost and expense of sale, at least 0. A sale with no price of its own takes
 * box 2 of the Form 1099-S it names, which overstates a form two sales share.
 */

import {
  getForm1099SFacts,
  readBusinessPropertySaleFacts,
  type BusinessPropertySaleFactValue,
} from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";

type FactRow = { key: string; value: unknown; category: string };

export function form4797GainUpperBound(facts: ReadonlyArray<FactRow>): number {
  const forms = getForm1099SFacts(facts);
  const gainOf = (sale: BusinessPropertySaleFactValue) =>
    sum(
      sale.grossSalesPrice ?? forms.get(sale.form1099SKey ?? "")?.box2,
      sale.depreciationAllowed,
      0 - sale.costOrOtherBasis,
      0 - (sale.expenseOfSale ?? 0),
    );
  const sales = readBusinessPropertySaleFacts(facts).sales;
  return atLeast(0, sum(...sales.map((sale) => gainOf(sale.value))));
}
