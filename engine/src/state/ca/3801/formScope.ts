/*
 * What FTB 3801 holds for this return, figured from the facts: the Schedule E
 * properties in California amounts (californiaRentals.ts), the passive
 * activities the engine cannot put on the form, and the facts that make the
 * form file. The bindings read the figures from the filing info.
 */

import {
  businessesOnReturn,
  caPassiveCarryoverOf,
  makeCaPassiveCarryoverKey,
  rentalsOnReturn,
  SPOUSE_KEYS,
} from "../../../facts/index.js";
import type { FarmRentalSummary } from "../../../federal/4835/filingInfo.js";
import { isGap } from "../../../federal/4835/lines.js";
import { resolve4835Info } from "../../../federal/4835/resolveInfo.js";
import {
  form8582K1Activities,
  hasPassiveDeductions,
} from "../../../federal/passThrough/form8582Rows.js";
import { passThroughEntitiesOnReturn } from "../../../federal/passThrough/items.js";
import { limitContextOf } from "../../../federal/passThrough/receipts.js";
import { booleanFact, spousePropertiesOnReturn } from "../../../federal/rentals/passive.js";
import { rentalColumnsOf } from "../../../federal/schedule-e/columns.js";
import { filingStatusOf, type ResolverInputs } from "../../../resolverInputs.js";
import {
  californiaProperty,
  type CaScheduleEActivity,
  type PropertyOutcome,
} from "./californiaRentals.js";

/* What the bindings read. */
export interface Form3801Figures {
  /* Why the engine cannot fill the form: every field but the header shows it. */
  gap?: string;
  /* Every Schedule E Part I property, in column order; undefined while an answer is missing. */
  activities?: CaScheduleEActivity[];
  /* A K-1 is on Schedule E: the Schedule E adjustment worksheet needs its California amounts. */
  scheduleEWorksheetGap?: string;
}

export interface Form3801Scope {
  figures: Form3801Figures;
  /* The facts and decisions that file the form. */
  triggeredBy: string[];
  /* A missing answer could file the form. */
  open: boolean;
  /* The answers the form waits on. */
  waitingKeys: string[];
  /* The Schedule E properties whose need for the form is not known yet. */
  undecidedPropertyKeys: string[];
}

export const MUST_FILE_540NR_KEY = "decisions.scope.must_file_540nr";
export const MUST_FILE_4835_KEY = "decisions.scope.must_file_4835";
export const MUST_FILE_SCHEDULE_F_KEY = "decisions.scope.must_file_schedule_f";

export const NONRESIDENT_GAP =
  "Nonresidents and part-year residents complete FTB 3801 twice, once for all sources and once for California sources (ca-3801-inst-2025::sec::nonresident-and-part-year-resident-instructions::b01); the engine does not model it.";
export const PASSIVE_K1_GAP =
  "A Schedule K-1 that is or may be passive is on the return: FTB 3801 takes its California amount from Schedule K-1 (565, 568 or 100S) column (d) (ca-3801-inst-2025::sec::step-1-figuring-your-california-passive-activity-income-loss::b01), which the engine does not read.";
export const PASSIVE_BUSINESS_GAP =
  "A Schedule C business the owner did not materially participate in is a passive activity; its net income or loss before the PAL rules is not modeled, so FTB 3801 cannot list it.";
export const FARM_GAP =
  "A farm (Schedule F) or a farm rental (Form 4835) is on the return; FTB 3801 does not take a farm or farm rental activity yet, so it cannot place it.";
export const OVERFLOW_GAP =
  "More than three Schedule E properties: a second Schedule E is not modeled, so FTB 3801 cannot list them.";
export const K1_WORKSHEET_GAP =
  "The California Adjustment Worksheet for Schedule E includes each Schedule K-1 activity on federal Schedule E with its California amount (ca-3801-inst-2025::sec::step-4-figuring-the-california-adjustment::b02); the engine does not read California K-1 amounts.";

/* The return's K-1s and what they add: a passive one is a gap; one with a passive loss files the form. */
function k1Scope(inputs: ResolverInputs, joint: boolean) {
  const entities = passThroughEntitiesOnReturn(inputs.facts, joint).entities;
  const k1 = form8582K1Activities(entities, limitContextOf(inputs));
  const passive = k1 !== undefined && (k1.rows.length > 0 || k1.gap !== undefined || !k1.settled);
  return {
    any: entities.length > 0,
    passive,
    settled: k1?.settled ?? true,
    triggers: [
      ...(k1?.rows ?? []).filter(hasPassiveDeductions).map((row) => row.factKey),
      ...(k1?.unmodeledWithDeductions ?? []),
    ],
  };
}

/* Form 4835 files: by its decision (MUST_FILE_4835_KEY) or by a farm rental fact. */
const farmRentalFiles = (inputs: ResolverInputs) =>
  resolve4835Info(inputs).mustFile?.["form-4835"]?.value === true;

/*
 * The farm rental's part of who files (ca-3801-inst-2025::sec::b-who-must-file::b01:
 * "losses (including prior year unallowed losses) from passive activities").
 * Each farm's Schedule E line 40 part decides: a loss, or a gap that hides it
 * (a prior-year unallowed loss is one), files the form with that farm's fact;
 * net income does not. A gap over the whole Form 4835 (the decision with no
 * fact) files it with what files Form 4835. While a farm's part waits, FTB 3801
 * waits on Form 4835's answers.
 */
function farmRentalScope(inputs: ResolverInputs): { triggers: string[]; waitingKeys: string[] } {
  const info = resolve4835Info(inputs);
  const derivation = info.mustFile?.["form-4835"]?.derivation;
  if (!farmRentalFiles(inputs) || !derivation) return { triggers: [], waitingKeys: [] };
  if (!info.farmRentals) {
    return {
      triggers: [...derivation.triggeredByDecisionKeys, ...derivation.triggeredByFactKeys],
      waitingKeys: [],
    };
  }
  const lossOrGap = (net: FarmRentalSummary["net"]) => net !== undefined && (isGap(net) || net < 0);
  // A real estate professional's farm rental they materially participated in is not passive.
  const triggers = info.farmRentals
    .filter((farm) => lossOrGap(farm.net) && farm.nonpassive !== true)
    .map((farm) => farm.factKey);
  const waits = info.farmRentals.some((farm) => farm.net === undefined);
  return { triggers, waitingKeys: waits ? [...(info.missingInputs?.["form-4835"] ?? [])] : [] };
}

/* The first gap that covers the whole form, or undefined. */
function formGapOf(inputs: ResolverInputs, k1Passive: boolean, passiveBusiness: boolean) {
  const decided = (key: string) => inputs.decisionByKey.get(key) === true;
  if (decided(MUST_FILE_540NR_KEY)) return NONRESIDENT_GAP;
  if (k1Passive) return PASSIVE_K1_GAP;
  if (passiveBusiness) return PASSIVE_BUSINESS_GAP;
  if (farmRentalFiles(inputs) || decided(MUST_FILE_SCHEDULE_F_KEY)) return FARM_GAP;
  return undefined;
}

/* The properties' outcomes: the activities when all are ready, a gap, or the keys they wait on. */
function propertiesOf(outcomes: PropertyOutcome[]) {
  const gap = outcomes.find((outcome) => outcome.kind === "gap");
  const waitingKeys = outcomes.flatMap((outcome) => (outcome.kind === "waits" ? outcome.keys : []));
  const activities = outcomes.flatMap((outcome) =>
    outcome.kind === "ready" ? [outcome.activity] : [],
  );
  return {
    gap: gap?.kind === "gap" ? gap.reason : undefined,
    waitingKeys,
    activities: waitingKeys.length === 0 ? activities : undefined,
  };
}

export function form3801Scope(inputs: ResolverInputs): Form3801Scope {
  const status = filingStatusOf(inputs);
  const joint = spousePropertiesOnReturn(status);
  const columns = rentalColumnsOf(inputs);
  const malformedKeys = rentalsOnReturn(inputs.facts, joint).malformedKeys;
  const outcomes = (columns.properties ?? []).map((property) =>
    californiaProperty(property, {
      filingStatus: status,
      livedApartFromSpouseAllYear: booleanFact(inputs.factByKey.get(SPOUSE_KEYS.livedApartAllYear)),
      statedCarryover: (factKey) => caPassiveCarryoverOf(inputs.facts, factKey),
      carryoverKey: makeCaPassiveCarryoverKey,
    }),
  );
  const k1 = k1Scope(inputs, joint);
  const passiveBusinesses = businessesOnReturn(inputs.facts, joint).businesses.filter(
    (business) => business.value.materiallyParticipated === false,
  );
  const properties = propertiesOf(outcomes);
  const gap =
    formGapOf(inputs, k1.passive && k1.settled, passiveBusinesses.length > 0) ??
    (columns.overflow ? OVERFLOW_GAP : properties.gap);
  const farmRental = farmRentalScope(inputs);
  const waitingKeys = [...malformedKeys, ...properties.waitingKeys, ...farmRental.waitingKeys];
  const waits = waitingKeys.length > 0 || !k1.settled;
  const triggeredBy = [
    ...outcomes.flatMap((outcome, index) =>
      outcome.producesLoss ? [columns.properties?.[index]?.factKey ?? ""] : [],
    ),
    ...k1.triggers,
    ...passiveBusinesses.map((business) => business.key),
    ...farmRental.triggers,
  ];
  return {
    figures: {
      gap,
      activities: gap || waits ? undefined : properties.activities,
      scheduleEWorksheetGap: k1.any ? K1_WORKSHEET_GAP : undefined,
    },
    triggeredBy,
    open: waits,
    waitingKeys: [...new Set(waitingKeys)],
    undecidedPropertyKeys: outcomes.flatMap((outcome, index) =>
      outcome.producesLoss === undefined ? [columns.properties?.[index]?.factKey ?? ""] : [],
    ),
  };
}
