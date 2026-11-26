/*
 * The Form 8697 of the return, from the look-back fact: each prior year's
 * column, its interest, the totals and the net line, and how many forms the
 * columns need. A problem with the fact is `gap` (every amount line is
 * unsupported); a case the interest rules do not cover is `interestGap` (the
 * interest lines, the totals, the net lines and Schedule 2 line 17n).
 */

import type {
  LookBackFactValue,
  RegularLookBackFactValue,
  SimplifiedLookBackFactValue,
} from "../../facts/index.js";
import { interestEndDate, lookBackInterest } from "./interest.js";
import {
  columnInterest,
  columnTotal,
  FILING_YEAR,
  netInterest,
  PART_I_COLUMNS_PER_FORM,
  PART_II_COLUMNS_PER_FORM,
  regularColumnLines,
  simplifiedColumnLines,
  type ColumnInterest,
  type NetInterest,
  type RegularColumnLines,
  type SimplifiedColumnLines,
} from "./lines.js";
import { smimAmtRate, smimRegularRate } from "./rates.js";

export interface PlannedColumn<L> {
  taxYear: number;
  lines: L;
  /* Cents kept; undefined with an interest gap. */
  interest: ColumnInterest;
}

export interface Form8697Totals {
  /* Part I line 2(c); undefined for Part II, or when line 2 includes other adjustments. */
  line2Total?: number;
  dueTotal?: number;
  refundTotal?: number;
  net: NetInterest;
}

export interface Form8697Plan {
  method: LookBackFactValue["method"];
  value: LookBackFactValue;
  regularColumns: PlannedColumn<RegularColumnLines>[];
  simplifiedColumns: PlannedColumn<SimplifiedColumnLines>[];
  totals?: Form8697Totals;
  /* Why no amount line can be figured. */
  gap?: string;
  /* Why the interest lines and what follows them cannot be figured. */
  interestGap?: string;
  copyCount: number;
}

const PAST_RATE_TABLE =
  "The interest needs a section 6621 rate for an accrual period the engine's table does not hold (before 1999, or past April 15, 2026; data/underpaymentRates.ts).";
const CARRYOVER_CHANGED =
  "A loss or credit carryback or carryover changes with the look-back (line 1 or line 3 below 0, or a year the fact marks): the interest then runs over other periods (irs-8697-inst-2025::sec::line-3::b01, ::lines-7-and-8::b01, b02), which the engine does not figure.";
const NO_AMT_RATE =
  "Part II line 4 names no AMT rate for a tax year that began before 1987 (irs-8697-inst-2025::sec::line-4::b01).";

/* A problem with the prior years that stops every amount line, or undefined. */
function yearsGap(years: ReadonlyArray<{ taxYear: number }>): string | undefined {
  if (years.length === 0)
    return "The look-back fact lists no prior year: Form 8697 needs at least one.";
  const seen = new Set<number>();
  for (const { taxYear } of years) {
    if (!Number.isInteger(taxYear) || taxYear >= FILING_YEAR) {
      return `The look-back fact lists ${taxYear}, which is not a tax year before ${FILING_YEAR}.`;
    }
    if (seen.has(taxYear)) return `The look-back fact lists ${taxYear} twice.`;
    seen.add(taxYear);
  }
  return undefined;
}

/* The forms the columns need: at least one (the note under each part's column headings). */
function copiesFor(columns: number, perForm: number): number {
  let copies = 1;
  while (copies * perForm < columns) copies += 1;
  return copies;
}

/* Each column's interest on its change in tax, or undefined past the rate table. */
function withInterest<L>(
  columns: ReadonlyArray<{ taxYear: number; lines: L; change: number }>,
  end: Date,
): PlannedColumn<L>[] | undefined {
  const planned: PlannedColumn<L>[] = [];
  for (const { taxYear, lines, change } of columns) {
    const amount = change === 0 ? 0 : lookBackInterest(Math.abs(change), taxYear, end);
    if (amount === undefined) return undefined;
    planned.push({ taxYear, lines, interest: columnInterest(change, amount) });
  }
  return planned;
}

function totalsOf<L>(
  columns: ReadonlyArray<PlannedColumn<L>>,
  line2Total?: number,
): Form8697Totals {
  const dueTotal = columnTotal(columns.map((column) => column.interest.due));
  const refundTotal = columnTotal(columns.map((column) => column.interest.refunded));
  return { line2Total, dueTotal, refundTotal, net: netInterest(dueTotal, refundTotal) };
}

function regularPlan(value: RegularLookBackFactValue, end: Date): Form8697Plan {
  const base = { method: value.method, value, simplifiedColumns: [] };
  const copyCount = copiesFor(value.priorYears.length, PART_I_COLUMNS_PER_FORM);
  const figured = value.priorYears.map((year) => {
    const lines = regularColumnLines(year);
    return { taxYear: year.taxYear, lines, change: lines.line6 };
  });
  const noInterest = figured.map((column) => ({ ...column, interest: {} }));
  const carryover =
    value.priorYears.some((year) => year.carryoverChanged === true) ||
    figured.some(({ lines }) => lines.line1 < 0 || lines.line3 < 0);
  if (carryover) {
    return { ...base, regularColumns: noInterest, interestGap: CARRYOVER_CHANGED, copyCount };
  }
  const columns = withInterest(figured, end);
  if (columns === undefined) {
    return { ...base, regularColumns: noInterest, interestGap: PAST_RATE_TABLE, copyCount };
  }
  /*
   * DECISION (2026-11-26, by the author): line 2, column (c). The column
   * heading: "(c) Totals (Add columns (a) and (b).)" (irs-8697-face-2025, Part I).
   * The line 2 instruction: "the sum of all line 2 amounts should be zero and
   * reflected in column 2(c)" (irs-8697-inst-2025::sec::line-2::b01), which
   * counts the filing-year column too. The engine adds columns (a) and (b),
   * every Form 8697's, as the heading says: the form's arithmetic wins over a
   * sentence that breaks it. No line reads 2(c). "If there are additional
   * adjustments ..., leave column 2(c) blank" (::line-2::b01) still applies.
   */
  const line2Total =
    value.otherAdjustmentsIncluded === true
      ? undefined
      : columnTotal(columns.map((column) => column.lines.line2));
  return { ...base, regularColumns: columns, totals: totalsOf(columns, line2Total), copyCount };
}

function simplifiedPlan(value: SimplifiedLookBackFactValue, end: Date): Form8697Plan {
  const base = { method: value.method, value, regularColumns: [] };
  const copyCount = copiesFor(value.priorYears.length, PART_II_COLUMNS_PER_FORM);
  const figured = [];
  for (const year of value.priorYears) {
    const amtRate = smimAmtRate(year.taxYear);
    if (amtRate === undefined)
      return { ...base, simplifiedColumns: [], gap: NO_AMT_RATE, copyCount };
    const lines = simplifiedColumnLines({
      ...year,
      regularRate: smimRegularRate(year.taxYear),
      amtRate,
    });
    figured.push({ taxYear: year.taxYear, lines, change: lines.line7 });
  }
  const columns = withInterest(figured, end);
  if (columns === undefined) {
    const noInterest = figured.map((column) => ({ ...column, interest: {} }));
    return { ...base, simplifiedColumns: noInterest, interestGap: PAST_RATE_TABLE, copyCount };
  }
  return { ...base, simplifiedColumns: columns, totals: totalsOf(columns), copyCount };
}

/* The oldest prior year first: column (a), then (b), then the next form. */
function oldestFirst(value: LookBackFactValue): LookBackFactValue {
  const byYear = (first: { taxYear: number }, second: { taxYear: number }) =>
    first.taxYear - second.taxYear;
  return value.method === "regular"
    ? { ...value, priorYears: [...value.priorYears].sort(byYear) }
    : { ...value, priorYears: [...value.priorYears].sort(byYear) };
}

/* The plan for the fact. */
export function planForm8697(stated: LookBackFactValue): Form8697Plan {
  const value = oldestFirst(stated);
  const gap = yearsGap(value.priorYears);
  const end = interestEndDate(FILING_YEAR, value.filedAndPaidOn);
  if (gap !== undefined) {
    return {
      method: value.method,
      value,
      regularColumns: [],
      simplifiedColumns: [],
      gap,
      copyCount: 1,
    };
  }
  return value.method === "regular" ? regularPlan(value, end) : simplifiedPlan(value, end);
}
