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
import { magiWithK1Gap } from "../8582/magiGap.js";
import { needsForm7203 } from "../passThrough/basis.js";
import type { PassThroughEntity, PassThroughItem } from "../passThrough/items.js";
import type { ItemType } from "../passThrough/itemTypes.js";
import { k1sOnForm6198, limitContextFrom } from "../passThrough/limits.js";
import { isPassiveItem, releasedOnDisposition } from "../passThrough/passiveActivity.js";
import { allowedWithRoute, routeEntities, type RoutedEntity } from "../passThrough/routing.js";
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
 * The kind of a line 28 row. The K-1's ordinary income or loss is on its first
 * line, and "each related item ... stated separately on Schedule K-1" on a
 * separate line that follows it, described in column (a)
 * (irs-1040se-inst-2025::sec::line-28::b01): a partnership's rentals (boxes 2
 * and 3) and guaranteed payments (boxes 4a to 4c). Losses carried from earlier
 * years and allowed now go "on a separate line" with "PYA" in column (a), never
 * netted against the current year
 * (irs-1040se-inst-2025::sec::losses-not-allowed-in-prior-years-due-to-the-basis::b01).
 */
type RowKind = "ordinary" | "rental_real_estate" | "other_rental" | "guaranteed" | "pya";

const ROW_KIND_OF: Partial<Record<ItemType, RowKind>> = {
  ordinary_business_income: "ordinary",
  net_rental_real_estate_income: "rental_real_estate",
  other_net_rental_income: "other_rental",
  guaranteed_payment_services: "guaranteed",
  guaranteed_payment_capital: "guaranteed",
  guaranteed_payments_total: "guaranteed",
};

/* The current-year kinds in line order; the first a K-1 has takes its first line. */
const CURRENT_KINDS: ReadonlyArray<RowKind> = [
  "ordinary",
  "rental_real_estate",
  "other_rental",
  "guaranteed",
];

/* Column (a)'s description of a related item's line. */
const RELATED_DESCRIPTION: Partial<Record<RowKind, string>> = {
  rental_real_estate: "rental real estate",
  other_rental: "other rental",
  guaranteed: "guaranteed payments",
};

interface PartIIRow {
  entity: PassThroughEntity;
  kind: RowKind;
  /* The K-1's first line: it answers columns (e) and (f). */
  first: boolean;
}

/*
 * An allowed item on the "PYA" row: a basis loss carried from an earlier year,
 * nonpassive, in column (i)
 * (irs-1040se-inst-2025::sec::losses-not-allowed-in-prior-years-due-to-the-basis::b01);
 * and a carried passive loss not reported on Form 8582, which an entire
 * disposition releases, in column (g)
 * (irs-1040se-inst-2025::sec::prior-year-unallowed-losses-from-a-passive::b01).
 * A passive basis loss, and a carried passive loss on Form 8582, are in the
 * activity's own row (irs-8582-inst-2025::sec::how-to-report-allowed-losses::b04).
 */
function onPriorYearRow(entity: PassThroughEntity, item: PassThroughItem): boolean {
  if (item.fromPriorYear !== true) return false;
  if (item.passiveCarryover === true) return releasedOnDisposition(entity);
  return !isPassiveItem(entity, item);
}

const GUARANTEED_PARTS: ReadonlyArray<string> = [
  "guaranteed_payment_services",
  "guaranteed_payment_capital",
];

/*
 * Box 4c is the total of boxes 4a and 4b
 * (irs-1065k1-inst-2025::sec::box-4c-total-guaranteed-payments::b01): only the
 * part of it above them is more income (a K-1 that prints the total alone).
 */
function guaranteedPaymentsOnce(items: PassThroughItem[]): PassThroughItem[] {
  const parts = sum(
    ...items.filter((item) => GUARANTEED_PARTS.includes(item.type)).map((item) => item.amount),
  );
  return items.map((item) =>
    item.type === "guaranteed_payments_total"
      ? { ...item, amount: Math.max(0, (item.amount ?? 0) - parts) }
      : item,
  );
}

/* The row an item goes on: its kind, or the PYA row. */
const rowKindOf = (entity: PassThroughEntity, item: PassThroughItem): RowKind =>
  onPriorYearRow(entity, item) ? "pya" : (ROW_KIND_OF[item.type] ?? "ordinary");

/* The allowed Part II items of one kind of row. */
const partIIItems = (routed: RoutedEntity, kind: RowKind) =>
  guaranteedPaymentsOnce(allowedWithRoute(routed, "schedule_e_part_ii")).filter(
    (item) => rowKindOf(routed.entity, item) === kind,
  );

const priorYearLoss = (routed: RoutedEntity | undefined) =>
  routed && roundDollars(sumOrBlank(...partIIItems(routed, "pya").map((item) => item.amount)));

/* The current-year kinds a K-1 has, from its items, in line order; one line at least. */
function currentKinds(entity: PassThroughEntity): RowKind[] {
  const present = new Set(
    [...entity.items, ...entity.priorYearItems]
      .filter((item) => (item.amount ?? 0) !== 0)
      .map((item) => ROW_KIND_OF[item.type])
      .filter((kind) => kind !== undefined),
  );
  const kinds = CURRENT_KINDS.filter((kind) => present.has(kind));
  return kinds.length > 0 ? kinds : ["ordinary"];
}

/* The rows in order: each K-1's first line, its related items' lines, then its PYA row. */
function partIIRows(info: PassThroughInfo): PartIIRow[] {
  const routed = routedEntities(info);
  return partIIEntities(info).flatMap((entity) => {
    const own = routed.find((entry) => entry.entity.key === entity.key);
    const pya = (priorYearLoss(own) ?? 0) !== 0;
    const kinds: RowKind[] = [...currentKinds(entity), ...(pya ? (["pya"] as const) : [])];
    return kinds.map((kind, index) => ({ entity, kind, first: index === 0 }));
  });
}

/*
 * The letter of the line 28 row that holds a K-1's passive activity, for Form
 * 8582's second column ("Sch E, line 28A", irs-8582-inst-2025::sec::part-vi::b01);
 * undefined past the four rows.
 */
export function passiveActivityRowLetter(
  info: PassThroughInfo,
  entityKey: string,
): string | undefined {
  const rows = partIIRows(info);
  const index = rows.findIndex((row) => {
    if (row.entity.key !== entityKey || row.kind === "pya") return false;
    return row.entity.items.some(
      (item) => isPassiveItem(row.entity, item) && rowKindOf(row.entity, item) === row.kind,
    );
  });
  return index >= 0 && index < ROWS.length ? ROWS[index].toUpperCase() : undefined;
}

const rowAt = (info: PassThroughInfo, row: Row) => partIIRows(info)[ROWS.indexOf(row)];

function routedRow(info: Info, row: Row): RoutedEntity | undefined {
  const entity = rowAt(info, row)?.entity;
  return entity && routedEntities(info).find((routed) => routed.entity.key === entity.key);
}

const OVERFLOW_PART_II =
  "More than four rows of partnership or S corporation K-1s (a carried loss allowed this year, and each separately stated item, takes a row of its own) need a continuation sheet for Part II, which the engine does not fill.";

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
function amountColumn(read: (routed: RoutedEntity, row: PartIIRow) => unknown) {
  return (row: Row): Fn =>
    (_, info) => {
      const routed = routedRow(info, row);
      const current = rowAt(info, row);
      if (!routed || !current) return undefined;
      return gapOf(routed) ?? (routed.kind === "routed" ? read(routed, current) : undefined);
    };
}

/*
 * One column of a row: the row's allowed Part II items that are passive or
 * not, and income or loss, added up; a loss as a positive amount. Blank with none.
 */
function columnAmount(
  routed: RoutedEntity,
  kind: RowKind,
  passive: boolean,
  income: boolean,
): number | undefined {
  const amounts = partIIItems(routed, kind)
    .filter((item) => isPassiveItem(routed.entity, item) === passive)
    .map((item) => item.amount ?? 0)
    .filter((amount) => (income ? amount > 0 : amount < 0));
  const total = roundDollars(sumOrBlank(...amounts));
  if (total === undefined || total === 0) return undefined;
  return income ? total : -total;
}

/*
 * Column (k): nonpassive income, box 1 of an owner who materially participated
 * and a partner's guaranteed payments (irs-1065k1-inst-2025::sec::box-4a-guaranteed-payments-for-services::b01,
 * ::box-4b-guaranteed-payments-for-capital::b01); column (i): a nonpassive loss
 * the limits allow (irs-1120sk1-inst-2025::sec::income-loss::b01, report box 1
 * "in column (i) or (k)"); a PYA row's column (i) is the carried basis loss
 * allowed now. Column (h): passive income; column (g): the passive loss Form
 * 8582 allows, the carried passive loss included
 * (irs-1065k1-inst-2025::sec::income-loss::b01, ::b02;
 * irs-8582-inst-2025::sec::how-to-report-allowed-losses::b04), or, for an
 * entire disposition off Form 8582, this year's passive loss in full (the
 * applicable column, irs-1040se-inst-2025::sec::line-28::b01) and the carried
 * one on its PYA row. Column (j), section 179, has no route: a K-1 with it is
 * unsupported.
 */
const nonpassiveIncome = amountColumn((routed, row) => columnAmount(routed, row.kind, false, true));
const nonpassiveLoss = amountColumn((routed, row) => columnAmount(routed, row.kind, false, false));
const passiveIncome = amountColumn((routed, row) => columnAmount(routed, row.kind, true, true));
const passiveLoss = amountColumn((routed, row) => columnAmount(routed, row.kind, true, false));
const noRouteYet = amountColumn(() => undefined);

/*
 * Column (e) is checked for a loss, a distribution, a sale of stock or a loan
 * repayment from an S corporation, with the basis computation attached
 * (irs-1040se-inst-2025::sec::line-28::b03): when Form 7203 files for it
 * (needsForm7203). Column (f) is checked for an activity subject to the
 * at-risk rules, with Form 6198 figuring the deductible loss
 * (::special-rules-that-limit-losses::b03): when Form 6198 files for the K-1
 * (k1sOnForm6198). A PYA row and a related item's line leave both to the K-1's
 * first line.
 */
const basisComputationColumn = amountColumn((routed, row) =>
  row.first ? needsForm7203(routed.entity) : undefined,
);
const notAtRiskColumn = amountColumn((routed, row) =>
  row.first ? k1sOnForm6198([routed.entity], {}).length > 0 : undefined,
);

/* Column (a): the K-1's name; a related item's line adds its description; a PYA row starts with "PYA". */
function rowName(row: PartIIRow): string {
  if (row.kind === "pya") return `PYA ${row.entity.name}`;
  const description = row.first ? undefined : RELATED_DESCRIPTION[row.kind];
  return description ? `${row.entity.name}, ${description}` : row.entity.name;
}

function rowBindings(row: Row): Record<string, Fn> {
  const entity = (info: Info) => rowAt(info, row)?.entity;
  const prefix = `1.line.28_row_${row}`;
  return {
    [`${prefix}_col_a_name`]: (_, info) => {
      const current = rowAt(info, row);
      return current && rowName(current);
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
    [`${prefix}_col_g_passive_loss_allowed`]: passiveLoss(row),
    [`${prefix}_col_h_passive_income`]: passiveIncome(row),
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
 * expenses. The form asks about a passive loss only "if that loss wasn't
 * reported on Form 8582": an allowed basis loss from an earlier year makes it
 * Yes, and so does a carried passive loss an entire disposition releases
 * (irs-1040se-inst-2025::sec::prior-year-unallowed-losses-from-a-passive::b01).
 */
function priorYearLossAllowed(info: Info): boolean {
  const reported = (entity: PassThroughEntity, item: PassThroughItem) =>
    item.fromPriorYear === true &&
    (item.passiveCarryover !== true || releasedOnDisposition(entity));
  return routedEntities(info).some(
    (routed) =>
      routed.entity.form !== "1041" &&
      routed.kind === "routed" &&
      routed.allowed.some((item) => reported(routed.entity, item)),
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
  // Line 26 is Form 8582 line 6's gap with a K-1 (8582/magiGap.ts): line 41 shows it too.
  const magiGap = info.partIInUse ? magiWithK1Gap((fieldId) => form[fieldId], info) : undefined;
  if (magiGap) return magiGap;
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
