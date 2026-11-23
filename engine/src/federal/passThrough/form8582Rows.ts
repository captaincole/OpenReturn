/*
 * Form 8582 Part V's rows for the partnership K-1s, for a resolver: the same
 * rows the passive stage builds (passive.ts), from the items the basis and
 * at-risk stages allow. Schedule E's and Form 8582's info carry them, so line
 * 22 and the form's parts see every passive activity.
 */

import { roundDollars } from "../../money.js";
import type { PassiveActivity, PassiveK1Activities } from "../8582/activities.js";
import type { PassThroughEntity } from "./items.js";
import { RENTAL_TYPES } from "./itemTypes.js";
import { applyLossLimits, LIMIT_STAGES, type LimitContext } from "./limits.js";
import { sortPartnership } from "./passiveActivity.js";

/* A K-1 that may add a Part V row: a rental, a business the owner may not work in, or a carried passive loss. */
function mayBePassive(entity: PassThroughEntity): boolean {
  if ((entity.holding?.carriedLosses?.passive ?? 0) > 0) return true;
  return entity.items.some(
    (item) =>
      (item.amount ?? 0) !== 0 &&
      (RENTAL_TYPES.includes(item.type) ||
        (item.type === "ordinary_business_income" &&
          entity.holding?.materiallyParticipated !== true)),
  );
}

/* Undefined with no partnership K-1; settled is false while one that may be passive waits or stops early. */
export function form8582K1Activities(
  entities: ReadonlyArray<PassThroughEntity>,
  context: LimitContext,
): PassiveK1Activities | undefined {
  const partnerships = entities.filter((entity) => entity.form === "1065");
  if (partnerships.length === 0) return undefined;
  const earlier = LIMIT_STAGES.filter(([name]) => name === "basis" || name === "atRisk");
  const rows: PassiveActivity[] = [];
  let settled = true;
  for (const limited of applyLossLimits(partnerships, context, earlier)) {
    if (limited.kind !== "allowed") {
      settled &&= !mayBePassive(limited.entity);
      continue;
    }
    const sorted = sortPartnership({ entity: limited.entity, items: limited.allowed });
    if (sorted.kind === "activity") rows.push(sorted.activity.row);
    else if (sorted.outcome.kind !== "applied") settled &&= !mayBePassive(limited.entity);
  }
  return { rows, settled };
}

/* A row's losses (columns (b) and (c)) in whole dollars: the must-file test reads them. */
export const hasPassiveDeductions = (row: PassiveActivity) =>
  roundDollars(row.netLoss + row.priorUnallowedLoss) > 0;
