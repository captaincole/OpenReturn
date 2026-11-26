/*
 * Form 4255 Part I: one line's columns (a) to (t) and the line 3 totals.
 * Block ids are in irs-4255-inst-2025::sec unless named.
 */

import type { CreditRecaptureLineFactValue, Form4255Line } from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";
import { AMOUNT_COLUMNS, columnLabel, LINE_COLUMNS, type AmountColumn } from "./columns.js";
import { EXCESS_ADDITION_RATE, percentText } from "./lines.js";
import { splitPenalty } from "./penalties.js";

/* One line's printed cells: an amount, column (g)'s text, or blank (absent). */
export type PartOneRow = Partial<Record<AmountColumn, number>> & { g?: string };

/* One recapture event on a line: its increase in tax, its carryover reduction, its percentage (0–100). */
export interface RecaptureEvent {
  increaseInTax: number;
  carryoverReduction: number;
  percent?: number;
}

/*
 * The lines whose credit an individual can take as an elective payment: the
 * four boxes of Schedule 2 lines 1e and 1f (irs-1040-inst-2025::sec::line-1e-2::b01,
 * line-1f-2::b01). Only these lines can hold columns (b), (c), (n) and the
 * elective payment parts of (o) and (p) on Form 1040.
 */
export const ELECTIVE_PAYMENT_LINES: readonly Form4255Line[] = ["1a", "1c", "1d", "2a"];

const isLineTwo = (line: Form4255Line): boolean => line.startsWith("2");
const positive = (value: number): number | undefined => (value > 0 ? value : undefined);
const addition = (amount: number, reasonableCause: boolean): number =>
  reasonableCause ? 0 : roundDollars(amount * EXCESS_ADDITION_RATE);

/* Columns (a) to (f) (amounts-from-prior-year-s-returns::b01): (d) = (b) − (c); (f) = (a) − (b) − (e). */
function priorYear(fact: CreditRecaptureLineFactValue) {
  const claimed = roundDollars(fact.creditClaimed);
  const nonElective = roundDollars(fact.nonElectiveCreditAppliedToTax);
  const gross = roundDollars(fact.grossElectivePayment);
  const applied =
    gross === undefined ? undefined : roundDollars(fact.grossElectivePaymentAppliedToTax ?? 0);
  return {
    a: claimed,
    b: gross,
    c: applied,
    d: gross === undefined || applied === undefined ? undefined : gross - applied,
    e: nonElective,
    f: claimed - (gross ?? 0) - nonElective,
  };
}
type PriorYear = ReturnType<typeof priorYear>;

/*
 * Columns (j), (k) and (l): the part of the increase in tax that recaptures
 * the non-EPE credit applied against tax (column (e)), the gross EPE applied
 * against tax (column (c)) and the net EPE (column (d))
 * (amounts-from-prior-year-s-returns::b01, b02). With one kind of use the whole
 * increase is that kind; with more than one the instructions give no split.
 */
function splitIncrease(
  increase: number,
  prior: PriorYear,
): Pick<PartOneRow, "j" | "k" | "l"> | string {
  if (increase === 0) return {};
  if ((prior.b ?? 0) === 0) return { j: increase };
  const kinds = (
    [
      ["j", prior.e],
      ["k", prior.c ?? 0],
      ["l", prior.d ?? 0],
    ] as const
  ).filter(([, used]) => used > 0);
  if (kinds.length === 1) return { [kinds[0][0]]: increase };
  return "the credit was used in more than one way (columns (c), (d) and (e)), and the instructions do not say how the recapture splits among columns (j), (k) and (l)";
}

/* Column (g): the one event's percentage, "N/A" for more than one event (amounts-from-prior-year-s-returns::b01). */
function percentColumn(events: ReadonlyArray<RecaptureEvent>): string | undefined {
  if (events.length > 1) return "N/A";
  const percent = events[0]?.percent;
  return percent === undefined ? undefined : percentText(percent / 100);
}

/* Columns (g) to (l): column (h) is the increase in tax plus the carryover reduction (column (i)). */
function recapture(events: ReadonlyArray<RecaptureEvent>, prior: PriorYear): PartOneRow | string {
  if (events.length === 0) return {};
  const increase = sum(...events.map((event) => event.increaseInTax));
  const i = sum(...events.map((event) => event.carryoverReduction));
  const split = splitIncrease(increase, prior);
  if (typeof split === "string") return split;
  return { g: percentColumn(events), h: increase + i, i: positive(i), ...split };
}

/* Columns (m) and (n) (excessive-payments-eps-excessive-credit::b01): 20% more without reasonable cause. */
function excessAmounts(fact: CreditRecaptureLineFactValue): PartOneRow {
  const transfer = fact.excessiveCreditTransfer;
  const m1 = roundDollars(transfer?.amount ?? 0);
  const payment = fact.excessivePayment;
  const n1 = roundDollars(payment?.netPortion ?? 0);
  const n2 = roundDollars(payment?.otherPortion ?? 0);
  return {
    m1: positive(m1),
    m2: positive(addition(m1, transfer?.reasonableCause ?? true)),
    m3: positive(roundDollars(fact.creditTransferRecapture ?? 0)),
    n1: positive(n1),
    n2: positive(n2),
    n3: positive(addition(n1 + n2, payment?.reasonableCause ?? true)),
  };
}

/*
 * Columns (q) to (t) (totals-by-type::b01). Column (q): (n) and (m)(1)–(m)(2)
 * on every line, (j)–(l) on lines 2a–2z. Column (r): (o) and (p) on every line,
 * (j)–(l) on lines 1a–1z, and (m)(3).
 *
 * DECISION (2026-11-25, by the author): column (m)(3) of line 1z counts in
 * column (r), and of line 2z in column (q), as columns (j) to (l) of the same
 * lines do.
 * Text A, Form 4255: column (r) adds "Lines 1b, 1g, and 1j in column (m)(3)",
 * and column (q) adds no (m)(3) (irs-4255-inst-2025::sec::totals-by-type::b01).
 * Text B: the blank form has an (m)(3) cell on lines 1z and 2z, and the Schedule
 * 2 instructions take "Any section 6418(g)(3) amounts attributable to recapture
 * from Form 4255, column (m)(3)" on line 17a (irs-1040-inst-2025::sec::identify-as-eccfr::b01)
 * and line 2a's (m)(3) on line 1y, with the amounts that credits can reduce
 * (::identify-as-epe8933::b01).
 * The engine follows Text B: an amount the form has a cell for reaches the
 * return, and a line 1 recapture is never reduced by credits while a line 2
 * recapture is.
 */
function totalsByType(line: Form4255Line, row: PartOneRow): PartOneRow {
  const recaptured = sum(row.j, row.k, row.l, row.m3);
  const payments = sum(row.n1, row.n2, row.n3, row.m1, row.m2);
  const penalties = sum(row.o1, row.o2, row.o3, row.p1, row.p2, row.p3);
  return {
    q: positive(payments + (isLineTwo(line) ? recaptured : 0)),
    r: positive(penalties + (isLineTwo(line) ? 0 : recaptured)),
    s: positive(sum(row.l, row.n1)),
    t: positive(sum(row.n3, row.o1, row.o2, row.p1, row.p2)),
  };
}

/* Why the line cannot be filled, or undefined. */
function lineGap(
  line: Form4255Line,
  fact: CreditRecaptureLineFactValue,
  prior: PriorYear,
): string | undefined {
  const elects = (prior.b ?? 0) > 0 || fact.excessivePayment !== undefined;
  if (elects && !ELECTIVE_PAYMENT_LINES.includes(line))
    return "an individual can elect a payment only for the credits of lines 1a, 1c, 1d and 2a (the boxes of Schedule 2 lines 1e and 1f)";
  if ((prior.c ?? 0) > (prior.b ?? 0) || prior.f < 0)
    return "the earlier-year amounts do not add up: column (c) is more than (b), or (b) plus (e) is more than (a)";
  if (fact.prevailingWageRecaptures !== undefined && line !== "1g" && line !== "1j")
    return "Worksheet 3 recapture goes only on line 1g or 1j (lines-1-and-2::b01)";
  return undefined;
}

/* A cell that holds an amount on a line that has no such column. */
function missingColumn(line: Form4255Line, row: PartOneRow): string | undefined {
  const columns = LINE_COLUMNS[line];
  const extra = AMOUNT_COLUMNS.find(
    (column) => (row[column] ?? 0) !== 0 && !columns.includes(column),
  );
  return extra === undefined
    ? undefined
    : `line ${line} has no column ${columnLabel(extra)} on the form`;
}

/* One Part I line: its printed cells, or why it cannot be filled (a sentence). */
export function partOneRow(
  line: Form4255Line,
  fact: CreditRecaptureLineFactValue,
  events: ReadonlyArray<RecaptureEvent>,
): PartOneRow | string {
  const prior = priorYear(fact);
  const gap = lineGap(line, fact, prior);
  if (gap !== undefined) return `Form 4255 line ${line}: ${gap}.`;
  const recaptured = recapture(events, prior);
  if (typeof recaptured === "string") return `Form 4255 line ${line}: ${recaptured}.`;
  const penalties = splitPenalty(fact, prior);
  const row: PartOneRow = { ...prior, ...recaptured, ...excessAmounts(fact), ...penalties };
  const filled = { ...row, ...totalsByType(line, row) };
  const extra = missingColumn(line, filled);
  return extra === undefined ? filled : `Form 4255: ${extra}.`;
}

/* Line 3: each amount column's total; blank where no line prints (column (g) has no total). */
export function partOneTotals(rows: ReadonlyArray<PartOneRow>): PartOneRow {
  return Object.fromEntries(
    AMOUNT_COLUMNS.map((column) => [column, sumOrBlank(...rows.map((row) => row[column]))]),
  ) as PartOneRow;
}

/* The row has an amount that makes the form file: a recapture, an excessive amount or a penalty. */
export const rowHasAmount = (row: PartOneRow): boolean =>
  (row.h ?? 0) > 0 || (row.q ?? 0) > 0 || (row.r ?? 0) > 0;
