import {
  ADJUSTMENT_KEYS,
  businessesOnReturn,
  isDividendFactKey,
  ownerOf,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { factsInCategory, filingStatusOf, num, type ResolverInputs } from "../../resolverInputs.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { routeEntities } from "../passThrough/routing.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import { netProfit } from "../schedule-c/lines.js";
import { resolveScheduleEInfo } from "../schedule-e/resolveInfo.js";
import { resolveScheduleSEInfo } from "../schedule-se/resolveInfo.js";
import type { QbiBusiness, QbiFilingInfo } from "./filingInfo.js";

/* Qualified REIT dividends: 1099-DIV box 5, cents kept. Undefined with no 1099-DIV. */
export function qualifiedReitDividends(inputs: ResolverInputs): number | undefined {
  const divs = factsInCategory(inputs, "investment_income").filter((row) =>
    isDividendFactKey(row.key),
  );
  return divs.length > 0
    ? sum(...divs.map((row) => (row.value as { box5?: unknown }).box5))
    : undefined;
}

/* The shared QBI slots, filled whichever QBI form files (Form 8995 or 8995-A). */
export function resolveQbiInfo(inputs: ResolverInputs): QbiFilingInfo {
  const { businesses } = qbiBusinesses(inputs);
  return {
    qualifiedReitDividends: qualifiedReitDividends(inputs),
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
 * MANUAL EDIT: a K-1 with a section 199A statement is one more trade or business
 * (irs-1120sk1-inst-2025::sec::box-17-other-information::b11, ::b12). Its QBI,
 * W-2 wages, UBIA and specified service answer are the statement's. A K-1 with
 * no statement adds nothing. Its QBI waits while the K-1 waits, and is a gap
 * while any of its items has no route: the amounts on the statement may
 * include items not allowed this year (::b12).
 */
function qbiPassThroughs(inputs: ResolverInputs): QbiBusiness[] {
  const status = filingStatusOf(inputs);
  const { entities } = passThroughEntitiesOnReturn(inputs.facts, spousePropertiesOnReturn(status));
  const withStatement = entities.filter((entity) => entity.k1.section199A !== undefined);
  return routeEntities(withStatement, { filingStatus: status }).map((routed): QbiBusiness => {
    const { entity } = routed;
    const statement = entity.k1.section199A;
    return {
      factKey: entity.key,
      kind: "passThrough",
      owner: entity.holding?.owner ?? "taxpayer",
      name: statement?.businessName ?? entity.name,
      ein: entity.ein,
      specifiedService: statement?.specifiedService,
      statementQbi: routed.kind === "routed" ? statement?.qualifiedBusinessIncome : undefined,
      ownersOnlyBusiness: false,
      qbiGap: routed.kind === "unsupported" ? routed.reasons.join(" ") : undefined,
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
    businesses: [
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
    ],
    malformedKeys,
  };
}
