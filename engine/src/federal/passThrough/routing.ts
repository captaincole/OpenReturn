/*
 * Layer 5 (README.md): where each allowed item goes. ROUTES is the whole list
 * of items that have a line today; every other item makes the return visibly
 * incomplete: the entity is unsupported, with a reason that names the entity
 * and the item type, and Schedule E line 41 reports it (schedule-e/partII.ts).
 */

import type { K1Form } from "../../facts/index.js";
import { sumOrBlank } from "../../money.js";
import type { ItemType } from "./itemTypes.js";
import {
  describeItem,
  entityTitle,
  type PassThroughEntity,
  type PassThroughItem,
} from "./items.js";
import { applyLossLimits, type LimitContext } from "./limits.js";

/*
 * The lines an item can reach today:
 * - schedule_e_part_ii: an S corporation's ordinary business income (loss),
 *   nonpassive, on Schedule E line 28 column (i) or (k)
 *   (irs-1120sk1-inst-2025::sec::income-loss::b01);
 * - qbi: an S corporation's section 199A statement, one more business on
 *   Form 8995 or 8995-A (irs-1120sk1-inst-2025::sec::box-17-other-information::b11).
 */
export type Route = "schedule_e_part_ii" | "qbi";

export const ROUTES: Readonly<Record<K1Form, Partial<Record<ItemType, Route>>>> = {
  "1120-S": {
    ordinary_business_income: "schedule_e_part_ii",
    section_199a_information: "qbi",
  },
  "1065": {},
  "1041": {},
};

export function routeOf(form: K1Form, type: ItemType): Route | undefined {
  return ROUTES[form][type];
}

/*
 * One entity after the limits and the routes:
 * - routed: every item has a line; allowed holds them;
 * - waiting: an answer is missing; the lines wait on factKeys;
 * - unsupported: a case the engine does not handle; reasons name each one.
 */
export type RoutedEntity =
  | { entity: PassThroughEntity; kind: "routed"; allowed: PassThroughItem[] }
  | { entity: PassThroughEntity; kind: "waiting"; factKeys: string[] }
  | { entity: PassThroughEntity; kind: "unsupported"; reasons: string[] };

/* The entity's items with no route, each named by its type and box; whatever the limits did. */
function unroutedReason(entity: PassThroughEntity): string | undefined {
  const unrouted = entity.items.filter((item) => routeOf(entity.form, item.type) === undefined);
  if (unrouted.length === 0) return undefined;
  return `${entityTitle(entity)}: ${unrouted.map(describeItem).join(", ")} has no route in the engine yet.`;
}

/* Statement amounts the QBI forms do not read from a K-1 yet. */
function statementReason(entity: PassThroughEntity): string | undefined {
  const statement = entity.k1.section199A;
  if (!statement) return undefined;
  const reit = (statement.section199ADividends ?? 0) !== 0;
  const ptp = (statement.qualifiedPtpIncome ?? 0) !== 0;
  return reit || ptp
    ? `${entityTitle(entity)}: section 199A dividends or PTP income on the section 199A statement are not modeled.`
    : undefined;
}

/* Header answers that bring items the boxes do not hold. */
function headerReason(entity: PassThroughEntity): string | undefined {
  const k3 = entity.k1.form !== "1041" && entity.k1.scheduleK3Attached === true;
  return k3
    ? `${entityTitle(entity)}: Schedule K-3 (international items) is not modeled.`
    : undefined;
}

/* A statement box listed without its statement: the K-1 fact is asked again. */
function statementMissing(entity: PassThroughEntity, items: PassThroughItem[]): boolean {
  return (
    items.some((item) => item.type === "section_199a_information") &&
    entity.k1.section199A === undefined
  );
}

/* The limits, then the routes, for each entity in order. */
export function routeEntities(
  entities: ReadonlyArray<PassThroughEntity>,
  context: LimitContext,
): RoutedEntity[] {
  return applyLossLimits(entities, context).map((limited): RoutedEntity => {
    const { entity } = limited;
    const reasons = defined([
      limited.kind === "unsupported" ? limited.reason : undefined,
      unroutedReason(entity),
      headerReason(entity),
      statementReason(entity),
    ]);
    if (limited.kind === "unsupported" || reasons.length > 0) {
      return { entity, kind: "unsupported", reasons };
    }
    if (limited.kind === "waiting") {
      return { entity, kind: "waiting", factKeys: limited.factKeys };
    }
    if (statementMissing(entity, limited.allowed)) {
      return { entity, kind: "waiting", factKeys: [entity.key] };
    }
    return { entity, kind: "routed", allowed: limited.allowed };
  });
}

const defined = (values: Array<string | undefined>): string[] =>
  values.filter((value): value is string => value !== undefined);

/* The allowed items of one type, summed; undefined when there are none. */
export function allowedAmount(routed: RoutedEntity, type: ItemType): number | undefined {
  if (routed.kind !== "routed") return undefined;
  return sumOrBlank(
    ...routed.allowed.filter((item) => item.type === type).map((item) => item.amount),
  );
}
