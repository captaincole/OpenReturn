/*
 * What one route receives from every K-1 on the return (README.md, layer 5).
 * A form that takes K-1 items next to its own amounts (Schedule B's payer
 * lists, Form 1040 lines 2b, 3a and 3b, Schedule D, Form 8995) reads a
 * receipt: the items, or why they are not known yet.
 */

import { businessesOnReturn, rentalsOnReturn } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { passiveRentalsOf } from "../8582/rentalRows.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import { netProfit } from "../schedule-c/lines.js";
import { netIncomeOrLoss } from "../schedule-e/lines.js";
import type { OtherBusinessLosses } from "./excessBusinessLoss.js";
import { otherPassiveActivitiesOf } from "./form8582Rows.js";
import {
  passThroughEntitiesOnReturn,
  type PassThroughEntity,
  type PassThroughItem,
} from "./items.js";
import type { LimitContext } from "./limits.js";
import {
  allowedWithRoute,
  itemsWithRoute,
  routeEntities,
  type Route,
  type RoutedEntity,
} from "./routing.js";

/* One item a route receives, with the K-1 it came from (a payer row names it). */
export interface ReceivedItem {
  entity: PassThroughEntity;
  item: PassThroughItem;
}

/*
 * - received: the items the limits allow, from every K-1 with an item there
 *   (none is a receipt too: nothing goes to the line);
 * - waiting: a K-1 with an item there waits on an answer;
 * - unsupported: a K-1 with an item there stopped at a loss limit, so the
 *   item's amount is not known; reason names the entity.
 */
export type Receipt =
  | { kind: "received"; items: ReceivedItem[] }
  | { kind: "waiting"; factKeys: string[] }
  | { kind: "unsupported"; reason: string };

export function receivedAt(routed: ReadonlyArray<RoutedEntity>, route: Route): Receipt {
  const items: ReceivedItem[] = [];
  const factKeys: string[] = [];
  const reasons: string[] = [];
  for (const entry of routed) {
    if (itemsWithRoute(entry.entity, route).length === 0) continue;
    if (entry.kind === "waiting") {
      factKeys.push(...entry.factKeys);
      continue;
    }
    const allowed = allowedWithRoute(entry, route);
    if (entry.kind === "unsupported" && allowed.length === 0) {
      reasons.push(...entry.reasons);
      continue;
    }
    items.push(...allowed.map((item) => ({ entity: entry.entity, item })));
  }
  if (reasons.length > 0) return { kind: "unsupported", reason: reasons.join(" ") };
  if (factKeys.length > 0) return { kind: "waiting", factKeys };
  return { kind: "received", items };
}

/* A received item's signed amount; a statement-only item adds nothing. */
const itemAmount = (received: ReceivedItem) => received.item.amount ?? 0;

/*
 * The return's own amount plus what the route receives, cents kept: undefined
 * with neither, and while a K-1 waits; the gap when a K-1 is unsupported. With
 * no amount of its own and every K-1 amount 0 or absent, the line is blank,
 * not 0 (a statement-only item, or an item a limit allowed at 0).
 */
export function withReceived(
  own: number | undefined,
  receipt: Receipt | undefined,
  amountOf: (received: ReceivedItem) => number | undefined = itemAmount,
): number | Unsupported | undefined {
  if (receipt === undefined) return own;
  if (receipt.kind === "unsupported") return unsupported(receipt.reason);
  if (receipt.kind === "waiting") return undefined;
  const amounts = receipt.items.map(amountOf);
  if (own === undefined && amounts.every((amount) => (amount ?? 0) === 0)) return undefined;
  return sum(own, ...amounts);
}

/* withReceived rounded to whole dollars, for a line that adds document amounts. */
export function roundedWithReceived(
  own: number | undefined,
  receipt: Receipt | undefined,
): number | Unsupported | undefined {
  const total = withReceived(own, receipt);
  return typeof total === "number" ? roundDollars(total) : total;
}

/* The received items whose amount is not 0. */
export function receivedAmounts(receipt: Receipt | undefined): ReceivedItem[] {
  return receipt?.kind === "received"
    ? receipt.items.filter((received) => (received.item.amount ?? 0) !== 0)
    : [];
}

/* The K-1s on this return, for a resolver. */
const entitiesOnReturn = (inputs: ResolverInputs) =>
  passThroughEntitiesOnReturn(inputs.facts, spousePropertiesOnReturn(filingStatusOf(inputs)))
    .entities;

/*
 * The return's business losses outside the K-1s, for the excess business loss
 * stage (limits.ts): each Schedule C business's line 31 loss and each rental
 * or royalty property's loss before the passive rules (Schedule E line 21),
 * added without any income, so the total bounds what Form 461 would add up
 * (irs-461-inst-2025::sec::who-must-file::b02). A business or property whose
 * amount is not known yet is listed by its key.
 */
export function otherBusinessLosses(inputs: ResolverInputs): OtherBusinessLosses {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const { businesses } = businessesOnReturn(inputs.facts, joint);
  const { properties } = rentalsOnReturn(inputs.facts, joint);
  const values = businesses.map((business) => business.value);
  const scheduleC = businesses.map(({ key, value }) => ({ key, net: netProfit(value, values) }));
  const rentals = properties.map(({ key, value }) => ({ key, net: netIncomeOrLoss(value) }));
  const losses = (amounts: Array<{ net: number | undefined }>) =>
    sum(...amounts.map(({ net }) => Math.max(0, -(net ?? 0))));
  return {
    scheduleCLosses: losses(scheduleC),
    rentalLosses: losses(rentals),
    unknownKeys: [...scheduleC, ...rentals]
      .filter(({ net }) => net === undefined)
      .map(({ key }) => key),
  };
}

/* What every loss limit reads besides the items, for a resolver. */
export function limitContextOf(inputs: ResolverInputs): LimitContext {
  const context: LimitContext = {
    filingStatus: filingStatusOf(inputs),
    otherBusinessLosses: otherBusinessLosses(inputs),
    passiveRentals: passiveRentalsOf(inputs),
  };
  // The basis and at-risk stages read none of the context, so the K-1s Form 8582 cannot take come first.
  return {
    ...context,
    otherPassiveActivities: otherPassiveActivitiesOf(entitiesOnReturn(inputs), context),
  };
}

/* Every K-1 on this return after the limits and the routes, for a resolver. */
export function routedOnReturn(inputs: ResolverInputs): RoutedEntity[] {
  return routeEntities(entitiesOnReturn(inputs), limitContextOf(inputs));
}

/* What one route receives on this return. */
export function receivedOnReturn(inputs: ResolverInputs, route: Route): Receipt {
  return receivedAt(routedOnReturn(inputs), route);
}

/* The items of every K-1 on this return for one route, before the limits: a bound's input. */
export function k1ItemsWithRoute(inputs: ResolverInputs, route: Route): PassThroughItem[] {
  return entitiesOnReturn(inputs).flatMap((entity) => itemsWithRoute(entity, route));
}

/* The K-1s on this return with an amount for the route, before the limits: a must-file answer. */
export function k1KeysWithRoute(inputs: ResolverInputs, route: Route): string[] {
  return entitiesOnReturn(inputs)
    .filter((entity) => itemsWithRoute(entity, route).some((item) => (item.amount ?? 0) !== 0))
    .map((entity) => entity.key);
}
