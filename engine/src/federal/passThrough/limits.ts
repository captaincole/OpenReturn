/*
 * Layer 4 (README.md): the loss limits, in the order the law sets them: basis,
 * then at-risk, then passive, then the excess business loss cap
 * (irs-1120sk1-inst-2025::sec::additional-information::b01,
 * irs-1065k1-inst-2025::sec::part-iii::b01). Each stage takes the items still
 * allowed and returns, for each entity, the items it allows and the items it
 * carries to next year, or why it cannot decide.
 *
 * The basis stage figures an S corporation shareholder's basis (Form 7203,
 * basis.ts). The other stages pass the items through when the facts show
 * their limit cannot apply, and otherwise report unsupported with one
 * sentence: Form 6198, Form 8582 and Form 461 have no rules for a K-1 yet.
 */

import type { FilingStatus } from "../../values.js";
import {
  basisItems,
  figureBasis,
  isPartIIIItem,
  soldSomeShares,
  withAmount,
  type BasisFigures,
} from "./basis.js";
import { isLossOrDeduction, isPortfolio, type ItemType } from "./itemTypes.js";
import {
  describeItem,
  entityTitle,
  hasCarriedBasisLoss,
  type PassThroughEntity,
  type PassThroughItem,
} from "./items.js";

/*
 * The return's business losses outside the K-1s, for the excess business loss
 * stage: an upper bound, each Schedule C business's and rental property's loss
 * added without any income (positive), and the facts whose loss is not known
 * yet (receipts.ts, limitContextOf).
 */
export interface OtherBusinessLosses {
  amount: number;
  unknownKeys: string[];
}

/*
 * What a stage may read besides the items. The passive stage will need Form
 * 8582's allowed losses and the return's other passive activities; they are
 * added here, so no caller moves.
 */
export interface LimitContext {
  filingStatus?: FilingStatus;
  /* Undefined when the caller does not know them: a K-1 business loss is then unsupported. */
  otherBusinessLosses?: OtherBusinessLosses;
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

/*
 * A loss or deduction from the trade or business: not portfolio, and not a
 * charitable contribution, which the owner deducts on Schedule A
 * (irs-1120sk1-inst-2025::sec::box-12-other-deductions::b06), not from the activity.
 */
const activityLosses = (items: PassThroughItem[]) =>
  lossesAndDeductions(items).filter(
    (item) => !isPortfolio(item.type) && item.type !== "charitable_contribution",
  );

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

/*
 * Basis (irs-1120sk1-inst-2025::sec::basis-limitations::b01; the partnership's
 * irs-1065k1-inst-2025::sec::basis-limitations): losses and deductions are
 * limited to the owner's basis, and a distribution above basis is a gain
 * (irs-1120sk1-inst-2025::sec::box-16-items-affecting-shareholder-basis::b02).
 * With no loss, deduction, distribution or loan repayment, no loss carried
 * from an earlier year, and the interest still held, nothing is limited. An
 * S corporation shareholder's basis is Form 7203's (basis.ts); a partner's
 * worksheet is not modeled. A beneficiary has no basis limit on a K-1 (Form 1041).
 */
export const basisLimit: LimitStage = perEntity(({ entity, items }) => {
  if (entity.form === "1041") return passAll(items);
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
  if (entity.form === "1120-S") return sCorporationBasis(entity, items);
  return unsupportedFor(
    entity,
    limited,
    "a loss, deduction, distribution, loan repayment or carried basis loss needs the partner's basis limit (the Partner's Basis Worksheet), which is not modeled.",
  );
});

/*
 * At-risk (irs-1120sk1-inst-2025::sec::at-risk-limitations::b01): only a loss
 * or deduction from an activity is limited, so with none, and no loss carried
 * from an earlier year (::b03), nothing is limited. Portfolio items are not
 * from an at-risk activity. With all of the investment at risk the limit does
 * not reduce the loss (Form 6198 is not needed); otherwise Form 6198 figures
 * it, which is not modeled for a K-1.
 */
export const atRiskLimit: LimitStage = perEntity(({ entity, items }) => {
  const limited = activityLosses(items);
  const carried = (entity.holding?.carriedLosses?.atRisk ?? 0) > 0;
  if (limited.length === 0 && !carried) return passAll(items);
  const allAtRisk = entity.holding?.allInvestmentAtRisk;
  if (!carried && allAtRisk === true) return passAll(items);
  if (!carried && allAtRisk === undefined)
    return { kind: "waiting", factKeys: [entity.holdingKey] };
  return unsupportedFor(
    entity,
    limited,
    "a loss or deduction from the activity with amounts not at risk, or a carried at-risk loss, needs the at-risk limit (Form 6198), which is not modeled for a K-1.",
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

/*
 * irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01:
 * rules for beneficiaries are not issued. A loss in boxes 6 to 8, or a passive
 * loss carried from an earlier year, is unsupported; income passes.
 */
function passiveForTrust(entry: EntityItems): StageOutcome {
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
 * irs-461-inst-2025::sec::who-must-file::b01: Form 461 files when "your net
 * losses from all of your trades or businesses are more than $313,000
 * ($626,000 for taxpayers filing a joint return), or ... you would report a
 * loss of more than $156,500 on any one of Form 461, lines 1 through 8"; the
 * 2025 threshold is the same (::b02). Business losses added without any income
 * bound both the net loss and each line's loss, so at or below $156,500
 * neither test is met and nothing is limited.
 */
export const FORM_461_NOT_NEEDED_UP_TO = 156_500;

const positiveTotal = (items: PassThroughItem[]) =>
  items.reduce((total, item) => total + Math.abs(item.amount ?? 0), 0);

/*
 * Excess business loss (irs-1120sk1-inst-2025::sec::excess-business-loss-limitations::b01):
 * only a business loss is limited, on Form 461, and the limit does not change
 * Schedule E (irs-1040se-inst-2025::sec::special-rules-that-limit-losses::b01).
 * It is figured with every business on the return, so the stage adds every
 * K-1's business losses and the return's other ones (context). With no K-1
 * business loss, or a bound at most FORM_461_NOT_NEEDED_UP_TO, nothing is
 * limited; above it Form 461 is needed, which is not modeled.
 */
export const excessBusinessLossLimit: LimitStage = (entities, context) => {
  const k1Losses = entities.reduce(
    (total, entry) => total + positiveTotal(activityLosses(entry.items)),
    0,
  );
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
    if (k1Losses + other.amount <= FORM_461_NOT_NEEDED_UP_TO) return passAll(items);
    return unsupportedFor(
      entity,
      limited,
      `the return's business losses can be more than $${FORM_461_NOT_NEEDED_UP_TO}, so the excess business loss limit (Form 461) may apply, which is not modeled for a K-1.`,
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
