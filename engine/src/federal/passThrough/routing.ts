/*
 * Layer 5 (README.md): where each allowed item goes. ROUTES is the whole list
 * of items that have a line today; every other item makes the return visibly
 * incomplete: the entity is unsupported, with a reason that names the entity
 * and the item type, and Schedule E line 41 reports it (schedule-e/partII.ts).
 * A form reads what one route receives with receivedAt (receipts.ts).
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
 * The lines an item can reach. A route names its destination; a destination
 * the engine does not fill yet returns unsupported there, naming the entity,
 * so the rest of the return still computes.
 * - interest_list: one more payer row on Schedule B line 1, and Form 1040 line 2b;
 * - dividend_list: one more payer row on Schedule B line 5, and Form 1040 line 3b;
 * - qualified_dividends: Form 1040 line 3a, and the tax worksheet that reads it;
 * - schedule_d_line_5, schedule_d_line_12: net short-term and long-term gain;
 * - schedule_d_line_18, schedule_d_line_19: the 28% rate gain and unrecaptured
 *   section 1250 gain worksheets (not modeled: unsupported there);
 * - schedule_e_part_ii: Schedule E line 28 column (i) or (k);
 * - schedule_e_part_iii: Schedule E line 33 column (d) or (f);
 * - qbi: the section 199A statement on Form 8995 or 8995-A;
 * - schedule_a_line_11: a cash charitable contribution, with the return's own
 *   cash gifts (another kind of contribution is unsupported there);
 * - form_1040_line_2a: tax-exempt interest;
 * - form_7203: an item that only moves the shareholder's basis (Form 7203);
 * - schedule_3_line_1: the foreign tax credit: a trust K-1 is one more Form 1116
 *   source (1116/sources.ts); an S corporation's needs Schedule K-3 (unsupported there);
 * - form_8960_line_7: the beneficiary's net investment income adjustment
 *   (not modeled when not 0: unsupported there);
 * - no_line: an item the instructions say needs no entry on the return.
 */
export type Route =
  | "interest_list"
  | "dividend_list"
  | "qualified_dividends"
  | "schedule_d_line_5"
  | "schedule_d_line_12"
  | "schedule_d_line_18"
  | "schedule_d_line_19"
  | "schedule_e_part_ii"
  | "schedule_e_part_iii"
  | "qbi"
  | "schedule_a_line_11"
  | "form_1040_line_2a"
  | "form_7203"
  | "schedule_3_line_1"
  | "form_8960_line_7"
  | "no_line";

/* The comment over each entry is the corpus block that sends the item there. */
export const ROUTES: Readonly<Record<K1Form, Partial<Record<ItemType, Route>>>> = {
  "1120-S": {
    // irs-1120sk1-inst-2025::sec::income-loss::b01
    ordinary_business_income: "schedule_e_part_ii",
    // irs-1120sk1-inst-2025::sec::box-4-interest-income::b01
    interest: "interest_list",
    // irs-1120sk1-inst-2025::sec::box-5a-ordinary-dividends::b01
    ordinary_dividends: "dividend_list",
    // irs-1120sk1-inst-2025::sec::box-5b-qualified-dividends::b01
    qualified_dividends: "qualified_dividends",
    // irs-1120sk1-inst-2025::sec::box-7-net-short-term-capital-gain-loss::b01
    net_short_term_capital_gain: "schedule_d_line_5",
    // irs-1120sk1-inst-2025::sec::box-8a-net-long-term-capital-gain-loss::b01
    net_long_term_capital_gain: "schedule_d_line_12",
    // irs-1120sk1-inst-2025::sec::box-12-other-deductions::b06: code A on Schedule A line 11
    charitable_contribution: "schedule_a_line_11",
    // irs-1120sk1-inst-2025::sec::box-16-items-affecting-shareholder-basis::b01: code A on Form 1040 line 2a
    tax_exempt_interest: "form_1040_line_2a",
    // the same block: codes B, C and D change basis only, never income
    other_tax_exempt_income: "form_7203",
    nondeductible_expenses: "form_7203",
    distribution: "form_7203",
    // irs-1120sk1-inst-2025::sec::box-16-items-affecting-shareholder-basis::b02: code F; Form 1116 reads Schedule K-3 instead
    foreign_tax_paid: "schedule_3_line_1",
    // irs-1120sk1-inst-2025::sec::box-17-other-information::b11
    section_199a_information: "qbi",
    // irs-1120sk1-inst-2025::sec::box-17-other-information::b16: used to figure Form 8990, no line of its own.
    gross_receipts_448c: "no_line",
  },
  "1065": {
    // irs-1065k1-inst-2025::sec::part-xiii::b02, ::b03: the partner's share for the section 448(c) test.
    gross_receipts_448c: "no_line",
  },
  "1041": {
    // irs-1041k1-inst-2025::sec::box-1-interest-income::b01
    interest: "interest_list",
    // irs-1041k1-inst-2025::sec::box-2a-ordinary-dividends::b01
    ordinary_dividends: "dividend_list",
    // irs-1041k1-inst-2025::sec::box-2b-qualified-dividends::b01
    qualified_dividends: "qualified_dividends",
    // irs-1041k1-inst-2025::sec::boxes-3-and-4a-net-short-term-and-net::b01
    net_short_term_capital_gain: "schedule_d_line_5",
    // irs-1041k1-inst-2025::sec::boxes-3-and-4a-net-short-term-and-net::b01
    net_long_term_capital_gain: "schedule_d_line_12",
    // irs-1041k1-inst-2025::sec::boxes-4b-and-4c-28-rate-gain-and::b01
    collectibles_gain: "schedule_d_line_18",
    // irs-1041k1-inst-2025::sec::boxes-4b-and-4c-28-rate-gain-and::b01
    unrecaptured_section_1250_gain: "schedule_d_line_19",
    // irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01; irs-1040se-inst-2025::sec::part-iii::b01
    other_portfolio_income: "schedule_e_part_iii",
    // the same blocks: boxes 6 through 8
    ordinary_business_income: "schedule_e_part_iii",
    net_rental_real_estate_income: "schedule_e_part_iii",
    other_net_rental_income: "schedule_e_part_iii",
    // irs-1041k1-inst-2025::sec::box-14-other-information::b03, ::b05
    section_199a_information: "qbi",
    // irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02
    foreign_tax_paid: "schedule_3_line_1",
    // irs-1041k1-inst-2025::sec::box-14-other-information::b03
    net_investment_income: "form_8960_line_7",
  },
};

export function routeOf(form: K1Form, type: ItemType): Route | undefined {
  return ROUTES[form][type];
}

/*
 * One entity after the limits and the routes:
 * - routed: every item has a line; allowed holds them;
 * - waiting: an answer is missing; the lines wait on factKeys;
 * - unsupported: a case the engine does not handle; reasons name each one.
 *   allowed holds the items the limits let through (none when a limit
 *   stopped the entity), so an item with a route still reaches its line.
 */
export type RoutedEntity =
  | { entity: PassThroughEntity; kind: "routed"; allowed: PassThroughItem[] }
  | { entity: PassThroughEntity; kind: "waiting"; factKeys: string[] }
  | {
      entity: PassThroughEntity;
      kind: "unsupported";
      reasons: string[];
      allowed: PassThroughItem[];
    };

/* This year's items and the losses carried from earlier years. */
const everyItem = (entity: PassThroughEntity) => [...entity.items, ...entity.priorYearItems];

/* The entity's items with no route, each named by its type and box; whatever the limits did. */
function unroutedReason(entity: PassThroughEntity): string | undefined {
  const unrouted = everyItem(entity).filter(
    (item) => routeOf(entity.form, item.type) === undefined,
  );
  if (unrouted.length === 0) return undefined;
  return `${entityTitle(entity)}: ${unrouted.map(describeItem).join(", ")} has no route in the engine yet.`;
}

/* Statement amounts the QBI forms do not read from a K-1 yet. */
function statementReason(entity: PassThroughEntity): string | undefined {
  const statement = entity.k1.section199A;
  if (!statement) return undefined;
  return (statement.qualifiedPtpIncome ?? 0) !== 0
    ? `${entityTitle(entity)}: qualified PTP income on the section 199A statement is not modeled.`
    : undefined;
}

/* Header answers that bring items the boxes do not hold. */
function headerReason(entity: PassThroughEntity): string | undefined {
  const k3 = entity.k1.form !== "1041" && entity.k1.scheduleK3Attached === true;
  return k3
    ? `${entityTitle(entity)}: Schedule K-3 (international items) is not modeled.`
    : undefined;
}

/*
 * Schedule E Part III takes a beneficiary's income in columns (d) and (f);
 * a loss there (column (e)) is not modeled. Boxes 6 to 8 losses stop at the
 * passive limit first (limits.ts); this names a box 5 loss.
 */
function partIIILossReason(entity: PassThroughEntity): string | undefined {
  const losses = entity.items.filter(
    (item) => routeOf(entity.form, item.type) === "schedule_e_part_iii" && (item.amount ?? 0) < 0,
  );
  if (losses.length === 0) return undefined;
  return `${entityTitle(entity)}: ${losses.map(describeItem).join(", ")}: a loss on Schedule E Part III is not modeled.`;
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
    const allowed = limited.kind === "allowed" ? limited.allowed : [];
    const reasons = defined([
      limited.kind === "unsupported" ? limited.reason : undefined,
      unroutedReason(entity),
      headerReason(entity),
      statementReason(entity),
      partIIILossReason(entity),
    ]);
    if (limited.kind === "unsupported" || reasons.length > 0) {
      return { entity, kind: "unsupported", reasons, allowed };
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

/*
 * The allowed items of one type, summed; undefined when there are none. By
 * default this year's items only: a loss carried from an earlier year and
 * allowed now is reported on its own (Schedule E line 28, "PYA").
 */
export function allowedAmount(
  routed: RoutedEntity,
  type: ItemType,
  fromPriorYear = false,
): number | undefined {
  if (routed.kind !== "routed") return undefined;
  return sumOrBlank(
    ...routed.allowed
      .filter((item) => item.type === type && (item.fromPriorYear === true) === fromPriorYear)
      .map((item) => item.amount),
  );
}

/*
 * The entity's items that go to one route, whether or not the limits allow
 * them, the losses carried from earlier years included.
 */
export function itemsWithRoute(entity: PassThroughEntity, route: Route): PassThroughItem[] {
  return everyItem(entity).filter((item) => routeOf(entity.form, item.type) === route);
}

/* The allowed items that go to one route (the limits may have changed their amounts). */
export function allowedWithRoute(routed: RoutedEntity, route: Route): PassThroughItem[] {
  if (routed.kind === "waiting") return [];
  return routed.allowed.filter((item) => routeOf(routed.entity.form, item.type) === route);
}
