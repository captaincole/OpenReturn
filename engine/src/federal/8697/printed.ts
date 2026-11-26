/*
 * How the plan prints on each copy of Form 8697. The first copy is the whole
 * form. A later copy holds the next prior-year columns: "enter your name,
 * identifying number, and tax year. Complete lines 1 through 8 (as
 * applicable), but do not enter totals in column (c)"
 * (irs-8697-inst-2025::sec::part-i-regular-method::b01; Part II the same with
 * lines 1 through 9 and column (d), ::part-ii-simplified-marginal-impact::b02).
 */

import { numberOrBlank, roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8697FilingInfo } from "./filingInfo.js";
import {
  FILING_YEAR,
  PART_I_COLUMNS_PER_FORM,
  PART_II_COLUMNS_PER_FORM,
  type RegularColumnLines,
  type SimplifiedColumnLines,
} from "./lines.js";
import type { Form8697Plan, Form8697Totals, PlannedColumn } from "./plan.js";

export type Value = number | string | boolean;
export type Accessor = { readonly [fieldId: string]: unknown };
export type Binding = (form: Accessor, info: Form8697FilingInfo) => Value | Unsupported | undefined;
type Method = Form8697Plan["method"];

const copyIndexOf = (info: Form8697FilingInfo): number => info.form8697CopyIndex ?? 0;

/* A line of the form: blank with no plan; unsupported with a gap in the fact. */
export function planLine(
  pick: (
    plan: Form8697Plan,
    info: Form8697FilingInfo,
    form: Accessor,
  ) => Value | Unsupported | undefined,
): Binding {
  return (form, info) => {
    const plan = info.form8697;
    if (plan === undefined) return undefined;
    if (plan.gap !== undefined) return unsupported(plan.gap);
    return pick(plan, info, form);
  };
}

/* A line of one part: blank on the part the method does not use. */
export function partLine(
  method: Method,
  pick: (
    plan: Form8697Plan,
    info: Form8697FilingInfo,
    form: Accessor,
  ) => Value | Unsupported | undefined,
): Binding {
  return planLine((plan, info, form) =>
    plan.method === method ? pick(plan, info, form) : undefined,
  );
}

/* A line of the first copy only. */
export function firstCopyLine(
  method: Method | undefined,
  pick: (
    plan: Form8697Plan,
    info: Form8697FilingInfo,
    form: Accessor,
  ) => Value | Unsupported | undefined,
): Binding {
  return planLine((plan, info, form) => {
    if (copyIndexOf(info) !== 0) return undefined;
    if (method !== undefined && plan.method !== method) return undefined;
    return pick(plan, info, form);
  });
}

/* The column this copy prints at `index` (0 = column (a)); undefined when the copy does not use it. */
function columnAt<L>(
  columns: ReadonlyArray<PlannedColumn<L>>,
  info: Form8697FilingInfo,
  perForm: number,
  index: number,
): PlannedColumn<L> | undefined {
  return columns[copyIndexOf(info) * perForm + index];
}

export function regularColumnLine(
  index: number,
  pick: (column: PlannedColumn<RegularColumnLines>) => Value | undefined,
): Binding {
  return partLine("regular", (plan, info) => {
    const column = columnAt(plan.regularColumns, info, PART_I_COLUMNS_PER_FORM, index);
    return column === undefined ? undefined : pick(column);
  });
}

export function simplifiedColumnLine(
  index: number,
  pick: (column: PlannedColumn<SimplifiedColumnLines>) => Value | undefined,
): Binding {
  return partLine("simplified_marginal_impact", (plan, info) => {
    const column = columnAt(plan.simplifiedColumns, info, PART_II_COLUMNS_PER_FORM, index);
    return column === undefined ? undefined : pick(column);
  });
}

/* An interest line of a column: unsupported with an interest gap in a column the copy uses. */
export function interestColumnLine(
  method: Method,
  index: number,
  pick: (column: PlannedColumn<RegularColumnLines | SimplifiedColumnLines>) => number | undefined,
): Binding {
  return partLine(method, (plan, info) => {
    const columns: ReadonlyArray<PlannedColumn<RegularColumnLines | SimplifiedColumnLines>> =
      method === "regular" ? plan.regularColumns : plan.simplifiedColumns;
    const perForm = method === "regular" ? PART_I_COLUMNS_PER_FORM : PART_II_COLUMNS_PER_FORM;
    const column = columnAt(columns, info, perForm, index);
    if (column === undefined) return undefined;
    if (plan.interestGap !== undefined) return unsupported(plan.interestGap);
    return roundDollars(pick(column));
  });
}

/* A total or net line of the first copy: unsupported with an interest gap. */
export function totalLine(
  method: Method,
  pick: (totals: Form8697Totals) => number | undefined,
): Binding {
  return firstCopyLine(method, (plan) => {
    if (plan.interestGap !== undefined) return unsupported(plan.interestGap);
    return plan.totals === undefined ? undefined : pick(plan.totals);
  });
}

/* The "Year ended" heading of a column: a calendar year ends in month 12. */
const DECEMBER = "12";
export const yearEndedMonth = (): string => DECEMBER;
export const yearEndedYear = (column: { taxYear: number }): string => String(column.taxYear);

/*
 * The filing-year column of Part I (::part-i-regular-method::b01): line 1 is
 * the 2025 return's taxable income, Form 1040 line 15; the taxpayer states
 * lines 2 and 4. First copy only.
 */
export function filingYearLine(
  pick: (line1: number | undefined, plan: Form8697Plan) => Value | undefined,
): Binding {
  return firstCopyLine("regular", (plan, _, form) =>
    pick(numberOrBlank(form["form-1040.line.15"]), plan),
  );
}

export const filingYearAdjustment = (plan: Form8697Plan): number | undefined =>
  plan.value.method === "regular"
    ? roundDollars(plan.value.filingYear.incomeAdjustment)
    : undefined;
export const filingYearTax = (plan: Form8697Plan): number | undefined =>
  plan.value.method === "regular"
    ? roundDollars(plan.value.filingYear.taxOnAdjustedIncome)
    : undefined;

/* "For the filing year beginning ..., and ending ..." (::filing-year::b01): the calendar year 2025. */
export const FILING_YEAR_BEGINNING = `01/01/${FILING_YEAR}`;
export const FILING_YEAR_ENDING = `12/31/${FILING_YEAR}`;

/*
 * Lines 9b–9d (10b–10d): the account, when interest is to be refunded and the
 * fact names one (::line-9a::b02). Blank otherwise: the refund comes by check.
 */
export function depositLine(
  method: Method,
  pick: (deposit: NonNullable<Form8697Plan["value"]["refundDeposit"]>) => Value | undefined,
): Binding {
  return firstCopyLine(method, (plan) => {
    if (plan.interestGap !== undefined) return unsupported(plan.interestGap);
    const deposit = plan.value.refundDeposit;
    return plan.totals?.net.refund === undefined || deposit === undefined
      ? undefined
      : pick(deposit);
  });
}

/* "Enter your address only if you are filing this form separately" (::filing-year::b01): a refund of interest. */
export function addressLine(pick: (info: Form8697FilingInfo) => string | undefined): Binding {
  return firstCopyLine(undefined, (plan, info) => {
    if (plan.interestGap !== undefined) return unsupported(plan.interestGap);
    return plan.totals?.net.refund === undefined ? undefined : pick(info);
  });
}

const MORE_THAN_ONE_ENTITY =
  "More than one pass-through entity holds the contracts: item C takes an attached schedule (the form face, item C), and the engine writes no schedules.";

/* Item C: the one entity that holds the contracts; blank for the taxpayer's own contracts. */
export function entityLine(pick: (entity: { name: string; ein: string }) => string): Binding {
  return firstCopyLine(undefined, (plan) => {
    const entities = plan.value.entities ?? [];
    if (entities.length > 1) return unsupported(MORE_THAN_ONE_ENTITY);
    return entities.length === 1 ? pick(entities[0]) : undefined;
  });
}
