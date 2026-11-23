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
import { needsForm7203 } from "../passThrough/basis.js";
import type { PassThroughEntity } from "../passThrough/items.js";
import { limitContextFrom } from "../passThrough/limits.js";
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
export type PassThroughInfo = Pick<
  ScheduleEFilingInfo,
  "passThroughEntities" | "filingStatus" | "passThroughLimitContext"
>;

const ROWS = ["a", "b", "c", "d"] as const;
type Row = (typeof ROWS)[number];

/* Line 28 column (b): "P" for a partnership, "S" for an S corporation. */
const ENTITY_TYPE_CODE = { "1065": "P", "1120-S": "S" } as const;

const partIIEntities = (info: PassThroughInfo): PassThroughEntity[] =>
  (info.passThroughEntities ?? []).filter((entity) => entity.form !== "1041");

/* Every K-1 on the return after the limits and routes, in fact order. */
function routedEntities(info: PassThroughInfo): RoutedEntity[] {
  return routeEntities(info.passThroughEntities ?? [], limitContextFrom(info));
}

/*
 * One line 28 row: a K-1's current-year amounts, or its losses carried from
 * earlier years and allowed now, which go "on a separate line in column (i)"
 * with "PYA" in column (a), never netted against the current year
 * (irs-1040se-inst-2025::sec::losses-not-allowed-in-prior-years-due-to-the-basis::b01).
 */
interface PartIIRow {
  entity: PassThroughEntity;
  priorYearAllowed: boolean;
}

const priorYearLoss = (routed: RoutedEntity | undefined) =>
  routed && roundDollars(allowedAmount(routed, "ordinary_business_income", true));

/* The rows in order: each K-1's row, then its PYA row when a carried loss is allowed. */
function partIIRows(info: PassThroughInfo): PartIIRow[] {
  const routed = routedEntities(info);
  return partIIEntities(info).flatMap((entity) => {
    const own = routed.find((entry) => entry.entity.key === entity.key);
    const pya = (priorYearLoss(own) ?? 0) !== 0;
    return pya
      ? [
          { entity, priorYearAllowed: false },
          { entity, priorYearAllowed: true },
        ]
      : [{ entity, priorYearAllowed: false }];
  });
}

const rowAt = (info: PassThroughInfo, row: Row) => partIIRows(info)[ROWS.indexOf(row)];

function routedRow(info: Info, row: Row): RoutedEntity | undefined {
  const entity = rowAt(info, row)?.entity;
  return entity && routedEntities(info).find((routed) => routed.entity.key === entity.key);
}

const OVERFLOW_PART_II =
  "More than four rows of partnership or S corporation K-1s (a carried loss allowed this year takes a row of its own) need a continuation sheet for Part II, which the engine does not fill.";

/* Every reason the return is incomplete because of a K-1, in order; empty when there is none. */
export function passThroughGaps(info: PassThroughInfo): string[] {
  const reasons = routedEntities(info).flatMap((routed) =>
    routed.kind === "unsupported" ? routed.reasons : [],
  );
  if (partIIRows(info).length > ROWS.length) reasons.push(OVERFLOW_PART_II);
  if (partIIIEntities(info).length > PART_III_ROWS) reasons.push(OVERFLOW_PART_III);
  return reasons;
}

const gapOf = (routed: RoutedEntity): Unsupported | undefined =>
  routed.kind === "unsupported" ? unsupported(routed.reasons.join(" ")) : undefined;

/*
 * An amount column of a row: blank with no K-1 in the row, the gap when the
 * K-1 is unsupported, blank while it waits, else the routed amount.
 */
function amountColumn(read: (routed: RoutedEntity, priorYearAllowed: boolean) => unknown) {
  return (row: Row): Fn =>
    (_, info) => {
      const routed = routedRow(info, row);
      if (!routed) return undefined;
      const priorYearAllowed = rowAt(info, row)?.priorYearAllowed === true;
      return (
        gapOf(routed) ?? (routed.kind === "routed" ? read(routed, priorYearAllowed) : undefined)
      );
    };
}

const ordinary = (routed: RoutedEntity) =>
  roundDollars(allowedAmount(routed, "ordinary_business_income"));

/*
 * Column (k): nonpassive income; column (i): a nonpassive loss the limits
 * allow, a positive amount (irs-1120sk1-inst-2025::sec::income-loss::b01, report
 * box 1 "in column (i) or (k)"); a PYA row's column (i) is the carried loss
 * allowed now. Columns (g), (h) and (j) take passive amounts and section 179,
 * which no route fills yet: a K-1 with them is unsupported.
 */
const nonpassiveIncome = amountColumn((routed, priorYearAllowed) => {
  const amount = ordinary(routed);
  return !priorYearAllowed && amount !== undefined && amount > 0 ? amount : undefined;
});
const nonpassiveLoss = amountColumn((routed, priorYearAllowed) => {
  const amount = priorYearAllowed ? priorYearLoss(routed) : ordinary(routed);
  return amount !== undefined && amount < 0 ? -amount : undefined;
});
const noRouteYet = amountColumn(() => undefined);

/*
 * Column (e) is checked for a loss, a distribution, a sale of stock or a loan
 * repayment from an S corporation, with the basis computation attached
 * (irs-1040se-inst-2025::sec::line-28::b03): when Form 7203 files for it
 * (needsForm7203). Column (f) is for amounts not at risk in an activity with a
 * loss (::special-rules-that-limit-losses::b03): the limits route a loss only
 * when all of the investment is at risk, so it is No. A PYA row leaves both
 * to the K-1's own row.
 */
const basisComputationColumn = amountColumn((routed, priorYearAllowed) =>
  priorYearAllowed ? undefined : needsForm7203(routed.entity),
);
const notAtRiskColumn = amountColumn((_, priorYearAllowed) =>
  priorYearAllowed ? undefined : false,
);

function rowBindings(row: Row): Record<string, Fn> {
  const entity = (info: Info) => rowAt(info, row)?.entity;
  const prefix = `1.line.28_row_${row}`;
  return {
    [`${prefix}_col_a_name`]: (_, info) => {
      const current = rowAt(info, row);
      return (
        current && (current.priorYearAllowed ? `PYA ${current.entity.name}` : current.entity.name)
      );
    },
    [`${prefix}_col_b_entity_type`]: (_, info) => {
      const form = entity(info)?.form;
      return form === "1065" || form === "1120-S" ? ENTITY_TYPE_CODE[form] : undefined;
    },
    [`${prefix}_col_c_foreign_partnership`]: (_, info) => {
      const k1 = entity(info)?.k1;
      return k1?.form === "1065" ? k1.foreignPartnership : undefined;
    },
    [`${prefix}_col_d_ein`]: (_, info) => entity(info)?.ein,
    [`${prefix}_col_e_basis_computation_required`]: basisComputationColumn(row),
    [`${prefix}_col_f_amount_not_at_risk`]: notAtRiskColumn(row),
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
  if (partIIRows(info).length > ROWS.length) gaps.push(OVERFLOW_PART_II);
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
 * Line 27 (irs-1040se-inst-2025::sec::line-27::b01): "Yes" when the return
 * reports a loss not allowed in a prior year because of the at-risk or basis
 * limits, or a prior-year unallowed passive loss, or unreimbursed partnership
 * expenses. The limits route a carried loss only from the basis limit, as an
 * allowed item from an earlier year; any such item makes it Yes.
 */
function priorYearLossAllowed(info: Info): boolean {
  return routedEntities(info).some(
    (routed) =>
      routed.entity.form !== "1041" &&
      routed.kind === "routed" &&
      routed.allowed.some((item) => item.fromPriorYear === true),
  );
}

function line27(yes: boolean): Fn {
  return (_, info) => {
    if (partIIEntities(info).length === 0) return undefined;
    const gap = partIIGap(info);
    if (gap) return gap;
    return partIIReady(info) ? priorYearLossAllowed(info) === yes : undefined;
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
    "1.line.27_yes": line27(true),
    "1.line.27_no": line27(false),
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
