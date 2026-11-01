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

// "Each $step or part of $step": a part step counts, so this rounds up by rule.
export function stepsOf(amount: number, step: number): number {
  return Math.ceil(amount / step);
}

// Zero prints "0" on purpose: "computed as zero", not "not filled".
export function formatDollars(value: number | null | undefined): string {
  const dollars = roundDollars(value ?? undefined);
  if (dollars === undefined) return "";
  if (dollars === 0) return "0";
  return dollars.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
