/*
 * Form 2210 Part III, Section A (lines 10–18), as pure arithmetic. Columns
 * (a)–(d) are the four due dates. "Complete lines 12 through 18 of one column
 * before going to line 12 of the next column" (the blank form).
 */

import { atLeast, roundDollars } from "../../money.js";

export const INSTALLMENT_COUNT = 4;
/* Line 10 without Schedule AI: "enter 25% (0.25) of line 9 ... in each column". */
export const REGULAR_INSTALLMENT_PERCENT = 0.25;

/* One column of lines 12–18. A line the form leaves blank (or grey) is undefined. */
export interface SectionAColumn {
  line10: number;
  line11: number;
  line12?: number;
  line13?: number;
  line14?: number;
  line15?: number;
  line16?: number;
  line17?: number;
  line18?: number;
}

export interface SectionALines {
  columns: SectionAColumn[];
  /*
   * Line 11: "If line 11 is equal to or more than line 10 for all payment
   * periods, stop here; you don't owe a penalty." Lines 12–18 stay blank then.
   */
  stoppedAtLine11: boolean;
}

/* Line 10 by the regular method: 25% of line 9, to the nearest dollar, in each column. */
export function regularInstallments(line9: number): number[] {
  const each = roundDollars(line9 * REGULAR_INSTALLMENT_PERCENT);
  return Array.from({ length: INSTALLMENT_COUNT }, () => each);
}

/* Lines 17 and 18 of one column: an underpayment when line 10 is equal to or more than line 15. */
function underOrOver(line10: number, line15: number): Pick<SectionAColumn, "line17" | "line18"> {
  return line10 >= line15 ? { line17: line10 - line15 } : { line18: line15 - line10 };
}

/* Column (a): "For column (a) only, enter the amount from line 11" on line 15. */
function firstColumn(line10: number, line11: number): SectionAColumn {
  return { line10, line11, line15: line11, ...underOrOver(line10, line11) };
}

/*
 * Columns (b)–(d). Line 12 is the previous line 18, line 14 the previous lines
 * 16 and 17. Line 16 has no box in columns (a) and (d); line 18 none in (d).
 */
function laterColumn(
  line10: number,
  line11: number,
  previous: SectionAColumn,
  last: boolean,
): SectionAColumn {
  const line12 = previous.line18 ?? 0;
  const line13 = line11 + line12;
  const line14 = (previous.line16 ?? 0) + (previous.line17 ?? 0);
  const line15 = atLeast(0, line13 - line14);
  const line16 = last ? undefined : line15 === 0 ? line14 - line13 : 0;
  const { line17, line18 } = underOrOver(line10, line15);
  return {
    line10,
    line11,
    line12,
    line13,
    line14,
    line15,
    line16,
    line17,
    line18: last ? undefined : line18,
  };
}

/* Lines 10–18 from the required installments and the payments of each column (whole dollars). */
export function sectionALines(
  installments: readonly number[],
  payments: readonly number[],
): SectionALines {
  const stoppedAtLine11 = installments.every((due, index) => payments[index] >= due);
  if (stoppedAtLine11) {
    return {
      columns: installments.map((line10, index) => ({ line10, line11: payments[index] })),
      stoppedAtLine11,
    };
  }
  const columns: SectionAColumn[] = [firstColumn(installments[0], payments[0])];
  for (let index = 1; index < INSTALLMENT_COUNT; index++) {
    const last = index === INSTALLMENT_COUNT - 1;
    columns.push(laterColumn(installments[index], payments[index], columns[index - 1], last));
  }
  return { columns, stoppedAtLine11 };
}
