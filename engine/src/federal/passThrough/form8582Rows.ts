/*
 * Form 8582 Part V's rows for the partnership K-1s, for a resolver: the same
 * rows the passive stage builds (passive.ts), from the items the basis and
 * at-risk stages allow. Schedule E's and Form 8582's info carry them, so line
 * 22 and the form's parts see every passive activity.
 *
 * Part I combines every passive activity (irs-8582-inst-2025::sec::specific-instructions::b01).
 * A K-1 that is or may be passive and that the engine cannot put on the form
 * (a passive S corporation K-1, a beneficiary's boxes 6 to 8, a partnership
 * K-1 the passive stage stops) leaves the form's amounts unknown: it is a gap
 * that names the K-1, or Part V waits while its answer is missing.
 */

import { roundDollars } from "../../money.js";
import type { PassiveActivity, PassiveK1Activities } from "../8582/activities.js";
import { entityTitle, type PassThroughEntity, type PassThroughItem } from "./items.js";
import { RENTAL_TYPES, type ItemType } from "./itemTypes.js";
import {
  applyLossLimits,
  LIMIT_STAGES,
  type LimitContext,
  type LimitedEntity,
  type StageOutcome,
} from "./limits.js";
import { passiveForSCorporation } from "./passive.js";
import { sortPartnership } from "./passiveActivity.js";

/* The K-1s that are or may be passive and are not on Form 8582. */
export interface OtherPassiveActivities {
  /* One reason for each such K-1 the engine does not handle; each names its entity. */
  gaps: string[];
  /* The answers such a K-1 waits on. */
  waitingKeys: string[];
  /* Such K-1s with a passive loss, deduction or carried passive loss: Form 8582 files. */
  withDeductionsKeys: string[];
}

/* A trade or business item (boxes 1 and the business boxes after it). */
const BUSINESS_TYPES: ReadonlyArray<ItemType> = [
  "ordinary_business_income",
  "other_income",
  "net_section_1231_gain",
  "section_179_deduction",
  "other_deduction",
];

const hasAmount = (item: PassThroughItem) => (item.amount ?? 0) !== 0;
const carriedPassive = (entity: PassThroughEntity) =>
  (entity.holding?.carriedLosses?.passive ?? 0) > 0;

/* A business or rental item that is or may be passive for this owner. */
function mayBePassiveItem(entity: PassThroughEntity, item: PassThroughItem): boolean {
  if (!hasAmount(item)) return false;
  if (RENTAL_TYPES.includes(item.type)) return true;
  if (!BUSINESS_TYPES.includes(item.type)) return false;
  return entity.form === "1041" || entity.holding?.materiallyParticipated !== true;
}

/* A K-1 that may add a passive activity: such an item, or a carried passive loss. */
const mayBePassive = (entity: PassThroughEntity) =>
  carriedPassive(entity) || entity.items.some((item) => mayBePassiveItem(entity, item));

/* Such a K-1 with a passive loss or deduction: Form 8582 must file for it (who-must-file::b01). */
const withDeductions = (entity: PassThroughEntity) =>
  carriedPassive(entity) ||
  entity.items.some((item) => mayBePassiveItem(entity, item) && (item.amount ?? 0) < 0);

const TRUST_GAP = (entity: PassThroughEntity) =>
  `${entityTitle(entity)}: a beneficiary's boxes 6 to 8 are passive (Schedule E Part III column (d)), and Form 8582 does not take them in the engine.`;

/* The passive stage's outcome for a K-1 that reached it, if Form 8582 cannot take its activity. */
function passiveOutcome(limited: LimitedEntity & { kind: "allowed" }): StageOutcome | undefined {
  const entry = { entity: limited.entity, items: limited.allowed };
  if (limited.entity.form === "1065") {
    const sorted = sortPartnership(entry);
    return sorted.kind === "outcome" ? sorted.outcome : undefined;
  }
  if (limited.entity.form === "1120-S") return passiveForSCorporation(entry);
  return { kind: "unsupported", reason: TRUST_GAP(limited.entity) };
}

/* Every K-1 that is or may be passive and that Form 8582 cannot take, after basis and at-risk. */
export function otherPassiveActivitiesOf(
  entities: ReadonlyArray<PassThroughEntity>,
  context: LimitContext,
): OtherPassiveActivities {
  const earlier = LIMIT_STAGES.filter(([name]) => name === "basis" || name === "atRisk");
  const out: OtherPassiveActivities = { gaps: [], waitingKeys: [], withDeductionsKeys: [] };
  for (const limited of applyLossLimits(entities, context, earlier)) {
    if (!mayBePassive(limited.entity)) continue;
    const outcome: StageOutcome | undefined =
      limited.kind === "allowed" ? passiveOutcome(limited) : limited;
    if (outcome === undefined || outcome.kind === "applied") continue;
    if (outcome.kind === "waiting") out.waitingKeys.push(...outcome.factKeys);
    else out.gaps.push(outcome.reason);
    if (withDeductions(limited.entity)) out.withDeductionsKeys.push(limited.entity.key);
  }
  return out;
}

/*
 * Undefined with no partnership K-1 and no other K-1 that may be passive;
 * settled is false while such a K-1 waits; gap names the ones the engine does
 * not handle.
 */
export function form8582K1Activities(
  entities: ReadonlyArray<PassThroughEntity>,
  context: LimitContext,
): PassiveK1Activities | undefined {
  const others = otherPassiveActivitiesOf(entities, context);
  const partnerships = entities.filter((entity) => entity.form === "1065");
  const blocked = others.gaps.length + others.waitingKeys.length > 0;
  if (partnerships.length === 0 && !blocked) return undefined;
  const earlier = LIMIT_STAGES.filter(([name]) => name === "basis" || name === "atRisk");
  const rows: PassiveActivity[] = [];
  for (const limited of applyLossLimits(partnerships, context, earlier)) {
    if (limited.kind !== "allowed") continue;
    const sorted = sortPartnership({ entity: limited.entity, items: limited.allowed });
    if (sorted.kind === "activity") rows.push(sorted.activity.row);
  }
  return {
    rows,
    settled: others.waitingKeys.length === 0,
    gap: others.gaps.length > 0 ? others.gaps.join(" ") : undefined,
    unmodeledWithDeductions: others.withDeductionsKeys,
  };
}

/* A row's losses (columns (b) and (c)) in whole dollars: the must-file test reads them. */
export const hasPassiveDeductions = (row: PassiveActivity) =>
  roundDollars(row.netLoss + row.priorUnallowedLoss) > 0;
