/*
 * The comparison worksheet: itemized against standard, federal and California,
 * on exact amounts and estimates alike. It uses the forms' own rules and
 * constants (the SALT cap, the AGI floors, the CA line 29 worksheet), so with
 * exact facts its totals equal Schedule A line 17 and Schedule CA line 29.
 */

import { saltCap } from "../federal/schedule-a/saltCap.js";
import { atLeast, roundDollars, sum } from "../money.js";
import { caItemizedLine29 } from "../state/ca/schedule-ca/itemizedWorksheet.js";
import type { FilingStatus } from "../values.js";
import { DEDUCTION_ITEMS, type ItemId, type ReturnLine } from "./catalog.js";

export type Amounts = Partial<Record<ItemId, number>>;

export interface ComparisonInput {
  /** Each item's amount as stated (exact or estimate); a floor or cap is applied here. */
  amounts: Amounts;
  /** The items whose amount is an estimate. */
  estimated: ReadonlySet<ItemId>;
  /** Federal AGI (Form 1040 line 11b): the floors and the SALT cap read it. */
  agi: number;
  filingStatus: FilingStatus;
  federalStandard: number;
  /** Undefined when the return has no California 540. */
  caStandard?: number;
  /** FTB 3526 line 8 when California's investment interest differs from the federal. */
  caInvestmentInterest?: number;
}

export interface JurisdictionComparison {
  itemized: number;
  standard: number;
  /** Itemized less standard: positive means itemizing wins. */
  margin: number;
  recommendation: "itemize" | "standard";
  /**
   * Estimated items whose amount is at least the margin: an error that size
   * could flip the recommendation, so their documents come first. Empty when
   * the recommendation holds whatever the estimates turn out to be.
   */
  decidingItems: ItemId[];
}

export interface DeductionsComparison {
  federal: JurisdictionComparison;
  ca?: JurisdictionComparison;
}

const amountOf = (amounts: Amounts, id: ItemId): number => amounts[id] ?? 0;

const itemById = (id: ItemId) => DEDUCTION_ITEMS.find((item) => item.id === id)!;

/* What one item adds on one return: its amount, or the part over the AGI floor. */
function counted(line: ReturnLine, amount: number, agi: number): number {
  if (line.rule === "none") return 0;
  if (line.rule === "agi_floor")
    return atLeast(0, amount - roundDollars(agi * (line.floorRate ?? 0)));
  return amount;
}

/* Schedule A line 17: the SALT pool under its cap, the rest as their rules say. */
export function federalItemized(input: ComparisonInput): number {
  const salt = DEDUCTION_ITEMS.filter((item) => item.federal.rule === "salt");
  const pool = sum(...salt.map((item) => amountOf(input.amounts, item.id)));
  const others = DEDUCTION_ITEMS.filter((item) => item.federal.rule !== "salt").map((item) =>
    counted(item.federal, amountOf(input.amounts, item.id), input.agi),
  );
  return sum(Math.min(pool, saltCap(input.agi, input.filingStatus)), ...others);
}

/*
 * Schedule CA Part II line 29: no state income tax, no SALT cap, the 2% items,
 * California's own investment interest, then the high-AGI worksheet.
 */
export function caItemized(input: ComparisonInput): number | undefined {
  const line28 = sum(
    ...DEDUCTION_ITEMS.map((item) =>
      item.id === "investment_interest" && input.caInvestmentInterest !== undefined
        ? input.caInvestmentInterest
        : counted(item.ca, amountOf(input.amounts, item.id), input.agi),
    ),
  );
  // Worksheet line 2 reads the federal Schedule A lines 4 and 9.
  return caItemizedLine29({
    line28,
    federalAgi: input.agi,
    filingStatus: input.filingStatus,
    scheduleALine4: counted(
      itemById("medical").federal,
      amountOf(input.amounts, "medical"),
      input.agi,
    ),
    scheduleALine9: amountOf(input.amounts, "investment_interest"),
    scheduleALine15: undefined,
    scheduleALine16: undefined,
  });
}

/*
 * An estimated item decides the result when setting it to 0, or doubling
 * it, flips the recommendation on this return: its document comes first. A
 * item this return does not deduct, or one under its floor either way,
 * never does.
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
