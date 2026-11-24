/*
 * Form 6198, At-Risk Limitations: the arithmetic of every line, pure. The
 * callers (passThrough/atRisk.ts for a K-1, schedule-c/atRisk.ts for a
 * business) turn an activity's items into Part I entries and read the owner's
 * amounts at risk from the facts (facts/kinds/atRisk.ts). Whole dollars: the
 * entries are rounded once per line, and the allocation of the deductible loss
 * splits whole dollars with prorateDollars.
 */

import type { AtRiskDetailed, AtRiskSimplified } from "../../facts/index.js";
import { atLeast, prorateDollars, roundDollars, sum, sumOrBlank } from "../../money.js";

/* The Part I line an entry goes on (irs-6198-inst-2025::sec::line-1::b01 to ::line-4::b01). */
export type PartILine = "1" | "2a" | "2b" | "2c" | "3" | "4";

/*
 * One item of income, gain, deduction or loss from the activity, signed: a
 * deduction or loss is negative, the way line 5 combines lines 1 through 4.
 * `source` is the caller's item, handed back with its allowed part.
 */
export interface PartIEntry<T> {
  line: PartILine;
  amount: number;
  /* Undefined for an amount the owner reports on another form (lines 2a to 2c from the facts). */
  source?: T;
}

export interface PartILines {
  line1?: number;
  line2a?: number;
  line2b?: number;
  line2c?: number;
  line3?: number;
  line4?: number;
  /* Combine lines 1 through 4 (irs-6198-inst-2025::sec::line-5::b01). */
  line5: number;
}

/* Part I: each line adds its entries (blank with none); line 5 combines them. */
export function partILines<T>(entries: ReadonlyArray<PartIEntry<T>>): PartILines {
  const line = (which: PartILine) =>
    roundDollars(
      sumOrBlank(...entries.filter((entry) => entry.line === which).map((entry) => entry.amount)),
    );
  const lines = {
    line1: line("1"),
    line2a: line("2a"),
    line2b: line("2b"),
    line2c: line("2c"),
    line3: line("3"),
    line4: line("4"),
  };
  return { ...lines, line5: sum(...Object.values(lines)) };
}

export interface PartIILines {
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10a: number;
  line10b: number;
}

/*
 * Part II, the simplified computation (irs-6198-inst-2025::sec::part-ii-simplified::b01):
 * line 8 adds lines 6 and 7; line 10a subtracts line 9 from line 8; line 10b
 * is line 10a when more than zero, else 0. Line 6 is never below zero.
 */
export function partIILines(amounts: AtRiskSimplified): PartIILines {
  const line6 = roundDollars(atLeast(0, amounts.adjustedBasisAtStart));
  const line7 = roundDollars(amounts.increases ?? 0);
  const line8 = line6 + line7;
  const line9 = roundDollars(amounts.decreases ?? 0);
  const line10a = line8 - line9;
  return { line6, line7, line8, line9, line10a, line10b: atLeast(0, line10a) };
}

export interface PartIIILines {
  /* Lines 11 to 14 only when Part III starts at the effective date. */
  line11?: number;
  line12?: number;
  line13?: number;
  line14?: number;
  /* Box a: the amount at the effective date; box b: last year's line 19b. */
  line15Box: "a" | "b";
  line15: number;
  /* Lines 16 and 18 count since the effective date (box a) or since the end of last year (box b). */
  sinceBox: "a" | "b";
  line16: number;
  line17: number;
  line18: number;
  line19a: number;
  line19b: number;
}

/*
 * Line 15 (irs-6198-inst-2025::sec::part-iii-detailed::b01, ::line-15::b01):
 * last year's line 19b when Part III was completed last year (box b); 0 when the
 * activity began on or after the effective date; else line 13 less line 14,
 * never below zero (box a). Undefined while the starting amount is missing.
 */
function startOfPartIII(amounts: AtRiskDetailed) {
  if (amounts.start === "prior_year_form") {
    if (amounts.priorYearAmountAtRisk === undefined) return undefined;
    return { line15Box: "b" as const, line15: roundDollars(amounts.priorYearAmountAtRisk) };
  }
  if (amounts.start === "began_after_effective_date") return { line15Box: "a" as const, line15: 0 };
  if (amounts.investmentAtEffectiveDate === undefined) return undefined;
  const line11 = roundDollars(atLeast(0, amounts.investmentAtEffectiveDate));
  const line12 = roundDollars(amounts.increasesAtEffectiveDate ?? 0);
  const line13 = line11 + line12;
  const line14 = roundDollars(amounts.decreasesAtEffectiveDate ?? 0);
  return {
    line11,
    line12,
    line13,
    line14,
    line15Box: "a" as const,
    line15: atLeast(0, line13 - line14),
  };
}

/*
 * Part III, the detailed computation: line 17 adds lines 15 and 16; line 19a
 * subtracts line 18 from line 17; line 19b is line 19a when more than zero,
 * else 0 (Form 6198 lines 17 to 19b). Undefined while line 15 cannot be figured.
 */
export function partIIILines(amounts: AtRiskDetailed): PartIIILines | undefined {
  const start = startOfPartIII(amounts);
  if (start === undefined) return undefined;
  const line16 = roundDollars(amounts.increasesSince ?? 0);
  const line17 = start.line15 + line16;
  const line18 = roundDollars(amounts.decreasesSince ?? 0);
  const line19a = line17 - line18;
  return {
    ...start,
    sinceBox: amounts.start === "prior_year_form" ? "b" : "a",
    line16,
    line17,
    line18,
    line19a,
    line19b: atLeast(0, line19a),
  };
}

/* Line 20: the larger of line 10b or line 19b, of the parts completed ("You do not need to complete Part II if you use Part III"). */
export function amountAtRisk(partII?: PartIILines, partIII?: PartIIILines): number | undefined {
  const amounts = [partII?.line10b, partIII?.line19b].filter(
    (amount): amount is number => amount !== undefined,
  );
  return amounts.length === 0 ? undefined : Math.max(...amounts);
}

/*
 * Line 21 (irs-6198-inst-2025::sec::part-iv-deductible-loss::b01): the smaller
 * of the line 5 loss, treated as a positive number, or line 20, entered as a
 * loss: ($400) with a $400 loss and $1,000 at risk; ($1,200) with a $1,600
 * loss and $1,200 at risk; 0 with nothing at risk.
 */
export function deductibleLoss(line5: number, line20: number): number {
  const allowed = Math.min(-line5, atLeast(0, line20));
  return allowed === 0 ? 0 : -allowed;
}

/*
 * The amount at risk fell below zero at the end of the year: the method
 * completed gives line 20 no amount and its line 10a or 19a is negative. Earlier
 * losses may then be recaptured as income (irs-pub-925-2025::sec::recapture-rule::b01;
 * irs-6198-inst-2025::sec::line-10b::b01, ::line-19b::b01).
 */
export function amountAtRiskBelowZero(partII?: PartIILines, partIII?: PartIIILines): boolean {
  if ((amountAtRisk(partII, partIII) ?? 0) > 0) return false;
  return (partII?.line10a ?? 0) < 0 || (partIII?.line19a ?? 0) < 0;
}

/* An entry's part allowed this year and the part carried to next year (a loss negative in both). */
export interface AllowedEntry<T> {
  source?: T;
  line: PartILine;
  allowed: number;
  carried: number;
}

/*
 * Each entry's allowed part. Income and gains are reported in full. With a
 * line 5 profit, so is every deduction and loss (irs-6198-inst-2025::sec::line-5::b01).
 * With a loss, the deductions and losses are allowed up to the income and gains
 * plus the line 21 loss, each in proportion to its share of all the deductions
 * and losses (::line-5::b02, ::part-iv-deductible-loss::b02; QUESTIONS.md item 2);
 * the rest of each is carried to next year (::part-iv-deductible-loss::b02).
 */
export function allocateLoss<T>(
  entries: ReadonlyArray<PartIEntry<T>>,
  line21: number | undefined,
): AllowedEntry<T>[] {
  const rounded = entries.map((entry) => ({ ...entry, amount: roundDollars(entry.amount) }));
  const losses = rounded.filter((entry) => entry.amount < 0);
  const gains = sum(...rounded.filter((entry) => entry.amount > 0).map((entry) => entry.amount));
  const lossTotal = -sum(...losses.map((entry) => entry.amount));
  const allowedTotal = line21 === undefined ? lossTotal : Math.min(lossTotal, gains - line21);
  const shares = prorateDollars(
    allowedTotal,
    losses.map((entry) => -entry.amount),
  );
  const allowedOf = new Map(losses.map((entry, index) => [entry, 0 - shares[index]]));
  return rounded.map((entry) => {
    const allowed = allowedOf.get(entry) ?? entry.amount;
    return { source: entry.source, line: entry.line, allowed, carried: entry.amount - allowed };
  });
}
