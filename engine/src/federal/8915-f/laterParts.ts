/*
 * Parts II, III and IV of the printed Form 8915-F. Block ids are in
 * irs-8915f-inst-2025.
 */

import type { FormAccessor, FormSpec } from "../../defineForm.js";
import { numberOrBlank } from "../../money.js";
import { unsupported } from "../../types.js";
import type { Form8915FCopy, Form8915FFilingInfo } from "./filingInfo.js";
import { partIIIOf } from "./partIII.js";
import type { PartIIILines, PartIILines, PartIVLines } from "./parts.js";
import { box, datesText, lineOf, tableCell } from "./printed.js";
import type { Form8915F } from "./types.js";

type Bindings = FormSpec<Form8915F, Form8915FFilingInfo>["bindings"];

const LINE_15B = "form-8606.1.line.15b_qualified_disaster_distributions";
const LINE_25B = "form-8606.1.line.25b_roth_qualified_disaster_distributions";

const partII = <T>(pick: (lines: PartIILines) => T | undefined) =>
  lineOf((copy) => pick(copy.figure.partII));

/* Lines 8 to 15 (parts.ts partIILines). */
function partIIBindings(): Bindings {
  return {
    "2.line.8_amount_on_line_2_col_b_no": partII((lines) => box(lines.line8, "no")),
    "2.line.8_amount_on_line_2_col_b_yes": partII((lines) => box(lines.line8, "yes")),
    "2.line.8_amount_from_line_2_col_b": partII((lines) => lines.line8Amount),
    "2.line.9_applicable_cost_of_distributions": partII((lines) => lines.line9),
    "2.line.10_taxable_amount_other_than_ira": partII((lines) => lines.line10),
    "2.line.11_elect_not_to_spread": partII((lines) => lines.line11Checked),
    "2.line.11_taxable_amount_this_year": partII((lines) => lines.line11),
    "2.line.12_income_for_prior_years": partII((lines) => lines.line12),
    "2.line.13_total_income_this_year": partII((lines) => lines.line13),
    "2.line.14_total_repayment": partII((lines) => lines.line14),
    "2.line.15_amount_subject_to_tax": partII((lines) => lines.line15),
  };
}

/*
 * Part III after Form 8606: lines 18 and 19 copy this year's Form 8606 lines
 * 15b and 25b (the form). The engine evaluates the first Form 8606, which the
 * resolver checks is this form's owner's.
 */
function partIIIFor(form: FormAccessor<Form8915F>, copy: Form8915FCopy): PartIIILines {
  return partIIIOf(copy.figure, copy.onForm8606, {
    line15b: numberOrBlank(form[LINE_15B]),
    line25b: numberOrBlank(form[LINE_25B]),
  });
}

const partIII =
  <T>(pick: (lines: PartIIILines) => T | undefined) =>
  (form: FormAccessor<Form8915F>, info: Form8915FFilingInfo) =>
    lineOf((copy) => pick(partIIIFor(form, copy)))(form, info);

/* Lines 16 to 26 (partIII.ts). */
function partIIIBindings(): Bindings {
  return {
    "2.line.16_amount_on_line_3_or_4_col_b_yes": partIII((lines) => box(lines.line16, "yes")),
    "2.line.16_amount_on_line_3_or_4_col_b_no": partIII((lines) => box(lines.line16, "no")),
    "2.line.17_ira_distribution_on_form_8606_yes": partIII((lines) => box(lines.line17, "yes")),
    "2.line.17_ira_distribution_on_form_8606_no": partIII((lines) => box(lines.line17, "no")),
    "2.line.18_form_8606_line_15b": partIII((lines) => lines.line18),
    "2.line.19_form_8606_line_25b": partIII((lines) => lines.line19),
    "2.line.20_amount_from_line_3_col_b": partIII((lines) => lines.line20),
    "2.line.21_taxable_amount_ira": partIII((lines) => lines.line21),
    "2.line.22_elect_not_to_spread": partIII((lines) => lines.line22Checked),
    "2.line.22_taxable_amount_this_year": partIII((lines) => lines.line22),
    "2.line.23_income_for_prior_years": partIII((lines) => lines.line23),
    "2.line.24_total_income_this_year": partIII((lines) => lines.line24),
    "2.line.25_total_repayment": partIII((lines) => lines.line25),
    "2.line.26_amount_subject_to_tax": partIII((lines) => lines.line26),
  };
}

const partIV = <T>(pick: (lines: PartIVLines, copy: Form8915FCopy) => T | undefined) =>
  lineOf((copy) => (copy.figure.partIV ? pick(copy.figure.partIV.lines, copy) : undefined));

type Cell = "femaNumber" | "declarationDate" | "beginningDate" | "endingDate";

/* The Part IV table: two rows, with the incident's ending date. */
const partIVTable = (row: number, field: Cell) =>
  partIV((_, copy) =>
    copy.printGaps.partIVTable
      ? unsupported(copy.printGaps.partIVTable)
      : tableCell(copy.figure.partIV?.disasters, row, field),
  );

function partIVTableBindings(): Bindings {
  return {
    "3.line.part4_disaster_row1_fema_number": partIVTable(0, "femaNumber"),
    "3.line.part4_disaster_row1_declaration_date": partIVTable(0, "declarationDate"),
    "3.line.part4_disaster_row1_beginning_date": partIVTable(0, "beginningDate"),
    "3.line.part4_disaster_row1_ending_date": partIVTable(0, "endingDate"),
    "3.line.part4_disaster_row2_fema_number": partIVTable(1, "femaNumber"),
    "3.line.part4_disaster_row2_declaration_date": partIVTable(1, "declarationDate"),
    "3.line.part4_disaster_row2_beginning_date": partIVTable(1, "beginningDate"),
    "3.line.part4_disaster_row2_ending_date": partIVTable(1, "endingDate"),
    "3.line.part4_qualified_distribution_dates": partIV((_, copy) =>
      datesText(copy.figure.partIV?.pieces.map((piece) => piece.date) ?? []),
    ),
  };
}

/*
 * Lines 27 to 32 (parts.ts partIVLines). The write-in left of line 32 is for
 * a second form's Part I (line-32::b01), which the engine does not figure
 * (resolveInfo.ts), so it is always blank.
 */
function partIVLineBindings(): Bindings {
  return {
    "3.line.27_ira_distribution_on_8606_yes": partIV((lines) => box(lines.line27, "yes")),
    "3.line.27_ira_distribution_on_8606_no": partIV((lines) => box(lines.line27, "no")),
    "3.line.28_total_qualified_distributions": partIV((lines) => lines.line28),
    "3.line.29_applicable_cost_of_distributions": partIV((lines) => lines.line29),
    "3.line.30_distributions_less_cost": partIV((lines) => lines.line30),
    "3.line.31_total_repayments": partIV((lines) => lines.line31),
    "3.line.32_taxable_amount_write_in": () => undefined,
    "3.line.32_taxable_amount": partIV((lines) => lines.line32),
  };
}

export function laterPartsBindings(): Bindings {
  return {
    ...partIIBindings(),
    ...partIIIBindings(),
    ...partIVTableBindings(),
    ...partIVLineBindings(),
  };
}
