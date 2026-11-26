/*
 * Part III, lines 16 to 26, once Form 8606 is known. A traditional IRA
 * distribution of a person with IRA basis (Form 8606 Part I) and a Roth IRA
 * distribution with code J or T (Part III) are on this year's Form 8606, so
 * line 17 is Yes and lines 18 and 19 copy Form 8606 lines 15b and 25b.
 */

import { numberOrBlank } from "../../money.js";
import type { Form8915FFigure } from "./figure.js";
import { partIIILines, type PartIIILines } from "./parts.js";

const LINE_23 = "form-8606.1.line.23_line_21_minus_line_22";
const LINE_25B = "form-8606.1.line.25b_roth_qualified_disaster_distributions";

/*
 * Form 8606 line 25b as Form 8915-F line 19 and Form 1040 line 4b read it.
 * Line 19 takes "the amount, if any, from this year's Form 8606, line 25b"
 * (irs-8915f-face-2025::sec::face-part-iii::b01). A Form 8606 line 23 of 0
 * skips lines 24 and 25, so line 25b holds nothing and line 19 takes 0.
 * Undefined while Form 8606 waits.
 */
export function form8606Line25b(form: { readonly [fieldId: string]: unknown }) {
  const line25b = numberOrBlank(form[LINE_25B]);
  if (line25b !== undefined) return line25b;
  return numberOrBlank(form[LINE_23]) === 0 ? 0 : undefined;
}

/* Which IRA kinds of the Part I distributions Form 8606 takes. */
export interface FromForm8606Kinds {
  traditional: boolean;
  roth: boolean;
}

/* Form 8606 lines 15b and 25b as evaluated; undefined while they wait. */
export interface Form8606Lines {
  line15b?: number;
  line25b?: number;
}

export function partIIIOf(
  figure: Form8915FFigure,
  onForm8606: FromForm8606Kinds,
  form8606: Form8606Lines = {},
): PartIIILines {
  const columnB = figure.partI?.columns.columnB;
  const traditional = columnB?.traditional ?? 0;
  const anyOn8606 = onForm8606.traditional || onForm8606.roth;
  const line18 = onForm8606.traditional ? form8606.line15b : undefined;
  const line19 = onForm8606.roth ? form8606.line25b : undefined;
  return partIIILines({
    partICompleted: figure.partI !== undefined,
    iraColumnB: traditional + (columnB?.roth ?? 0),
    form8606: anyOn8606
      ? {
          line18,
          line19,
          waiting:
            (onForm8606.traditional && line18 === undefined) ||
            (onForm8606.roth && line19 === undefined),
        }
      : undefined,
    // "Don't include on line 20 any amounts reported on Form 8606" (the form, line 20).
    line20: onForm8606.traditional ? 0 : traditional,
    electNotToSpread: figure.electNotToSpread,
    priorYearIncome: figure.worksheet4.line3,
    totalRepayment: figure.worksheet5.line5,
  });
}
