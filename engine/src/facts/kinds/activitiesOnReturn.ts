/*
 * The businesses and rentals on this return, with the return's depreciation
 * scope added. The mid-quarter test (irs-4562-inst-2025::sec::recovery-period-for-most-property::b02)
 * counts all the personal property the return places in service in 2025, in
 * every activity. When two or more activities place it in service, each
 * activity's depreciation is marked personalPropertyInOtherActivities, and
 * Form 4562 reports the test as a gap (federal/4562/lines.ts).
 */

import { deductionReductionOf } from "../../federal/6765/figures.js";
import { paidByCategory } from "../../federal/6765/qualifiedExpenses.js";
import { placeReduction } from "../../federal/6765/reduction.js";
import { tipCreditReductions } from "../../federal/8846/figures.js";
import { atLeast, sum } from "../../money.js";
import { statedBusinessesOnReturn, type BusinessFactValue } from "./business.js";
import { placesPersonalProperty, type ScopedDepreciation } from "./depreciation.js";
import { statedRentalsOnReturn, type RentalFactValue } from "./rental.js";
import { readResearchCreditFact } from "./researchCredit.js";
import { section179RecaptureByBusiness } from "./section179Recapture.js";
import { workOpportunityCreditByActivity } from "./workOpportunity.js";

type FactRow = { key: string; value: unknown; category: string };
type Activity = { key: string; value: BusinessFactValue | RentalFactValue };

function activitiesWithPersonalProperty(facts: ReadonlyArray<FactRow>, joint: boolean): number {
  const activities: Activity[] = [
    ...statedBusinessesOnReturn(facts, joint).businesses,
    ...statedRentalsOnReturn(facts, joint).properties,
  ];
  return activities.filter((activity) => placesPersonalProperty(activity.value.depreciation))
    .length;
}

function marked<T extends Activity>(activities: T[], shared: boolean): T[] {
  if (!shared) return activities;
  return activities.map((activity) =>
    placesPersonalProperty(activity.value.depreciation)
      ? {
          ...activity,
          value: {
            ...activity.value,
            depreciation: {
              ...activity.value.depreciation,
              personalPropertyInOtherActivities: true,
            } satisfies ScopedDepreciation,
          },
        }
      : activity,
  );
}

const SHARED_TEST_MINIMUM = 2;

const BUSINESS_PREFIX = "business.";

/*
 * Form 4797 line 35: the section 179 or 280F(b)(2) recapture goes "as other
 * income on the same form or schedule on which you took the deduction"
 * (irs-4797-inst-2025::sec::line-35::b01): Schedule C line 6 of the business the
 * recapture fact names, added to its stated other income.
 */
function withRecapture<T extends { key: string; value: BusinessFactValue }>(
  businesses: T[],
  facts: ReadonlyArray<FactRow>,
): T[] {
  const recapture = section179RecaptureByBusiness(facts);
  if (recapture.size === 0) return businesses;
  return businesses.map((business) => {
    const amount = recapture.get(business.key.slice(BUSINESS_PREFIX.length));
    if (amount === undefined) return business;
    return {
      ...business,
      value: { ...business.value, otherIncome: sum(business.value.otherIncome, amount) },
    };
  });
}

/*
 * Schedule C line 26: "Enter the total salaries and wages for the tax year
 * reduced by the amount of the following credit(s) ... Work Opportunity Credit
 * (Form 5884)" (irs-1040sc-inst-2025::sec::line-26::b01): the stated wages
 * less the credit of the business's own targeted group employees (Form 5884
 * line 2, workOpportunity.ts), never below 0. Stated wages only: a business
 * that states none has nothing to reduce. A credit from a K-1 is not taken off
 * ("Do not reduce your deduction for any portion of a credit that was passed
 * through to you").
 */
function withWorkOpportunityWages<T extends { key: string; value: BusinessFactValue }>(
  businesses: T[],
  facts: ReadonlyArray<FactRow>,
): T[] {
  const credits = workOpportunityCreditByActivity(facts);
  if (credits.size === 0) return businesses;
  return businesses.map((business) => {
    const credit = credits.get(business.key);
    const wages = business.value.expenses?.wages;
    if (credit === undefined || wages === undefined) return business;
    const expenses = { ...business.value.expenses, wages: atLeast(0, wages - credit) };
    return { ...business, value: { ...business.value, expenses } };
  });
}

/* The wages withWorkOpportunityWages takes off the return's Schedule C businesses, in total (Schedule CA line 3). */
export function workOpportunityWageReduction(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): number {
  const credits = workOpportunityCreditByActivity(facts);
  const reductions = statedBusinessesOnReturn(facts, joint).businesses.map(({ key, value }) => {
    const wages = value.expenses?.wages;
    return wages === undefined ? 0 : Math.min(atLeast(0, wages), credits.get(key) ?? 0);
  });
  return sum(...reductions);
}

/*
 * Form 8846 line 4 comes off the business's taxes: "Reduce your deduction by
 * the amount shown on Form 8846, line 4" (irs-1040sc-inst-2025::sec::line-23::b01).
 * The stated taxesAndLicenses hold the employer taxes before the credit.
 */
function withTipCredit<T extends { key: string; value: BusinessFactValue }>(
  businesses: T[],
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): T[] {
  const reductions = tipCreditReductions(facts, joint);
  if (reductions.size === 0) return businesses;
  return businesses.map((business) => {
    const reduction = reductions.get(business.key);
    if (reduction === undefined) return business;
    const expenses = business.value.expenses ?? {};
    const taxesAndLicenses = (expenses.taxesAndLicenses ?? 0) - reduction;
    return {
      ...business,
      value: { ...business.value, expenses: { ...expenses, taxesAndLicenses } },
    };
  });
}

type BusinessOnReturn = { key: string; value: BusinessFactValue };

/* The research business's expenses less Form 6765 line 28; undefined with no reduction, the business when it is not on the return. */
function researchPlacement(businesses: BusinessOnReturn[], facts: ReadonlyArray<FactRow>) {
  const fact = readResearchCreditFact(facts).fact;
  if (fact === undefined) return undefined;
  const reduction = deductionReductionOf(fact.value);
  if (reduction === undefined) return undefined;
  const { businessKey, expenses, businessComponents } = fact.value;
  const business = businesses.find((each) => each.key === businessKey);
  if (business === undefined) return { businessKey, reduction, placed: undefined };
  const paid = paidByCategory(expenses, businessComponents);
  return {
    businessKey,
    reduction,
    placed: placeReduction(business.value.expenses, reduction, paid),
  };
}

/*
 * Form 6765 without the reduced credit election: the research expenses the
 * business deducts go down by line 28 (federal/6765/reduction.ts). A
 * reduction that does not fit is a gap on line 28, and the lines stay as stated.
 */
function withResearchCredit<T extends BusinessOnReturn>(
  businesses: T[],
  facts: ReadonlyArray<FactRow>,
): T[] {
  const placement = researchPlacement(businesses, facts);
  const placed = placement?.placed;
  if (placed === undefined || placed.left > 0) return businesses;
  return businesses.map((business) =>
    business.key === placement?.businessKey
      ? { ...business, value: { ...business.value, expenses: placed.expenses } }
      : business,
  );
}

/* The businesses before the research credit: the scope, the recapture and the work opportunity wages. */
function beforeResearch(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedBusinessesOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  const businesses = withRecapture(marked(result.businesses, shared), facts);
  return { result, reduced: withWorkOpportunityWages(businesses, facts) };
}

/* Form 6765 line 28's reduction on the research business, for the form's gap: undefined with no reduction. */
export function researchCreditPlacement(facts: ReadonlyArray<FactRow>, joint: boolean) {
  return researchPlacement(beforeResearch(facts, joint).reduced, facts);
}

/* The research expenses withResearchCredit takes off the business's Schedule C lines (Schedule CA line 3); 0 with none. */
export function researchCreditDeductionReduction(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): number {
  const placement = researchCreditPlacement(facts, joint);
  const placed = placement?.placed;
  return placement !== undefined && placed !== undefined && placed.left === 0
    ? placement.reduction
    : 0;
}

/*
 * statedBusinessesOnReturn, with the return's depreciation scope, its Form 4797
 * Part IV recapture, its wages less the work opportunity credit, its taxes
 * less the Form 8846 credit and its research expenses less the Form 6765
 * credit. The work opportunity credit comes off the wages first, so the
 * research credit takes what is left of them.
 */
export function businessesOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const { result, reduced } = beforeResearch(facts, joint);
  const withTips = withTipCredit(reduced, facts, joint);
  return { ...result, businesses: withResearchCredit(withTips, facts) };
}

/* statedRentalsOnReturn, with the return's depreciation scope. */
export function rentalsOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedRentalsOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  return { ...result, properties: marked(result.properties, shared) };
}
