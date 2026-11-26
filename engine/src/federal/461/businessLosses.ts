/*
 * The trades or businesses that put a loss on Form 461 Part I, one entry
 * each. The QBI forms read the list (qbi/excessBusinessLoss.ts): with exactly
 * one such business, the excess business loss holds back part of that
 * business's loss, and only the allowed part is QBI
 * (irs-8995-inst-2025::sec::determining-your-qualified-business::b02, ::b03).
 */

import { BUSINESS_LOSS_LIMIT_KEYS, businessesOnReturn, farmsOnReturn } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { filingStatusOf, num, type ResolverInputs } from "../../resolverInputs.js";
import type { Receipt } from "../passThrough/receipts.js";
import { netProfit } from "../schedule-c/lines.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";
import { line21Amount } from "../schedule-e/lines.js";
import { farmLosses } from "../schedule-f/totals.js";
import { k1BusinessLosses, propertyIsBusiness, type RentalAnswer } from "./classify.js";
import type { BusinessLoss } from "./filingInfo.js";

/* Schedule C businesses with a loss on line 31 (Form 461 line 2); undefined while a line 31 waits. */
function scheduleCLosses(inputs: ResolverInputs): BusinessLoss[] | undefined {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const { businesses } = businessesOnReturn(inputs.facts, joint);
  const values = businesses.map((business) => business.value);
  const profits = businesses.map((business) => ({
    key: business.key,
    profit: netProfit(business.value, values),
  }));
  if (profits.some((entry) => entry.profit === undefined)) return undefined;
  return profits
    .filter((entry) => (entry.profit ?? 0) < 0)
    .map((entry) => ({ key: entry.key, loss: roundDollars(0 - (entry.profit ?? 0)) }));
}

/*
 * Part I rentals that are a trade or business and may show a loss (Form 461
 * line 5). Line 22's allowed loss is known only at evaluation, so the loss is
 * left out; a line 21 that is not known yet counts as a possible loss.
 */
function rentalLosses(properties: ReadonlyArray<RentalProperty>): BusinessLoss[] {
  return properties
    .filter((property) => propertyIsBusiness(property) === true)
    .filter((property) => (line21Amount(property.value) ?? -1) < 0)
    .map((property) => ({ key: property.factKey }));
}

/* A stated line 8 loss (::line-8::b01): its business is not named, so it is one more entry. */
function line8Loss(inputs: ResolverInputs): BusinessLoss[] {
  const line8 = roundDollars(num(inputs, BUSINESS_LOSS_LIMIT_KEYS.otherBusinessIncome)) ?? 0;
  return line8 < 0 ? [{ key: BUSINESS_LOSS_LIMIT_KEYS.otherBusinessIncome, loss: 0 - line8 }] : [];
}

/* Farms with a loss on Schedule F line 34 (Form 461 line 6); undefined while a line 34 is not known. */
function scheduleFLosses(inputs: ResolverInputs): BusinessLoss[] | undefined {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  return farmLosses(farmsOnReturn(inputs.facts, joint).farms);
}

/* Every business loss on Form 461 lines 2, 5, 6 and 8; undefined while one is not known. */
export function businessLossesOnReturn(
  inputs: ResolverInputs,
  properties: ReadonlyArray<RentalProperty>,
  k1Receipts: ReadonlyArray<Receipt>,
  rentalAnswer: RentalAnswer,
): BusinessLoss[] | undefined {
  const scheduleC = scheduleCLosses(inputs);
  const scheduleF = scheduleFLosses(inputs);
  const k1s = k1BusinessLosses(k1Receipts, rentalAnswer);
  if (scheduleC === undefined || scheduleF === undefined || k1s === undefined) return undefined;
  return [...scheduleC, ...scheduleF, ...rentalLosses(properties), ...k1s, ...line8Loss(inputs)];
}
