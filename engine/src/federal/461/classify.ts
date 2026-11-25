/*
 * Part II of Form 461 takes out of lines 1 to 8 the income, gain, loss and
 * deduction that is "not from a trade or business"
 * (irs-461-inst-2025::sec::line-9::b01, ::line-10::b01, ::line-11::b01). This
 * file sorts what Schedule E carries to Schedule 1 line 5 (Form 461 line 5)
 * into business and not business, from the answers on the facts. A trade or
 * business is an activity with a profit motive, carried on with continuity and
 * regularity (::who-must-file::b03).
 */

import { k1EntityIdOf, makeK1RentalTradeOrBusinessKey } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { RENTAL_TYPES, type ItemType } from "../passThrough/itemTypes.js";
import type { Receipt, ReceivedItem } from "../passThrough/receipts.js";
import type { PropertyColumn, RentalProperty } from "../schedule-e/filingInfo.js";

/* A Schedule E Part I column whose amount is not from a trade or business. */
export interface NonbusinessColumn {
  column: PropertyColumn;
  royalty: boolean;
}

/* What the K-1s on Schedule E add to lines 10 and 11, positive whole dollars. */
export interface K1Nonbusiness {
  income: number;
  losses: number;
}

/* A sorting: the parts not from a business, the answers still missing, or why it cannot be done. */
export type Sorted<T> =
  | { kind: "sorted"; value: T }
  | { kind: "waiting"; factKeys: string[] }
  | { kind: "unsupported"; reason: string };

/*
 * One Part I property. A royalty's activity answer settles it: a portfolio
 * royalty is investment income, not a trade or business, while a passive or
 * nonpassive royalty comes "from a trade or business" (rental.ts,
 * RoyaltyActivityKind). A rental is a trade or business when its fact says so
 * (tradeOrBusiness, the section 162 answer Form 8960 also reads). Undefined
 * while the answer is missing.
 */
export function propertyIsBusiness(property: RentalProperty): boolean | undefined {
  const { value } = property;
  if (value.propertyType === "royalties") {
    return value.royaltyActivity === undefined ? undefined : value.royaltyActivity !== "portfolio";
  }
  return value.tradeOrBusiness;
}

/* The Part I columns not from a trade or business, or the property facts whose answer is missing. */
export function sortProperties(
  properties: ReadonlyArray<RentalProperty>,
): Sorted<NonbusinessColumn[]> {
  const open = properties.filter((property) => propertyIsBusiness(property) === undefined);
  if (open.length > 0) {
    return { kind: "waiting", factKeys: open.map((property) => property.factKey) };
  }
  return {
    kind: "sorted",
    value: properties
      .filter((property) => propertyIsBusiness(property) === false)
      .map((property) => ({
        column: property.column,
        royalty: property.value.propertyType === "royalties",
      })),
  };
}

/*
 * One K-1 item on Schedule E. Box 5 of a trust's K-1 is "other portfolio and
 * nonbusiness income" (irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01):
 * never business. A rental item is business when the taxpayer says the
 * entity's rental activity is a trade or business: "the trade or business
 * determination is made at that entity's level" (::who-must-file::b03). Every
 * other Schedule E item (ordinary business income, guaranteed payments) comes
 * from the entity's trade or business. Undefined while the answer is missing.
 */
function itemIsBusiness(
  { entity, item }: ReceivedItem,
  rentalAnswer: RentalAnswer,
): boolean | undefined {
  const portfolio: ItemType = "other_portfolio_income";
  if (item.type === portfolio) return false;
  if (!RENTAL_TYPES.includes(item.type)) return true;
  return rentalAnswer(entity.key);
}

/* A K-1 entity's rental answer by its K-1 key (resolveInfo.ts reads the fact); undefined while missing. */
export type RentalAnswer = (entityKey: string) => boolean | undefined;

/* The fact key that holds a K-1 entity's rental answer. */
export const rentalAnswerKey = (entityKey: string): string =>
  makeK1RentalTradeOrBusinessKey(k1EntityIdOf(entityKey) ?? entityKey);

/*
 * Each K-1's items that are not business, added up by sign and rounded once
 * for each K-1, the way its Schedule E row prints them.
 */
function addNonbusiness(items: ReadonlyArray<ReceivedItem>): K1Nonbusiness {
  const byEntity = new Map<string, number[]>();
  for (const received of items) {
    const amounts = byEntity.get(received.entity.key) ?? [];
    byEntity.set(received.entity.key, [...amounts, received.item.amount ?? 0]);
  }
  const totals = [...byEntity.values()];
  const rounded = (amounts: number[]) => roundDollars(sum(...amounts));
  const income = totals.map((amounts) => rounded(amounts.filter((amount) => amount > 0)));
  const losses = totals.map((amounts) => rounded(amounts.filter((amount) => amount < 0)));
  return { income: sum(...income), losses: 0 - sum(...losses) };
}

/*
 * The K-1 items Schedule E Parts II and III take (its two receipts), sorted:
 * the amounts not from a business, the rental answers still missing, or the
 * gap when a K-1 is unsupported.
 */
export function sortK1Items(
  receipts: ReadonlyArray<Receipt>,
  rentalAnswer: RentalAnswer,
): Sorted<K1Nonbusiness> {
  const items = answeredItems(receipts, rentalAnswer);
  if (items.kind !== "sorted") return items;
  return {
    kind: "sorted",
    value: addNonbusiness(
      items.value.filter((received) => itemIsBusiness(received, rentalAnswer) === false),
    ),
  };
}

/* The nonzero K-1 items of the receipts, once every item's business answer is known. */
function answeredItems(
  receipts: ReadonlyArray<Receipt>,
  rentalAnswer: RentalAnswer,
): Sorted<ReceivedItem[]> {
  const items: ReceivedItem[] = [];
  const waiting: string[] = [];
  for (const receipt of receipts) {
    if (receipt.kind === "unsupported") return receipt;
    if (receipt.kind === "waiting") waiting.push(...receipt.factKeys);
    else items.push(...receipt.items.filter((received) => (received.item.amount ?? 0) !== 0));
  }
  const open = items.filter((received) => itemIsBusiness(received, rentalAnswer) === undefined);
  const keys = [...waiting, ...open.map((received) => rentalAnswerKey(received.entity.key))];
  if (keys.length > 0) return { kind: "waiting", factKeys: [...new Set(keys)] };
  return { kind: "sorted", value: items };
}

/* A K-1 whose business items on Schedule E net to a loss: its key and the loss, positive whole dollars. */
export interface K1BusinessLoss {
  key: string;
  loss: number;
}

/*
 * The K-1s whose business items on Schedule E (Form 461 line 5) net to a
 * loss, rounded once for each K-1; undefined while a K-1 waits or is a gap.
 */
export function k1BusinessLosses(
  receipts: ReadonlyArray<Receipt>,
  rentalAnswer: RentalAnswer,
): K1BusinessLoss[] | undefined {
  const items = answeredItems(receipts, rentalAnswer);
  if (items.kind !== "sorted") return undefined;
  const byEntity = new Map<string, number[]>();
  for (const received of items.value) {
    if (itemIsBusiness(received, rentalAnswer) !== true) continue;
    const amounts = byEntity.get(received.entity.key) ?? [];
    byEntity.set(received.entity.key, [...amounts, received.item.amount ?? 0]);
  }
  return [...byEntity.entries()]
    .map(([key, amounts]) => ({ key, net: roundDollars(sum(...amounts)) }))
    .filter((entry) => entry.net < 0)
    .map((entry) => ({ key: entry.key, loss: 0 - entry.net }));
}
