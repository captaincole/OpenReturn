/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { METHOD_TEXT, RECOVERY_YEARS } from "../../../federal/4562/assets.js";
import { unsupported } from "../../../types.js";
import { ISODate, isoDate, SSN } from "../../../values.js";
import type { Form3885AFilingInfo } from "./filingInfo.js";
import {
  CA_SECTION_179_GAP,
  form3885AFigures,
  TABLE_ROWS,
  type CaliforniaAmortizationRow,
  type CaliforniaAssetRow,
  type Form3885AFigures,
} from "./lines.js";
import type { Form3885A } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3885A]: BindingFn<Form3885A, Form3885AFilingInfo, K> }>;

/* ca-3885a-inst-2025: the method as the federal Form 4562 column (f) prints it. */
const MORE_ROWS =
  "The activity has more than four rows for this table; the engine writes no attached statement.";

const activityOf = (info: Form3885AFilingInfo) =>
  info.form3885aActivities?.[info.form3885aCopyIndex ?? 0];

const figuresOf = (info: Form3885AFilingInfo) => {
  const activity = activityOf(info);
  return activity ? form3885AFigures(activity.depreciation) : undefined;
};

/* Column (e) in years with one decimal, as 5.0 or 27.5. */
const lifeText = (years: number) => (Number.isInteger(years) ? `${years}.0` : `${years}`);

/* A total line; unsupported with the activity's gap. */
const total =
  (read: (figures: Form3885AFigures) => number | undefined) =>
  (_: unknown, info: Form3885AFilingInfo) => {
    const figures = figuresOf(info);
    if (!figures) return undefined;
    return figures.gap ? unsupported(figures.gap) : read(figures);
  };

function rowBindings<Row>(
  line: "3" | "9",
  rowsOf: (figures: Form3885AFigures) => Row[],
  cells: Record<string, (row: Row) => unknown>,
): Bindings {
  const out: Record<string, unknown> = {};
  for (let index = 0; index < TABLE_ROWS; index++) {
    for (const [column, read] of Object.entries(cells)) {
      out[`0.line.${line}_row${index + 1}_${column}`] = (_: unknown, info: Form3885AFilingInfo) => {
        const figures = figuresOf(info);
        if (!figures) return undefined;
        const rows = rowsOf(figures);
        if (rows.length > TABLE_ROWS) return unsupported(MORE_ROWS);
        const row = rows[index];
        return row === undefined ? undefined : read(row);
      };
    }
  }
  return out as Bindings;
}

/*
 * Line 3 (ca-3885a-inst-2025::sec::line-3::b01): each asset placed in service in
 * 2025, with the California basis; column (e) is the recovery period in years.
 */
const line3Rows = rowBindings<CaliforniaAssetRow>("3", (figures) => figures.line3, {
  description: (row) => row.asset.description,
  date_placed_in_service: (row) => ISODate.usSlash(isoDate(row.asset.placedInService)),
  california_basis: (row) => row.basis,
  method: (row) => METHOD_TEXT[row.asset.method],
  life_or_rate: (row) => lifeText(RECOVERY_YEARS[row.asset.recoveryClass]),
  california_depreciation: (row) => row.depreciation,
});

/* Line 9 (::line-9::b01): each cost whose amortization begins in 2025; column (e) in months. */
const line9Rows = rowBindings<CaliforniaAmortizationRow>("9", (figures) => figures.line9, {
  description: (row) => row.cost.description,
  date_amortization_begins: (row) => ISODate.usSlash(isoDate(row.cost.beginsOn)),
  california_basis: (row) => row.basis,
  code_section: (row) => row.cost.codeSection,
  period_or_percentage: (row) => `${row.cost.periodMonths} months`,
  california_amortization: (row) => row.amortization,
});

export function register(): void {
  defineForm<Form3885A, Form3885AFilingInfo>("form-3885a", {
    bindings: {
      "0.header.name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => (info.taxpayerSSN ? SSN.format(info.taxpayerSSN) : undefined),
      "0.header.business_or_activity": (_, info) => activityOf(info)?.name,
      // Line 1 (ca-3885a-inst-2025::sec::line-1::b01): passive or nonpassive.
      "0.line.1_activity_type": (_, info) => {
        const passive = activityOf(info)?.passive;
        return passive === undefined ? undefined : passive ? "passive" : "nonpassive";
      },
      // Line 2: the Tangible Property Expense Worksheet line 12; its line 11 is not modeled.
      "0.line.2_section_179_expense": (_, info) =>
        (activityOf(info)?.depreciation.assets ?? []).some(
          (asset) => (asset.californiaSection179Elected ?? 0) > 0,
        )
          ? unsupported(CA_SECTION_179_GAP)
          : undefined,
      ...line3Rows,
      "0.line.4_total_line_3": total((figures) => figures.line4),
      "0.line.5_prior_year_depreciation": total((figures) => figures.line5),
      "0.line.6_total_california_depreciation": total((figures) => figures.line6),
      "0.line.7_federal_depreciation": total((figures) => figures.line7),
      "0.line.8a_california_more": total((figures) => figures.line8a),
      "0.line.8b_california_less": total((figures) => figures.line8b),
      ...line9Rows,
      "0.line.10_total_line_9": total((figures) => figures.line10),
      "0.line.11_prior_year_amortization": total((figures) => figures.line11),
      "0.line.12_total_california_amortization": total((figures) => figures.line12),
      "0.line.13_federal_amortization": total((figures) => figures.line13),
      "0.line.14a_california_more": total((figures) => figures.line14a),
      "0.line.14b_california_less": total((figures) => figures.line14b),
    },
  });
}
