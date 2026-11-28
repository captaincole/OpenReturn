/*
 * Form 8900 from the railroad track maintenance fact
 * (facts/kinds/railroadTrackMaintenance.ts): lines 1 to 5, and the basis
 * reduction of the asset that holds the capitalized expenditures. The
 * reduction lowers the asset's cost wherever the business is read: it is one
 * entry of the list of credits that lower a deduction
 * (facts/kinds/activitiesOnReturn.ts). Line 5 is the business's Form 3800 line
 * 4g source (form3800.ts). This file reads only facts, so the facts layer can
 * call it.
 */

import type { BusinessCreditReduction } from "../../facts/kinds/activitiesOnReturn.js";
import { statedBusinessesOnReturn, type BusinessFactValue } from "../../facts/kinds/business.js";
import {
  readRailroadTrackMaintenanceFact,
  type CapitalizedTrackExpenditure,
  type RailroadTrackMaintenanceFact,
} from "../../facts/kinds/railroadTrackMaintenance.js";
import { roundDollars, sum } from "../../money.js";
import { basisReductionOf, trackLines, type TrackLines } from "./lines.js";

type FactRow = { key: string; value: unknown; category: string };

/* The cost of one 2025 asset, lowered by the credit. */
export interface TrackBasisReduction {
  asset: string;
  amount: number;
}

export interface TrackMaintenanceFigures {
  /* The fact, when its business is on this return. */
  fact?: RailroadTrackMaintenanceFact;
  business?: BusinessFactValue;
  /* The fact's shape is wrong: Cade records it again. */
  malformed: boolean;
  /* Lines 1 to 5; undefined while an answer is missing or a gap stops them. */
  lines?: TrackLines;
  /* The asset cost the credit takes off; undefined with none. */
  reduction?: TrackBasisReduction;
  /* Why the engine cannot figure the credit or its basis reduction. */
  gap?: string;
  /* Fact keys still waiting on an answer. */
  missing: string[];
}

const FULL_BUSINESS_USE = 100;

const NOT_A_BUSINESS = (businessKey: string) =>
  `The railroad track maintenance credit names ${businessKey}, which is not a Schedule C business on this return: the credit lowers the basis of the business's track (irs-8900-inst-2025::sec::adjustments-to-basis::b01), and the engine lowers only a Schedule C business's.`;

const NOT_A_RAILROAD_MILES =
  "Lines 3a and 3b apply only to a Class II or Class III railroad (irs-8900-inst-2025::sec::line-3a::b01, line-3b::b01), and the fact states miles owned, leased or assigned to others for a business that is not one.";

const ASSIGNED_TOO_MANY = (owned: number, assigned: number) =>
  `Line 3b (${assigned} miles assigned to others) is more than line 3a (${owned} miles owned or leased): "You can only assign each mile of railroad track once during your tax year" (irs-8900-inst-2025::sec::line-3b::b01).`;

const CAPITALIZED_TOO_MUCH = (capitalized: number, line1: number) =>
  `The capitalized expenditures ($${capitalized}) are more than line 1 ($${line1}), of which they are a part (irs-8900-inst-2025::sec::adjustments-to-basis::b01).`;

const SEVERAL_ASSETS =
  "The expenditures are capitalized in more than one asset: the reduction is allocated among them in proportion to the unadjusted basis of each asset (cfr-26-2025::sec::s1.45g-1::e-2-p2), and the engine does not split it.";

const AMORTIZED = (name: string) =>
  `The expenditures are capitalized in the intangible asset "${name}", whose basis the credit lowers (irs-8900-inst-2025::sec::adjustments-to-basis::b01); the engine lowers only the cost of an asset placed in service in 2025.`;

/* Why the capitalized asset cannot take the reduction; undefined when it can. */
function assetGap(
  business: BusinessFactValue,
  asset: string,
  reduction: number,
): string | undefined {
  const matches = (business.depreciation?.assets ?? []).filter(
    (each) => each.description === asset,
  );
  if (matches.length !== 1) {
    return `The capitalized track expenditures name the asset "${asset}", which is not exactly one asset placed in service in 2025 in the business's depreciation: its basis must be reduced by the credit (irs-8900-inst-2025::sec::adjustments-to-basis::b01).`;
  }
  const [found] = matches;
  if ((found.businessUsePercent ?? FULL_BUSINESS_USE) !== FULL_BUSINESS_USE) {
    return `The track asset "${asset}" is not wholly business use, and the engine takes the credit off the basis only of an asset used wholly in the business.`;
  }
  if ((found.section179Elected ?? 0) > 0) {
    return `The track asset "${asset}" has a section 179 election, and the instructions do not say whether the credit lowers the basis before or after the section 179 deduction.`;
  }
  if (reduction > roundDollars(found.cost)) {
    return `The credit taken off the track asset "${asset}" ($${reduction}) is more than its cost.`;
  }
  return undefined;
}

/* The basis reduction of the one capitalized place, or why the engine cannot make it. */
function placeReduction(
  business: BusinessFactValue,
  lines: TrackLines,
  capitalized: ReadonlyArray<CapitalizedTrackExpenditure>,
): { reduction?: TrackBasisReduction; gap?: string } {
  const total = roundDollars(sum(...capitalized.map((each) => each.amount)));
  if (total === 0) return {};
  if (total > lines.line1) return { gap: CAPITALIZED_TOO_MUCH(total, lines.line1) };
  if (capitalized.length > 1) return { gap: SEVERAL_ASSETS };
  const [place] = capitalized;
  if (place.amortizedCost !== undefined) return { gap: AMORTIZED(place.amortizedCost) };
  const amount = basisReductionOf(lines.line5, place.amount);
  // A structure not placed in service in 2025 has no 2025 depreciation to lower (QUESTIONS.md item 6).
  if (place.asset === undefined || amount === 0) return {};
  const gap = assetGap(business, place.asset, amount);
  return gap === undefined ? { reduction: { asset: place.asset, amount } } : { gap };
}

/* Why the miles cannot be entered as stated; undefined when they can. */
function milesGap(value: RailroadTrackMaintenanceFact["value"]): string | undefined {
  const owned = value.milesOwnedOrLeased;
  const assigned = value.milesAssignedToOthers;
  if (!value.classIIOrIIIRailroad && (owned !== undefined || assigned !== undefined)) {
    return NOT_A_RAILROAD_MILES;
  }
  if (sum(assigned) > sum(owned)) return ASSIGNED_TOO_MANY(sum(owned), sum(assigned));
  return undefined;
}

/*
 * The figures of the return. A fact for a spouse's business on a separate
 * return is not on this return, like the business.
 */
export function trackMaintenanceFigures(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): TrackMaintenanceFigures {
  const { fact, malformed } = readRailroadTrackMaintenanceFact(facts);
  if (fact === undefined) return { malformed, missing: [] };
  const { businesses, spouseKeys } = statedBusinessesOnReturn(facts, joint);
  if (spouseKeys.includes(fact.value.businessKey)) return { malformed, missing: [] };
  const business = businesses.find((each) => each.key === fact.value.businessKey)?.value;
  const base = { fact, business, malformed, missing: [] as string[] };
  if (business === undefined) return { ...base, gap: NOT_A_BUSINESS(fact.value.businessKey) };
  const { value } = fact;
  const gap = milesGap(value);
  if (gap !== undefined) return { ...base, gap };
  // Line 3a is the railroad's own track: "Enter the number of eligible railroad track miles ... owned or leased by you" (line-3a::b01).
  if (value.classIIOrIIIRailroad && value.milesOwnedOrLeased === undefined) {
    return { ...base, missing: [fact.key] };
  }
  const lines = trackLines(
    value.expenditures,
    {
      ownedOrLeased: value.milesOwnedOrLeased,
      assignedToOthers: value.milesAssignedToOthers,
      assignedToYou: value.milesAssignedToYou,
    },
    value.groupShareOfCredit,
  );
  const placed = placeReduction(business, lines, value.capitalized ?? []);
  if (placed.gap !== undefined) return { ...base, gap: placed.gap };
  return { ...base, lines, reduction: placed.reduction };
}

/*
 * The basis reduction, as one entry of the credits that lower a deduction
 * (facts/kinds/activitiesOnReturn.ts): the cost of the 2025 asset, which is
 * its basis for depreciation on Form 4562 (column (c): "subtract any credits
 * and deductions allocable to the property", irs-4562-inst-2025::sec::section-b::b08).
 * Empty while the form waits or has a gap, or with nothing capitalized in a
 * 2025 asset.
 */
export function trackMaintenanceReductions(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): Map<string, BusinessCreditReduction[]> {
  const figures = trackMaintenanceFigures(facts, joint);
  if (figures.fact === undefined || figures.reduction === undefined) return new Map();
  return new Map([[figures.fact.value.businessKey, [figures.reduction]]]);
}
