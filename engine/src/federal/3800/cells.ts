/*
 * A Form 3800 amount: a number, blank (undefined), or an engine gap. Gaps pass
 * through every line that adds or compares them, so a credit the engine cannot
 * figure never drops out of a total.
 */

import { atLeast, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";

export type Cell = number | Unsupported | undefined;

export const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && (value as Unsupported | null)?.unsupported === true;

export const firstGap = (cells: ReadonlyArray<Cell>): Unsupported | undefined => cells.find(isGap);

/* The cells added: the first gap; blank when every cell is blank; else the sum (blank counts 0). */
export function addCells(...cells: Cell[]): Cell {
  const gap = firstGap(cells);
  if (gap) return gap;
  if (cells.every((cell) => cell === undefined)) return undefined;
  return sum(...cells);
}

/* A line figured from others, blank counting 0: the first gap, else the result. */
export function figure(fn: (...values: number[]) => number, ...cells: Cell[]): Cell {
  const gap = firstGap(cells);
  if (gap) return gap;
  return fn(...cells.map((cell) => (typeof cell === "number" ? cell : 0)));
}

/* "Add lines …": the sum, blank counting 0; never blank. */
export const totalOf = (...cells: Cell[]): Cell => figure((...values) => sum(...values), ...cells);

/* "Subtract line … from line …. If zero or less, enter -0-." */
export const subtractedAtLeastZero = (from: Cell, amount: Cell): Cell =>
  figure((whole, part) => atLeast(0, whole - part), from, amount);

/* "Enter the smaller of …" and "Enter the greater of …". */
export const smallerOf = (first: Cell, second: Cell): Cell =>
  figure((left, right) => Math.min(left, right), first, second);
export const greaterOf = (first: Cell, second: Cell): Cell =>
  figure((left, right) => Math.max(left, right), first, second);

/* The number a cell holds, 0 when blank; only for a cell known not to be a gap. */
export const valueOf = (cell: Cell): number => (typeof cell === "number" ? cell : 0);

/* A blank for 0: a total line prints nothing when nothing is in it. */
export const blankForZero = (cell: Cell): Cell => (cell === 0 ? undefined : cell);

export const gap = (reason: string): Unsupported => unsupported(reason);
