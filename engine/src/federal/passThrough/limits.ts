/*
 * Layer 4 (README.md): the loss limits, in the order the law sets them: basis,
 * then at-risk, then passive, then the excess business loss cap
 * (irs-1120sk1-inst-2025::sec::additional-information::b01,
 * irs-1065k1-inst-2025::sec::part-iii::b01). Each stage takes the items still
 * allowed and returns, for each entity, the items it allows and the items it
 * carries to next year, or why it cannot decide.
 *
 * In this pull request each stage passes the items through when the facts
 * show its limit cannot apply (income only), and otherwise reports
 * unsupported with one sentence. The signatures are final: the basis stage
 * (Form 7203) and the passive stage (Form 8582) fill in their cases without
 * moving the callers.
 */

import type { FilingStatus } from "../../values.js";
import { isLossOrDeduction, isPortfolio, type ItemType } from "./itemTypes.js";
import {
  describeItem,
  entityTitle,
  type PassThroughEntity,
  type PassThroughItem,
} from "./items.js";

/*
 * What a stage may read besides the items. The passive stage will need Form
 * 8582's allowed losses and the return's other passive activities; they are
 * added here, so no caller moves.
 */
export interface LimitContext {
  filingStatus?: FilingStatus;
}

/* One entity's items still allowed when a stage starts. */
export interface EntityItems {
  entity: PassThroughEntity;
  items: PassThroughItem[];
}

/*
 * A stage's answer for one entity:
 * - applied: the items it allows, and the parts it carries to next year;
 * - waiting: an answer is missing (the holding fact): the lines wait;
 * - unsupported: a case the engine does not handle, in one sentence.
 */
export type StageOutcome =
  | { kind: "applied"; allowed: PassThroughItem[]; carried: PassThroughItem[] }
  | { kind: "waiting"; factKeys: string[] }
  | { kind: "unsupported"; reason: string };

/* A stage answers for every entity it is given, by the entity's K-1 key. */
export type LimitStage = (
  entities: ReadonlyArray<EntityItems>,
  context: LimitContext,
) => ReadonlyMap<string, StageOutcome>;

export type LimitName = "basis" | "atRisk" | "passive" | "excessBusinessLoss";

const passAll = (items: PassThroughItem[]): StageOutcome => ({
  kind: "applied",
  allowed: items,
  carried: [],
});

/* The stage's reason, naming the items it would limit (none for a carried loss or an ended interest). */
const unsupportedFor = (
  entity: PassThroughEntity,
  items: PassThroughItem[],
  what: string,
): StageOutcome => {
  const named = items.length > 0 ? ` ${items.map(describeItem).join(", ")}:` : "";
  return { kind: "unsupported", reason: `${entityTitle(entity)}:${named} ${what}` };
};

const perEntity =
  (decide: (entry: EntityItems) => StageOutcome): LimitStage =>
  (entities) =>
    new Map(entities.map((entry) => [entry.entity.key, decide(entry)]));

const lossesAndDeductions = (items: PassThroughItem[]) =>
  items.filter((item) => isLossOrDeduction(item.type, item.amount));

const activityLosses = (items: PassThroughItem[]) =>
  lossesAndDeductions(items).filter((item) => !isPortfolio(item.type));

const BASIS_DECREASES: ReadonlyArray<ItemType> = ["distribution", "loan_repayment"];

/*
 * Basis (irs-1120sk1-inst-2025::sec::basis-limitations::b01; the partnership's
 * irs-1065k1-inst-2025::sec::basis-limitations): losses and deductions are
 * limited to the owner's basis, and a distribution above basis is a gain
 * (irs-1120sk1-inst-2025::sec::box-16-items-affecting-shareholder-basis::b02).
 * With no loss, deduction, distribution or loan repayment, no loss carried
 * from an earlier year, and the interest still held, nothing is limited. A
 * beneficiary has no basis limit on a K-1 (Form 1041).
 */
export const basisLimit: LimitStage = perEntity(({ entity, items }) => {
  if (entity.form === "1041") return passAll(items);
  const ended = entity.holding?.disposedOfEntirely === true || entity.k1.finalK1 === true;
  const limited = [
    ...lossesAndDeductions(items),
    ...items.filter((item) => BASIS_DECREASES.includes(item.type)),
  ];
  const carried = (entity.holding?.carriedLosses?.basis ?? 0) > 0;
  if (limited.length > 0 || carried || ended) {
    const form = entity.form === "1120-S" ? "Form 7203" : "the partner's basis worksheet";
    return unsupportedFor(
      entity,
      limited,
      `a loss, deduction, distribution, loan repayment, carried basis loss or ended interest needs the basis limit (${form}), which is not modeled.`,
    );
  }
  return passAll(items);
});

/*
 * At-risk (irs-1120sk1-inst-2025::sec::at-risk-limitations::b01): only a loss
 * or deduction from an activity is limited, so with none, and no loss carried
 * from an earlier year (::b03), nothing is limited. Portfolio items are not
 * from an at-risk activity.
 */
export const atRiskLimit: LimitStage = perEntity(({ entity, items }) => {
  const limited = activityLosses(items);
  const carried = (entity.holding?.carriedLosses?.atRisk ?? 0) > 0;
  if (limited.length === 0 && !carried) return passAll(items);
  return unsupportedFor(
    entity,
    limited,
    "a loss or deduction from the activity needs the at-risk limit (Form 6198), which is not modeled for a K-1.",
  );
});

/* Rental activities are passive for every owner but a real estate professional (::passive-activity-limitations::b01, ::b02). */
const RENTAL_TYPES: ReadonlyArray<ItemType> = [
  "net_rental_real_estate_income",
  "other_net_rental_income",
];

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

function passiveForTrust(entry: EntityItems): StageOutcome {
  // irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01: rules for beneficiaries are not issued.
  const losses = entry.items.filter(
    (item) => activityItem(item) && isLossOrDeduction(item.type, item.amount),
  );
  return losses.length > 0
    ? unsupportedFor(
        entry.entity,
        losses,
        "a loss in boxes 6 to 8 may be passive, and the passive rules for a beneficiary are not issued or modeled.",
      )
    : passAll(entry.items);
}

/*
 * Passive (irs-1120sk1-inst-2025::sec::passive-activity-limitations::b01 to
 * ::b09): portfolio items skip it. A trade or business in which the owner
 * materially participated is nonpassive (::b08), so its items pass. A passive
 * business, a rental activity, more than one activity, or a loss carried from
 * an earlier passive year needs Form 8582, which is not modeled for a K-1.
 */
export const passiveLimit: LimitStage = perEntity((entry) => {
  const { entity, items } = entry;
  if (entity.form === "1041") return passiveForTrust(entry);
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
});

/*
 * Excess business loss (irs-1120sk1-inst-2025::sec::excess-business-loss-limitations::b01):
 * only a business loss is limited, on Form 461, and the limit does not change
 * Schedule E (irs-1040se-inst-2025::sec::special-rules-that-limit-losses::b06).
 * With no business loss among the items, nothing is limited.
 */
export const excessBusinessLossLimit: LimitStage = perEntity(({ entity, items }) => {
  const limited = activityLosses(items);
  if (limited.length === 0) return passAll(items);
  return unsupportedFor(
    entity,
    limited,
    "a business loss needs the excess business loss limit (Form 461), which is not modeled for a K-1.",
  );
});

export const LIMIT_STAGES: ReadonlyArray<readonly [LimitName, LimitStage]> = [
  ["basis", basisLimit],
  ["atRisk", atRiskLimit],
  ["passive", passiveLimit],
  ["excessBusinessLoss", excessBusinessLossLimit],
];

/* One entity after every stage: its allowed items and what each limit carries, or where it stopped. */
export type LimitedEntity =
  | {
      entity: PassThroughEntity;
      kind: "allowed";
      allowed: PassThroughItem[];
      carried: Record<LimitName, PassThroughItem[]>;
    }
  | { entity: PassThroughEntity; kind: "waiting"; factKeys: string[] }
  | { entity: PassThroughEntity; kind: "unsupported"; reason: string; limit: LimitName };

type Carried = Record<LimitName, PassThroughItem[]>;
const NO_CARRY = (): Carried => ({ basis: [], atRisk: [], passive: [], excessBusinessLoss: [] });

/* Runs the stages in order; an entity that waits or is unsupported leaves the pipeline there. */
export function applyLossLimits(
  entities: ReadonlyArray<PassThroughEntity>,
  context: LimitContext,
): LimitedEntity[] {
  const stopped = new Map<string, LimitedEntity>();
  const carried = new Map(entities.map((entity) => [entity.key, NO_CARRY()]));
  let current: EntityItems[] = entities.map((entity) => ({ entity, items: entity.items }));
  for (const [name, stage] of LIMIT_STAGES) {
    const outcomes = stage(current, context);
    current = current.flatMap(({ entity }) => {
      const outcome = outcomes.get(entity.key) ?? passAll([]);
      if (outcome.kind === "applied") {
        carried.get(entity.key)?.[name].push(...outcome.carried);
        return [{ entity, items: outcome.allowed }];
      }
      stopped.set(
        entity.key,
        outcome.kind === "waiting"
          ? { entity, kind: "waiting", factKeys: outcome.factKeys }
          : { entity, kind: "unsupported", reason: outcome.reason, limit: name },
      );
      return [];
    });
  }
  const allowed = new Map(current.map((entry) => [entry.entity.key, entry.items]));
  return entities.map(
    (entity) =>
      stopped.get(entity.key) ?? {
        entity,
        kind: "allowed",
        allowed: allowed.get(entity.key) ?? [],
        carried: carried.get(entity.key) ?? NO_CARRY(),
      },
  );
}
