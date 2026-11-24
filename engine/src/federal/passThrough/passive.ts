/*
 * The passive stage (limits.ts, layer 4). Portfolio items skip it. A trust K-1
 * passes income and stops a loss (the beneficiary rules are not issued). An S
 * corporation K-1 passes a business the owner materially participated in and
 * stops anything passive. A partnership K-1's passive activity goes on Form
 * 8582 Part V with the return's rentals (passiveActivity.ts sorts it), and
 * the stage allows what Part VIII allows (irs-8582-inst-2025::sec::how-to-report-allowed-losses::b02).
 */

import { prorateDollars, roundDollars, sum } from "../../money.js";
import { overallOf, ROWS_PER_PART, type PassiveActivity } from "../8582/activities.js";
import { allocateLosses } from "../8582/allocation.js";
import { withAmount } from "./basis.js";
import type { PassThroughItem } from "./items.js";
import { isLossOrDeduction, isPortfolio, RENTAL_TYPES, type ItemType } from "./itemTypes.js";
import type { EntityItems, LimitContext, LimitStage, StageOutcome } from "./limits.js";
import { sortPartnership, type PassiveK1Activity } from "./passiveActivity.js";
import { passAll, unsupportedFor } from "./stageHelpers.js";

/* Guaranteed payments are generally not passive (irs-1065k1-inst-2025::sec::box-4a-guaranteed-payments-for-services::b01). */
const NONPASSIVE_TYPES: ReadonlyArray<ItemType> = [
  "guaranteed_payment_services",
  "guaranteed_payment_capital",
  "guaranteed_payments_total",
];

/* An item the passive rules sort: not portfolio, and an amount of income, loss or deduction. */
function activityItem(item: PassThroughItem): boolean {
  if (isPortfolio(item.type) || NONPASSIVE_TYPES.includes(item.type)) return false;
  return isLossOrDeduction(item.type, item.amount) || (item.amount ?? 0) > 0;
}

/*
 * irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01:
 * rules for beneficiaries are not issued. A loss in boxes 6 to 8, or a passive
 * loss carried from an earlier year, is unsupported; income passes.
 */
export function passiveForTrust(entry: EntityItems): StageOutcome {
  const losses = entry.items.filter(
    (item) => activityItem(item) && isLossOrDeduction(item.type, item.amount),
  );
  const carried = (entry.entity.holding?.carriedLosses?.passive ?? 0) > 0;
  return losses.length > 0 || carried
    ? unsupportedFor(
        entry.entity,
        losses,
        "a loss in boxes 6 to 8, or a passive loss carried from an earlier year, may be passive, and the passive rules for a beneficiary are not issued or modeled.",
      )
    : passAll(entry.items);
}

/*
 * Passive (irs-1120sk1-inst-2025::sec::passive-activity-limitations::b01 to
 * ::b09): a trade or business in which the shareholder materially participated
 * is nonpassive (::b08), so its items pass. A passive business, a rental
 * activity, more than one activity, or a loss carried from an earlier passive
 * year needs Form 8582, which is not modeled for an S corporation K-1.
 */
export function passiveForSCorporation({ entity, items }: EntityItems): StageOutcome {
  const sorted = items.filter(activityItem);
  const carried = (entity.holding?.carriedLosses?.passive ?? 0) > 0;
  if (sorted.length === 0 && !carried) return passAll(items);
  if (entity.holding?.materiallyParticipated === undefined) {
    return { kind: "waiting", factKeys: [entity.holdingKey] };
  }
  const rental = sorted.some((item) => RENTAL_TYPES.includes(item.type));
  const passive = entity.holding.materiallyParticipated === false;
  const severalActivities = entity.k1.form !== "1041" && entity.k1.moreThanOnePassiveActivity;
  if (rental || passive || carried || severalActivities === true) {
    return unsupportedFor(
      entity,
      sorted,
      "a passive activity (a rental, a business without material participation, more than one activity, or a carried passive loss) needs Form 8582, which is not modeled for a K-1.",
    );
  }
  return passAll(items);
}

/* An activity's allowed loss shared among its loss items and its carried loss, in proportion. */
function allowedParts(activity: PassiveK1Activity, allowedLoss: number): StageOutcome {
  const losses = activity.passive.filter((item) => (item.amount ?? 0) < 0);
  const income = activity.passive.filter((item) => (item.amount ?? 0) >= 0);
  const pieces = [...losses, ...(activity.carried ? [activity.carried] : [])];
  const amounts = pieces.map((item) => roundDollars(Math.abs(item.amount ?? 0)));
  const allowed = prorateDollars(allowedLoss, amounts);
  const allowedItems = pieces
    .map((item, index) => withAmount(item, allowed[index]))
    .filter((item) => item.amount !== 0);
  const carried = pieces
    .map((item, index) => withAmount(item, amounts[index] - allowed[index]))
    .filter((item) => item.amount !== 0);
  return {
    kind: "applied",
    allowed: [...activity.nonpassive, ...income, ...allowedItems],
    carried,
  };
}

/* Every loss of the activity allowed: its own items and its carried loss. */
const allowedInFull = (activity: PassiveK1Activity): StageOutcome => ({
  kind: "applied",
  allowed: [
    ...activity.nonpassive,
    ...activity.passive,
    ...(activity.carried ? [activity.carried] : []),
  ],
  carried: [],
});

/*
 * Part I and Parts VI to VIII with the rentals' rows: each K-1 activity's
 * allowed loss (Part VIII column (c)), or why it cannot be known.
 */
function figureForm8582(
  activities: PassiveK1Activity[],
  context: LimitContext,
): Map<string, StageOutcome> {
  const losing = activities.filter((activity) => overallOf(activity.row) < 0);
  const decide = (outcome: (activity: PassiveK1Activity) => StageOutcome) =>
    new Map(activities.map((activity) => [activity.entity.key, outcome(activity)]));
  const forLosing = (outcome: (activity: PassiveK1Activity) => StageOutcome) =>
    decide((activity) =>
      overallOf(activity.row) < 0 ? outcome(activity) : allowedInFull(activity),
    );
  if (losing.length === 0) return decide(allowedInFull);
  // Part I combines every passive activity (irs-8582-inst-2025::sec::specific-instructions::b01).
  const others = context.otherPassiveActivities;
  if (others && others.gaps.length > 0) {
    const reason = `Form 8582 combines every passive activity, and another K-1's is not on it: ${others.gaps.join(" ")}`;
    return forLosing((activity) => unsupportedFor(activity.entity, [], reason));
  }
  if (others && others.waitingKeys.length > 0) {
    return forLosing(() => ({ kind: "waiting", factKeys: others.waitingKeys }));
  }
  const rentals = context.passiveRentals;
  if (rentals === undefined) {
    return forLosing((activity) =>
      unsupportedFor(
        activity.entity,
        [],
        "the return's other passive activities are not known, so Form 8582 cannot be figured.",
      ),
    );
  }
  if (!rentals.part4 || !rentals.part5) {
    return forLosing(() => ({ kind: "waiting", factKeys: rentals.waitingKeys }));
  }
  const part5 = [...rentals.part5, ...activities.map((activity) => activity.row)];
  const parts = { part4: rentals.part4, part5 };
  return forLosing((activity) => allowedOnForm8582(activity, parts));
}

const SPECIAL_ALLOWANCE =
  "the return's rental real estate with active participation has a loss, so the special allowance (Form 8582 Part II, which needs modified AGI) shares in the passive losses, which is not modeled for a K-1.";

/* One losing K-1 activity's outcome on Form 8582. */
function allowedOnForm8582(
  activity: PassiveK1Activity,
  parts: { part4: PassiveActivity[]; part5: PassiveActivity[] },
): StageOutcome {
  if (parts.part5.length > ROWS_PER_PART) {
    return unsupportedFor(
      activity.entity,
      [],
      "more than five Form 8582 Part V activities need a continuation statement, which is not modeled.",
    );
  }
  const line3 = sum(...[...parts.part4, ...parts.part5].map(overallOf));
  if (line3 >= 0) return allowedInFull(activity);
  // Line 9 is 0 unless Part IV's combined amount (line 1d) is a loss (part-ii-special-allowance-for-rental::b01).
  const line1d = sum(...parts.part4.map(overallOf));
  if (line1d < 0) return unsupportedFor(activity.entity, [], SPECIAL_ALLOWANCE);
  const allocation = allocateLosses(parts, line3, 0);
  if (!allocation) {
    return unsupportedFor(
      activity.entity,
      [],
      "more than five Form 8582 Part VII activities need a continuation statement, which is not modeled.",
    );
  }
  const row = allocation.part8.find((entry) => entry.factKey === activity.entity.key);
  return row ? allowedParts(activity, row.allowed) : allowedInFull(activity);
}

/*
 * The partnership K-1s together: each is sorted (passiveActivity.ts); the
 * ones with a passive activity share Form 8582 with the rentals.
 */
function passiveForPartnerships(
  entries: ReadonlyArray<EntityItems>,
  context: LimitContext,
): Map<string, StageOutcome> {
  const outcomes = new Map<string, StageOutcome>();
  const activities: PassiveK1Activity[] = [];
  for (const entry of entries) {
    const sorted = sortPartnership(entry);
    if (sorted.kind === "activity") activities.push(sorted.activity);
    else outcomes.set(entry.entity.key, sorted.outcome);
  }
  for (const [key, outcome] of figureForm8582(activities, context)) outcomes.set(key, outcome);
  return outcomes;
}

export const passiveLimit: LimitStage = (entities, context) => {
  const outcomes = passiveForPartnerships(
    entities.filter((entry) => entry.entity.form === "1065"),
    context,
  );
  for (const entry of entities) {
    if (entry.entity.form === "1041") outcomes.set(entry.entity.key, passiveForTrust(entry));
    if (entry.entity.form === "1120-S") {
      outcomes.set(entry.entity.key, passiveForSCorporation(entry));
    }
  }
  return outcomes;
};
