/*
 * The comparison worksheet: itemized against standard, federal and California.
 * The itemized totals are the forms' own lines (Schedule A line 17, Schedule
 * CA line 29) from a pass as if the return itemizes, on facts and assumptions
 * alike (evaluate.ts runs the passes).
 */

import type { ItemId } from "./catalog.js";

/** The itemized totals of one pass; undefined while a line waits. */
export interface Totals {
  federal?: number;
  /** Undefined when the return has no California 540. */
  ca?: number;
}

export interface ComparisonInput {
  totals: Totals;
  standards: { federal: number; ca?: number };
  /** Each unsettled item (an assumption, or the CPA's upper bound), with the totals at 0 and at double. */
  whatIfs: ReadonlyArray<{ id: ItemId; totals: Totals[] }>;
}

export interface JurisdictionComparison {
  itemized: number;
  standard: number;
  /** Itemized less standard: positive means itemizing wins. */
  margin: number;
  recommendation: "itemize" | "standard";
  /**
   * Unsettled items whose 0 or double flips the recommendation: their
   * documents come first. Empty when the recommendation holds whatever the
   * assumptions turn out to be.
   */
  decidingItems: ItemId[];
}

export interface DeductionsComparison {
  /** Undefined while Schedule A line 17 waits (an open mortgage). */
  federal?: JurisdictionComparison;
  ca?: JurisdictionComparison;
}

function judge(
  input: ComparisonInput,
  jurisdiction: keyof Totals,
  standard: number | undefined,
): JurisdictionComparison | undefined {
  const itemized = input.totals[jurisdiction];
  if (itemized === undefined || standard === undefined) return undefined;
  const margin = itemized - standard;
  const itemizes = margin > 0;
  const flips = (totals: Totals) => {
    const changed = totals[jurisdiction];
    return changed !== undefined && changed > standard !== itemizes;
  };
  return {
    itemized,
    standard,
    margin,
    recommendation: itemizes ? "itemize" : "standard",
    decidingItems: input.whatIfs
      .filter((whatIf) => whatIf.totals.some(flips))
      .map((whatIf) => whatIf.id),
  };
}

export function compareDeductions(input: ComparisonInput): DeductionsComparison {
  const federal = judge(input, "federal", input.standards.federal);
  const ca = judge(input, "ca", input.standards.ca);
  return { ...(federal && { federal }), ...(ca && { ca }) };
}
