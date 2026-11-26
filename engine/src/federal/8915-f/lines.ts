/*
 * Form 8915-F arithmetic, in whole dollars: Part I's limit and columns, the
 * 3-year spread of Parts II and III, Worksheets 2 to 5 and Part IV. The block
 * id of each rule is in irs-8915f-inst-2025 unless named otherwise.
 */

import { atLeast, roundDollars, sum } from "../../money.js";

/*
 * "For each qualified 2021 or later disaster, the total of your qualified
 * disaster distributions from all plans is limited to $22,000"
 * (disaster-virginia-severe-winter-storm-and-snowstorm::b03; what-s-new::b03).
 */
export const QUALIFIED_DISASTER_LIMIT = 22_000;

/* Lines 11 and 22: "Otherwise, enter the amount from line 10 divided by 3.0" (the form). */
export const SPREAD_YEARS = 3;

/*
 * Qualified disaster distributions can be made "in the year the disaster began
 * and, for certain disasters, in the year or 2 after" (what-is-a-qualified-disaster::b02),
 * which is why Worksheets 2 and 4 look back at most two forms.
 */
export const LAST_DISTRIBUTION_YEAR_AFTER_DISASTER = 2;

/* Lines 2, 3 and 4: other-than-IRA plans, traditional IRAs, Roth IRAs. */
export type PartILine = "plan" | "traditional" | "roth";
export const PART_I_LINES: readonly PartILine[] = ["plan", "traditional", "roth"];
export type ByLine = Record<PartILine, number>;

/* A part of a distribution treated as a qualified disaster distribution, whole dollars. */
export interface DesignatedPiece {
  line: PartILine;
  amount: number;
  date: string;
}

/* A disaster in the Part I table, for the limit. */
export interface LimitDisaster {
  onEarlierForm: boolean;
  /* Whole dollars of qualified disaster distributions made in earlier years. */
  earlier: number;
  periodStart: string;
  periodEnd: string;
}

export interface Line1 {
  line1a?: number;
  line1b?: number;
  line1c?: number;
  line1d?: number;
  line1e: number;
}

/*
 * Lines 1a to 1e. Leave 1a–1d blank when no Part I disaster is on an earlier
 * Form 8915-F; line 1e is then $22,000 times the disasters
 * (lines-1a-through-1d::b01, line-1e::b01). Otherwise 1a is $22,000 times the
 * disasters on an earlier form (line-1a::b01), 1b the earlier distributions
 * for all Part I disasters (line-1b::b02), 1c = 1a − 1b, 1d $22,000 times the
 * disasters on no earlier form (line-1d::b01), 1e = 1c + 1d.
 */
export function line1(disasters: readonly LimitDisaster[]): Line1 {
  const earlier = disasters.filter((disaster) => disaster.onEarlierForm).length;
  if (earlier === 0) return { line1e: QUALIFIED_DISASTER_LIMIT * disasters.length };
  const line1a = QUALIFIED_DISASTER_LIMIT * earlier;
  const line1b = sum(...disasters.map((disaster) => disaster.earlier));
  const line1c = atLeast(0, line1a - line1b);
  const line1d = QUALIFIED_DISASTER_LIMIT * (disasters.length - earlier);
  return { line1a, line1b, line1c, line1d, line1e: line1c + line1d };
}

const inPeriod = (disaster: LimitDisaster, piece: DesignatedPiece) =>
  piece.date >= disaster.periodStart && piece.date <= disaster.periodEnd;

/*
 * Worksheet 1B is required with more than one Part I disaster unless every
 * distribution of the year falls in every Part I disaster's period
 * (worksheet-1b::b01–b02). The engine uses it only when required: where it is
 * a choice, lines 1a–1e give the same total.
 */
export function needsWorksheet1B(
  disasters: readonly LimitDisaster[],
  pieces: readonly DesignatedPiece[],
): boolean {
  if (disasters.length < 2) return false;
  return pieces.some((piece) => disasters.some((disaster) => !inPeriod(disaster, piece)));
}

/* Pieces in date order, the order given for the same day. */
export function inDateOrder<T extends { date: string }>(pieces: readonly T[]): number[] {
  return pieces
    .map((piece, index) => ({ piece, index }))
    .sort((one, two) => one.piece.date.localeCompare(two.piece.date) || one.index - two.index)
    .map((entry) => entry.index);
}

/*
 * DECISION (2026-11-25, by the author): when the designated distributions
 * are more than line 1e, which of them are qualified? Text A, line 5b step (3):
 * "Enter on lines 2 through 4 in column (b) the amounts from lines 2 through
 * 4, respectively, in column (a) allocated, if needed, by any reasonable
 * method" (irs-8915f-inst-2025::sec::section-601-of-the-secure-2-0-act-of-2022::b02;
 * disaster-virginia-severe-winter-storm-and-snowstorm::b03, "any reasonable
 * method"). Text B, Worksheet 1B: "apply your distributions in $22,000 amounts
 * as available" and its examples apply them in date order (worksheet-1b::b03–b05).
 * The engine applies the designated distributions in date order up to line 1e,
 * as Worksheet 1B does, because the limit is reached in time order and one rule
 * then serves both paths. Returns the qualified amount of each piece.
 */
export function allocateInDateOrder(pieces: readonly DesignatedPiece[], limit: number): number[] {
  const qualified = pieces.map(() => 0);
  let left = limit;
  for (const index of inDateOrder(pieces)) {
    const taken = Math.min(pieces[index].amount, atLeast(0, left));
    qualified[index] = taken;
    left -= taken;
  }
  return qualified;
}

/*
 * Worksheet 1B column (X) and (b): "apply your distributions in $22,000 amounts
 * as available to each available disaster, beginning with the disaster with
 * the earliest ending date" (worksheet-1b::b03); a distribution counts only for
 * a disaster whose period it falls in (worksheet-1b::b02, ::b05). Each
 * disaster's room is $22,000 less its column (X). Returns the qualified amount
 * of each piece.
 */
export function worksheet1B(
  disasters: readonly LimitDisaster[],
  pieces: readonly DesignatedPiece[],
): number[] {
  const left = pieces.map((piece) => piece.amount);
  const qualified = pieces.map(() => 0);
  const byEnd = inDateOrder(disasters.map((disaster) => ({ date: disaster.periodEnd })));
  for (const disasterIndex of byEnd) {
    const disaster = disasters[disasterIndex];
    let room = atLeast(0, QUALIFIED_DISASTER_LIMIT - disaster.earlier);
    for (const index of inDateOrder(pieces)) {
      if (room === 0 || !inPeriod(disaster, pieces[index])) continue;
      const taken = Math.min(left[index], room);
      left[index] -= taken;
      qualified[index] += taken;
      room -= taken;
    }
  }
  return qualified;
}

export interface PartIColumns {
  columnA: ByLine;
  /* Blank when line 1e is 0: "skip line 5, enter -0- on line 6" (the form, line 1e). */
  columnB?: ByLine;
  line5a?: number;
  line5bColumnA?: number;
  line5bColumnB?: number;
  line6: number;
  line7: number;
}

const byLine = (pieces: readonly DesignatedPiece[], amounts: readonly number[]): ByLine => {
  const total = (line: PartILine) =>
    sum(...pieces.map((piece, index) => (piece.line === line ? amounts[index] : 0)));
  return { plan: total("plan"), traditional: total("traditional"), roth: total("roth") };
};

/*
 * Lines 2 to 7. Line 5a is the part of column (a) that is not a qualified
 * disaster distribution (line-5a::b01); 5b column (a) is the rest. Line 6 is
 * 5b column (b). Line 7 is column (a) less line 6, reduced by the part of it
 * on Part IV line 28 (line-7::b02, line-28::b01).
 *
 * DECISION (2026-11-25, by the author): what goes in column (b) of lines 2 to
 * 4 when line 5b column (a) is not more than line 1e? Text A: "enter the
 * amounts on lines 2 through 4 and line 5b in column (a) on lines 2 through 4
 * and line 5b in column (b)"
 * (irs-8915f-inst-2025::sec::section-601-of-the-secure-2-0-act-of-2022::b02).
 * Text B, the form, line 5b step (3): the amounts are allocated "so that the
 * sum of lines 2 through 4 in column (b) equals the amount on line 5b, column
 * (b)", and line 5b column (a) is lines 2 to 4 less line 5a. The engine puts
 * only the qualified amount of each line in column (b), so the lines add to
 * line 5b column (b): the form's arithmetic wins over a sentence written
 * before line 5a was added (what-s-new::b01–b02).
 */
export function partIColumns(input: {
  columnA: ByLine;
  pieces: readonly DesignatedPiece[];
  qualified: readonly number[];
  line1e?: number;
  line28: number;
}): PartIColumns {
  const totalA = sum(...PART_I_LINES.map((line) => input.columnA[line]));
  const line7 = (line6: number) => atLeast(0, totalA - line6 - input.line28);
  if (input.line1e === 0) return { columnA: input.columnA, line6: 0, line7: line7(0) };
  const designated = sum(...input.pieces.map((piece) => piece.amount));
  const columnB = byLine(input.pieces, input.qualified);
  const line5bColumnB = sum(...PART_I_LINES.map((line) => columnB[line]));
  return {
    columnA: input.columnA,
    columnB,
    line5a: atLeast(0, totalA - designated),
    line5bColumnA: totalA - atLeast(0, totalA - designated),
    line5bColumnB,
    line6: line5bColumnB,
    line7: line7(line5bColumnB),
  };
}

/* Lines 11 and 22: the whole taxable amount with the box checked, else a third of it. */
export function spreadOverThreeYears(taxable: number, electNotToSpread: boolean): number {
  return electNotToSpread ? taxable : roundDollars(taxable / SPREAD_YEARS);
}

/* Lines 15 and 26: "Subtract line 14 from line 13. If zero or less, enter -0-" (the form). */
export const amountSubjectToTax = (income: number, repayment: number): number =>
  atLeast(0, income - repayment);
