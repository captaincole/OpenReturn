/*
 * The small answers every loss limit stage gives (limits.ts, passive.ts): pass
 * the items, or name the entity and the items it cannot decide.
 */

import {
  describeItem,
  entityTitle,
  type PassThroughEntity,
  type PassThroughItem,
} from "./items.js";
import type { EntityItems, LimitStage, StageOutcome } from "./limits.js";

export const passAll = (items: PassThroughItem[]): StageOutcome => ({
  kind: "applied",
  allowed: items,
  carried: [],
});

/* The stage's reason, naming the items it would limit (none for a carried loss or an ended interest). */
export const unsupportedFor = (
  entity: PassThroughEntity,
  items: PassThroughItem[],
  what: string,
): StageOutcome => {
  const named = items.length > 0 ? ` ${items.map(describeItem).join(", ")}:` : "";
  return { kind: "unsupported", reason: `${entityTitle(entity)}:${named} ${what}` };
};

export const perEntity =
  (decide: (entry: EntityItems) => StageOutcome): LimitStage =>
  (entities) =>
    new Map(entities.map((entry) => [entry.entity.key, decide(entry)]));
