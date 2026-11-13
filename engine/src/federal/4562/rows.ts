/*
 * Form 4562 table rows: lines 19a–19j (one row per class, two for 19i and 19j)
 * and line 42 (two rows). MANUAL EDIT: hand-written, spread into bindings.ts.
 */

import type { BindingFn } from "../../defineForm.js";
import type { DepreciationMethod } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { RECOVERY_YEARS, type FederalAssetFigures } from "./assets.js";
import type { Form4562FilingInfo } from "./filingInfo.js";
import { amortizationThisYear, form4562Figures, type Line19Row } from "./lines.js";
import type { Form4562 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form4562]: BindingFn<Form4562, Form4562FilingInfo, K> }>;
type AnyBinding = BindingFn<Form4562, Form4562FilingInfo, keyof Form4562>;

/* irs-4562-inst-2025::sec::recovery-period-for-most-property::b03: "200 DB", "150 DB" or "S/L". */
const METHOD_TEXT: Record<DepreciationMethod, string> = {
  "200DB": "200 DB",
  "150DB": "150 DB",
  SL: "S/L",
};

const SPLIT_ROW =
  "The class has assets with different methods or conventions; its one row cannot show them, and the engine writes no attached statement.";
const MORE_THAN_TWO_MONTHS =
  "The real property was placed in service in more than two months; the form has two rows, and the engine writes no attached statement.";
const MORE_THAN_TWO_COSTS =
  "More than two costs begin amortization in 2025; the form has two rows on line 42, and the engine writes no attached statement.";
export const LINE_42_ROWS = 2;
const REAL_PROPERTY_ROWS = 2;

/* The activity this copy is for. */
export function activityOf(info: Form4562FilingInfo) {
  return info.form4562Activities?.[info.form4562CopyIndex ?? 0];
}

function line19Row(info: Form4562FilingInfo, row: string): Line19Row | undefined {
  const activity = activityOf(info);
  if (!activity) return undefined;
  return form4562Figures(activity.depreciation).line19.find((entry) => entry.row === row);
}

/* A row's single method and convention; undefined when its assets differ. */
function sharedText(row: Line19Row, part: "method" | "convention"): string | undefined {
  const values = new Set(row.assets.map((figures) => figures.asset[part]));
  if (values.size !== 1) return undefined;
  const [value] = [...values];
  return part === "method" ? METHOD_TEXT[value as DepreciationMethod] : value;
}

const monthYear = (date: string) => {
  const [year, month] = date.split("-");
  return `${month}/${year}`;
};

/* Lines 19a–19g: basis, period, convention, method and deduction for one class row. */
function classRowBindings(row: string): Record<string, AnyBinding> {
  const split = (entry: Line19Row) =>
    sharedText(entry, "method") === undefined || sharedText(entry, "convention") === undefined;
  const cell =
    (read: (entry: Line19Row) => unknown): AnyBinding =>
    (_, info) => {
      const entry = line19Row(info, row);
      if (!entry) return undefined;
      return (split(entry) ? unsupported(SPLIT_ROW) : read(entry)) as never;
    };
  return {
    [`0.line.${row}_basis`]: cell((entry) => entry.basis),
    [`0.line.${row}_recovery_period`]: cell(
      (entry) => `${RECOVERY_YEARS[entry.assets[0].asset.recoveryClass]} yrs.`,
    ),
    [`0.line.${row}_convention`]: cell((entry) => sharedText(entry, "convention")),
    [`0.line.${row}_method`]: cell((entry) => sharedText(entry, "method")),
    [`0.line.${row}_deduction`]: cell((entry) => entry.deduction),
  };
}

interface MonthGroup {
  monthYear: string;
  members: FederalAssetFigures[];
}

/* Lines 19h–19j: the assets of the row for the index-th month placed in service. */
function monthGroup(
  info: Form4562FilingInfo,
  line: string,
  index: number,
  rows: number,
): MonthGroup | Unsupported | undefined {
  const entry = line19Row(info, line);
  if (!entry) return undefined;
  const months = [
    ...new Set(entry.assets.map((figures) => monthYear(figures.asset.placedInService))),
  ];
  if (months.length > rows) return unsupported(MORE_THAN_TWO_MONTHS);
  const chosen = months[index];
  if (chosen === undefined) return undefined;
  const members = entry.assets.filter(
    (figures) => monthYear(figures.asset.placedInService) === chosen,
  );
  return { monthYear: chosen, members };
}

/* A column of a month row, rounded; undefined while an asset waits. */
function monthTotal(members: FederalAssetFigures[], part: "macrsBasis" | "depreciation") {
  const amounts = members.map((figures) => figures[part]);
  if (amounts.includes(undefined)) return undefined;
  // Column (c) is rounded once; column (g) adds the assets' rounded deductions (assets.ts).
  return part === "macrsBasis" ? roundDollars(sum(...amounts)) : sum(...amounts);
}

/* Lines 19h–19j: a row per month placed in service (the period, MM and S/L are printed). */
function realPropertyRows(line: string, rows: number): Record<string, AnyBinding> {
  const out: Record<string, AnyBinding> = {};
  for (let index = 0; index < rows; index++) {
    const prefix = rows === 1 ? `0.line.${line}` : `0.line.${line}_row${index + 1}`;
    const cell =
      (read: (group: MonthGroup) => unknown): AnyBinding =>
      (_, info) => {
        const group = monthGroup(info, line, index, rows);
        return (group === undefined || "unsupported" in group ? group : read(group)) as never;
      };
    out[`${prefix}_month_year`] = cell((group) => group.monthYear);
    out[`${prefix}_basis`] = cell((group) => monthTotal(group.members, "macrsBasis"));
    out[`${prefix}_deduction`] = cell((group) => monthTotal(group.members, "depreciation"));
  }
  return out;
}

export function line19Bindings(): Bindings {
  const rows = ["19a", "19b", "19c", "19d", "19e", "19f"].map(classRowBindings);
  const line19g = classRowBindings("19g");
  return Object.assign(
    {},
    ...rows,
    {
      "0.line.19g_basis": line19g["0.line.19g_basis"],
      "0.line.19g_convention": line19g["0.line.19g_convention"],
      "0.line.19g_deduction": line19g["0.line.19g_deduction"],
    },
    realPropertyRows("19h", 1),
    realPropertyRows("19i", REAL_PROPERTY_ROWS),
    realPropertyRows("19j", REAL_PROPERTY_ROWS),
    {
      // The second 19j row has its own period box: nonresidential real property is 39 years.
      "0.line.19j_row2_recovery_period": (_: unknown, info: Form4562FilingInfo) => {
        const group = monthGroup(info, "19j", 1, REAL_PROPERTY_ROWS);
        return group === undefined || "unsupported" in group ? group : "39 yrs.";
      },
    },
  ) as Bindings;
}

const isoToFormDate = (date: string) => {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
};

/* Line 42: one row per cost whose amortization begins in 2025. */
export function line42Bindings(): Bindings {
  const out: Record<string, AnyBinding> = {};
  for (let index = 0; index < LINE_42_ROWS; index++) {
    const prefix = `2.line.42_row${index + 1}`;
    const cell =
      (read: (cost: NonNullable<ReturnType<typeof costAt>>) => unknown): AnyBinding =>
      (_, info) => {
        const costs = activityOf(info)?.depreciation.amortizedCosts ?? [];
        if (costs.length > LINE_42_ROWS) return unsupported(MORE_THAN_TWO_COSTS) as never;
        const cost = costAt(info, index);
        return (cost ? read(cost) : undefined) as never;
      };
    out[`${prefix}_description`] = cell((cost) => cost.description);
    out[`${prefix}_date_begins`] = cell((cost) => isoToFormDate(cost.beginsOn));
    out[`${prefix}_amortizable_amount`] = cell((cost) => roundDollars(cost.amount));
    out[`${prefix}_code_section`] = cell((cost) => cost.codeSection);
    out[`${prefix}_period_or_percentage`] = cell((cost) => `${cost.periodMonths} months`);
    out[`${prefix}_amortization`] = cell((cost) => amortizationThisYear(cost));
  }
  return out as Bindings;
}

function costAt(info: Form4562FilingInfo, index: number) {
  return activityOf(info)?.depreciation.amortizedCosts?.[index];
}
