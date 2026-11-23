/*
 * Which of a partnership K-1's items are one passive activity, and its Form
 * 8582 Part V row (irs-8582-inst-2025::sec::part-v::b01). Passive: a trade or
 * business the partner did not materially participate in, and every rental
 * unless a real estate professional materially participated in it
 * (irs-1065k1-inst-2025::sec::passive-activity-limitations::b01, ::b08).
 * The stage that allows the losses is passive.ts; Form 8582 reads the same
 * rows (form8582Rows.ts).
 */

import { roundDollars, sum } from "../../money.js";
import type { PassiveActivity } from "../8582/activities.js";
import type { PassThroughEntity, PassThroughItem } from "./items.js";
import { labelOf, RENTAL_TYPES, type ItemType } from "./itemTypes.js";
import type { EntityItems, StageOutcome } from "./limits.js";
import { passAll, unsupportedFor } from "./stageHelpers.js";

/* A trade or business item (boxes 1, 10, 11, 12 and 13's deductions). */
const BUSINESS_TYPES: ReadonlyArray<ItemType> = [
  "ordinary_business_income",
  "other_income",
  "net_section_1231_gain",
  "section_179_deduction",
  "other_deduction",
];

/* The passive items a Schedule E Part II column takes; the others have no Form 8582 row here. */
const ROUTED_PASSIVE_TYPES: ReadonlyArray<ItemType> = ["ordinary_business_income", ...RENTAL_TYPES];

/* The activity a passive item belongs to: a trade or business, rental real estate, other rental. */
const activityKindOf = (type: ItemType) => (BUSINESS_TYPES.includes(type) ? "business" : type);

/* One K-1's passive activity: its Part V row and the items in it. */
export interface PassiveK1Activity {
  entity: PassThroughEntity;
  /* The K-1's other items: they pass the stage untouched. */
  nonpassive: PassThroughItem[];
  /* This year's passive items. */
  passive: PassThroughItem[];
  /* The prior-year unallowed loss (column (c)) as an item, when the holding has one. */
  carried?: PassThroughItem;
  row: PassiveActivity;
}

export type SortedPartnership =
  { kind: "activity"; activity: PassiveK1Activity } | { kind: "outcome"; outcome: StageOutcome };

const hasAmount = (item: PassThroughItem) => (item.amount ?? 0) !== 0;

/* This year's passive items: the rentals, and the business items of a partner who did not materially participate. */
function passiveItemsOf(entity: PassThroughEntity, items: PassThroughItem[]): PassThroughItem[] {
  const passiveBusiness = entity.holding?.materiallyParticipated === false;
  return items.filter(
    (item) =>
      hasAmount(item) &&
      (RENTAL_TYPES.includes(item.type) || (passiveBusiness && BUSINESS_TYPES.includes(item.type))),
  );
}

const carriedPassiveLoss = (entity: PassThroughEntity) =>
  roundDollars(entity.holding?.carriedLosses?.passive ?? 0);

/* The prior-year unallowed loss as an item of the activity's kind, from the K-1 box of its first item. */
function carriedItem(
  entity: PassThroughEntity,
  like: PassThroughItem,
): PassThroughItem | undefined {
  const amount = carriedPassiveLoss(entity);
  if (amount <= 0) return undefined;
  return {
    entityKey: entity.key,
    type: like.type,
    box: like.box,
    amount: -amount,
    label: `${labelOf(like.type)}: passive loss carried from an earlier year`,
    fromPriorYear: true,
    passiveCarryover: true,
  };
}

/* Columns (a) and (b) of the row: this year's net, and the gain on an entire disposition apart. */
function rowOf(entity: PassThroughEntity, passive: PassThroughItem[]): PassiveActivity {
  const net = roundDollars(sum(...passive.map((item) => item.amount)));
  const gain = roundDollars(entity.holding?.gainOnDisposition ?? 0);
  return {
    factKey: entity.key,
    part: "part5",
    name: entity.name,
    netIncome: Math.max(0, net) + Math.max(0, gain),
    netLoss: Math.max(0, -net) + Math.max(0, -gain),
    priorUnallowedLoss: Math.max(0, carriedPassiveLoss(entity)),
  };
}

/* The questions a K-1 with passive candidates waits on, or undefined when answered. */
function missingAnswer(entity: PassThroughEntity, items: PassThroughItem[]): boolean {
  const holding = entity.holding;
  const business = items.some((item) => hasAmount(item) && BUSINESS_TYPES.includes(item.type));
  const rental = items.some((item) => hasAmount(item) && RENTAL_TYPES.includes(item.type));
  const carried = carriedPassiveLoss(entity) > 0;
  if (holding === undefined) return true;
  if ((business || carried) && holding.materiallyParticipated === undefined) return true;
  return rental && holding.realEstateProfessional === undefined;
}

/*
 * Rental real estate goes in Part IV with active participation
 * (irs-8582-inst-2025::sec::part-iv-2::b01); a limited partner cannot actively
 * participate (irs-1065k1-inst-2025::sec::passive-activity-limitations::b16).
 */
function activeParticipation(entity: PassThroughEntity, passive: PassThroughItem[]) {
  if (!passive.some((item) => item.type === "net_rental_real_estate_income")) return false;
  const k1 = entity.k1;
  if (k1.form === "1065" && k1.partnerType === "limited") return false;
  return entity.holding?.activelyParticipated;
}

/* Why the activity is a case the engine does not handle, or undefined. */
function caseNotModeled(entity: PassThroughEntity, passive: PassThroughItem[]): string | undefined {
  const k1 = entity.k1;
  if (k1.form === "1065" && k1.publiclyTraded === true) {
    return "a publicly traded partnership's passive items are figured apart from Form 8582 (irs-1065k1-inst-2025::sec::passive-activity-limitations::b10), which is not modeled.";
  }
  if (k1.form === "1065" && k1.moreThanOnePassiveActivity === true) {
    return "more than one passive activity (box 23) needs the partnership's statement of each activity, which is not modeled.";
  }
  if (new Set(passive.map((item) => activityKindOf(item.type))).size > 1) {
    return "a trade or business and a rental, or two kinds of rental, are separate passive activities that the K-1 does not split, which is not modeled.";
  }
  const unrouted = passive.filter((item) => !ROUTED_PASSIVE_TYPES.includes(item.type));
  if (unrouted.length > 0) {
    return "a passive item other than ordinary business or rental income (loss) has no Form 8582 row in the engine.";
  }
  if (activeParticipation(entity, passive) === true) {
    return "rental real estate with active participation goes in Form 8582 Part IV with the special allowance, which is not modeled for a K-1.";
  }
  return undefined;
}

/*
 * An entire disposition with an overall loss (this year's items, the gain on
 * the sale and the carried loss together) is not entered on Form 8582: every
 * loss is allowed in full (irs-8582-inst-2025::sec::reporting-an-entire-disposition-on-form-4797-or::b01).
 */
export function releasedOnDisposition(entity: PassThroughEntity, items = entity.items): boolean {
  if (entity.form !== "1065" || entity.holding?.disposedOfEntirely !== true) return false;
  const passive = passiveItemsOf(entity, items);
  if (passive.length === 0 && carriedPassiveLoss(entity) === 0) return false;
  const row = rowOf(entity, passive);
  return row.netIncome - row.netLoss - row.priorUnallowedLoss < 0;
}

/* An allowed item of a partnership K-1 that Schedule E Part II reports as passive (columns (g) and (h)). */
export function isPassiveItem(entity: PassThroughEntity, item: PassThroughItem): boolean {
  if (entity.form !== "1065" || releasedOnDisposition(entity)) return false;
  if (item.passiveCarryover === true) return true;
  return passiveItemsOf(entity, [item]).length > 0;
}

/* A partnership K-1's passive stage before Form 8582: an outcome, or its activity for the form. */
export function sortPartnership({ entity, items }: EntityItems): SortedPartnership {
  const outcome = (value: StageOutcome): SortedPartnership => ({ kind: "outcome", outcome: value });
  const candidates = items.filter(
    (item) =>
      hasAmount(item) && (RENTAL_TYPES.includes(item.type) || BUSINESS_TYPES.includes(item.type)),
  );
  if (candidates.length === 0 && carriedPassiveLoss(entity) === 0) return outcome(passAll(items));
  if (missingAnswer(entity, items)) {
    return outcome({ kind: "waiting", factKeys: [entity.holdingKey] });
  }
  if (
    candidates.some((item) => RENTAL_TYPES.includes(item.type)) &&
    entity.holding?.realEstateProfessional === true
  ) {
    return outcome(
      unsupportedFor(
        entity,
        [],
        "a real estate professional's rental through a partnership may be nonpassive, which is not modeled.",
      ),
    );
  }
  const passive = passiveItemsOf(entity, items);
  if (passive.length === 0) {
    return carriedPassiveLoss(entity) > 0
      ? outcome(
          unsupportedFor(
            entity,
            [],
            "a passive loss carried from an earlier year with no passive item this year (a former passive activity, or one whose kind the K-1 does not show) is not modeled.",
          ),
        )
      : outcome(passAll(items));
  }
  const notModeled = caseNotModeled(entity, passive);
  if (notModeled) return outcome(unsupportedFor(entity, passive, notModeled));
  if (activeParticipation(entity, passive) === undefined) {
    return outcome({ kind: "waiting", factKeys: [entity.holdingKey] });
  }
  return activityOrDisposition(entity, items, passive);
}

/* The activity for Form 8582, or the items an entire disposition releases. */
function activityOrDisposition(
  entity: PassThroughEntity,
  items: PassThroughItem[],
  passive: PassThroughItem[],
): SortedPartnership {
  const disposed = entity.holding?.disposedOfEntirely === true;
  if (disposed && entity.holding?.gainOnDisposition === undefined) {
    return { kind: "outcome", outcome: { kind: "waiting", factKeys: [entity.holdingKey] } };
  }
  const carried = carriedItem(entity, passive[0]);
  const nonpassive = items.filter((item) => !passive.includes(item));
  if (releasedOnDisposition(entity, items)) {
    return {
      kind: "outcome",
      outcome: { kind: "applied", allowed: [...items, ...(carried ? [carried] : [])], carried: [] },
    };
  }
  return {
    kind: "activity",
    activity: { entity, nonpassive, passive, carried, row: rowOf(entity, passive) },
  };
}
