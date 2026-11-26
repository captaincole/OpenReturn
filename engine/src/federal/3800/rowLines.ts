/*
 * The columns of one Part III or Part IV row, from its sources, and the total
 * lines (Part III lines 2, 5 and 6; Part IV lines 5, 6 and 7). Column (i) of
 * Part III and columns (g) and (i) of Part IV read the allocation
 * (allocation.ts) and are filled in form.ts.
 */

import { addCells, blankForZero, firstGap, gap, type Cell } from "./cells.js";
import {
  ELECTIVE_PAYMENT_GAP,
  PASSIVE_GAP,
  isCarryback,
  needsPassiveLimit,
  signedTransfer,
  type Carryover,
  type CurrentCredit,
} from "./credits.js";

export interface PartIIIColumns {
  /* (a): the number of Part V rows, when more than one source. */
  a?: number;
  /* (b): the registration number, with an election. */
  b?: string;
  /* (c): the pass-through or transferor EIN. */
  c?: string;
  d: Cell;
  e: Cell;
  f: Cell;
  g: Cell;
  h: Cell;
  j: Cell;
}

const amountCell = (credit: CurrentCredit): Cell =>
  credit.amount === 0 ? undefined : credit.amount;

/* The EIN column (c) names: the pass-through entity allocating the most, else the transferor transferring the most (transferees-of-eligible-credits-under-section::b03, ::b04). */
export function einOf(sources: ReadonlyArray<{ ein?: string; size: number }>): string | undefined {
  const withEin = sources.filter((source) => source.ein !== undefined);
  if (withEin.length === 0) return undefined;
  return withEin.reduce((most, source) => (source.size > most.size ? source : most)).ein;
}

const sizeOf = (cell: Cell) => (typeof cell === "number" ? cell : 0);

function columnC(credits: ReadonlyArray<CurrentCredit>): string | undefined {
  const passThrough = einOf(
    credits.map((credit) => ({ ein: credit.ein, size: sizeOf(credit.amount) })),
  );
  if (passThrough !== undefined) return passThrough;
  const purchased = credits.filter((credit) => credit.transfer?.direction === "purchased");
  return einOf(
    purchased.map((credit) => ({
      ein: credit.transfer?.transferorEin,
      size: credit.transfer?.amount ?? 0,
    })),
  );
}

/* Columns (d) to (j) of one Part III row (transferees-of-eligible-credits-under-section::b02 to part-ii-3::b02). */
export function partIIIColumns(credits: ReadonlyArray<CurrentCredit>): PartIIIColumns {
  const passive = credits.filter((credit) => credit.passive);
  const nonpassive = credits.filter((credit) => !credit.passive);
  const passiveColumn = addCells(...passive.map(amountCell));
  const nonpassiveColumn = addCells(...nonpassive.map(amountCell));
  const transferColumn = addCells(...credits.map(signedTransfer));
  const anyGap = firstGap([passiveColumn, nonpassiveColumn, transferColumn]);
  const combined =
    anyGap ??
    (credits.some(needsPassiveLimit)
      ? gap(PASSIVE_GAP)
      : addCells(nonpassiveColumn, transferColumn));
  const elective = credits.some((credit) => credit.electivePayment !== undefined);
  const elected = credits.find((credit) => credit.transfer ?? credit.electivePayment);
  return {
    a: credits.length > 1 ? credits.length : undefined,
    b: elected?.transfer?.registrationNumber ?? elected?.electivePayment?.registrationNumber,
    c: columnC(credits),
    d: passiveColumn,
    e: nonpassiveColumn,
    f: transferColumn,
    g: combined,
    h: elective ? gap(ELECTIVE_PAYMENT_GAP) : undefined,
    j: elective ? gap(ELECTIVE_PAYMENT_GAP) : undefined,
  };
}

/* The non-passive part of column (f): Part I line 1 and Part II line 30 take only it. */
export function nonpassiveTransfers(credits: ReadonlyArray<CurrentCredit>): Cell {
  return addCells(...credits.filter((credit) => !credit.passive).map(signedTransfer));
}

/* The passive part of column (f): Part I line 2 and Part II line 32. */
export function passiveTransfers(credits: ReadonlyArray<CurrentCredit>): Cell {
  return addCells(...credits.filter((credit) => credit.passive).map(signedTransfer));
}

export interface PartIVColumns {
  a?: number;
  /* (b): the latest originating year; "2026" for a carryback (part-iv::b01). */
  b?: number;
  c?: string;
  d: Cell;
  e: Cell;
  f: Cell;
  h: Cell;
}

const carryAmount = (carryover: Carryover): Cell =>
  carryover.amount === 0 ? undefined : carryover.amount;

/*
 * Columns (a) to (f) and (h) of one Part IV row (part-iv-2::b03, ::b04). Column
 * (e), the passive carryovers allowed, needs Form 8582-CR.
 */
export function partIVColumns(carryovers: ReadonlyArray<Carryover>): PartIVColumns {
  const passive = carryovers.filter((carryover) => carryover.passive);
  const passiveColumn = addCells(...passive.map(carryAmount));
  const years = carryovers.map((carryover) => carryover.originYear);
  const sized = carryovers.map((carryover) => ({
    ein: carryover.ein,
    size: sizeOf(carryover.amount),
  }));
  return {
    a: carryovers.length > 1 ? carryovers.length : undefined,
    b: years.length > 0 ? Math.max(...years) : undefined,
    c: einOf(sized),
    d: passiveColumn,
    e: passive.length > 0 ? gap(PASSIVE_GAP) : undefined,
    f: addCells(...carryovers.filter((carryover) => !carryover.passive).map(carryAmount)),
    h: blankForZero(addCells(...carryovers.map((carryover) => carryover.recaptured))),
  };
}

/*
 * What a carryover brings to the tax limit: column (f) less column (h).
 *
 * DECISION (2026-11-25, by the author): a carryover's recaptured or adjusted
 * part (column (h)) is not used against the tax.
 * - Part I line 4: "Enter the amount of non-passive carryforwards to 2025 of
 *   unused credits that are reported from line 6 of Part IV, column (f)"
 *   (irs-3800-inst-2025::sec::line-4::b01); column (i) subtracts (g) and (h)
 *   from (e) and (f) (part-iv-2::b04).
 * - "Caution: The carryforward must be reduced if there has been a recapture
 *   or other downward adjustment" (carryback-and-carryforward-of::b01).
 * The engine takes column (f) less column (h) on lines 4, 5, 22, 34 and 35 and
 * in the allocation, so a recaptured credit is never allowed; column (f) still
 * prints the carryover as last year's return reported it.
 */
export const availableOf = (carryover: Carryover): Cell =>
  typeof carryover.amount === "number"
    ? Math.max(0, carryover.amount - (carryover.recaptured ?? 0))
    : carryover.amount;

/* The non-passive carryforwards (Part I line 4, Part II line 34) or carrybacks (lines 5, 35) of a set of rows. */
export function nonpassiveCarryovers(
  carryovers: ReadonlyArray<Carryover>,
  carryback: boolean,
): Cell {
  const kept = carryovers.filter(
    (carryover) => !carryover.passive && isCarryback(carryover) === carryback,
  );
  return kept.length === 0 ? undefined : addCells(...kept.map(availableOf));
}
