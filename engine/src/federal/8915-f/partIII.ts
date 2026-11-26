/*
 * Part III, lines 16 to 26, once Form 8606 is known. A traditional IRA
 * distribution of a person with IRA basis (Form 8606 Part I) and a Roth IRA
 * distribution with code J or T (Part III) are on this year's Form 8606, so
 * line 17 is Yes and lines 18 and 19 copy Form 8606 lines 15b and 25b.
 */

import type { Form8915FFigure } from "./figure.js";
import { partIIILines, type PartIIILines } from "./parts.js";

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
