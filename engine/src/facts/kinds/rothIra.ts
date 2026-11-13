/*
 * One fact per person with a Roth IRA distribution that is not qualified (1099-R
 * code J or T): the answers Form 8606 Part III needs that no 1099-R prints. The
 * taxpayer states them, from last year's Form 8606 and their records.
 */

import type { IraOwner } from "./traditionalIra.js";

export interface RothIraFactValue {
  /* Form 8606 line 19: the part of the distributions rolled over or otherwise left off line 19. */
  notOnLine19?: number;
  /* Line 20: qualified first-time homebuyer expenses (at most $10,000 over a lifetime). */
  firstTimeHomebuyerExpenses?: number;
  /* Line 22: basis in regular Roth IRA contributions. */
  contributionBasis?: number;
  /* Line 24: basis in conversions and in rollovers from qualified plans. */
  conversionAndRolloverBasis?: number;
}

const AMOUNT_FIELDS: Array<keyof RothIraFactValue> = [
  "notOnLine19",
  "firstTimeHomebuyerExpenses",
  "contributionBasis",
  "conversionAndRolloverBasis",
];

export function makeRothIraFactKey(owner: IraOwner): string {
  return `retirement.roth_ira.${owner}`;
}

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

/* The fact, or undefined when it is missing or a field is not an amount (Cade asks again). */
export function readRothIraFact(
  factByKey: ReadonlyMap<string, unknown>,
  owner: IraOwner,
): RothIraFactValue | undefined {
  const value = factByKey.get(makeRothIraFactKey(owner));
  if (typeof value !== "object" || value === null) return undefined;
  const fields = value as Record<string, unknown>;
  return AMOUNT_FIELDS.every((field) => isAmount(fields[field]))
    ? (value as RothIraFactValue)
    : undefined;
}
