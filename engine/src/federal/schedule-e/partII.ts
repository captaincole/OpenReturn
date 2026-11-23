/*
 * Part II (partnerships and S corporations), lines 27 to 32, and line 41.
 * Part III (estates and trusts) is in partIII.ts.
 * Hand-written (MANUAL EDIT): the bindings spread partIIBindings. The K-1
 * items come through the loss limits and routes in federal/passThrough/
 * (README.md there). One row per K-1, in fact order; a K-1 whose items have
 * no route makes its amount columns, the totals and line 41 unsupported,
 * with a reason that names the entity and the item type.
 */

import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank, roundDollars, sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { PassThroughEntity } from "../passThrough/items.js";
import { allowedAmount, routeEntities, type RoutedEntity } from "../passThrough/routing.js";
import type { ScheduleEFilingInfo } from "./filingInfo.js";
import type { PartIBindings } from "./lines.js";
import {
  OVERFLOW_PART_III,
  PART_III_ROWS,
  line37ForLine41,
  partIIIBindings,
  partIIIEntities,
  partIIIGap,
} from "./partIII.js";
import type { ScheduleE } from "./types.js";

type Form = FormAccessor<ScheduleE>;
type Info = ScheduleEFilingInfo;
type Fn = (form: Form, info: Info) => unknown;
/* What the K-1 rows read; other forms that report a K-1 gap pass the same slots. */
export type PassThroughInfo = Pick<ScheduleEFilingInfo, "passThroughEntities" | "filingStatus">;

const ROWS = ["a", "b", "c", "d"] as const;
type Row = (typeof ROWS)[number];

/* Line 28 column (b): "P" for a partnership, "S" for an S corporation. */
const ENTITY_TYPE_CODE = { "1065": "P", "1120-S": "S" } as const;

const partIIEntities = (info: PassThroughInfo): PassThroughEntity[] =>
  (info.passThroughEntities ?? []).filter((entity) => entity.form !== "1041");

/* Every K-1 on the return after the limits and routes, in fact order. */
function routedEntities(info: PassThroughInfo): RoutedEntity[] {
  return routeEntities(info.passThroughEntities ?? [], { filingStatus: info.filingStatus });
}

function routedRow(info: Info, row: Row): RoutedEntity | undefined {
  const entity = partIIEntities(info)[ROWS.indexOf(row)];
  return entity && routedEntities(info).find((routed) => routed.entity.key === entity.key);
}

const OVERFLOW_PART_II =
  "More than four partnership or S corporation K-1s need a continuation sheet for Part II, which the engine does not fill.";

/* Every reason the return is incomplete because of a K-1, in order; empty when there is none. */
export function passThroughGaps(info: PassThroughInfo): string[] {
  const reasons = routedEntities(info).flatMap((routed) =>
    routed.kind === "unsupported" ? routed.reasons : [],
  );
  if (partIIEntities(info).length > ROWS.length) reasons.push(OVERFLOW_PART_II);
  if (partIIIEntities(info).length > PART_III_ROWS) reasons.push(OVERFLOW_PART_III);
  return reasons;
}

const gapOf = (routed: RoutedEntity): Unsupported | undefined =>
  routed.kind === "unsupported" ? unsupported(routed.reasons.join(" ")) : undefined;

/*
 * An amount column of a row: blank with no K-1 in the row, the gap when the
 * K-1 is unsupported, blank while it waits, else the routed amount.
 */
function amountColumn(read: (routed: RoutedEntity) => number | undefined) {
  return (row: Row): Fn =>
    (_, info) => {
      const routed = routedRow(info, row);
      if (!routed) return undefined;
      return gapOf(routed) ?? (routed.kind === "routed" ? read(routed) : undefined);
    };
}

const ordinary = (routed: RoutedEntity) =>
  roundDollars(allowedAmount(routed, "ordinary_business_income"));

/*
 * Column (k): nonpassive income; column (i): a nonpassive loss the limits
 * allow, a positive amount (irs-1120sk1-inst-2025::sec::income-loss::b01, report
 * box 1 "in column (i) or (k)"). Columns (g), (h) and (j) take passive amounts
 * and section 179, which no route fills yet: a K-1 with them is unsupported.
 */
const nonpassiveIncome = amountColumn((routed) => {
  const amount = ordinary(routed);
  return amount !== undefined && amount > 0 ? amount : undefined;
});
const nonpassiveLoss = amountColumn((routed) => {
  const amount = ordinary(routed);
  return amount !== undefined && amount < 0 ? -amount : undefined;
});
const noRouteYet = amountColumn(() => undefined);

/*
 * Columns (e) and (f), for a routed row: (e) is checked for a loss, a
 * distribution, a sale of stock or a loan repayment from an S corporation
 * (irs-1040se-inst-2025::sec::line-28::b03); (f) for amounts not at risk in an
 * activity with a loss (::special-rules-that-limit-losses::b03). A routed
 * K-1 has none of them, so both are No; a partnership K-1 has no route yet.
 */
function checkColumn(row: Row): Fn {
  return (_, info) => {
    const routed = routedRow(info, row);
    if (!routed) return undefined;
    return gapOf(routed) ?? (routed.kind === "routed" ? false : undefined);
  };
}

function rowBindings(row: Row): Record<string, Fn> {
  const entity = (info: Info) => partIIEntities(info)[ROWS.indexOf(row)];
  const prefix = `1.line.28_row_${row}`;
  return {
    [`${prefix}_col_a_name`]: (_, info) => entity(info)?.name,
    [`${prefix}_col_b_entity_type`]: (_, info) => {
      const form = entity(info)?.form;
      return form === "1065" || form === "1120-S" ? ENTITY_TYPE_CODE[form] : undefined;
    },
    [`${prefix}_col_c_foreign_partnership`]: (_, info) => {
      const k1 = entity(info)?.k1;
      return k1?.form === "1065" ? k1.foreignPartnership : undefined;
    },
    [`${prefix}_col_d_ein`]: (_, info) => entity(info)?.ein,
    [`${prefix}_col_e_basis_computation_required`]: checkColumn(row),
    [`${prefix}_col_f_amount_not_at_risk`]: checkColumn(row),
    [`${prefix}_col_g_passive_loss_allowed`]: noRouteYet(row),
    [`${prefix}_col_h_passive_income`]: noRouteYet(row),
    [`${prefix}_col_i_nonpassive_loss_allowed`]: nonpassiveLoss(row),
    [`${prefix}_col_j_section_179_deduction`]: noRouteYet(row),
    [`${prefix}_col_k_nonpassive_income`]: nonpassiveIncome(row),
  };
}

/*
 * The Part II gap, or undefined. Waiting rows leave the totals blank
 * (partIIReady); a K-1 that is unsupported, or more than four, makes them
 * unsupported.
 */
function partIIGap(info: Info): Unsupported | undefined {
  const gaps = routedEntities(info)
    .filter((routed) => routed.entity.form !== "1041" && routed.kind === "unsupported")
    .flatMap((routed) => (routed.kind === "unsupported" ? routed.reasons : []));
  if (partIIEntities(info).length > ROWS.length) gaps.push(OVERFLOW_PART_II);
  return gaps.length > 0 ? unsupported(gaps.join(" ")) : undefined;
}

/* Every Part II row is routed: the totals can be added. */
function partIIReady(info: Info): boolean {
  const keys = new Set(partIIEntities(info).map((entity) => entity.key));
  return (
    keys.size > 0 &&
    routedEntities(info)
      .filter((routed) => keys.has(routed.entity.key))
      .every((routed) => routed.kind === "routed")
  );
}

/* Lines 29a and 29b: one column over rows A–D, once every row is routed. */
function columnTotal(column: string): Fn {
  return (form, info) => {
    const gap = partIIGap(info);
    if (gap) return gap;
    if (!partIIReady(info)) return undefined;
    return sumOrBlank(...ROWS.map((row) => form[`1.line.28_row_${row}_${column}`]));
  };
}

/*
 * Line 27 (irs-1040se-inst-2025::sec::line-27::b01): a prior-year loss allowed
 * now, or unreimbursed partnership expenses. A routed K-1 carries no loss from
 * an earlier year (the limits stop one), so the answer is No.
 */
function line27(checked: boolean): Fn {
  return (_, info) => {
    if (partIIEntities(info).length === 0) return undefined;
    const gap = partIIGap(info);
    if (gap) return gap;
    return partIIReady(info) ? checked : undefined;
  };
}

/*
 * Line 41: lines 26, 32, 37, 39 and 40. MANUAL EDIT: a K-1 with an item that
 * has no route makes it unsupported, with every reason; Part I waits on line 26
 * only when Part I is in use, Part II on line 32 and Part III on line 37 only
 * when they have a row. Lines 39 and 40 are unsupported (no fact) and add
 * nothing; any K-1 gap is reported here, a trust K-1's too.
 */
function line41(form: Form, info: Info): number | Unsupported | undefined {
  const gaps = passThroughGaps(info);
  if (gaps.length > 0) return unsupported(gaps.join(" "));
  const partIII = partIIIGap(info);
  if (partIII) return partIII;
  const line26 = numberOrBlank(form["0.line.26_total_income_or_loss"]);
  const line32 = numberOrBlank(form["1.line.32_total_partnership_s_corp_income"]);
  const line37 = line37ForLine41(form, info);
  const hasPartII = partIIEntities(info).length > 0;
  const hasPartIII = partIIIEntities(info).length > 0;
  if (info.partIInUse && line26 === undefined) return undefined;
  if (hasPartII && line32 === undefined) return undefined;
  if (hasPartIII && line37 === undefined) return undefined;
  if (!info.partIInUse && !hasPartII && !hasPartIII) return undefined;
  return sum(
    line26,
    line32,
    line37,
    form["1.line.39_remic_income_combined"],
    form["1.line.40_net_farm_rental_income"],
  );
}

export function partIIBindings(): PartIBindings {
  const out: Record<string, Fn> = {
    "1.line.27_yes": line27(false),
    "1.line.27_no": line27(true),
    ...rowBindings("a"),
    ...rowBindings("b"),
    ...rowBindings("c"),
    ...rowBindings("d"),
    "1.line.29a_totals_col_h": columnTotal("col_h_passive_income"),
    "1.line.29a_totals_col_k": columnTotal("col_k_nonpassive_income"),
    "1.line.29b_totals_col_g": columnTotal("col_g_passive_loss_allowed"),
    "1.line.29b_totals_col_i": columnTotal("col_i_nonpassive_loss_allowed"),
    "1.line.29b_totals_col_j": columnTotal("col_j_section_179_deduction"),
    // Line 30: the income columns of line 29a.
    "1.line.30_add_income_columns": (form, info) =>
      partIIGap(info) ??
      (partIIReady(info)
        ? sumOrBlank(form["1.line.29a_totals_col_h"], form["1.line.29a_totals_col_k"])
        : undefined),
    // Line 31: the loss columns of line 29b, a positive amount.
    "1.line.31_add_loss_columns": (form, info) =>
      partIIGap(info) ??
      (partIIReady(info)
        ? sumOrBlank(
            form["1.line.29b_totals_col_g"],
            form["1.line.29b_totals_col_i"],
            form["1.line.29b_totals_col_j"],
          )
        : undefined),
    // Line 32: line 30 less line 31; 0 when both are blank.
    "1.line.32_total_partnership_s_corp_income": (form, info) =>
      partIIGap(info) ??
      (partIIReady(info)
        ? sum(form["1.line.30_add_income_columns"]) - sum(form["1.line.31_add_loss_columns"])
        : undefined),
    // MANUAL EDIT: Part III, lines 33–37 (partIII.ts).
    ...partIIIBindings(),
    "1.line.41_total_income_or_loss": line41,
  };
  return out as PartIBindings;
}
