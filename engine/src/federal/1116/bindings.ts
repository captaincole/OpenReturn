/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { form1116Set, isGap, type CopyLines, type Value } from "./copies.js";
import type { Form1116FilingInfo } from "./filingInfo.js";
import type { PartIVLines } from "./lines.js";
import type { PartIColumn, PartIIRow } from "./partI.js";
import type { Accessor } from "./returnAmounts.js";
import type { ForeignIncomeKind } from "./sources.js";
import type { Form1116 } from "./types.js";

/* A binding of any field; each helper checks its own value type. */
type Fn = (form: FormAccessor<Form1116>, info: Form1116FilingInfo) => never;
type Printed = string | number | boolean | Unsupported | undefined;

const NO_COUNTRY =
  "No document or answer names the country for this column (1099-INT box 7, or the foreign income statement).";
const NO_RESIDENCE =
  "No home address in a U.S. state, and the instructions give no rule for line h.";

/* The copy this render prints (0, the summary copy, by default), or why the form has none. */
function copyOf(form: Accessor, info: Form1116FilingInfo): CopyLines | Unsupported | undefined {
  const set = form1116Set(form, info);
  if (set === undefined || isGap(set)) return set;
  return set.copies[info.form1116CopyIndex ?? 0];
}

/* A field of the copy: blank with no form, the gap with one. */
function onCopy(pick: (copy: CopyLines, info: Form1116FilingInfo) => Printed): Fn {
  return (form, info) => {
    const copy = copyOf(form, info);
    if (copy === undefined || isGap(copy)) return copy as never;
    return pick(copy, info) as never;
  };
}

/* A Part I field of column `index`: blank past the last column; the Part I gap or wait. */
function onColumn(index: number, pick: (column: PartIColumn) => Printed): Fn {
  return onCopy((copy) => {
    if (index >= copy.columns.length) return undefined;
    if (!Array.isArray(copy.partI)) return copy.partI;
    return pick(copy.partI[index]);
  });
}

function onRow(index: number, pick: (row: PartIIRow) => Printed): Fn {
  return onCopy((copy) =>
    index < copy.columns.length ? pick(copy.columns[index].partII) : undefined,
  );
}

/* A Part I total (lines 1a and 6) over every column, the ones past C included. */
function onPartITotal(pick: (column: PartIColumn) => number): Fn {
  return onCopy((copy) => {
    if (!Array.isArray(copy.partI)) return copy.partI;
    return copy.partI.reduce((total, column) => total + pick(column), 0);
  });
}

/* A Part III line; 0 prints blank where the form leaves a line empty (lines 10, 12, 13, 16, 22). */
const line = (pick: (copy: CopyLines) => Value, zeroBlank = false): Fn =>
  onCopy((copy) => {
    const value = pick(copy);
    return zeroBlank && value === 0 ? undefined : value;
  });

/* Part IV, on the summary copy only. */
function partIV(pick: (lines: PartIVLines) => number | undefined): Fn {
  return (form, info) => {
    if ((info.form1116CopyIndex ?? 0) !== 0) return undefined as never;
    const set = form1116Set(form, info);
    if (set === undefined || isGap(set)) return set as never;
    const lines = set.partIV;
    return (lines === undefined || isGap(lines) ? lines : pick(lines)) as never;
  };
}

const ratioText = (ratio: Value) => (typeof ratio === "number" ? String(ratio) : ratio);

const COLUMN_LETTERS = ["a", "b", "c"] as const;

const PART_I_COLUMN_FIELDS: Record<string, (column: PartIColumn) => Printed> = {
  "0.line.1a_gross_foreign_income": (column) => column.line1a,
  "0.line.2_expenses_definitely_related": (column) => column.line2,
  "0.line.3a_itemized_or_standard_deduction": (column) => column.line3a,
  "0.line.3b_other_deductions": (column) => column.line3b,
  "0.line.3c_add_lines_3a_3b": (column) => column.line3c,
  "0.line.3d_gross_foreign_source_income": (column) => column.line3d,
  "0.line.3e_gross_income_all_sources": (column) => column.line3e,
  "0.line.3f_divide_3d_by_3e": (column) => String(column.line3f),
  "0.line.3g_multiply_3c_by_3f": (column) => column.line3g,
  "0.line.4a_home_mortgage_interest": (column) => column.line4a,
  // MANUAL EDIT: line 4b is blank unless the asset method applies, and that case is a Part I gap (copies.ts).
  "0.line.4b_other_interest_expense": () => undefined,
  // MANUAL EDIT: line 5: no foreign tax source carries a loss.
  "0.line.5_losses_from_foreign_sources": () => undefined,
  "0.line.6_total_deductions_and_losses": (column) => column.line6,
};

const ROW_KINDS: ReadonlyArray<[ForeignIncomeKind, string, string]> = [
  ["dividends", "foreign_currency_withheld_dividends_col_m", "usd_withheld_dividends_col_q"],
  [
    "rents_royalties",
    "foreign_currency_withheld_rents_royalties_col_n",
    "usd_withheld_rents_royalties_col_r",
  ],
  ["interest", "foreign_currency_withheld_interest_col_o", "usd_withheld_interest_col_s"],
  ["other", "foreign_currency_other_taxes_col_p", "usd_other_taxes_col_t"],
];

function columnBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  COLUMN_LETTERS.forEach((letter, index) => {
    out[`0.line.i_foreign_country_name_col_${letter}`] = onCopy((copy) => {
      if (index >= copy.columns.length) return undefined;
      return copy.columns[index].country ?? unsupported(NO_COUNTRY);
    });
    for (const [field, pick] of Object.entries(PART_I_COLUMN_FIELDS)) {
      out[`${field}_col_${letter}`] = onColumn(index, pick);
    }
    const row = `0.line.row_${letter}`;
    out[`${row}_date_paid_or_accrued_col_l`] = onRow(index, (each) => each.date);
    for (const [kind, foreign, dollars] of ROW_KINDS) {
      out[`${row}_${foreign}`] = onRow(index, (each) => each.foreignCurrency[kind]);
      out[`${row}_${dollars}`] = onRow(index, (each) => each.dollars[kind]);
    }
    out[`${row}_total_foreign_taxes_col_u`] = onRow(index, (each) => each.total);
  });
  return out;
}

/* Line 1a's dotted line: the income types, in source order. */
function incomeTypes(copy: CopyLines): string {
  const names = copy.columns
    .flatMap((column) => column.sources)
    .map(
      (source) =>
        source.description ?? (source.incomeKind === "interest" ? "Interest" : "Dividends"),
    );
  return [...new Set(names)].join(", ");
}

export function register(): void {
  defineForm<Form1116, Form1116FilingInfo>("form-1116", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,

      // MANUAL EDIT: one box per form (irs-1116-inst-2025::sec::categories-of-income::b01); the engine figures c and d.
      "0.header.a_section_951a_category_income": onCopy(() => undefined),
      "0.header.b_foreign_branch_category_income": onCopy(() => undefined),
      "0.header.c_passive_category_income": onCopy((copy) =>
        copy.category === "passive" ? true : undefined,
      ),
      "0.header.d_general_category_income": onCopy((copy) =>
        copy.category === "general" ? true : undefined,
      ),
      "0.header.e_section_901j_income": onCopy(() => undefined),
      "0.header.f_income_resourced_by_treaty": onCopy(() => undefined),
      "0.header.g_lump_sum_distributions": onCopy(() => undefined),
      // MANUAL EDIT: line h has no instruction; a U.S. home address prints "United States" (QUESTIONS.md).
      "0.header.h_resident_of_country": onCopy(
        (_, info) => info.foreignTax?.residentOf ?? unsupported(NO_RESIDENCE),
      ),
      ...(columnBindings() as Record<string, never>),
      "0.line.1a_gross_income_description": onCopy((copy) => incomeTypes(copy)),
      "0.line.1a_gross_foreign_income_total": onPartITotal((column) => column.line1a),
      // MANUAL EDIT: irs-1116-inst-2025::sec::line-1b::b01: alternative-basis compensation of $250,000 or more.
      "0.line.1b_compensation_alternative_basis": onCopy((copy) => copy.line1b),
      "0.line.6_total_deductions_and_losses_total": onPartITotal((column) => column.line6),
      "0.line.7_net_foreign_source_income": line((copy) => copy.line15),
      // MANUAL EDIT: (j) Paid unless the taxpayer chose to credit accrued taxes (part-ii-foreign-taxes-paid-or::b01).
      "0.line.j_credit_claimed_taxes_paid": onCopy((_, info) =>
        info.foreignTax?.claimAccrued === true ? undefined : true,
      ),
      "0.line.k_credit_claimed_taxes_accrued": onCopy((_, info) =>
        info.foreignTax?.claimAccrued === true ? true : undefined,
      ),
      "0.line.8_total_foreign_taxes_paid": line((copy) => copy.line8),
      "1.line.9_foreign_taxes_from_line_8": line((copy) => copy.line8),
      // MANUAL EDIT: the box is for a carryback with no Schedule B; a carryover needs Schedule B (part-iii-figuring-the-credit::b01).
      "1.line.10_no_schedule_b_checkbox": onCopy(() => undefined),
      "1.line.10_carryover_carryback_foreign_taxes": line((copy) => copy.line10, true),
      "1.line.11_add_lines_9_10": line((copy) => copy.line11),
      "1.line.12_reduction_in_foreign_taxes": line((copy) => copy.line12, true),
      "1.line.13_taxes_reclassified_high_tax_kickout": line((copy) => copy.line13, true),
      "1.line.14_foreign_taxes_available_for_credit": line((copy) => copy.line14),
      "1.line.15_foreign_taxable_income_from_line_7": line((copy) => copy.line15),
      "1.line.16_adjustments_to_line_15": line((copy) => copy.line16, true),
      "1.line.17_net_foreign_source_taxable_income": line((copy) => copy.line17),
      "1.line.18_taxable_income_all_sources": line((copy) => copy.line18),
      "1.line.19_foreign_income_ratio": onCopy((copy) => ratioText(copy.line19)),
      "1.line.20_tax_before_credits": line((copy) => copy.line20),
      "1.line.21_maximum_amount_of_credit": line((copy) => copy.line21),
      "1.line.22_increase_in_limitation_960c": line((copy) => copy.line22, true),
      "1.line.23_add_lines_21_22": line((copy) => copy.line23),
      "1.line.24_smaller_of_line_14_or_23": line((copy) => copy.line24),
      // MANUAL EDIT: Part IV (part-iv-summary-of-separate::b01): the engine's categories are lines 27 and 28.
      "1.line.25_credit_section_951a_income": partIV(() => undefined),
      "1.line.26_credit_foreign_branch_income": partIV(() => undefined),
      "1.line.27_credit_passive_category_income": partIV((lines) => lines.line27),
      "1.line.28_credit_general_category_income": partIV((lines) => lines.line28),
      "1.line.29_credit_section_901j_income": partIV(() => undefined),
      "1.line.30_credit_income_resourced_by_treaty": partIV(() => undefined),
      "1.line.31_credit_lump_sum_distributions": partIV(() => undefined),
      "1.line.32_add_lines_25_through_31": partIV((lines) => lines.line32),
      "1.line.33_smaller_of_line_20_or_32": partIV((lines) => lines.line33),
      // MANUAL EDIT: line 34, the boycott reduction (line-12-2::b04, b05): no fact holds Form 5713.
      "1.line.34_reduction_international_boycott": partIV(() => undefined),
      "1.line.35_foreign_tax_credit": partIV((lines) => lines.line35),
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
