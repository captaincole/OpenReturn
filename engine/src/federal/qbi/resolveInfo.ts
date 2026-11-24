import {
  ADJUSTMENT_KEYS,
  businessesOnReturn,
  isDividendFactKey,
  ownerOf,
  type Section199AStatement,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { factsInCategory, filingStatusOf, num, type ResolverInputs } from "../../resolverInputs.js";
import type { Unsupported } from "../../types.js";
import { isLossOrDeduction, isPortfolio } from "../passThrough/itemTypes.js";
import { entityTitle, type PassThroughItem } from "../passThrough/items.js";
import {
  receivedOnReturn,
  routedOnReturn,
  withReceived,
  type ReceivedItem,
} from "../passThrough/receipts.js";
import type { RoutedEntity } from "../passThrough/routing.js";
import { netProfit } from "../schedule-c/lines.js";
import { resolveScheduleEInfo } from "../schedule-e/resolveInfo.js";
import { resolveScheduleSEInfo } from "../schedule-se/resolveInfo.js";
import type { QbiBusiness, QbiFilingInfo } from "./filingInfo.js";
import { withForm4797 } from "./form4797.js";

/* 1099-DIV box 5, cents kept. Undefined with no 1099-DIV. */
function form1099ReitDividends(inputs: ResolverInputs): number | undefined {
  const divs = factsInCategory(inputs, "investment_income").filter((row) =>
    isDividendFactKey(row.key),
  );
  return divs.length > 0
    ? sum(...divs.map((row) => (row.value as { box5?: unknown }).box5))
    : undefined;
}

/* A K-1 statement's section 199A dividends (irs-1041k1-inst-2025::sec::box-14-other-information::b05). */
const statementReitDividends = ({ entity }: ReceivedItem) =>
  entity.k1.section199A?.section199ADividends;

/*
 * Qualified REIT dividends: 1099-DIV box 5 and each K-1 statement's section
 * 199A dividends (irs-1120sk1-inst-2025::sec::box-17-other-information::b13),
 * cents kept. Undefined with neither, and while a K-1 waits; the gap when a
 * K-1 is unsupported.
 */
function reitDividendsWithK1s(inputs: ResolverInputs): number | Unsupported | undefined {
  const own = form1099ReitDividends(inputs);
  const receipt = receivedOnReturn(inputs, "qbi");
  const withK1 = withReceived(own, receipt, statementReitDividends);
  const anyK1 =
    receipt.kind !== "received" ||
    receipt.items.some((received) => (statementReitDividends(received) ?? 0) !== 0);
  return anyK1 ? withK1 : own;
}

/* Qualified REIT dividends as a number, for the must-file and form-choice bounds. */
export function qualifiedReitDividends(inputs: ResolverInputs): number | undefined {
  const amount = reitDividendsWithK1s(inputs);
  return typeof amount === "number" ? amount : form1099ReitDividends(inputs);
}

/* The shared QBI slots, filled whichever QBI form files (Form 8995 or 8995-A). */
export function resolveQbiInfo(inputs: ResolverInputs): QbiFilingInfo {
  const { businesses } = qbiBusinesses(inputs);
  const reit = reitDividendsWithK1s(inputs);
  return {
    qualifiedReitDividends: typeof reit === "number" ? reit : undefined,
    qualifiedReitDividendsGap: typeof reit === "object" ? reit.reason : undefined,
    qbiBusinesses: businesses.length > 0 ? businesses : undefined,
    qbiScheduleSEFiled: resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value,
  };
}

/*
 * A rental or royalty property is a QBI trade or business when the taxpayer says so
 * (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b04: a section 162
 * trade or business, or the Rev. Proc. 2019-38 safe harbor). It takes Part I's
 * first columns, in the order the answer key lists it. A jointly owned property is
 * listed under the taxpayer's TIN.
 */
function qbiRentals(inputs: ResolverInputs): QbiBusiness[] {
  return (resolveScheduleEInfo(inputs).rentalProperties ?? [])
    .filter((property) => property.value.qualifiedBusiness === true)
    .map((property) => ({
      factKey: property.factKey,
      kind: "rental",
      scheduleEColumn: property.column,
      owner: property.value.owner === "spouse" ? "spouse" : "taxpayer",
      name: property.value.address?.street ?? property.value.propertyType,
      specifiedService: property.value.specifiedService,
      ownersOnlyBusiness: false,
      w2WagesPaid: property.value.w2WagesPaid,
      qualifiedPropertyUbia: property.value.qualifiedPropertyUbia,
    }));
}

/*
 * A beneficiary's QBI is apportioned from the trust's trades or businesses
 * (irs-1041k1-inst-2025::sec::box-14-other-information::b03, ::b04), which
 * Part III does not identify; not modeled.
 */
const TRUST_QBI_GAP = (name: string) =>
  `${name} (estate or trust K-1): QBI from an estate's or trust's trade or business on the section 199A statement is not modeled.`;

/* A loss or deduction of the business itself: not portfolio, not a charitable contribution. */
const isBusinessLoss = (item: PassThroughItem) =>
  isLossOrDeduction(item.type, item.amount) &&
  !isPortfolio(item.type) &&
  item.type !== "charitable_contribution";

const lossTotal = (items: PassThroughItem[]) =>
  sum(...items.filter(isBusinessLoss).map((item) => Math.abs(item.amount ?? 0)));

/*
 * The K-1's QBI this year. Losses a limit suspends are not QBI; "only the
 * portion of the allowed loss or deduction attributable to QBI" counts: the
 * allowed loss times the share of the total loss that is QBI
 * (irs-8995-inst-2025::sec::determining-your-qualified-business::b02, ::b03).
 * The statement's QBI is for the whole year's loss, so it is scaled by the part
 * of the business losses the limits allow. A statement with QBI of 0 or more
 * while a business loss is held back is not modeled.
 */
function allowedStatementQbi(routed: RoutedEntity, statementQbi: number) {
  if (routed.kind !== "routed") return undefined;
  const current = routed.allowed.filter((item) => item.fromPriorYear !== true);
  const whole = lossTotal(routed.entity.items);
  const allowed = lossTotal(current);
  if (allowed >= whole) return { qbi: statementQbi };
  if (statementQbi >= 0) {
    return {
      gap: `${entityTitle(routed.entity)}: the section 199A statement gives QBI of 0 or more while a limit holds back part of a business loss; scaling it is not modeled.`,
    };
  }
  // A loss the limits hold back in full is no QBI at all (0, not a negative zero).
  return { qbi: allowed === 0 ? 0 : (statementQbi * allowed) / whole };
}

/*
 * A basis loss carried from an earlier year and allowed now goes on Form 8995
 * line 3, not line 1 (irs-8995-inst-2025::sec::specific-instructions::b02,
 * ::line-3::b01): its qualified part, the allowed loss times the share of the
 * carried loss that is QBI (the holding's answer; the QBI Loss Tracking
 * Worksheet's column B, ::specific-instructions-2::b01). Undefined with none;
 * "waiting" while the holding does not give the qualified part.
 */
function priorYearQbiLossOf(routed: RoutedEntity): number | "waiting" | undefined {
  if (routed.kind !== "routed") return undefined;
  const allowed = lossTotal(
    routed.allowed.filter((item) => item.fromPriorYear === true && item.passiveCarryover !== true),
  );
  if (allowed === 0) return undefined;
  const qualified = routed.entity.holding?.carriedQualifiedBusinessLoss;
  if (qualified === undefined) return "waiting";
  const carried = lossTotal(routed.entity.priorYearItems);
  return (allowed * qualified) / carried;
}

/*
 * A passive loss carried from an earlier year and allowed now is a QBI loss
 * carryforward too (irs-8995-inst-2025::sec::line-3::b01), but the holding's
 * qualified part (carriedQualifiedBusinessLoss) is the basis loss's, so its
 * part on Form 8995 line 3 is not modeled.
 */
const carriedPassiveLossAllowed = (routed: RoutedEntity) =>
  routed.kind === "routed" &&
  routed.allowed.some((item) => item.passiveCarryover === true && isBusinessLoss(item));

const CARRIED_PASSIVE_QBI_GAP = (title: string) =>
  `${title}: a passive loss carried from an earlier year and allowed this year is a QBI loss carryforward (Form 8995 line 3), whose qualified part is not modeled.`;

/* The K-1s whose allowed carried loss waits on the holding's qualified part. */
export function k1sWithoutCarriedQbiAnswer(inputs: ResolverInputs): string[] {
  return routedOnReturn(inputs)
    .filter(
      (routed) =>
        routed.entity.k1.section199A?.qualifiedBusinessIncome !== undefined &&
        priorYearQbiLossOf(routed) === "waiting",
    )
    .map((routed) => routed.entity.holdingKey);
}

/*
 * A statement with W-2 wages or UBIA and no QBI amount. Form 8995-A lines 4
 * and 7 count them only with the business's QBI: "If the QBI on line 2 ... is
 * zero, then the amount reported on line 4 ... must also be zero"
 * (irs-8995a-inst-2025::sec::line-4-3::b01, ::line-7::b02). An absent QBI is
 * not a stated 0, so the row is a gap rather than a row with 0 income.
 */
const NO_QBI_GAP = (title: string) =>
  `${title}: the section 199A statement gives W-2 wages or UBIA of qualified property but no QBI amount, and Form 8995-A lines 4 and 7 count them only with the business's QBI.`;

const hasLimitAmounts = (statement: Section199AStatement | undefined) =>
  (statement?.w2Wages ?? 0) > 0 || (statement?.qualifiedPropertyUbia ?? 0) > 0;

/* What a routed K-1 gives its QBI row: the statement's QBI, the carried qualified loss, or a gap. */
function passThroughQbi(routed: RoutedEntity) {
  const statement = routed.entity.k1.section199A;
  const scaled = allowedStatementQbi(routed, statement?.qualifiedBusinessIncome ?? 0);
  const priorYear = priorYearQbiLossOf(routed);
  const trustGap = routed.entity.form === "1041" ? TRUST_QBI_GAP(routed.entity.name) : undefined;
  const passiveGap = carriedPassiveLossAllowed(routed)
    ? CARRIED_PASSIVE_QBI_GAP(entityTitle(routed.entity))
    : undefined;
  const limitGap = routed.kind === "unsupported" ? routed.reasons.join(" ") : undefined;
  const noQbiGap =
    statement?.qualifiedBusinessIncome === undefined
      ? NO_QBI_GAP(entityTitle(routed.entity))
      : undefined;
  return {
    statementQbi: priorYear === "waiting" ? undefined : scaled?.qbi,
    priorYearQbiLoss: typeof priorYear === "number" ? priorYear : undefined,
    qbiGap: limitGap ?? noQbiGap ?? trustGap ?? passiveGap ?? scaled?.gap,
  };
}

/*
 * MANUAL EDIT: a K-1 with a section 199A statement is one more trade or business
 * (irs-1120sk1-inst-2025::sec::box-17-other-information::b11, ::b12). Its QBI,
 * W-2 wages, UBIA and specified service answer are the statement's. A K-1 with
 * no statement, or a statement with no QBI (section 199A dividends only), adds
 * no business; a statement with W-2 wages or UBIA but no QBI adds a business
 * whose QBI is a gap (NO_QBI_GAP), so the amounts are never dropped without a
 * word. Its QBI waits while the K-1 waits, and is a gap while any of
 * its items has no route: the amounts on the statement may include items not
 * allowed this year (::b12); passThroughQbi keeps only the allowed part. A
 * trust's QBI is a gap (TRUST_QBI_GAP). Every K-1 goes through the limits
 * together, since the excess business loss stage adds them all.
 */
function qbiPassThroughs(inputs: ResolverInputs): QbiBusiness[] {
  const withStatement = (routed: RoutedEntity) =>
    routed.entity.k1.section199A?.qualifiedBusinessIncome !== undefined ||
    hasLimitAmounts(routed.entity.k1.section199A);
  return routedOnReturn(inputs)
    .filter(withStatement)
    .map((routed): QbiBusiness => {
      const { entity } = routed;
      const statement = entity.k1.section199A;
      return {
        factKey: entity.key,
        kind: "passThrough",
        owner: entity.holding?.owner ?? "taxpayer",
        name: statement?.businessName ?? entity.name,
        ein: entity.ein,
        specifiedService: statement?.specifiedService,
        ...passThroughQbi(routed),
        ownersOnlyBusiness: false,
        w2WagesPaid: statement?.w2Wages,
        qualifiedPropertyUbia: statement?.qualifiedPropertyUbia,
      };
    });
}

/* Rental properties whose QBI answer is missing: Cade asks for the property again. */
export function rentalsWithoutQbiAnswer(inputs: ResolverInputs): string[] {
  return (resolveScheduleEInfo(inputs).rentalProperties ?? [])
    .filter((property) => property.value.qualifiedBusiness === undefined)
    .map((property) => property.factKey);
}

/*
 * QBI rentals whose QBI waits on a prior-year unallowed loss: its QBI part goes on
 * the loss-carryforward line through the QBI Loss Tracking Worksheet
 * (irs-8995a-inst-2025::sec::line-2::b01), which is not modeled (rentalQbi waits).
 * Listed so the return does not read as ready while the QBI form is blank.
 */
export function rentalsWithUnmodeledQbi(inputs: ResolverInputs): string[] {
  return (resolveScheduleEInfo(inputs).rentalProperties ?? [])
    .filter(
      (property) =>
        property.value.qualifiedBusiness === true &&
        (property.value.priorYearUnallowedLoss ?? 0) > 0,
    )
    .map((property) => property.factKey);
}

/*
 * irs-8995-inst-2025::sec::determining-your-qualified-business::b01: QBI takes off
 * the contributions to qualified retirement plans attributable to the business.
 * The answer (Schedule 1 line 16) names no business: with one Schedule C business
 * on the return it is that business's; with two or more, their QBI is a gap.
 */
export const PLAN_DEDUCTION_GAP =
  "The self-employed retirement plan deduction (Schedule 1 line 16) comes off the QBI of the business the plan belongs to, and no answer says which of the return's businesses that is.";

export function qbiBusinesses(inputs: ResolverInputs): {
  businesses: QbiBusiness[];
  malformedKeys: string[];
} {
  const { businesses, malformedKeys } = businessesOnReturn(
    inputs.facts,
    filingStatusOf(inputs) === "married_filing_jointly",
  );
  const onReturn = businesses.map((business) => ({ ...business, owner: ownerOf(business.value) }));
  const taxpayerCount = onReturn.filter((business) => business.owner === "taxpayer").length;
  const onReturnValues = businesses.map((business) => business.value);
  const planDeduction = num(inputs, ADJUSTMENT_KEYS.selfEmployedPlanDeduction);
  const sharedPlan = onReturn.length > 1 && (planDeduction ?? 0) > 0;
  return {
    businesses: withForm4797(inputs, [
      ...qbiRentals(inputs),
      ...onReturn.map(({ key, value, owner }): QbiBusiness => ({
        factKey: key,
        kind: "business",
        owner,
        name: value.name ?? value.activity,
        ein: value.ein,
        specifiedService: value.specifiedService,
        netProfit: netProfit(value, onReturnValues),
        ownersOnlyBusiness: owner === "taxpayer" && taxpayerCount === 1,
        retirementPlanDeduction: onReturn.length === 1 ? planDeduction : undefined,
        qbiGap: sharedPlan ? PLAN_DEDUCTION_GAP : undefined,
        w2WagesPaid: value.w2WagesPaid,
        qualifiedPropertyUbia: value.qualifiedPropertyUbia,
      })),
      ...qbiPassThroughs(inputs),
    ]),
    malformedKeys,
  };
}
