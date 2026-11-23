/*
 * Part III (estates and trusts), lines 33 to 37. Hand-written (MANUAL EDIT):
 * the bindings spread partIIIBindings. A beneficiary reports "your part of the
 * income (even if not received) or loss" here (irs-1040se-inst-2025::sec::part-iii::b01):
 * boxes 5 to 8 of Schedule K-1 (Form 1041). Interest, dividends and gains go to
 * Schedule B, Form 1040 and Schedule D instead, so a trust K-1 with none of
 * boxes 5 to 8 has no row here. One row per such K-1, in fact order.
 */

import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank, roundDollars, sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { ItemType } from "../passThrough/itemTypes.js";
import type { PassThroughEntity } from "../passThrough/items.js";
import { itemsWithRoute, routeEntities, type RoutedEntity } from "../passThrough/routing.js";
import type { ScheduleEFilingInfo } from "./filingInfo.js";
import type { ScheduleE } from "./types.js";

type Form = FormAccessor<ScheduleE>;
type Info = ScheduleEFilingInfo;
type Fn = (form: Form, info: Info) => unknown;

const ROWS = ["a", "b"] as const;
type Row = (typeof ROWS)[number];

/* Part III prints two rows. */
export const PART_III_ROWS = ROWS.length;

export const OVERFLOW_PART_III =
  "More than two estate or trust K-1s with Part III income need a continuation sheet for Part III, which the engine does not fill.";

const PASSIVE_WITH_FORM_8582 =
  "Form 8582 files, and it does not take a trust K-1's passive income (Part III column (d)), which may allow a passive loss.";

/*
 * Box 5 is income "that isn't subject to the passive activity rules"
 * (irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01):
 * column (f). Boxes 6 to 8 go in column (d), passive income: the rules for
 * applying the passive limits to a beneficiary "haven't yet been issued"
 * (same block), and treating the income as passive keeps it in net investment
 * income (QUESTIONS.md).
 */
const OTHER_INCOME: ReadonlyArray<ItemType> = ["other_portfolio_income"];
const PASSIVE_INCOME: ReadonlyArray<ItemType> = [
  "ordinary_business_income",
  "net_rental_real_estate_income",
  "other_net_rental_income",
];

/* The trust K-1s with an item for Part III, in fact order. */
export function partIIIEntities(info: Pick<Info, "passThroughEntities">): PassThroughEntity[] {
  return (info.passThroughEntities ?? []).filter(
    (entity) => itemsWithRoute(entity, "schedule_e_part_iii").length > 0,
  );
}

function routedRows(info: Info): RoutedEntity[] {
  const keys = new Set(partIIIEntities(info).map((entity) => entity.key));
  return routeEntities(info.passThroughEntities ?? [], { filingStatus: info.filingStatus }).filter(
    (routed) => keys.has(routed.entity.key),
  );
}

function routedRow(info: Info, row: Row): RoutedEntity | undefined {
  const entity = partIIIEntities(info)[ROWS.indexOf(row)];
  return entity && routedRows(info).find((routed) => routed.entity.key === entity.key);
}

const allowedOf = (routed: RoutedEntity, types: ReadonlyArray<ItemType>) =>
  routed.kind === "routed"
    ? roundDollars(
        sumOrBlank(
          ...routed.allowed.filter((item) => types.includes(item.type)).map((item) => item.amount),
        ),
      )
    : undefined;

const hasPassiveIncome = (info: Info) =>
  routedRows(info).some((routed) => (allowedOf(routed, PASSIVE_INCOME) ?? 0) > 0);

/*
 * The Part III gap, or undefined: an unsupported trust K-1 with a row, more
 * than two rows, or passive income while Form 8582 files.
 */
export function partIIIGap(info: Info): Unsupported | undefined {
  const gaps = routedRows(info).flatMap((routed) =>
    routed.kind === "unsupported" ? routed.reasons : [],
  );
  if (partIIIEntities(info).length > ROWS.length) gaps.push(OVERFLOW_PART_III);
  if (info.mustFile?.["form-8582"]?.value === true && hasPassiveIncome(info)) {
    gaps.push(PASSIVE_WITH_FORM_8582);
  }
  return gaps.length > 0 ? unsupported(gaps.join(" ")) : undefined;
}

/* Every Part III row is routed: the totals can be added. */
export function partIIIReady(info: Info): boolean {
  const rows = routedRows(info);
  return rows.length > 0 && rows.every((routed) => routed.kind === "routed");
}

/* An amount column: blank with no row, the gap, blank while the K-1 waits, else the amount. */
function amountColumn(types: ReadonlyArray<ItemType> | undefined) {
  return (row: Row): Fn =>
    (_, info) => {
      const routed = routedRow(info, row);
      if (!routed) return undefined;
      const gap = partIIIGap(info);
      if (gap) return gap;
      return types === undefined ? undefined : allowedOf(routed, types);
    };
}

function rowBindings(row: Row): Record<string, Fn> {
  const entity = (info: Info) => partIIIEntities(info)[ROWS.indexOf(row)];
  const prefix = `1.line.33_row_${row}`;
  return {
    [`${prefix}_col_a_name`]: (_, info) => entity(info)?.name,
    [`${prefix}_col_b_ein`]: (_, info) => entity(info)?.ein,
    // Columns (c) and (e) take losses and deductions, which stop before a route (routing.ts).
    [`${prefix}_col_c_passive_deduction_allowed`]: amountColumn(undefined)(row),
    [`${prefix}_col_d_passive_income`]: amountColumn(PASSIVE_INCOME)(row),
    [`${prefix}_col_e_nonpassive_deduction_loss`]: amountColumn(undefined)(row),
    [`${prefix}_col_f_other_income`]: amountColumn(OTHER_INCOME)(row),
  };
}

/* Lines 34a and 34b: one column over rows A and B, once every row is routed. */
function columnTotal(column: string): Fn {
  return (form, info) => {
    const gap = partIIIGap(info);
    if (gap) return gap;
    if (!partIIIReady(info)) return undefined;
    return sumOrBlank(...ROWS.map((row) => form[`1.line.33_row_${row}_${column}`]));
  };
}

/* A line after the totals: the gap, blank until every row is routed, else the amount. */
function whenReady(amount: (form: Form) => number | undefined): Fn {
  return (form, info) => partIIIGap(info) ?? (partIIIReady(info) ? amount(form) : undefined);
}

export function partIIIBindings(): Record<string, Fn> {
  return {
    ...rowBindings("a"),
    ...rowBindings("b"),
    "1.line.34a_totals_col_d": columnTotal("col_d_passive_income"),
    "1.line.34a_totals_col_f": columnTotal("col_f_other_income"),
    "1.line.34b_totals_col_c": columnTotal("col_c_passive_deduction_allowed"),
    "1.line.34b_totals_col_e": columnTotal("col_e_nonpassive_deduction_loss"),
    // Line 35: the income columns of line 34a.
    "1.line.35_add_income_columns": whenReady((form) =>
      sumOrBlank(form["1.line.34a_totals_col_d"], form["1.line.34a_totals_col_f"]),
    ),
    // Line 36: the loss columns of line 34b, a positive amount.
    "1.line.36_add_loss_columns": whenReady((form) =>
      sumOrBlank(form["1.line.34b_totals_col_c"], form["1.line.34b_totals_col_e"]),
    ),
    // Line 37: line 35 less line 36; 0 when both are blank.
    "1.line.37_total_estate_trust_income": whenReady(
      (form) => sum(form["1.line.35_add_income_columns"]) - sum(form["1.line.36_add_loss_columns"]),
    ),
  };
}

/* Line 41 reads line 37 only while Part III has a row. */
export const line37ForLine41 = (form: Form, info: Info): number | undefined =>
  partIIIEntities(info).length > 0
    ? numberOrBlank(form["1.line.37_total_estate_trust_income"])
    : undefined;
