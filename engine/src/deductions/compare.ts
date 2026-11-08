/*
 * The comparison worksheet: itemized against standard, federal and California,
 * on exact amounts and estimates alike. The totals (federal.ts, ca.ts) use the
 * forms' own rules and constants, so with exact facts they equal Schedule A
 * line 17 and Schedule CA line 29.
 */

import { caItemized, type CaItemizedInput } from "./ca.js";
import type { ItemId } from "./catalog.js";
import { federalItemized } from "./federal.js";
import { amountOf, type Amounts } from "./rules.js";

export interface ComparisonInput extends CaItemizedInput {
  /** The items whose amount is an estimate. */
  estimated: ReadonlySet<ItemId>;
  federalStandard: number;
  /** Undefined when the return has no California 540. */
  caStandard?: number;
}

export interface JurisdictionComparison {
  itemized: number;
  standard: number;
  /** Itemized less standard: positive means itemizing wins. */
  margin: number;
  recommendation: "itemize" | "standard";
  /**
   * Estimated items that could flip the recommendation (see decidingItems):
   * their documents come first. Empty when the recommendation holds whatever
   * the estimates turn out to be.
   */
  decidingItems: ItemId[];
}

export interface DeductionsComparison {
  federal: JurisdictionComparison;
  ca?: JurisdictionComparison;
}

/*
 * An estimated item decides the result when setting it to 0, or doubling
 * it, flips the recommendation on this return. An item this return does not
 * deduct, or one under its floor or over its cap either way, never does.
 */
function decidingItems(
  input: ComparisonInput,
  total: (amounts: Amounts) => number | undefined,
  standard: number,
  itemizes: boolean,
): ItemId[] {
  const flips = (id: ItemId, amount: number) => {
    const changed = total({ ...input.amounts, [id]: amount });
    return changed !== undefined && changed > standard !== itemizes;
  };
  return [...input.estimated].filter((id) => {
    const amount = amountOf(input.amounts, id);
    return flips(id, 0) || flips(id, 2 * amount);
  });
}

function judge(
  input: ComparisonInput,
  total: (amounts: Amounts) => number | undefined,
  standard: number,
): JurisdictionComparison | undefined {
  const itemized = total(input.amounts);
  if (itemized === undefined) return undefined;
  const margin = itemized - standard;
  const itemizes = margin > 0;
  return {
    itemized,
    standard,
    margin,
    recommendation: itemizes ? "itemize" : "standard",
    decidingItems: decidingItems(input, total, standard, itemizes),
  };
}

export function compareDeductions(input: ComparisonInput): DeductionsComparison {
  const federal = judge(
    input,
    (amounts) => federalItemized({ ...input, amounts }),
    input.federalStandard,
  )!;
  if (input.caStandard === undefined) return { federal };
  const ca = judge(input, (amounts) => caItemized({ ...input, amounts }), input.caStandard);
  return ca === undefined ? { federal } : { federal, ca };
}
