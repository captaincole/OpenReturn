/*
 * Form 1040 lines 4b and 5b with Forms 8915-F. A form takes over the taxable
 * part of the 1099-R amounts it reports, and its lines 15, 26 and 32 go on
 * the return instead: "Include this amount in the total on line 5b" (line 15),
 * "on line 4b" (line 26), and line 32 by where the distribution came from (the
 * form). Lines 4a and 5a keep the 1099-R gross amounts.
 */

import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8915FReturn } from "./filingInfo.js";
import { form8606Line25b } from "./partIII.js";

const LINE_26 = "form-8915-f.2.line.26_amount_subject_to_tax";

type Line = number | Unsupported | undefined;

const isUnsupported = (value: Line): value is Unsupported =>
  typeof value === "object" && value.unsupported === true;

/* The rows' taxable amount after the forms take theirs, and the forms' income. */
function rowsLessTakenPlusIncome(rows: number, taken: number, income: number): number {
  return atLeast(0, rows - roundDollars(taken)) + income;
}

/* No 1099-R of the kind and no income from the form: the line stays blank, as without the form. */
const nothingToAdd = (rows: Line, taken: number, income: number) =>
  rows === undefined && taken === 0 && income === 0;

/*
 * Line 4b. `rows` is line 4b as the 1099-Rs and Form 8606 give it, undefined
 * with no IRA 1099-R (`hasRows` false) or while it waits. A form whose Part III
 * reads Form 8606 adds its own line 26, and takes off Form 8606 line 25b,
 * which the rows' Roth IRA amount still holds (1040/resolveInfo.ts rothTaxable).
 */
export function line4bWithForm8915F(
  rows: Line,
  hasRows: boolean,
  form: FormAccessor<unknown>,
  disaster: Form8915FReturn,
): Line {
  if (disaster.gap) return unsupported(disaster.gap);
  if (isUnsupported(rows)) return rows;
  if (rows === undefined && hasRows) return undefined;
  const reads8606 = disaster.partIIIFromForm8606;
  const { takenFromRows, income } = disaster.ira;
  if (!reads8606)
    return nothingToAdd(rows, takenFromRows, income)
      ? undefined
      : rowsLessTakenPlusIncome(rows ?? 0, takenFromRows, income);
  const line26 = numberOrBlank(form[LINE_26]);
  const line25b = reads8606.roth ? form8606Line25b(form) : 0;
  if (line26 === undefined || line25b === undefined) return undefined;
  return rowsLessTakenPlusIncome((rows ?? 0) - line25b, takenFromRows, income + line26);
}

/* Line 5b, the same way for the other-than-IRA plans. */
export function line5bWithForm8915F(rows: Line, waits: boolean, disaster: Form8915FReturn): Line {
  if (disaster.gap) return unsupported(disaster.gap);
  if (isUnsupported(rows)) return rows;
  if (rows === undefined && waits) return undefined;
  const { takenFromRows, income } = disaster.pension;
  if (nothingToAdd(rows, takenFromRows, income)) return undefined;
  return rowsLessTakenPlusIncome(rows ?? 0, takenFromRows, income);
}
