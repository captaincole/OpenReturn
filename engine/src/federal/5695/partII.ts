import type { EnergyImprovementItem, EnergyItemKind } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import type { Form5695FilingInfo } from "./filingInfo.js";

export const CREDIT_RATE = 0.3;

const SECTION_A: readonly EnergyItemKind[] = ["insulation", "exterior_door", "window_skylight"];

export function itemsOf(info: Form5695FilingInfo, kind: EnergyItemKind): EnergyImprovementItem[] {
  return (info.energyItems ?? [])
    .filter((i) => i.kind === kind)
    .sort((left, right) => right.cost - left.cost);
}

export function hasSectionA(info: Form5695FilingInfo): boolean {
  return (info.energyItems ?? []).some((i) => SECTION_A.includes(i.kind));
}

export function hasSectionB(info: Form5695FilingInfo): boolean {
  return (info.energyItems ?? []).some((i) => !SECTION_A.includes(i.kind));
}

/* Form 5695: a No on line 17a, 17b, or 17c bars the credit. */
export function sectionAApplies(info: Form5695FilingInfo): boolean {
  return (
    hasSectionA(info) &&
    info.homeEnergyMainHomeInUs === true &&
    info.homeEnergyOriginalUser === true &&
    info.homeEnergyLastsFiveYears === true
  );
}

/* Form 5695 line 17e: "If you check the Yes box, skip lines 18a through 20d." */
export function sectionAQualifies(info: Form5695FilingInfo): boolean {
  return sectionAApplies(info) && info.homeEnergyNewConstruction === false;
}

export function sectionBQualifies(info: Form5695FilingInfo): boolean {
  return (
    hasSectionB(info) &&
    info.homeEnergyMainHomeInUs === true &&
    info.homeEnergyOriginalUser === true
  );
}

export function costOf(items: readonly EnergyImprovementItem[]): number | undefined {
  return items.length === 0 ? undefined : roundDollars(sum(...items.map((i) => i.cost)));
}

export function credit(amount: number | undefined, cap: number): number | undefined {
  return amount === undefined ? undefined : Math.min(roundDollars(amount * CREDIT_RATE), cap);
}

export function total(...values: Array<number | undefined>): number | undefined {
  return values.every((value) => value === undefined) ? undefined : sum(...values);
}
