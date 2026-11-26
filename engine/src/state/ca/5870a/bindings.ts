/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { ein } from "../../../values.js";
import {
  answerOf,
  columnRow,
  lineOf,
  totalOf,
  type Binding,
  type Bindings,
  type FiguredRow,
  type StatedRow,
} from "./bindingHelpers.js";
import type { Form5870AFilingInfo, PartILines } from "./filingInfo.js";
import type { PartISectionA, PartITotals } from "./lines.js";
import { partIIBindings } from "./partIIBindings.js";
import { partIIIBindings } from "./partIIIBindings.js";
import type { Form5870A } from "./types.js";

const LETTERS = ["a", "b", "c", "d", "e"] as const;

/* The trust's FEIN, nine digits (the box takes nine); undefined when the stated number is not nine digits. */
function feinOf(raw: string): string | undefined {
  try {
    return ein(raw);
  } catch {
    return undefined;
  }
}

/* MANUAL EDIT: the header (ca-5870a-face-2025::sec::face-header::b01). */
function headerBindings(): Bindings {
  return {
    "0.header.name": (_, info) => namesOnReturn(info),
    // The beneficiary's number, the spouse's when the spouse is the beneficiary (QUESTIONS.md).
    "0.header.ssn_or_itin": answerOf((copy, info) =>
      copy.beneficiary === "spouse" ? info.spouseSSN : info.taxpayerSSN,
    ),
    "0.header.trust_name": answerOf((copy) => copy.trustName),
    "0.header.trust_fein": answerOf((copy) => feinOf(copy.trustEin)),
    "0.header.trust_address": answerOf((copy) => copy.california?.trustStreet),
    "0.header.trust_city": answerOf((copy) => copy.california?.trustCity),
    "0.header.trust_state": answerOf((copy) => copy.california?.trustState),
    "0.header.trust_zip": answerOf((copy) => copy.california?.trustZip),
    // "Enter number of trusts from which you received accumulation distributions in this taxable year."
    "0.header.number_of_trusts": (_, info) => info.form5870ATrustCount || undefined,
  };
}

const partIOf =
  (pick: (partI: PartILines) => number | string | undefined): Binding =>
  (form, info) =>
    lineOf((lines) => (lines.partI ? pick(lines.partI) : undefined))(form, info);

const sectionALine = (pick: (lines: PartISectionA) => number) =>
  partIOf((partI) => pick(partI.sectionA));

/*
 * MANUAL EDIT: Part I Section A
 * (ca-5870a-inst-2025::sec::part-i-tax-on-accumulation-distribution::b02 to ::b05).
 */
function sectionABindings(): Bindings {
  const line11 = Object.fromEntries(
    [2024, 2023, 2022, 2021, 2020].map((year, index) => [
      `0.part1.11_taxable_income_${year}`,
      partIOf((partI) => partI.line11[index]),
    ]),
  );
  return {
    "0.part1.1_current_distribution_earlier_years": sectionALine((lines) => lines.line1),
    "0.part1.2_taxes_imposed_on_trust": sectionALine((lines) => lines.line2),
    "0.part1.3_total": sectionALine((lines) => lines.line3),
    "0.part1.4_tax_exempt_interest": sectionALine((lines) => lines.line4),
    "0.part1.5_taxable_part": sectionALine((lines) => lines.line5),
    "0.part1.6_earlier_years_distributed": sectionALine((lines) => lines.line6),
    "0.part1.7_average_annual_amount": sectionALine((lines) => lines.line7),
    "0.part1.8_line_7_times_25_percent": sectionALine((lines) => lines.line8),
    "0.part1.9_earlier_years_taken_into_account": sectionALine((lines) => lines.line9),
    "0.part1.10_average_amount_recomputing_tax": sectionALine((lines) => lines.line10),
    ...line11,
  } as Bindings;
}

/* Part I lines 12 to 21, the field names and the row each holds. */
const SECTION_B_ROWS: ReadonlyArray<[string, StatedRow | FiguredRow]> = [
  ["12_taxable_income", "taxableIncome"],
  ["13_amount_from_line_10", "share"],
  ["14_recomputed_taxable_income", "recomputed"],
  ["15_tax_on_line_14", "tax"],
  ["16_tax_before_credits", "taxBeforeCredits"],
  ["17_additional_tax_before_credits", "additionalTax"],
  ["18_tax_credit_adjustment", "creditAdjustment"],
  ["19_see_instructions", "afterCredits"],
  ["20_amt_adjustments", "minimumTaxChange"],
  ["21_combine_lines_19_20", "total"],
];

/* MANUAL EDIT: Part I Section B, lines 12 to 21 in the three kept years (::b05, ::b06). */
function sectionBColumnBindings(): Bindings {
  const entries = LETTERS.slice(0, 3).flatMap((letter, index) => {
    const columnOf = (partI: PartILines) => partI.columns[index];
    const year: [string, Binding][] = [
      [
        `0.part1.section_b_year_col_${letter}`,
        partIOf((partI) => String(partI.columns[index].year)),
      ],
    ];
    const rows = SECTION_B_ROWS.map(([name, row]): [string, Binding] => [
      `0.part1.${name}_col_${letter}`,
      lineOf((lines) => (lines.partI ? columnRow(columnOf(lines.partI), row) : undefined)),
    ]);
    return [...year, ...rows];
  });
  return Object.fromEntries(entries) as Bindings;
}

const totalLine = (pick: (totals: PartITotals) => number): Binding<number> =>
  lineOf((lines, figured) => {
    const { partI } = lines;
    if (partI === undefined) return undefined;
    return totalOf(partI.totals ? pick(partI.totals) : undefined, figured.taxGap);
  });

/* MANUAL EDIT: Part I lines 22 to 26 (face-part-i::b01; ::b06). */
function totalBindings(): Bindings {
  return {
    "0.part1.22_total_line_21_columns": totalLine((totals) => totals.line22),
    "0.part1.23_line_22_divided_by_3": totalLine((totals) => totals.line23),
    "0.part1.24_line_23_times_years": totalLine((totals) => totals.line24),
    "0.part1.25_amount_from_line_2": totalLine((totals) => totals.line25),
    "0.part1.26_partial_tax_accumulation_distribution": totalLine((totals) => totals.line26),
  };
}

export function register(): void {
  defineForm<Form5870A, Form5870AFilingInfo>("form-5870a", {
    bindings: {
      ...headerBindings(),
      ...sectionABindings(),
      ...sectionBColumnBindings(),
      ...totalBindings(),
      ...partIIBindings(),
      ...partIIIBindings(),
    },
  });
}
