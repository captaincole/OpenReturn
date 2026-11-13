/*
 * One fact per person with a traditional, SEP or SIMPLE IRA: the answers Form 8606
 * needs that no 1099-R prints. The taxpayer states them (or reads them from last
 * year's Form 8606 and the December 31 account statements).
 */

export type IraOwner = "taxpayer" | "spouse";

export interface TraditionalIraFactValue {
  /*
   * IRA Deduction Worksheet line 11: the year's traditional IRA contributions,
   * deductible or not. The worksheet decides the split: line 12 is Schedule 1
   * line 20, and lines 10 and 11 less line 12 is Form 8606 line 1
   * (irs-8606-inst-2025::sec::line-1::b01).
   */
  contributions?: number;
  /*
   * Form 8606 line 1: nondeductible contributions for 2025. Without
   * `contributions`, it is line 1 as stated. With it, it must equal what the
   * worksheet leaves, or Schedule 1 line 20 is a gap: a filer may choose to
   * deduct less than the worksheet allows, and the engine does not model that.
   */
  nondeductibleContributions?: number;
  /* Line 4: the part of line 1 contributed from January 1 to April 15, 2026. */
  contributionsMadeIn2026?: number;
  /* Line 2: total basis in traditional IRAs (2024 Form 8606 line 14). */
  basisPriorYears?: number;
  /* Line 6: value of all traditional, SEP and SIMPLE IRAs on December 31, 2025, plus any outstanding rollovers. */
  yearEndValue?: number;
  /* 2025 distributions rolled over to another IRA or plan: not on line 7, not taxable. */
  rolledOver?: number;
  /* Line 8: converted to a Roth IRA in 2025. */
  convertedToRoth?: number;
}

const AMOUNT_FIELDS: Array<keyof TraditionalIraFactValue> = [
  "contributions",
  "nondeductibleContributions",
  "contributionsMadeIn2026",
  "basisPriorYears",
  "yearEndValue",
  "rolledOver",
  "convertedToRoth",
];

export function makeTraditionalIraFactKey(owner: IraOwner): string {
  return `retirement.traditional_ira.${owner}`;
}

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

/*
 * Cade records this fact as one object he writes himself, so check it. A field
 * that is not an amount makes the whole fact missing, and Cade asks again.
 */
export function readTraditionalIraFact(
  factByKey: ReadonlyMap<string, unknown>,
  owner: IraOwner,
): TraditionalIraFactValue | undefined {
  const value = factByKey.get(makeTraditionalIraFactKey(owner));
  if (typeof value !== "object" || value === null) return undefined;
  const fields = value as Record<string, unknown>;
  return AMOUNT_FIELDS.every((field) => isAmount(fields[field]))
    ? (value as TraditionalIraFactValue)
    : undefined;
}
