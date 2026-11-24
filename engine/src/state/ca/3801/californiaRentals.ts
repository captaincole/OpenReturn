/*
 * FTB 3801 Parts IV and V from the return's Schedule E properties, in
 * California amounts, figured from the facts (resolver side).
 *
 * - Column (d) of the California Passive Activity Worksheet is the federal net
 *   income or loss before the PAL rules, Schedule E line 21
 *   (ca-3801-inst-2025::sec::step-1-figuring-your-california-passive-activity-income-loss::b01);
 *   line21Amount is that line's rule.
 * - Column (e) is the FTB 3885A difference (ca-3801-inst-2025::sec::step-1::b01):
 *   line 8b/14b raise California income, line 8a/14a lower it.
 * - Every rental activity is passive for California, a real estate
 *   professional's too (ca-3801-inst-2025::sec::material-participation-in-real-property-business-irc-section-469-c-7::b01).
 * - Column (c) of Parts IV and V is the California carryover
 *   (facts/kinds/caPassiveCarryover.ts).
 * Each property is then placed as federal Form 8582 places it (placementOf).
 */

import { SPOUSE_KEYS, type RentalFactValue } from "../../../facts/index.js";
import {
  activityName,
  placementOf,
  rowsOf,
  unmodeled,
  type PassiveActivity,
} from "../../../federal/8582/activities.js";
import { isRentalActivity, selfRentalState } from "../../../federal/rentals/passive.js";
import type { PropertyColumn, RentalProperty } from "../../../federal/schedule-e/filingInfo.js";
import { line21Amount, rentalDepreciationGap } from "../../../federal/schedule-e/lines.js";
import type { FilingStatus } from "../../../values.js";
import { californiaAdjustment, form3885AFigures } from "../3885a/lines.js";

/* One Schedule E Part I property, for both worksheets on Side 2 and Parts IV and V. */
export interface CaScheduleEActivity {
  factKey: string;
  column: PropertyColumn;
  name: string;
  royalty: boolean;
  /* Schedule E line 21: federal net income (loss) before the PAL rules. */
  federalNet: number;
  /* FTB 3885A: California income less federal income (8b + 14b − 8a − 14a); 0 with no difference. */
  californiaAdjustment: number;
  /* federalNet plus californiaAdjustment. */
  californiaNet: number;
  /* On FTB 3801 Parts IV or V: a passive activity for California. */
  passive: boolean;
  /* Its Part IV and Part V rows (one, or two when the carryover goes to Part V). */
  rows: PassiveActivity[];
}

/* The answers outside the property that its place reads. */
export interface PlacementAnswers {
  filingStatus?: FilingStatus;
  livedApartFromSpouseAllYear?: boolean;
  /* The California carryover the taxpayer stated for a fact key, if any. */
  statedCarryover: (factKey: string) => number | undefined;
  /* The key Cade records it under. */
  carryoverKey: (factKey: string) => string;
}

export type PropertyOutcome =
  | { kind: "ready"; activity: CaScheduleEActivity; producesLoss: boolean }
  | { kind: "waits"; keys: string[]; producesLoss?: boolean }
  | { kind: "gap"; reason: string; producesLoss?: boolean };

export const UNMODELED_GAP =
  "A passive rental the engine does not model for the passive activity rules (an entire disposition, a type 8 property, a passive trade or business or land with net income) is on the return, so FTB 3801 cannot place it.";
export const FORMER_PASSIVE_GAP =
  "A property that is not passive for California has a California prior year unallowed loss (a former passive activity), which FTB 3801 does not model.";
export const SELF_RENTAL_CARRYOVER_GAP =
  "A self-rental's net income is more than its California prior year unallowed loss: the loss is then allowed outside FTB 3801, which the engine does not model.";

/*
 * California's passive test: every rental activity is passive. A stay of 7
 * days or less is not a rental activity: as a trade or business it is passive
 * unless the owner materially participated, the federal rule. A royalty follows
 * its royaltyActivity answer. Undefined while an answer is missing.
 */
export function californiaPassive(value: RentalFactValue): boolean | undefined {
  if (value.propertyType === "royalties") {
    return value.royaltyActivity === undefined ? undefined : value.royaltyActivity === "passive";
  }
  const rental = isRentalActivity(value);
  if (rental === undefined) return undefined;
  if (rental) return true;
  return value.materiallyParticipated === undefined ? undefined : !value.materiallyParticipated;
}

/*
 * The federal carryover cannot stand in for California's when the property has
 * one (it is figured in federal amounts) or the property is not passive
 * federally (a real estate professional's rental has no federal carryover).
 */
export function asksCarryover(property: RentalProperty, passiveForCalifornia: boolean): boolean {
  if (!passiveForCalifornia) return false;
  return (property.value.priorYearUnallowedLoss ?? 0) > 0 || property.passive === false;
}

/* The FTB 3885A difference as one signed amount; undefined while it waits; a string is its gap. */
function depreciationDifference(value: RentalFactValue): number | string | undefined {
  if (!value.depreciation) return 0;
  const gap = form3885AFigures(value.depreciation).gap;
  if (gap) return gap;
  const adjustment = californiaAdjustment(value.depreciation);
  return adjustment === undefined ? undefined : adjustment.addition - adjustment.subtraction;
}

/*
 * The property needs FTB 3801's worksheets for its Schedule CA line 5 amount:
 * a passive loss or carryover in California (ca-3801-inst-2025::sec::b-who-must-file::b01),
 * or a federal one, which federal Form 8582 may have limited (QUESTIONS.md item 1).
 */
function needsForm(
  property: RentalProperty,
  passive: boolean,
  californiaNet: number,
  carryover: number,
): boolean {
  if (!passive) return false;
  if (californiaNet < 0 || carryover > 0) return true;
  const federalNet = line21Amount(property.value) ?? 0;
  const federalCarryover = property.value.priorYearUnallowedLoss ?? 0;
  return property.passive === true && (federalNet < 0 || federalCarryover > 0);
}

interface Amounts {
  federalNet: number;
  adjustment: number;
  passive: boolean;
  carryover: number;
}

/* Line 21, the FTB 3885A difference, the passive answer and the carryover; or why they wait. */
function amountsOf(
  property: RentalProperty,
  answers: PlacementAnswers,
): Amounts | Exclude<PropertyOutcome, { kind: "ready" }> {
  const { value, factKey } = property;
  const federalNet = line21Amount(value);
  if (federalNet === undefined) {
    const gap = rentalDepreciationGap(value);
    return gap ? { kind: "gap", reason: gap } : { kind: "waits", keys: [factKey] };
  }
  const adjustment = depreciationDifference(value);
  if (typeof adjustment === "string") return { kind: "gap", reason: adjustment };
  if (adjustment === undefined) return { kind: "waits", keys: [factKey] };
  const passive = californiaPassive(value);
  if (passive === undefined) return { kind: "waits", keys: [factKey] };
  const stated = answers.statedCarryover(factKey);
  const asked = asksCarryover(property, passive);
  const carryover = stated ?? (asked ? undefined : (value.priorYearUnallowedLoss ?? 0));
  if (carryover === undefined) return { kind: "waits", keys: [answers.carryoverKey(factKey)] };
  return { federalNet, adjustment, passive, carryover };
}

/* One property's California figures, rows and whether it needs the form. */
export function californiaProperty(
  property: RentalProperty,
  answers: PlacementAnswers,
): PropertyOutcome {
  const amounts = amountsOf(property, answers);
  if ("kind" in amounts) return amounts;
  const { federalNet, adjustment, passive, carryover } = amounts;
  const californiaNet = federalNet + adjustment;
  const producesLoss = needsForm(property, passive, californiaNet, carryover);
  const view: RentalProperty = {
    ...property,
    value: { ...property.value, priorYearUnallowedLoss: carryover },
    passive,
  };
  if (passive && unmodeled(view.value, californiaNet)) {
    return { kind: "gap", reason: UNMODELED_GAP, producesLoss };
  }
  if (selfRentalState(view.value, californiaNet) === "waits") {
    return { kind: "gap", reason: SELF_RENTAL_CARRYOVER_GAP, producesLoss };
  }
  const placement = placementOf(view, answers, californiaNet);
  if (placement === "lived_apart") {
    return { kind: "waits", keys: [SPOUSE_KEYS.livedApartAllYear], producesLoss };
  }
  if (placement === "property" || placement === "passive") {
    if (!passive) return { kind: "gap", reason: FORMER_PASSIVE_GAP, producesLoss };
    return { kind: "waits", keys: [property.factKey], producesLoss };
  }
  const rows = placement === null ? [] : rowsOf(view, placement, californiaNet);
  const activity: CaScheduleEActivity = {
    factKey: property.factKey,
    column: property.column,
    name: activityName(property),
    royalty: property.value.propertyType === "royalties",
    federalNet,
    californiaAdjustment: adjustment,
    californiaNet,
    passive: rows.length > 0,
    rows,
  };
  return { kind: "ready", activity, producesLoss };
}
