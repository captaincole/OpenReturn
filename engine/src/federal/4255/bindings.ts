/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

/*
 * MANUAL EDIT: every field of Form 4255. The form is figured from its facts in
 * resolveInfo.ts (Part I in partOne.ts, Parts II and III in lines.ts); each
 * binding prints one cell. Block ids are in irs-4255-inst-2025::sec.
 */

import { defineForm } from "../../defineForm.js";
import { FORM_4255_LINES, type Form4255Line } from "../../facts/index.js";
import { unsupported, type Unsupported } from "../../types.js";
import { ISODate, isoDate, SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { cellFieldId, LINE_COLUMNS, TOTAL_COLUMNS, type Column } from "./columns.js";
import type { Form4255FilingInfo, Form4255Result } from "./filingInfo.js";
import { percentText, type PartThreeLines, type PropertyLines } from "./lines.js";
import type { Form4255 } from "./types.js";

type Cell = number | string | undefined;
type AnyBinding = (form: unknown, info: Form4255FilingInfo) => Cell | Unsupported;
type Bindings = NonNullable<
  Parameters<typeof defineForm<Form4255, Form4255FilingInfo>>[1]["bindings"]
>;

/* A cell of the figured form: unsupported with a gap, blank when the form does not file or waits. */
const cellOf =
  (read: (result: Form4255Result) => Cell): AnyBinding =>
  (_, info) => {
    if (info.form4255Gap !== undefined) return unsupported(info.form4255Gap);
    return info.form4255 === undefined ? undefined : read(info.form4255);
  };

/* Part I (lines-1-and-2::b01 to totals-by-type::b01): each line's open cells and line 3. */
function partOneBindings(): Record<string, AnyBinding> {
  const out: Record<string, AnyBinding> = {};
  const bind = (line: Form4255Line, column: Column) => {
    out[cellFieldId(line, column)] = cellOf((result) => result.rows[line]?.[column]);
  };
  for (const line of FORM_4255_LINES) for (const column of LINE_COLUMNS[line]) bind(line, column);
  for (const column of TOTAL_COLUMNS)
    out[cellFieldId("3", column)] = cellOf((result) => result.total[column]);
  return out;
}

const usDate = (date: string): string => ISODate.usSlash(isoDate(date));
const PROPERTY_LETTERS = ["a", "b", "c", "d"] as const;

/* Part II's rows (part-ii::b01 to line-17::b01), each read from one property column. */
const PART_TWO_ROWS: ReadonlyArray<[string, (lines: PropertyLines) => Cell]> = [
  ["1_original_rate_of_credit", (lines) => lines.line1],
  ["2_credit_base_previous_year", (lines) => lines.line2],
  ["3_net_change_nonrecourse_financing", (lines) => lines.line3],
  ["4_credit_base_current_year", (lines) => lines.line4],
  ["5_refigured_credit", (lines) => lines.line5],
  ["6_credit_taken_prior_years", (lines) => lines.line6],
  ["7_credit_subject_to_recapture", (lines) => lines.line7],
  ["8_unused_credits_current_base", (lines) => lines.line8],
  ["9_recapture_tax_nonrecourse_financing", (lines) => lines.line9],
  ["10_date_placed_in_service", (lines) => lines.sectionD && usDate(lines.sectionD.line10)],
  ["11_date_ceased_to_qualify", (lines) => lines.sectionD && usDate(lines.sectionD.line11)],
  ["12_full_years_in_service", (lines) => lines.sectionD?.line12],
  ["13_unused_credits_without_property", (lines) => lines.sectionD?.line13],
  ["14_line_6_minus_line_13", (lines) => lines.sectionD?.line14],
  [
    "15_recapture_percentage",
    (lines) => lines.sectionD && percentText(lines.sectionD.line15 / 100),
  ],
  ["16_recapture_tax_disposition", (lines) => lines.sectionD?.line16],
  ["17_irs_registration_number", (lines) => lines.line17],
];

function partTwoBindings(): Record<string, AnyBinding> {
  const out: Record<string, AnyBinding> = {};
  PROPERTY_LETTERS.forEach((letter, index) => {
    const column = (read: (lines: PropertyLines) => Cell) =>
      cellOf((result) => {
        const lines = result.properties[index];
        return lines === undefined ? undefined : read(lines);
      });
    out[`3.part2.section_a_property_${letter}_description`] = column((lines) => lines.description);
    for (const [row, read] of PART_TWO_ROWS) out[`3.part2.${row}_col_${letter}`] = column(read);
  });
  out["3.part2.18_total_line_9_all_properties"] = cellOf((result) => result.partTwoTotals?.line18);
  out["3.part2.19_total_line_16_all_properties"] = cellOf((result) => result.partTwoTotals?.line19);
  out["3.part2.20_total_increase_in_tax"] = cellOf((result) => result.partTwoTotals?.line20);
  return out;
}

/* Part III (part-iii::b01; the form's lines 1–9). */
function partThreeBindings(): Record<string, AnyBinding> {
  const line = (read: (lines: PartThreeLines) => Cell) =>
    cellOf((result) => (result.partThree === undefined ? undefined : read(result.partThree)));
  return {
    "4.part3.1_designed_emissions_rate": line((lines) => lines.line1),
    "4.part3.2_basis_property_placed_in_service": line((lines) => lines.line2),
    "4.part3.3_energy_percentage_credit_year": line((lines) => lines.line3),
    "4.part3.4_basis_times_energy_percentage": line((lines) => lines.line4),
    "4.part3.5_current_year_emissions_rate": line((lines) => lines.line5),
    "4.part3.6_current_year_energy_percentage": line((lines) => lines.line6),
    "4.part3.7_current_percentage_times_basis": line((lines) => lines.line7),
    "4.part3.8_credit_difference": line((lines) => lines.line8),
    "4.part3.9_emissions_tier_recapture_tax": line((lines) => lines.line9),
  };
}

export function register(): void {
  defineForm<Form4255, Form4255FilingInfo>("form-4255", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      ...(partOneBindings() as Bindings),
      ...(partTwoBindings() as Bindings),
      ...(partThreeBindings() as Bindings),
    },
    // The identifying number widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
