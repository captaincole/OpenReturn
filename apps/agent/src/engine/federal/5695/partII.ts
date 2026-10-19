/*
 * Form 5695 Part II helpers: group the invoice items by line and do the
 * "30%, but not more than $X" step that every line group repeats.
 */

import type { EnergyImprovementItem, EnergyItemKind } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import type { Form5695FilingInfo } from "./filingInfo.js";

export const CREDIT_RATE = 0.3;

/* Section A (lines 17–20): energy efficiency improvements to the building envelope. */
const SECTION_A: readonly EnergyItemKind[] = ["insulation", "exterior_door", "window_skylight"];

/** The items of one kind, most expensive first. */
export function itemsOf(info: Form5695FilingInfo, kind: EnergyItemKind): EnergyImprovementItem[] {
  return (info.energyItems ?? []).filter((i) => i.kind === kind).sort((a, b) => b.cost - a.cost);
}

export function hasSectionA(info: Form5695FilingInfo): boolean {
  return (info.energyItems ?? []).some((i) => SECTION_A.includes(i.kind));
}

export function hasSectionB(info: Form5695FilingInfo): boolean {
  return (info.energyItems ?? []).some((i) => !SECTION_A.includes(i.kind));
}

/*
 * Lines 17d and 17e are filled in only when lines 17a, 17b, and 17c are
 * all Yes ("If you check the No box, you can't take the energy
 * efficient home improvement credit").
 */
export function sectionAApplies(info: Form5695FilingInfo): boolean {
  return (
    hasSectionA(info) &&
    info.homeEnergyMainHomeInUs === true &&
    info.homeEnergyOriginalUser === true &&
    info.homeEnergyLastsFiveYears === true
  );
}

/*
 * Lines 18–20 also need line 17e No: "If you check the Yes box, skip
 * lines 18a through 20d" (improvements related to building a new home).
 */
export function sectionAQualifies(info: Form5695FilingInfo): boolean {
  return sectionAApplies(info) && info.homeEnergyNewConstruction === false;
}

/* Section B applies only when lines 21a and 21b are both Yes. */
export function sectionBQualifies(info: Form5695FilingInfo): boolean {
  return (
    hasSectionB(info) &&
    info.homeEnergyMainHomeInUs === true &&
    info.homeEnergyOriginalUser === true
  );
}

/** Rounded total cost of some items; undefined when there are none. */
export function costOf(items: readonly EnergyImprovementItem[]): number | undefined {
  return items.length === 0 ? undefined : roundDollars(sum(...items.map((i) => i.cost)));
}

/** Line × 30%, rounded, then capped. Undefined stays undefined. */
export function credit(amount: number | undefined, cap: number): number | undefined {
  return amount === undefined ? undefined : Math.min(roundDollars(amount * CREDIT_RATE), cap);
}

/** Sum of the defined values; undefined when every value is undefined. */
export function total(...values: Array<number | undefined>): number | undefined {
  return values.every((v) => v === undefined) ? undefined : sum(...values);
}
