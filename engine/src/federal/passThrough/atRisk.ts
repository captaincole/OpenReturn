/*
 * The at-risk stage of the loss limits (README.md, layer 4) and the K-1's Form
 * 6198. Only a loss or deduction from the activity is limited
 * (irs-1120sk1-inst-2025::sec::at-risk-limitations::b01). With all of the
 * investment at risk and no loss carried from an earlier year, nothing is
 * limited and Form 6198 is not needed. Otherwise Form 6198 figures the
 * deductible loss (federal/6198/figure.ts) from the items that reach the stage
 * and the owner's amounts at risk (the at-risk fact, at_risk.<K-1 fact key>).
 * A loss the limit holds back "will be treated as a deduction allocable to the
 * activity in the next tax year" (::b03): it carries in the holding's
 * carriedLosses.atRisk, by item. With no loss, a decrease this year may still
 * bring recapture (profitYear).
 */

import { makeAtRiskFactKey, type PartnerLiabilities } from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  dispositionEntries,
  figureForm6198,
  profitYearRecapture,
  type AtRiskActivity,
  type Form6198Outcome,
} from "../6198/figure.js";
import type { PartIEntry, PartILine } from "../6198/lines.js";
import { withAmount } from "./basis.js";
import {
  atRiskCarriedItemsOf,
  entityTitle,
  type PassThroughEntity,
  type PassThroughItem,
} from "./items.js";
import { isLossOrDeduction, isPortfolio, labelOf, roleOf, type ItemType } from "./itemTypes.js";
import type { LimitStage, StageOutcome } from "./limits.js";
import { passAll, perEntity, unsupportedFor } from "./stageHelpers.js";

/*
 * A loss or deduction from the trade or business: not portfolio, and not a
 * charitable contribution, which the owner deducts on Schedule A
 * (irs-1120sk1-inst-2025::sec::box-12-other-deductions::b06), not from the activity.
 */
export const activityLosses = (items: PassThroughItem[]) =>
  items.filter(
    (item) =>
      isLossOrDeduction(item.type, item.amount) &&
      !isPortfolio(item.type) &&
      item.type !== "charitable_contribution",
  );

/*
 * The losses and deductions the at-risk limit held back in earlier years (the
 * holding's carriedLosses.atRisk), by item, as this year's items with their
 * character: "these losses and deductions must be included in the current year
 * amounts you enter in Part I" (irs-6198-inst-2025::sec::part-i::b01), a box 1
 * loss on line 1 (::part-i-2::b01), the others on the lines of their kind.
 */
export const carriedAtRiskItems = (entity: PassThroughEntity) =>
  atRiskCarriedItemsOf(entity.key, entity.holding, entity.form);

/* Any amount in carriedLosses.atRisk, a beneficiary's too (which has no items: its stage is a gap). */
const hasCarriedAtRiskLoss = (entity: PassThroughEntity) =>
  Object.values(entity.holding?.carriedLosses?.atRisk ?? {}).some((amount) => (amount ?? 0) > 0);

/*
 * Form 6198 files for the K-1: a partnership or an S corporation K-1 with a
 * loss or deduction from the activity and amounts not at risk, or with a loss
 * the at-risk limit carried from an earlier year
 * (irs-6198-inst-2025::sec::who-must-file::b01). The items are the ones that
 * reach the stage, after the basis limit.
 */
export function needsForm6198(entity: PassThroughEntity, items: PassThroughItem[]): boolean {
  if (entity.form === "1041") return false;
  if (hasCarriedAtRiskLoss(entity)) return true;
  return entity.holding?.allInvestmentAtRisk === false && activityLosses(items).length > 0;
}

/* Items whose place in the activity the instructions do not settle. */
const UNSETTLED: ReadonlyArray<ItemType> = [
  "guaranteed_payment_services",
  "guaranteed_payment_capital",
  "guaranteed_payments_total",
  "not_modeled",
];

/*
 * The Part I line of a K-1 item: box 1 on line 1 (irs-6198-inst-2025::sec::line-1::b01);
 * a section 1231 gain or loss, reported on Form 4797, on line 2b
 * (::lines-2a-2b-and-2c::b01); other income and gains on line 3 and other
 * deductions and losses on line 4 (::line-3::b01, ::line-4::b01). Portfolio
 * items and charitable contributions are not from the activity; credits,
 * basis items and information have no amount of income.
 */
function partILineOf(item: PassThroughItem): PartILine | undefined {
  if (isPortfolio(item.type) || item.type === "charitable_contribution") return undefined;
  if (item.type === "ordinary_business_income") return "1";
  if (item.type === "net_section_1231_gain") return "2b";
  const role = roleOf(item.type);
  if (role === "deduction") return "4";
  if (role !== "income") return undefined;
  return (item.amount ?? 0) < 0 ? "4" : "3";
}

/* The entry's signed amount: a deduction is negative on line 4. */
const signed = (item: PassThroughItem) =>
  roleOf(item.type) === "deduction" ? -(item.amount ?? 0) : (item.amount ?? 0);

function entriesOf(items: PassThroughItem[]): PartIEntry<PassThroughItem>[] {
  return items.flatMap((item) => {
    const line = partILineOf(item);
    if (line === undefined || (item.amount ?? 0) === 0) return [];
    return [{ line, amount: signed(item), source: item }];
  });
}

/* Why the engine cannot fill the K-1's Form 6198, or undefined. */
function k1Gap(entity: PassThroughEntity, items: PassThroughItem[]): string | undefined {
  const k1 = entity.k1;
  if (k1.form !== "1041" && k1.moreThanOneAtRiskActivity === true) {
    return "the K-1 reports more than one activity for at-risk purposes, each with its own Form 6198 from the entity's statement (irs-1065k1-inst-2025::sec::box-22-more-than-one-activity-for::b01), which is not modeled.";
  }
  if (entity.holding?.disposedOfEntirely === true) {
    return "a disposition of the interest with amounts not at risk puts the gain on Form 6198 line 2a and may recapture earlier losses, which is not modeled.";
  }
  const unsettled = items.filter((item) => UNSETTLED.includes(item.type));
  if (unsettled.length > 0) {
    return `whether ${namesOf(unsettled)} belong to the at-risk activity on Form 6198 is not settled by the instructions, so the at-risk limit is not modeled for this K-1.`;
  }
  return investmentInterestGap(entity, items) ?? carriedOutsidePartIGap(entity);
}

const namesOf = (items: PassThroughItem[]) =>
  [...new Set(items.map((item) => labelOf(item.type)))].join(", ");

/*
 * Investment interest expense from the activity goes on line 4 after Form
 * 4952: "If you have investment interest expense from your at-risk activity,
 * first complete Form 4952 ... enter that amount on line 4 of Form 6198. You
 * must reduce the allowable investment interest deduction on Form 4952 by the
 * amount you carry to Form 6198" (irs-6198-inst-2025::sec::line-4::b01; line 1
 * names it too, ::line-1::b01). No fact says which part of the K-1's investment
 * interest is from the activity, and Form 4952 does not take a K-1's, so the
 * K-1's Form 6198 is a gap rather than a Part I without it.
 */
function investmentInterestGap(entity: PassThroughEntity, items: PassThroughItem[]) {
  const interest = [...items, ...carriedAtRiskItems(entity)].some(
    (item) => item.type === "investment_interest_expense" && (item.amount ?? 0) !== 0,
  );
  return interest
    ? "investment interest expense from the at-risk activity goes on Form 6198 line 4 after Form 4952 (irs-6198-inst-2025::sec::line-4::b01); which part is from the activity, and the reduction on Form 4952, are not modeled."
    : undefined;
}

/* A carried at-risk item that has no Part I line here (a capital loss, a gift, foreign taxes). */
function carriedOutsidePartIGap(entity: PassThroughEntity) {
  const outside = carriedAtRiskItems(entity).filter((item) => partILineOf(item) === undefined);
  return outside.length > 0
    ? `a ${namesOf(outside)} carried by the at-risk limit has no line in Part I of Form 6198 here, which is not modeled.`
    : undefined;
}

/* The recourse debt and qualified nonrecourse financing in a partner's share of liabilities (item K1): at risk. */
const debtAtRisk = (liabilities: PartnerLiabilities | undefined) =>
  sum(liabilities?.recourse, liabilities?.qualifiedNonrecourseFinancing);

/*
 * The K-1 shows a decrease in the amount at risk this year: a distribution
 * (irs-6198-inst-2025::sec::line-9::b02, item 4: "Withdrawals and
 * distributions"), or, for a partner, a smaller share of the debt that is at
 * risk at the end of the year than at the start (inferred: a smaller share of
 * liabilities is treated as a distribution of money).
 */
function decreasedThisYear(entity: PassThroughEntity, items: PassThroughItem[]): boolean {
  if (items.some((item) => item.type === "distribution" && (item.amount ?? 0) > 0)) return true;
  const k1 = entity.k1;
  if (k1.form !== "1065" || k1.liabilitiesAtStart === undefined) return false;
  return debtAtRisk(k1.liabilitiesAtEnd) < debtAtRisk(k1.liabilitiesAtStart);
}

/* What the recapture check needs: the at-risk fact, the reason's title, the amounts, the decrease. */
const recaptureInputs = (entity: PassThroughEntity, items: PassThroughItem[]) => ({
  factKey: makeAtRiskFactKey(entity.key),
  title: entityTitle(entity),
  amounts: entity.atRisk,
  decreasedThisYear: decreasedThisYear(entity, items),
});

/* The K-1's activity for Form 6198, or the reason it cannot be figured. */
export function k1AtRiskActivity(
  entity: PassThroughEntity,
  items: PassThroughItem[],
): AtRiskActivity<PassThroughItem> | string {
  const gap = k1Gap(entity, items);
  if (gap) return gap;
  const amounts = entity.atRisk;
  const named = `${entity.name}, ${entity.ein}`;
  return {
    ...recaptureInputs(entity, items),
    description: amounts?.description ? `${amounts.description}, ${named}` : named,
    entries: [
      ...entriesOf([...carriedAtRiskItems(entity), ...items]),
      ...dispositionEntries<PassThroughItem>(amounts),
    ],
    owner: entity.holding?.owner ?? "taxpayer",
  };
}

/* The K-1's Form 6198, or the reason it cannot be figured. */
export function figureK1Form6198(
  entity: PassThroughEntity,
  items: PassThroughItem[],
): Form6198Outcome<PassThroughItem> {
  const activity = k1AtRiskActivity(entity, items);
  if (typeof activity === "string") {
    return { kind: "unsupported", reason: `${entityTitle(entity)}: ${activity}` };
  }
  return figureForm6198(activity);
}

/*
 * The stage's answer from Form 6198: every item outside Part I passes as it
 * is; each Part I item is allowed by its allocated part, and the rest carries
 * with the item's character (irs-6198-inst-2025::sec::part-iv-deductible-loss::b02).
 */
function fromForm6198(entity: PassThroughEntity, items: PassThroughItem[]): StageOutcome {
  const outcome = figureK1Form6198(entity, items);
  if (outcome.kind !== "figured") return outcome;
  const inPartI = new Set(outcome.figures.entries.map((entry) => entry.source));
  const outside = items.filter((item) => !inPartI.has(item));
  const allowed = outcome.figures.entries.flatMap(({ source, allowed: amount }) =>
    source === undefined || amount === 0 ? [] : [amount > 0 ? source : withAmount(source, -amount)],
  );
  const carried = outcome.figures.entries.flatMap(({ source, carried: amount }) =>
    source === undefined || amount === 0 ? [] : [withAmount(source, -amount)],
  );
  return { kind: "applied", allowed: [...outside, ...allowed], carried };
}

/*
 * No loss or deduction from the activity: the limit allows everything, but
 * with amounts not at risk a decrease this year may bring recapture income
 * (irs-6198-inst-2025::sec::line-5::b01; figure.ts profitYearRecapture).
 */
function profitYear(entity: PassThroughEntity, items: PassThroughItem[]): StageOutcome {
  if (entity.form === "1041" || entity.holding?.allInvestmentAtRisk !== false) {
    return passAll(items);
  }
  return profitYearRecapture(recaptureInputs(entity, items)) ?? passAll(items);
}

/*
 * At-risk: with no loss or deduction from the activity and no carried at-risk
 * loss, nothing is limited (profitYear checks for recapture). With all of the
 * investment at risk the limit does not reduce the loss; the stage waits while
 * the holding does not say. A beneficiary's at-risk rules are not modeled
 * (QUESTIONS.md item 11).
 */
export const atRiskLimit: LimitStage = perEntity(({ entity, items }) => {
  const limited = activityLosses(items);
  const carried = hasCarriedAtRiskLoss(entity);
  if (limited.length === 0 && !carried) return profitYear(entity, items);
  const allAtRisk = entity.holding?.allInvestmentAtRisk;
  if (!carried && allAtRisk === true) return passAll(items);
  if (!carried && allAtRisk === undefined) {
    return { kind: "waiting", factKeys: [entity.holdingKey] };
  }
  if (entity.form === "1041") {
    return unsupportedFor(
      entity,
      limited,
      "a loss or deduction from the activity with amounts not at risk, or a carried at-risk loss, needs the at-risk limit (Form 6198), which is not modeled for a beneficiary.",
    );
  }
  return fromForm6198(entity, items);
});
