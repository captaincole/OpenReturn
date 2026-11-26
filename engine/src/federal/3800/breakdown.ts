/*
 * Parts V and VI: one row for each source of a Part III or Part IV line that
 * adds more than one source. "If any of the amounts entered in Part III (aside
 * from totals) are aggregate figures from more than one facility or more than
 * one pass-through entity, provide breakdowns of those amounts" (irs-3800-inst-2025::sec::part-v-3::b01);
 * Part IV the same, "from more than 1 year or more than one pass-through
 * entity" (part-vi-2::b01). The paper holds 15 Part V rows and 35 Part VI
 * rows; a return with more prints more copies of pages 8 and 9 (copies.ts).
 */

import { figure, gap, type Cell } from "./cells.js";
import {
  ELECTIVE_PAYMENT_GAP,
  PASSIVE_GAP,
  makesElection,
  type Carryover,
  type CurrentCredit,
} from "./credits.js";
import type { Form3800Sources } from "./filingInfo.js";
import { carryforwardOf, type Form3800Rows } from "./form.js";
import { PART_III_ROWS, PART_IV_ROWS } from "./rows.js";

export const PART_V_ROWS_PER_COPY = 15;
export const PART_VI_ROWS_PER_COPY = 35;

/* The sources of every line with more than one, in form order and then in the order recorded. */
function brokenDown<T extends { line: string }>(
  lines: ReadonlyArray<{ line: string }>,
  items: ReadonlyArray<T>,
): T[] {
  return lines.flatMap(({ line }) => {
    const onLine = items.filter((item) => item.line === line);
    return onLine.length > 1 ? onLine : [];
  });
}

export const partVCredits = (rows: Pick<Form3800Rows, "current">) =>
  brokenDown(PART_III_ROWS, rows.current);

export const partVICarryovers = (rows: Pick<Form3800Rows, "carryovers">) =>
  brokenDown(PART_IV_ROWS, rows.carryovers);

export type PartVColumn =
  | "a"
  | "b"
  | "c1"
  | "c2"
  | "d1"
  | "d2"
  | "d3"
  | "d4"
  | "e"
  | "f1"
  | "f2"
  | "g"
  | "h1"
  | "h2"
  | "i1"
  | "i2"
  | "j"
  | "k";

const amountOf = (credit: CurrentCredit): Cell => (credit.amount === 0 ? undefined : credit.amount);
const transferred = (credit: CurrentCredit, direction: "sold" | "purchased") =>
  credit.transfer?.direction === direction ? credit.transfer.amount : undefined;

/*
 * One Part V row (part-v-3::b01 to ::b04): the passive columns (d)(1) to (d)(4)
 * or the non-passive (e), (f)(1), (f)(2); column (g) adds (d)(4), (e) and
 * (f)(2) and subtracts (f)(1). Column (d)(4) needs Form 8582-CR. Columns
 * (h)(1), (i)(2) and (j) are the elective payment's. `used` is the credit's
 * share of the allowed credit (allocation.ts).
 */
export function partVRow(credit: CurrentCredit, used: Cell): Record<PartVColumn, Cell | string> {
  const passive = credit.passive;
  const own = (cell: Cell) => (passive ? undefined : cell);
  const elective = credit.electivePayment !== undefined ? gap(ELECTIVE_PAYMENT_GAP) : undefined;
  const combined = passive
    ? gap(PASSIVE_GAP)
    : figure(
        (own, bought, sold) => own + bought - sold,
        amountOf(credit),
        transferred(credit, "purchased"),
        transferred(credit, "sold"),
      );
  const h2 = figure((total, payment) => total - payment, combined, elective);
  return {
    a: credit.line,
    b: makesElection(credit)
      ? (credit.transfer?.registrationNumber ?? credit.electivePayment?.registrationNumber)
      : undefined,
    c1: credit.ein,
    c2: credit.transfer?.transferorEin,
    d1: passive ? amountOf(credit) : undefined,
    d2: passive ? transferred(credit, "sold") : undefined,
    d3: passive ? transferred(credit, "purchased") : undefined,
    d4: passive ? gap(PASSIVE_GAP) : undefined,
    e: own(amountOf(credit)),
    f1: own(transferred(credit, "sold")),
    f2: own(transferred(credit, "purchased")),
    g: combined,
    h1: elective,
    h2,
    i1: used,
    i2: elective,
    j: elective,
    k: figure((left, applied) => left - applied, h2, used),
  };
}

export type PartVIColumn = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i";

/* One Part VI row: the Part IV columns for one carryover (part-iv-2::b03, ::b04). */
export function partVIRow(carryover: Carryover, used: Cell): Record<PartVIColumn, Cell | string> {
  const passive = carryover.passive;
  const amount = carryover.amount === 0 ? undefined : carryover.amount;
  const columns = {
    e: passive ? gap(PASSIVE_GAP) : undefined,
    f: passive ? undefined : amount,
    h: carryover.recaptured === 0 ? undefined : carryover.recaptured,
  };
  return {
    a: carryover.line,
    b: carryover.originYear,
    c: carryover.ein,
    d: passive ? amount : undefined,
    ...columns,
    g: used,
    i: carryforwardOf(columns, used),
  };
}

/*
 * The rows as the resolver knows them, for the copy count: the stated and K-1
 * sources. A Form 8911 or 8936 line may stand in for K-1 sources later, which
 * only lowers the count of a line's sources.
 */
export function form3800SourceRows(sources: Form3800Sources | undefined) {
  if (sources === undefined) return undefined;
  return {
    current: sources.current.map((source) => source.credit),
    carryovers: sources.carryovers,
  };
}

/* The copies the return needs: enough for Part V and Part VI, at least one. */
export function form3800CopyCount(
  rows: Pick<Form3800Rows, "current" | "carryovers"> | undefined,
): number {
  if (rows === undefined) return 1;
  const forPart = (count: number, perCopy: number) => {
    let copies = 1;
    while (copies * perCopy < count) copies += 1;
    return copies;
  };
  return Math.max(
    forPart(partVCredits(rows).length, PART_V_ROWS_PER_COPY),
    forPart(partVICarryovers(rows).length, PART_VI_ROWS_PER_COPY),
  );
}
