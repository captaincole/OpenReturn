/*
 * MANUAL EDIT: Part II, Sections A and B (ca-5870a-face-2025::sec::face-part-ii::b01;
 * ca-5870a-inst-2025::sec::section-a::b01 to ::b04, ::section-b::b01 to ::b04).
 * A section prints only when the accumulation period picks it; a "No" year's
 * column holds only its "No".
 */

import {
  columnRow,
  lineOf,
  totalOf,
  type Binding,
  type Bindings,
  type FiguredRow,
  type StatedRow,
} from "./bindingHelpers.js";
import type { PartIILines } from "./filingInfo.js";
import { PRECEDING_YEARS } from "./lines.js";

const LETTERS = ["a", "b", "c", "d", "e"] as const;

type Section = PartIILines["section"];

const partIIOf =
  <T extends number | string>(section: Section, pick: (partII: PartIILines) => T | undefined) =>
  (form: unknown, info: Parameters<Binding>[1]) =>
    lineOf((lines) => (lines.partII?.section === section ? pick(lines.partII) : undefined))(
      form,
      info,
    );

/* The rows of a year's column, Section A lines 4 to 13 (Section B 6 to 15). */
const ROWS: ReadonlyArray<StatedRow | FiguredRow> = [
  "taxableIncome",
  "share",
  "recomputed",
  "tax",
  "taxBeforeCredits",
  "additionalTax",
  "creditAdjustment",
  "afterCredits",
  "minimumTaxChange",
  "total",
];

const SECTION_A_NAMES = [
  "4_taxable_income_before_distribution",
  "5_distribution_amount",
  "6_recomputed_taxable_income",
  "7_tax_on_recomputed_income",
  "8_tax_before_credits",
  "9_additional_tax_before_credits",
  "10_tax_credit_adjustment",
  "11_additional_tax_after_credits",
  "12_amt_adjustments",
  "13_additional_tax_with_amt",
];

const SECTION_B_NAMES = [
  "6_taxable_income_before_distribution",
  "7_distribution_amount",
  "8_recomputed_taxable_income",
  "9_tax_on_recomputed_income",
  "10_tax_before_credits",
  "11_additional_tax_before_credits",
  "12_tax_credit_adjustment",
  "13_additional_tax_after_credits",
  "14_amt_adjustments",
  "15_additional_tax_with_amt",
];

/* The columns of one section: the resident box and the rows, column (a) 2024 back. */
function columnBindings(
  section: Section,
  prefix: string,
  residentLine: string,
  names: readonly string[],
): Bindings {
  const letters = section === "A" ? LETTERS : LETTERS.slice(0, 4);
  const entries = letters.flatMap((letter, index) => {
    const year = PRECEDING_YEARS[index];
    const resident: [string, Binding] = [
      `${prefix}.${residentLine}_col_${letter}`,
      partIIOf(section, (partII) => {
        const entry = partII.residentYears.find((each) => each.year === year);
        return entry === undefined ? undefined : entry.resident ? "yes" : "no";
      }),
    ];
    const rows = names.map((name, row): [string, Binding] => [
      `${prefix}.${name}_col_${letter}`,
      lineOf((lines) => {
        if (lines.partII?.section !== section) return undefined;
        const entry = lines.partII.columns.find((each) => each.year === year);
        return columnRow(entry, ROWS[row]);
      }),
    ]);
    return [resident, ...rows];
  });
  return Object.fromEntries(entries) as Bindings;
}

const totalLine = (section: Section): Binding<number> =>
  lineOf((lines, figured) =>
    lines.partII?.section === section ? totalOf(lines.partII.total, figured.taxGap) : undefined,
  );

export function partIIBindings(): Bindings {
  return {
    "1.part2a.1_income_accumulated_five_or_more": partIIOf("A", (partII) => partII.line1),
    // Line 2 also goes on Schedule CA (540) line 8z column C (section-a::b01).
    "1.part2a.2_line_1_divided_by_six": partIIOf("A", (partII) => partII.share),
    ...columnBindings("A", "1.part2a", "3_resident_or_part_year", SECTION_A_NAMES),
    "1.part2a.14_total_additional_tax": totalLine("A"),
    "1.part2b.1_income_accumulated_under_five": partIIOf("B", (partII) => partII.line1),
    "1.part2b.2a_years_trust_accumulated": partIIOf("B", (partII) => partII.years),
    "1.part2b.3_averaging_factor_total": partIIOf("B", (partII) => partII.averagingFactor),
    // Line 4 also goes on Schedule CA (540) line 8z column C (section-b::b01).
    "1.part2b.4_line_1_divided_by_line_3": partIIOf("B", (partII) => partII.share),
    ...columnBindings("B", "1.part2b", "5_resident_or_part_year", SECTION_B_NAMES),
    "1.part2b.16_total_additional_tax": totalLine("B"),
  } as Bindings;
}
