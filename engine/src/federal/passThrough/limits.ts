/*
 * Layer 4 (README.md): the loss limits, in the order the law sets them: basis,
 * then at-risk, then passive, then the excess business loss cap
 * (irs-1120sk1-inst-2025::sec::additional-information::b01,
 * irs-1065k1-inst-2025::sec::part-iii::b01). Each stage takes the items still
 * allowed and returns, for each entity, the items it allows and the items it
 * carries to next year, or why it cannot decide.
 *
 * The basis stage figures an S corporation shareholder's basis (Form 7203,
 * basis.ts) and a partner's (the Partner's Basis Worksheet, partnerBasis.ts).
 * The passive stage (passive.ts) puts a passive partnership K-1 on Form 8582
 * with the return's rentals. The other stages pass the items through when the
 * facts show their limit cannot apply, and otherwise report unsupported with
 * one sentence: Form 461 has no rules for a K-1 yet. The at-risk stage
 * (atRisk.ts) figures Form 6198 when some of the investment is not at risk.
 */

import type { FilingStatus } from "../../values.js";
import type { PassiveRentals } from "../8582/rentalRows.js";
import { activityLosses, atRiskLimit, needsForm6198 } from "./atRisk.js";
import {
  basisItems,
  figureBasis,
  isPartIIIItem,
  soldSomeShares,
  withAmount,
  type BasisFigures,
} from "./basis.js";
import {
  excessBusinessLossThreshold,
  noLossCanBeLimited,
  type OtherBusinessLosses,
} from "./excessBusinessLoss.js";
import type { OtherPassiveActivities } from "./form8582Rows.js";
import { hasCarriedBasisLoss, type PassThroughEntity, type PassThroughItem } from "./items.js";
import {
  figurePartnerBasis,
  isPartnerLossItem,
  liabilitiesDecreased,
  partnerBasisGaps,
  partnerBasisItems,
} from "./partnerBasis.js";
import { passiveLimit } from "./passive.js";
import { passAll, perEntity, unsupportedFor } from "./stageHelpers.js";

/* What a stage may read besides the items. */
export interface LimitContext {
  filingStatus?: FilingStatus;
  /* Undefined when the caller does not know them: a K-1 business loss is then unsupported. */
  otherBusinessLosses?: OtherBusinessLosses;
  /*
   * Form 8582's rows for the return's Schedule E properties (8582/rentalRows.ts).
   * Undefined when the caller does not know them: a passive K-1 loss is then unsupported.
   */
  passiveRentals?: PassiveRentals;
  /*
   * The K-1s that are or may be passive but that the engine cannot put on Form
   * 8582 (form8582Rows.ts): a losing K-1 activity is then unsupported, or waits.
   * Undefined: none known.
   */
  otherPassiveActivities?: OtherPassiveActivities;
}

/* A form's context: the one Schedule E's resolver figured, else the filing status alone. */
export function limitContextFrom(info: {
  passThroughLimitContext?: LimitContext;
  filingStatus?: FilingStatus;
}): LimitContext {
  return info.passThroughLimitContext ?? { filingStatus: info.filingStatus };
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

/*
 * The basis stage's answer from Form 7203: every item outside Part III passes;
 * each loss or deduction is allowed by its columns (c) plus (d) and carries its
 * column (e) (irs-7203-inst-2025::sec::part-iii::b01 to ::b03).
 */
function fromFigures(items: PassThroughItem[], figures: BasisFigures): StageOutcome {
  const outside = items.filter((item) => !isPartIIIItem(item));
  const allowed = figures.rows
    .filter((row) => row.fromStock + row.fromDebt > 0)
    .map((row) => withAmount(row.item, row.fromStock + row.fromDebt));
  const carried = figures.rows
    .filter((row) => row.carriedOut > 0)
    .map((row) => withAmount(row.item, row.carriedOut));
  return { kind: "applied", allowed: [...outside, ...allowed], carried };
}

/* An S corporation shareholder's basis limit (Form 7203, basis.ts). */
function sCorporationBasis(entity: PassThroughEntity, items: PassThroughItem[]): StageOutcome {
  const outcome = figureBasis(entity);
  if (outcome.kind !== "figured") return outcome;
  if (outcome.gaps.length > 0) return { kind: "unsupported", reason: outcome.gaps.join(" ") };
  return fromFigures(items, outcome.figures);
}

/* A partner's basis limit (the Partner's Basis Worksheet, partnerBasis.ts). */
function partnershipBasis(entity: PassThroughEntity, items: PassThroughItem[]): StageOutcome {
  const outcome = figurePartnerBasis(entity);
  if (outcome.kind !== "figured") return outcome;
  const gaps = partnerBasisGaps(entity, outcome.figures);
  if (gaps.length > 0) return { kind: "unsupported", reason: gaps.join(" ") };
  return { kind: "applied", ...partnerBasisItems(items, outcome.figures.rows) };
}

/*
 * A partnership interest that ended this year: a sale of the entire interest
 * (the holding's disposedOfEntirely, irs-8582-inst-2025::sec::former-passive-activities::b02)
 * goes through the worksheet like any year; a partial sale (item J) or a final
 * K-1 the holding does not explain is not modeled.
 */
function partnershipEnded(entity: PassThroughEntity): string | undefined {
  const k1 = entity.k1;
  if (k1.form !== "1065") return undefined;
  if (entity.holding?.disposedOfEntirely === true) return undefined;
  if (k1.decreasedBySale === true || k1.decreasedByExchange === true) {
    return "the interest decreased by a sale or exchange (item J): a partial sale needs the basis of the part sold and the gain on it, which are not modeled.";
  }
  return k1.finalK1 === true
    ? "a final K-1 with no disposition of the entire interest recorded (a liquidation or the end of the partnership) needs the basis at that point, which is not modeled."
    : undefined;
}

/*
 * Basis (irs-1120sk1-inst-2025::sec::basis-limitations::b01; the partnership's
 * irs-1065k1-inst-2025::sec::basis-limitations::b01): losses and deductions are
 * limited to the owner's basis, and a distribution above basis is a gain
 * (irs-1120sk1-inst-2025::sec::box-16-items-affecting-shareholder-basis::b02).
 * With no loss, deduction, distribution or loan repayment, no loss carried
 * from an earlier year, and the interest still held, nothing is limited. An
 * S corporation shareholder's basis is Form 7203's (basis.ts); a partner's is
 * the worksheet's (partnerBasis.ts). A beneficiary has no basis limit on a K-1
 * (Form 1041).
 */
export const basisLimit: LimitStage = perEntity(({ entity, items }) => {
  if (entity.form === "1041") return passAll(items);
  if (entity.form === "1065") {
    const ended = partnershipEnded(entity);
    if (ended) return unsupportedFor(entity, [], ended);
    const limited = items.filter((item) => isPartnerLossItem(item) || item.type === "distribution");
    const disposed = entity.holding?.disposedOfEntirely === true;
    const nothingLimited =
      limited.length === 0 && !hasCarriedBasisLoss(entity.holding) && !liabilitiesDecreased(entity);
    if (nothingLimited && !disposed) {
      return passAll(items);
    }
    return partnershipBasis(entity, items);
  }
  if (soldSomeShares(entity)) {
    return unsupportedFor(
      entity,
      [],
      "the shareholder held fewer shares at the end of the year than at the start: a sale of stock checks Schedule E line 28 column (e) and needs the basis computation (Form 7203) and the gain or loss on the sale, which are not modeled.",
    );
  }
  if (entity.holding?.disposedOfEntirely === true || entity.k1.finalK1 === true) {
    return unsupportedFor(
      entity,
      [],
      "an ended interest (a final K-1, or all of the stock or interest disposed of) needs the basis at the disposal and the gain or loss on it, which are not modeled.",
    );
  }
  const limited = basisItems(items);
  if (limited.length === 0 && !hasCarriedBasisLoss(entity.holding)) return passAll(items);
  return sCorporationBasis(entity, items);
});

export { atRiskLimit, passiveLimit };

const positiveTotal = (items: PassThroughItem[]) =>
  items.reduce((total, item) => total + Math.abs(item.amount ?? 0), 0);

/* The business losses of the K-1s a stage is given, added up (positive). */
export const k1BusinessLosses = (entities: ReadonlyArray<EntityItems>) =>
  entities.reduce((total, entry) => total + positiveTotal(activityLosses(entry.items)), 0);

/*
 * Excess business loss (irs-1120sk1-inst-2025::sec::excess-business-loss-limitations::b01):
 * only a business loss is limited, on Form 461, and the limit does not change
 * Schedule E (irs-1040se-inst-2025::sec::special-rules-that-limit-losses::b01).
 * It is figured with every business on the return, so the stage adds every
 * K-1's business losses and the return's other ones (context), without any
 * income. At or below the threshold for the filing status no loss can be
 * limited and the items pass in full (excessBusinessLoss.ts); whether Form
 * 461 must still be attached is its resolver's question. Above the threshold
 * the limit needs the income side and Form 461's rules, which are not modeled.
 */
export const excessBusinessLossLimit: LimitStage = (entities, context) => {
  const k1Losses = k1BusinessLosses(entities);
  const decide = ({ entity, items }: EntityItems): StageOutcome => {
    const limited = activityLosses(items);
    if (limited.length === 0) return passAll(items);
    const other = context.otherBusinessLosses;
    if (other === undefined) {
      return unsupportedFor(
        entity,
        limited,
        "the return's other business losses are not known, so the excess business loss limit (Form 461) cannot be ruled out.",
      );
    }
    if (other.unknownKeys.length > 0) return { kind: "waiting", factKeys: other.unknownKeys };
    if (noLossCanBeLimited(k1Losses, other, context.filingStatus)) return passAll(items);
    const threshold = excessBusinessLossThreshold(context.filingStatus);
    return unsupportedFor(
      entity,
      limited,
      `the return's business losses can be more than the $${threshold} threshold, so the excess business loss limit (Form 461) may apply, which is not modeled for a K-1.`,
    );
  };
  return new Map(entities.map((entry) => [entry.entity.key, decide(entry)]));
};

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

/*
 * Runs the stages in order (all of them unless told otherwise); an entity that
 * waits or is unsupported leaves the pipeline there.
 */
export function applyLossLimits(
  entities: ReadonlyArray<PassThroughEntity>,
  context: LimitContext,
  stages: ReadonlyArray<readonly [LimitName, LimitStage]> = LIMIT_STAGES,
): LimitedEntity[] {
  const stopped = new Map<string, LimitedEntity>();
  const carried = new Map(entities.map((entity) => [entity.key, NO_CARRY()]));
  let current: EntityItems[] = entities.map((entity) => ({ entity, items: entity.items }));
  for (const [name, stage] of stages) {
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

/*
 * The K-1 business losses as they reach the excess business loss stage (after
 * basis, at-risk and passive), for Form 461's resolver.
 */
export function businessLossesBeforeExcessBusinessLoss(
  entities: ReadonlyArray<PassThroughEntity>,
  context: LimitContext,
): number {
  const earlier = LIMIT_STAGES.filter(([name]) => name !== "excessBusinessLoss");
  const reached = applyLossLimits(entities, context, earlier).flatMap((limited) =>
    limited.kind === "allowed" ? [{ entity: limited.entity, items: limited.allowed }] : [],
  );
  return k1BusinessLosses(reached);
}

/*
 * The K-1s that file Form 6198 (needsForm6198 in atRisk.ts), each with the
 * items that reach the at-risk stage: after the basis limit, which comes first
 * (irs-pub-925-2025::sec::at-risk-limits::b02). A K-1 the basis stage stops
 * does not reach it.
 */
export function k1sOnForm6198(
  entities: ReadonlyArray<PassThroughEntity>,
  context: LimitContext,
): EntityItems[] {
  const basisOnly = LIMIT_STAGES.filter(([name]) => name === "basis");
  return applyLossLimits(entities, context, basisOnly).flatMap((limited) =>
    limited.kind === "allowed" && needsForm6198(limited.entity, limited.allowed)
      ? [{ entity: limited.entity, items: limited.allowed }]
      : [],
  );
}
