/*
 * Money — the one module for money math in the form engine.
 *
 * Every rule that sums, clamps, rounds, or formats a money value lives
 * here, so the rules stay in one place (CLAUDE.md, "Whole-dollar
 * rounding"). A lint rule bans Math.round / ceil / floor / trunc,
 * toFixed, and toLocaleString in the rest of src/engine.
 *
 * Storage is a `number` of dollars, not cents, so JSON round-trips and
 * fact values need no conversion. Negative values are valid (refunds,
 * losses, owe-amounts). Keep the cents while adding; round only where
 * the form asks for a whole-dollar line (roundDollars).
 */

/**
 * Dollars. A phantom brand: zero runtime cost, but the type checker
 * keeps `Money` and the other value brands (SSN, Phone) apart.
 */
export type Money = number & { readonly __brand: "Money" };

/**
 * Sum any number of numeric inputs. Undefined / null / NaN / non-numeric
 * values count as 0. The parameter type is `unknown` so cross-form
 * accessor reads (which the type system widens to `unknown`) flow through
 * without casts. The runtime `typeof v === "number"` filter keeps the
 * math honest.
 *
 * An unsupported upstream term contributes 0 rather than blocking the
 * sum. A cross-form term that is not evaluated yet does not: the engine
 * re-runs the binding on the next pass (pendingReads.ts). To block the
 * sum when any term is missing, write the arithmetic by hand and return
 * undefined from the binding.
 */
export function sum(...values: unknown[]): number {
  let total = 0;
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

/**
 * max(min, value): the form rule "if zero or less, enter -0-" when
 * `min` is 0. Treats undefined / non-numeric as `min`.
 */
export function atLeast(min: number, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return min;
  return Math.max(min, value);
}

/**
 * Whole dollars, nearest — every tax-form money line (CLAUDE.md,
 * "Whole-dollar rounding"). The IRS rule: drop under 50 cents, raise
 * 50–99 cents to the next dollar (by magnitude). Snaps to cents first,
 * so a float sum like 202887.49999999997 does not round the wrong way.
 * Blank stays blank.
 */
export function roundDollars(value: number): number;
export function roundDollars(value: number | undefined): number | undefined;
export function roundDollars(value: number | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const cents = Math.round(Math.abs(value) * 100) / 100;
  return Math.sign(value) * Math.floor(cents + 0.5);
}

/**
 * Step count for "each $step or part of $step" rules (CA AGI
 * limitation). A part step counts as a whole one, so this rounds up.
 * That is the rule itself, not dollar rounding.
 */
export function stepsOf(amount: number, step: number): number {
  return Math.ceil(amount / step);
}

/**
 * PDF text for a money widget: comma-grouped whole dollars ("79,000"),
 * the IRS-form convention in the CPA-completed golden PDFs. Zero prints
 * "0", so the field reads as "computed, value is zero", not "we forgot
 * to fill it". Blank stays blank. Per-form overrides (blank-for-zero,
 * no commas) go in `FormSpec.formatters`.
 */
export function formatDollars(value: number | null | undefined): string {
  const dollars = roundDollars(value ?? undefined);
  if (dollars === undefined) return "";
  if (dollars === 0) return "0";
  return dollars.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
