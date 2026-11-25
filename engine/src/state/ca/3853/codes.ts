/*
 * FTB 3853 Part III: the coverage and exemption codes of one person, month by
 * month (lines-1-12-2::b01–b03). The engine settles each month in this order:
 * coverage (Z); an exemption the person states; a month before or of a birth in
 * 2025 (I); coverage considered unaffordable from a stated offer (A); the
 * first short coverage gap (C); otherwise no coverage and no exemption (X).
 */

import type { CaStatedExemption } from "../../../facts/index.js";
import { MONTHS_IN_YEAR } from "./lines.js";

export const COVERED = "Z";
export const NO_COVERAGE = "X";
const BORN_OR_ADOPTED = "I";
const UNAFFORDABLE = "A";
const SHORT_GAP = "C";
/* Code B is for the whole year: "enter code 'B' in Part III, column (a)" (example-2-2::b02). */
const WHOLE_YEAR_CODES: ReadonlySet<string> = new Set(["B"]);
/* Two fields a month, one code each (lines-1-12-2::b01). */
const CODES_PER_MONTH = 2;
/* A gap of 3 continuous months or less (federal-poverty-line::b01). */
export const SHORT_GAP_MONTHS = 3;

const MONTH_NUMBERS = Array.from({ length: MONTHS_IN_YEAR }, (_, index) => index + 1);

export interface CodeInputs {
  coveredMonths: readonly number[];
  exemptions: readonly CaStatedExemption[];
  /* The birth month when the person was born in 2025. */
  birthMonth?: number;
  uncoveredMonthsBefore2025?: number;
}

/* The stated codes for a month, in the order stated, two at most. */
function statedCodes(exemptions: readonly CaStatedExemption[], month: number): string[] {
  const codes = exemptions
    .filter(({ code, months }) => WHOLE_YEAR_CODES.has(code) || months.includes(month))
    .map(({ code }) => code);
  return [...new Set(codes)].slice(0, CODES_PER_MONTH);
}

/* The codes before the short gap: each month's codes, or [] while the month is open. */
function settledCodes(inputs: CodeInputs, unaffordable: readonly boolean[]): string[][] {
  return MONTH_NUMBERS.map((month) => {
    if (inputs.coveredMonths.includes(month)) return [COVERED];
    const stated = statedCodes(inputs.exemptions, month);
    if (stated.length > 0) return stated;
    if (inputs.birthMonth !== undefined && month <= inputs.birthMonth) return [BORN_OR_ADOPTED];
    return unaffordable[month - 1] ? [UNAFFORDABLE] : [];
  });
}

/* Runs of open months: [first month index, length], January first. */
function openRuns(open: readonly boolean[]): Array<[number, number]> {
  const runs: Array<[number, number]> = [];
  open.forEach((isOpen, index) => {
    if (!isOpen) return;
    const last = runs[runs.length - 1];
    if (last !== undefined && last[0] + last[1] === index) last[1] += 1;
    else runs.push([index, 1]);
  });
  return runs;
}

/*
 * The short coverage gap (federal-poverty-line::b01, example-1-4::b01,
 * example-2-4::b01, example-1-5::b01, example-2-5::b01): the months of the
 * first gap of 3 continuous months or less. A gap that starts in January
 * counts the months without coverage at the end of 2024. Returns the month
 * indexes (0 is January); undefined while a gap from January waits for
 * the 2024 months.
 */
export function shortGapMonthIndexes(
  open: readonly boolean[],
  uncoveredMonthsBefore2025: number | undefined,
): number[] | undefined {
  for (const [start, length] of openRuns(open)) {
    const fromJanuary = start === 0;
    if (fromJanuary && length <= SHORT_GAP_MONTHS && uncoveredMonthsBefore2025 === undefined) {
      return undefined;
    }
    const total = fromJanuary ? length + (uncoveredMonthsBefore2025 ?? 0) : length;
    if (total <= SHORT_GAP_MONTHS) return Array.from({ length }, (_, offset) => start + offset);
  }
  return [];
}

/*
 * Whether the stated answers leave a gap from January short enough that the
 * 2024 months decide it (codes A not yet known, so they count as open).
 */
export function needsMonthsBefore2025(inputs: CodeInputs): boolean {
  const open = settledCodes(inputs, []).map((codes) => codes.length === 0);
  const firstRun = openRuns(open)[0];
  return firstRun !== undefined && firstRun[0] === 0 && firstRun[1] <= SHORT_GAP_MONTHS;
}

/*
 * The codes for each month, January first; undefined while the 2024 months
 * wait. `unaffordable` marks the months code A applies (index 0 is January).
 */
export function monthCodes(
  inputs: CodeInputs,
  unaffordable: readonly boolean[],
): string[][] | undefined {
  const settled = settledCodes(inputs, unaffordable);
  const gap = shortGapMonthIndexes(
    settled.map((codes) => codes.length === 0),
    inputs.uncoveredMonthsBefore2025,
  );
  if (gap === undefined) return undefined;
  return settled.map((codes, index) => {
    if (codes.length > 0) return codes;
    return gap.includes(index) ? [SHORT_GAP] : [NO_COVERAGE];
  });
}

/*
 * Column (a): the code when one code applies to the whole year ("enter the
 * coverage or exemption code in column (a) and leave columns (b) through (m)
 * blank", lines-1-12-2::b01); undefined otherwise.
 */
export function fullYearCode(codes: readonly string[][]): string | undefined {
  const [first] = codes;
  const same = codes.every((month) => month.length === 1 && month[0] === first[0]);
  return first.length === 1 && same ? first[0] : undefined;
}

/* The months (index 0 is January) that hold an X. */
export function xMonths(codes: readonly string[][]): boolean[] {
  return codes.map((month) => month.includes(NO_COVERAGE));
}
