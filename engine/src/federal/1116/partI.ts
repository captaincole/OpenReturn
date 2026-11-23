/*
 * Form 1116 Parts I and II for one category: one column (Part I) and one row
 * (Part II) for each country. Pure arithmetic on the sources and the return's
 * amounts; whole dollars on each line, cents kept while adding.
 */

import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";
import type { ForeignIncomeKind, ForeignTaxSource } from "./sources.js";

/* Line 3f: "round off the result to at least four decimal places ... don't enter more than 1" (irs-1116-inst-2025::sec::line-3f::b01). */
export const RATIO_PLACES = 4;

/*
 * Lines 4a and 4b: "If your gross foreign source income ... doesn't exceed
 * $5,000, you can allocate all of your interest expense to U.S. source income"
 * (irs-1116-inst-2025::sec::line-4a::b01, line-4b::b01).
 */
export const INTEREST_ALLOCATION_LIMIT = 5000;

/*
 * Adjusting foreign qualified dividends and capital gain distributions:
 * "multiply ... by 0.4054 if ... taxed at a rate of 15%, and by 0.5405 if they
 * are taxed at a 20% rate"; those taxed at 0% are left off line 1a
 * (irs-1116-inst-2025::sec::qualified-dividends-and-capital-gain-tax::b02).
 */
export const FIFTEEN_RATE_FACTOR = 0.4054;
export const TWENTY_RATE_FACTOR = 0.5405;

/* Part II column (l) for a tax a 1099 reports in U.S. dollars (irs-1116-inst-2025::sec::part-ii-foreign-taxes-paid-or::b04). */
export const PAYEE_STATEMENT_DATE = "1099 taxes";
/* Column (l) when a row holds payments on more than one date. Own reading (QUESTIONS.md). */
export const SEVERAL_DATES = "Various";

/* The worldwide qualified dividends and capital gain by tax rate: QDCG worksheet lines 9, 17 and 20. */
export interface RateBands {
  zeroRate: number;
  fifteenRate: number;
  twentyRate: number;
}

/*
 * One amount of foreign qualified dividends or capital gain distributions after
 * the adjustment. The instructions do not say which rate the foreign part bears
 * when the worldwide amount spans two rates; the engine spreads it in the same
 * proportions as the worldwide amount (QUESTIONS.md). Cents kept.
 */
export function adjustedPreferential(amount: number, bands: RateBands): number {
  const total = bands.zeroRate + bands.fifteenRate + bands.twentyRate;
  if (total <= 0) return amount;
  const factor =
    (bands.fifteenRate * FIFTEEN_RATE_FACTOR + bands.twentyRate * TWENTY_RATE_FACTOR) / total;
  return amount * factor;
}

/* A source's line 1a amount, cents kept: the gross, with its preferential part adjusted when it must be. */
export function line1aAmount(source: ForeignTaxSource, bands: RateBands | undefined): number {
  const gross = source.grossIncome ?? 0;
  if (bands === undefined) return gross;
  const preferential = sum(source.qualifiedDividends, source.capitalGainDistributions);
  return gross - preferential + adjustedPreferential(preferential, bands);
}

/* The amounts every column shares: lines 3a, 3b, 3e and the interest to apportion. */
export interface SharedDeductions {
  line3a: number;
  line3b: number;
  line3e: number;
  /* Schedule A line 8e to apportion on line 4a; 0 when none is apportioned. */
  homeMortgageInterest: number;
}

export interface PartIColumn {
  country: string | undefined;
  line1a: number;
  line2: number | undefined;
  line3a: number;
  line3b: number;
  line3c: number;
  line3d: number;
  line3e: number;
  line3f: number;
  line3g: number;
  line4a: number | undefined;
  line6: number;
}

/* Line 3f, and line 3 of the Worksheet for Home Mortgage Interest: a ratio of at most 1. */
export function grossIncomeRatio(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(1, roundToPlaces(part / whole, RATIO_PLACES));
}

/*
 * Worksheet for Home Mortgage Interest—Line 4a: line 4 (Schedule A line 8e)
 * times line 3 (the column's gross foreign income over gross income from all
 * sources, at least four places) (irs-1116-inst-2025::sec::part-ii-foreign-taxes-paid-or::b02, b03).
 */
export function homeMortgageInterestShare(
  mortgageInterest: number,
  foreignGross: number,
  allGross: number,
): number {
  return roundDollars(mortgageInterest * grossIncomeRatio(foreignGross, allGross));
}

/*
 * One Part I column. Line 1a: the income, adjusted when it must be. Line 2:
 * the definitely related expenses. Lines 3a–3c are the same in every column;
 * line 3d is the column's gross before any adjustment
 * (irs-1116-inst-2025::sec::line-3d::b01); line 3g = 3c × 3f. Line 5 is blank:
 * no source carries a foreign loss. Line 6 adds lines 2, 3g, 4a, 4b and 5.
 */
export function partIColumn(
  sources: ReadonlyArray<ForeignTaxSource>,
  shared: SharedDeductions,
  bands: RateBands | undefined,
): PartIColumn {
  const line1a = roundDollars(sum(...sources.map((source) => line1aAmount(source, bands))));
  const expenses = sources.map((source) => source.definitelyRelatedExpenses);
  const line2 = expenses.some((amount) => (amount ?? 0) > 0)
    ? roundDollars(sum(...expenses))
    : undefined;
  const line3c = shared.line3a + shared.line3b;
  const line3d = roundDollars(sum(...sources.map((source) => source.grossIncome)));
  const line3f = grossIncomeRatio(line3d, shared.line3e);
  const line3g = roundDollars(line3c * line3f);
  const line4a =
    shared.homeMortgageInterest > 0
      ? homeMortgageInterestShare(shared.homeMortgageInterest, line3d, shared.line3e)
      : undefined;
  return {
    country: sources[0]?.country,
    line1a,
    line2,
    line3a: shared.line3a,
    line3b: shared.line3b,
    line3c,
    line3d,
    line3e: shared.line3e,
    line3f,
    line3g,
    line4a,
    line6: sum(line2, line3g, line4a),
  };
}

/* Part II row: the U.S. dollar and foreign currency amounts by column, (q)–(t) and (m)–(p). */
export interface PartIIRow {
  date: string;
  foreignCurrency: Partial<Record<ForeignIncomeKind, number>>;
  dollars: Partial<Record<ForeignIncomeKind, number>>;
  /* Column (u): (q) through (t). */
  total: number;
}

const KINDS: ReadonlyArray<ForeignIncomeKind> = [
  "dividends",
  "rents_royalties",
  "interest",
  "other",
];

function byKind(
  sources: ReadonlyArray<ForeignTaxSource>,
  amountOf: (source: ForeignTaxSource) => number | undefined,
): Partial<Record<ForeignIncomeKind, number>> {
  const out: Partial<Record<ForeignIncomeKind, number>> = {};
  for (const kind of KINDS) {
    const amounts = sources
      .filter((source) => source.incomeKind === kind)
      .map(amountOf)
      .filter((amount): amount is number => amount !== undefined);
    if (amounts.length > 0) out[kind] = roundDollars(sum(...amounts));
  }
  return out;
}

/* Column (l): "1099 taxes" for payee statements, the date of a stated payment, else "Various". */
function rowDate(sources: ReadonlyArray<ForeignTaxSource>): string {
  const dates = new Set(
    sources.map((source) => (source.onPayeeStatement ? PAYEE_STATEMENT_DATE : source.datePaid)),
  );
  const [only] = [...dates];
  return dates.size === 1 && only !== undefined ? only : SEVERAL_DATES;
}

/*
 * One Part II row. A tax a 1099 reports in U.S. dollars needs no foreign
 * currency amount (irs-1116-inst-2025::sec::part-ii-foreign-taxes-paid-or::b04);
 * a stated tax gives both.
 */
export function partIIRow(sources: ReadonlyArray<ForeignTaxSource>): PartIIRow {
  const dollars = byKind(sources, (source) => source.foreignTaxPaid);
  return {
    date: rowDate(sources),
    foreignCurrency: byKind(
      sources.filter((source) => !source.onPayeeStatement),
      (source) => source.foreignTaxInForeignCurrency,
    ),
    dollars,
    total: sum(...Object.values(dollars)),
  };
}

/*
 * The country groups of a category, in source order: "use a separate column in
 * Part I and a separate line in Part II for each country or territory"
 * (irs-1116-inst-2025::sec::specific-instructions::b01). Names match with case
 * and spaces ignored.
 */
export function groupByCountry(sources: ReadonlyArray<ForeignTaxSource>): ForeignTaxSource[][] {
  const groups = new Map<string, ForeignTaxSource[]>();
  for (const source of sources) {
    const name = (source.country ?? "").trim().toUpperCase();
    groups.set(name, [...(groups.get(name) ?? []), source]);
  }
  return [...groups.values()];
}

/*
 * High-taxed income: passive income whose foreign tax (after expenses) is more
 * than "the highest U.S. tax that can be imposed on the income"
 * (irs-1116-inst-2025::sec::categories-of-income::b03). The engine tests each
 * country column against the top 2025 rate (irs-1040-inst-2025::sec::2025-tax-computation-worksheet-line-16::b02)
 * on its gross income before the qualified dividend adjustment (line 3d) less
 * line 6, and does not reclassify the income (QUESTIONS.md).
 */
export const TOP_INDIVIDUAL_RATE_2025 = 0.37;

export function isHighTaxed(column: PartIColumn, row: PartIIRow): boolean {
  if (row.total <= 0) return false;
  return row.total > TOP_INDIVIDUAL_RATE_2025 * atLeast(0, column.line3d - column.line6);
}
