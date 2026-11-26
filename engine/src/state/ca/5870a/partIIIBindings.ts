/*
 * MANUAL EDIT: Part III, the Behavioral Health Services Tax on the recomputed
 * income (ca-5870a-face-2025::sec::face-part-iii::b01;
 * ca-5870a-inst-2025::sec::section-a-2::b01, ::section-b-2::b01). Each column
 * lists one year checked "Yes" in Part II, in Part II's order. The part is
 * blank unless a recomputed income is over $1,000,000.
 */

import { lineOf, totalOf, type Binding, type Bindings } from "./bindingHelpers.js";
import type { PartIILines } from "./filingInfo.js";
import type { PartIIIColumn } from "./lines.js";

const LETTERS = ["a", "b", "c", "d", "e"] as const;

type Section = PartIILines["section"];

const ROWS: ReadonlyArray<[string, keyof Omit<PartIIIColumn, "year">]> = [
  ["1_recomputed_taxable_income", "line1"],
  ["2_income_over_1000000", "line2"],
  ["3_one_percent_tax", "line3"],
  ["4_bhst_paid_before_distribution", "line4"],
  ["5_additional_bhst", "line5"],
];

const columnLine = (
  section: Section,
  index: number,
  pick: (entry: PartIIIColumn) => number | string,
): Binding =>
  lineOf((lines) => {
    if (lines.partII?.section !== section) return undefined;
    const entry = lines.partIII?.columns[index];
    return entry === undefined ? undefined : pick(entry);
  });

function sectionBindings(section: Section, prefix: string): Bindings {
  const letters = section === "A" ? LETTERS : LETTERS.slice(0, 4);
  const entries = letters.flatMap((letter, index) => [
    [`${prefix}.tax_year_col_${letter}`, columnLine(section, index, (entry) => String(entry.year))],
    ...ROWS.map(([name, row]) => [
      `${prefix}.${name}_col_${letter}`,
      columnLine(section, index, (entry) => entry[row]),
    ]),
  ]);
  const total: Binding<number> = lineOf((lines, figured) =>
    lines.partII?.section === section ? totalOf(lines.partIII?.line6, figured.bhstGap) : undefined,
  );
  return { ...Object.fromEntries(entries), [`${prefix}.6_total_bhst`]: total } as Bindings;
}

export function partIIIBindings(): Bindings {
  return {
    ...sectionBindings("A", "2.part3_section_a"),
    ...sectionBindings("B", "2.part3_section_b"),
  };
}
