/*
 * Line 5b: "Enter the amount of gains (as a negative number) and losses (as a
 * positive number) included on line 5a that are excluded from NII", such as
 * "Gain or loss from the sale of property held in a non-section 1411 trade or
 * business" (irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b01).
 * The Lines 5a–5d Worksheet enters each such business's net gain on line 2(a)
 * and net loss on line 2(b) (::b05), and line 2(j), the sum of lines 2(a) to
 * 2(i), goes on line 5b (::b07). Line 5a holds the whole Form 4797 amount of a
 * sale (Form 1040 line 7a and Schedule 1 line 4), so a business's line 2 amount
 * is the total of its properties (4797/activities.ts).
 *
 * A Schedule C business with line G "Yes" is a nonpassive section 162 trade or
 * business, as on line 4b (line-4b-adjustment-for-net-income-or-loss::b01), so
 * its sales come out. A passive business's, a rental's and a sale with no
 * business's gain stays in NII. A rental that line 4b takes out as a
 * nonpassive trade or business is a gap: its sale is not modeled. Line 2(d)
 * takes a Form 6252 business sale's gain (form6252Line5b). Lines 2(c), 2(e) and
 * 2(g) have no facts. Lines 2(h) and 2(i) adjust a capital loss carryforward;
 * 2(h) is last year's line 2(i), which no fact gives, so a capital loss carried
 * in from 2024 makes the line a gap.
 */

import type { FormAccessor } from "../../defineForm.js";
import { sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form4797Activities } from "../4797/activities.js";
import type { SaleForm } from "../6252/sale.js";
import { saleIncome } from "../6252/totals.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";
import type { Form8960FilingInfo } from "./filingInfo.js";
import { section162Nonpassive } from "./lines.js";
import { pficLine5b } from "./pficLines.js";
import type { Form8960 } from "./types.js";

const CARRYOVER_GAP =
  "A capital loss was carried into 2025, and Lines 5a–5d Worksheet line 2(h) needs last year's line 2(i) (irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b06), which no fact gives.";

const rentalGap = (property: RentalProperty) =>
  `${property.value.address?.street ?? property.factKey}: a rental that is a nonpassive trade or business sold property; taking its gain out on line 5b is not modeled.`;

/* A rental with a sale that line 4b treats as a nonpassive trade or business: the gap, or undefined while its answer waits. */
function rentalSaleGap(
  activities: Form4797Activities,
  rentals: RentalProperty[],
): Unsupported | "waiting" | undefined {
  for (const property of rentals) {
    if (!activities.amounts.some((each) => each.key === property.factKey)) continue;
    const nonpassive = section162Nonpassive(property);
    if (nonpassive === undefined) return "waiting";
    if (nonpassive) return unsupported(rentalGap(property));
  }
  return undefined;
}

/* The Form 4797 part of line 5b, or "waiting" while a sale's business or rental answer is missing. */
export function form4797Line5b(
  info: Form8960FilingInfo,
): number | Unsupported | "waiting" | undefined {
  const activities = info.form4797Activities;
  if (activities === undefined) return undefined;
  if (activities.waiting) return "waiting";
  const rental = rentalSaleGap(activities, info.rentalProperties ?? []);
  if (rental !== undefined) return rental;
  const nonpassive = info.nonpassiveBusinessKeys ?? [];
  const excluded = activities.amounts.filter((each) => nonpassive.includes(each.key));
  const unread = activities.amounts.length === 0 && nonpassive.length > 0;
  if (excluded.length === 0 && !(unread && activities.totalGap)) return undefined;
  if (activities.totalGap) return unsupported(`Form 4797: ${activities.totalGap}`);
  if (info.capitalLossCarriedIn) return unsupported(CARRYOVER_GAP);
  return 0 - sum(...excluded.map((each) => each.total));
}

/* A Form 6252 sale whose gain goes to Form 4797 (line 4 or 10): property used in a trade or business, or another noncapital asset. */
const isBusinessInstallmentSale = (form: SaleForm): boolean => form.sale.use !== "capital_asset";

/* The fact keys of the business sales whose line 2(d) answer is missing: Form 8960 asks for each while it files. */
export function installmentSalesWithoutTradeOrBusinessAnswer(forms: SaleForm[]): string[] {
  return forms
    .filter(
      (each) =>
        isBusinessInstallmentSale(each) && each.sale.nonSection1411TradeOrBusiness === undefined,
    )
    .map((each) => each.key);
}

/*
 * Worksheet line 2(d): "Gains recognized in the current year for payments
 * received on an installment sale obligation or private annuity for the
 * disposition of property used in a non-section 1411 trade or business" (::b06),
 * as a negative: the sale's whole income this year, line 24 (and line 35),
 * recapture included, since Form 4797 sends all of it to line 5a. The sale's
 * fact answers whether its property was used in one
 * (nonSection1411TradeOrBusiness); the line waits while a business sale's answer
 * is missing. A capital asset's gain (Schedule D) stays in NII. A capital loss
 * carried in is the same gap as the Form 4797 part's (worksheet line 2(h)).
 */
export function form6252Line5b(
  info: Form8960FilingInfo,
): number | Unsupported | "waiting" | undefined {
  const forms = info.form6252Totals?.forms ?? [];
  if (installmentSalesWithoutTradeOrBusinessAnswer(forms).length > 0) return "waiting";
  const incomes = forms
    .filter((each) => isBusinessInstallmentSale(each))
    .filter((each) => each.sale.nonSection1411TradeOrBusiness === true)
    .map(saleIncome);
  const amounts: number[] = [];
  for (const income of incomes) {
    if (typeof income === "object") return unsupported(`Form 6252: ${income.reason}`);
    if (income === undefined) return "waiting";
    amounts.push(income);
  }
  const total = sum(...amounts);
  if (total === 0) return undefined;
  if (info.capitalLossCarriedIn) return unsupported(CARRYOVER_GAP);
  return 0 - total;
}

/* Line 5b, and line 5d with it, waits while a Form 4797 sale's activity or a Form 6252 sale's answer is missing. */
export function line5bWaits(info: Form8960FilingInfo): boolean {
  return info.form4797Activities?.waiting === true || form6252Line5b(info) === "waiting";
}

/*
 * The line: the Form 4797 part (worksheet lines 2(a) and 2(b)), the Form 6252
 * part (line 2(d)) and, with a fund fact, a QEF's line 7c (worksheet line 2(f),
 * pficLines.ts). Any part's gap makes the line a gap, the fund's first; the line
 * waits while Form 4797 or Form 6252 waits. With no fund fact the line is the
 * two sale parts.
 */
export function line5b(
  form: FormAccessor<Form8960>,
  info: Form8960FilingInfo,
): number | Unsupported | undefined {
  const form4797 = form4797Line5b(info);
  const form6252 = form6252Line5b(info);
  if (form4797 === "waiting" || form6252 === "waiting") return undefined;
  const sales =
    typeof form4797 === "object"
      ? form4797
      : typeof form6252 === "object"
        ? form6252
        : sumOrBlank(form4797, form6252);
  if (info.form8621Totals === undefined) return sales;
  const pfic = pficLine5b(form, info, info.form8621Totals);
  if (typeof pfic === "object") return pfic;
  if (typeof sales === "object") return sales;
  return sumOrBlank(sales, pfic);
}
