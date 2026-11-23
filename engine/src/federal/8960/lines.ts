import type { FormAccessor } from "../../defineForm.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { ItemType } from "../passThrough/itemTypes.js";
import type { Receipt } from "../passThrough/receipts.js";
import { selfRentalState } from "../rentals/passive.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";
import type { Form8960 } from "./types.js";

/* irs-8960-inst-2025::sec::application-to-individuals::b01: line 14 and Who Must File. Not indexed. */
export const NIIT_THRESHOLDS: Record<string, number> = {
  single: 200000,
  head_of_household: 200000,
  married_filing_jointly: 250000,
  qualifying_surviving_spouse: 250000,
  married_filing_separately: 125000,
};

const GUARANTEED_PAYMENTS: ReadonlyArray<ItemType> = [
  "guaranteed_payment_services",
  "guaranteed_payment_capital",
  "guaranteed_payments_total",
];

/* Line 12: the form says "If zero or less, enter -0-". */
export const netInvestmentIncome = (
  line8: number | undefined,
  line11: number | undefined,
): number => atLeast(0, sum(line8, line11 === undefined ? 0 : -line11));

/*
 * Line 4b (irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01,
 * ::b02): a rental that is not passive (a real estate professional who materially
 * participated) or a nonpassive royalty. Undefined while an answer is missing.
 */
function nonpassive(property: RentalProperty): boolean | undefined {
  if (property.value.propertyType !== "royalties") {
    return property.passive === undefined ? undefined : !property.passive;
  }
  const activity = property.value.royaltyActivity;
  return activity === undefined ? undefined : activity === "nonpassive";
}

/*
 * The property also rises to a section 162 trade or business (b01, b02), for a rental
 * and a royalty alike. Not the QBI answer: Rev. Proc. 2019-38's safe harbor is section 199A only.
 */
function section162Nonpassive(property: RentalProperty): boolean | undefined {
  const isNonpassive = nonpassive(property);
  if (isNonpassive !== true) return isNonpassive;
  return property.value.tradeOrBusiness;
}

/*
 * Line 4b for a K-1 (irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01):
 * "Net income or loss from a section 162 trade or business that's not a passive
 * activity", which line 4a took in through Schedule 1 line 5
 * (::line-4a-income-from-trades-businesses::b01, ::b02). These are the K-1
 * items the routes put on Schedule E Part II columns (i) and (k): nonpassive
 * trade or business income or loss, this year's and a carried loss allowed now,
 * of an owner who materially participated (the passive answer). Income is a
 * negative adjustment, a loss a positive one. Each row is rounded as Part II
 * prints it: one for the K-1's own amounts, one for its "PYA" row. Passive K-1
 * income (column (h), a trust's Part III column (d)) stays in NII. Undefined
 * while a K-1 waits; the gap when one is unsupported. No fact marks an entity
 * whose business is trading financial instruments (QUESTIONS.md). Only the
 * box 1 business counts: a partnership's rentals are passive (column (h) or
 * (g)) and stay in NII. A partner's guaranteed payments are a gap: the corpus
 * has no rule on them for line 4b (QUESTIONS.md item 31).
 */
export function nonpassiveK1Adjustments(
  receipt: Receipt | undefined,
): number[] | Unsupported | undefined {
  if (receipt === undefined) return [];
  if (receipt.kind === "unsupported") return unsupported(receipt.reason);
  if (receipt.kind === "waiting") return undefined;
  const guaranteed = receipt.items.filter(({ item }) => GUARANTEED_PAYMENTS.includes(item.type));
  if (guaranteed.length > 0) {
    const names = [...new Set(guaranteed.map(({ entity }) => entity.name))].join(", ");
    return unsupported(
      `${names}: whether a partner's guaranteed payments are net investment income (Form 8960 line 4b) is not modeled.`,
    );
  }
  const rows = new Map<string, number[]>();
  for (const { entity, item } of receipt.items) {
    if (entity.holding?.materiallyParticipated !== true) continue;
    if (item.type !== "ordinary_business_income" || item.passiveCarryover === true) continue;
    const row = `${entity.key}:${item.fromPriorYear === true}`;
    rows.set(row, [...(rows.get(row) ?? []), item.amount ?? 0]);
  }
  return [...rows.values()]
    .map((amounts) => roundDollars(sum(...amounts)))
    .filter((amount) => amount !== 0)
    .map((amount) => 0 - amount);
}

/* Nonpassive properties whose section 162 answer is missing: Cade asks for the property again. */
export function rentalsWithoutTradeOrBusinessAnswer(properties: RentalProperty[]): string[] {
  return properties
    .filter((property) => nonpassive(property) === true)
    .filter((property) => property.value.tradeOrBusiness === undefined)
    .map((property) => property.factKey);
}

/*
 * Line 4b: each section 162 nonpassive property's Schedule E amount as it reaches
 * Schedule 1 line 5 (line 21 income, or the line 22 deductible loss), income as a
 * negative and loss as a positive (b01). A self-rental's recharacterized net income
 * counts with no section 162 answer: it is treated as derived in the ordinary course
 * of a trade or business (irs-8960-inst-2025::sec::special-rules-for-certain-rental-income::b01,
 * ::b02; b02, item 2). No fact marks a lessee business that trades financial
 * instruments or commodities (special-rules-for-certain-rental-income::b02).
 * Undefined while an answer or a line waits.
 */
export function nonpassiveRentalAdjustments(
  form: FormAccessor<Form8960>,
  properties: RentalProperty[],
): number[] | undefined {
  const adjustments: number[] = [];
  for (const property of properties) {
    const line21 = form[`schedule-e.0.line.21_income_or_loss_${property.column}`];
    const income = typeof line21 === "number" ? line21 : undefined;
    // A passive self-rental only: a nonpassive one keeps the section 162 answer.
    const state =
      property.passive === true ? selfRentalState(property.value, income) : "not_self_rental";
    if (state === undefined || state === "waits") return undefined;
    const counts = state === "recharacterized" || section162Nonpassive(property);
    if (counts === undefined) return undefined;
    if (!counts) continue;
    // A prior-year loss allowed this year (b01, last bullet; a self-rental's too) is not modeled.
    if ((property.value.priorYearUnallowedLoss ?? 0) > 0) return undefined;
    if (income === undefined) return undefined;
    // A royalty has no line 22 (irs-1040se-inst-2025::sec::line-22::b01): its loss is on line 21.
    if (income >= 0 || property.value.propertyType === "royalties") {
      adjustments.push(0 - income);
      continue;
    }
    const loss = form[`schedule-e.0.line.22_deductible_loss_${property.column}`];
    if (typeof loss !== "number") return undefined;
    adjustments.push(loss);
  }
  return adjustments;
}
