/*
 * The one module for engine money math. Lint bans Math.round / ceil /
 * floor / trunc, toFixed and toLocaleString elsewhere in src/. Values are
 * dollars, not cents. Keep the cents while adding; round only the line.
 */

export type Money = number & { readonly __brand: "Money" };

/*
 * A missing or non-numeric term counts as 0; it does not block the sum.
 * To block on a missing term, write the arithmetic by hand.
 */
export function sum(...values: unknown[]): number {
  let total = 0;
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) total += value;
  }
  return total;
}

/* Blank, not 0, when every term is blank (the printed-zero rule): a total prints only when a line feeds it. */
export function sumOrBlank(...values: unknown[]): number | undefined {
  return values.some((value) => typeof value === "number") ? sum(...values) : undefined;
}

/* A cross-form read is typed unknown: a finite number passes, anything else is blank. */
export function numberOrBlank(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function atLeast(min: number, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return min;
  return Math.max(min, value);
}

/*
 * IRS rule: drop under 50 cents, raise 50–99 cents (by magnitude). Snap to
 * cents first, so 202887.49999999997 does not round the wrong way.
 */
export function roundDollars(value: number): number;
export function roundDollars(value: number | undefined): number | undefined;
export function roundDollars(value: number | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const cents = Math.round(Math.abs(value) * 100) / 100;
  return Math.sign(value) * Math.floor(cents + 0.5);
}

/*
 * A whole-dollar total split among shares in proportion (Form 7203 Part III
 * columns (c) and (d), irs-7203-inst-2025::sec::part-iii::b01–b02). Each running
 * total is rounded once, so the parts add up to the rounded total exactly and
 * each part is within a dollar of its share. Shares are positive.
 */
export function prorateDollars(total: number, shares: readonly number[]): number[] {
  const whole = sum(...shares);
  if (whole <= 0) return shares.map(() => 0);
  const runningTotals = shares.map((_, index) =>
    roundDollars((total * sum(...shares.slice(0, index + 1))) / whole),
  );
  return runningTotals.map((upTo, index) => upTo - (index === 0 ? 0 : runningTotals[index - 1]));
}

/*
 * A ratio a form enters "as a decimal (rounded to at least three places)" (Form
 * 8814 lines 7 and 8): rounded to `places` decimals, the half up. The small
 * tolerance absorbs float error only (0.4115 scaled is 411.49999999999994 and
 * gives 0.412). It is not roundDollars: that snaps to cents first, which would
 * round 0.4774951 to 0.478.
 */
const FLOAT_TOLERANCE = 1e-9;
export function roundToPlaces(value: number, places: number): number {
  const scale = 10 ** places;
  return (Math.sign(value) * Math.floor(Math.abs(value) * scale + 0.5 + FLOAT_TOLERANCE)) / scale;
}

/*
 * An amount in a foreign currency, in U.S. dollars with cents: divided by the
 * rate (units of the currency per dollar, irs.gov "Yearly average currency
 * exchange rates": "divide the foreign currency amount by the applicable ...
 * rate") and rounded to the cent, the half cent up by magnitude. The cents
 * stay until the form rounds its line (the whole-dollar rule).
 */
const CENT_PLACES = 2;
export function dollarsFromForeign(amount: number, unitsPerDollar: number): number {
  return roundToPlaces(amount / unitsPerDollar, CENT_PLACES);
}

// "Each $step or part of $step": a part step counts, so this rounds up by rule.
export function stepsOf(amount: number, step: number): number {
  return Math.ceil(amount / step);
}

// "Do not round; drop any numbers after the decimal point" (Form 8962 Worksheet 2): toward zero.
export function wholePart(value: number): number {
  return Math.trunc(value);
}

// Zero prints "0" on purpose: "computed as zero", not "not filled".
export function formatDollars(value: number | null | undefined): string {
  const dollars = roundDollars(value ?? undefined);
  if (dollars === undefined) return "";
  if (dollars === 0) return "0";
  return dollars.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
