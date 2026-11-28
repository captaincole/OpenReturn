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
import { placeReduction, REDUCTION_ORDER } from "../../federal/6765/reduction.js";
import { clinicalAndResearchOverlapGap } from "../../federal/8820/coordination.js";
import { orphanDrugFigures, orphanDrugReductions } from "../../federal/8820/figures.js";
import { disabledAccessReductions } from "../../federal/8826/figures.js";
import { tipCreditReductions } from "../../federal/8846/figures.js";
import { agriBiodieselIncomeByBusiness } from "../../federal/8864/figures.js";
import { childcareCreditReductions } from "../../federal/8882/figures.js";
import { healthCreditReductions } from "../../federal/8941/figures.js";
import { atLeast, sum } from "../../money.js";
import {
  statedBusinessesOnReturn,
  type BusinessExpenses,
  type BusinessFactValue,
} from "./business.js";
import { placesPersonalProperty, type ScopedDepreciation } from "./depreciation.js";
import { empowermentZoneFigures } from "./empowermentZone.js";
import { statedWageCreditsByBusiness } from "./generalBusinessCredit.js";
import { statedRentalsOnReturn, type RentalFactValue } from "./rental.js";
import { readResearchCreditFact } from "./researchCredit.js";
import { section179RecaptureByBusiness } from "./section179Recapture.js";
import { smallEmployerPlanReductions } from "./smallEmployerPlan.js";
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
  joint: boolean,
): T[] {
  const recapture = section179RecaptureByBusiness(facts);
  // Form 8864 line 9, the agri-biodiesel credit, is the producing business's other income too (federal/8864/figures.ts).
  const biodiesel = agriBiodieselIncomeByBusiness(facts, joint);
  if (recapture.size === 0 && biodiesel.size === 0) return businesses;
  return businesses.map((business) => {
    const amount = recapture.get(business.key.slice(BUSINESS_PREFIX.length));
    const credit = biodiesel.get(business.key);
    if (amount === undefined && credit === undefined) return business;
    return {
      ...business,
      value: { ...business.value, otherIncome: sum(business.value.otherIncome, amount, credit) },
    };
  });
}

/*
 * One amount a credit takes off one business: a Schedule C expense line, a
 * Part V entry by its description, or the cost of a 2025 asset of its
 * depreciation by its description (the first entry or asset with it).
 */
export type BusinessCreditReduction =
  | { line: keyof BusinessExpenses; amount: number }
  | { otherExpense: string; amount: number }
  | { asset: string; amount: number };

type ReductionsByBusiness = ReadonlyMap<string, ReadonlyArray<BusinessCreditReduction>>;

interface CreditReduction {
  /* Each business's reductions, by fact key, from the businesses as the credits before it in the list left them. */
  reductionsOf: (
    facts: ReadonlyArray<FactRow>,
    joint: boolean,
    businesses: ReadonlyArray<Business>,
  ) => ReductionsByBusiness;
  /* Whether Schedule CA line 3 column B gives back what the credit took off (businessCreditAddBack). */
  californiaAddsBack: boolean;
}

/* A credit of each business that lowers one fixed expense line. */
const onLine =
  (
    line: keyof BusinessExpenses,
    creditOf: (facts: ReadonlyArray<FactRow>, joint: boolean) => ReadonlyMap<string, number>,
  ) =>
  (facts: ReadonlyArray<FactRow>, joint: boolean): ReductionsByBusiness =>
    new Map([...creditOf(facts, joint)].map(([key, amount]) => [key, [{ line, amount }]]));

/* Credits of each business that lower the expense lines they name. */
const byLine = (
  reductions: ReadonlyMap<string, Readonly<Record<string, number>>>,
): ReductionsByBusiness =>
  new Map(
    [...reductions].map(([key, lines]) => [
      key,
      Object.entries(lines).map(([line, amount]) => ({
        line: line as keyof BusinessExpenses,
        amount,
      })),
    ]),
  );

/*
 * The credits of the taxpayer's own businesses that lower a Schedule C
 * expense. A new credit form adds one entry. A credit from a K-1 is not here:
 * "Do not reduce your deduction for any portion of a credit that was passed
 * through to you from a pass-through entity" (irs-1040sc-inst-2025::sec::line-26::b01).
 */
const BUSINESS_CREDIT_REDUCTIONS: ReadonlyArray<CreditReduction> = [
  /*
   * Line 26: "Enter the total salaries and wages for the tax year reduced by
   * the amount of the following credit(s) ... Work Opportunity Credit (Form
   * 5884). Empowerment Zone Employment Credit (Form 8844)" (line-26::b01): Form
   * 5884 line 2 of the business's targeted group employees (workOpportunity.ts)
   * and the business's share of Form 8844 line 2 (empowermentZone.ts).
   * California gives both back (state/ca/schedule-ca/answerLines.ts).
   */
  {
    reductionsOf: onLine("wages", (facts) => workOpportunityCreditByActivity(facts)),
    californiaAddsBack: true,
  },
  {
    reductionsOf: onLine(
      "wages",
      (facts, joint) => empowermentZoneFigures(facts, joint).creditByEmployer,
    ),
    californiaAddsBack: true,
  },
  /*
   * The same line's Form 8932 and Form 8994: the engine takes these credits as
   * stated, each naming the business that paid the wages (generalBusinessCredit.ts).
   * Section 280C(a) takes them off, and California does not apply it
   * (ca-rtc-2025::sec::s17270::b; federal/8820/QUESTIONS.md item 19).
   */
  { reductionsOf: onLine("wages", statedWageCreditsByBusiness), californiaAddsBack: true },
  /*
   * Line 23: "Reduce your deduction by the amount shown on Form 8846, line 4"
   * (irs-1040sc-inst-2025::sec::line-23::b01). The stated taxesAndLicenses hold
   * the employer taxes before the credit. California's treatment is an open
   * question (federal/8846/QUESTIONS.md).
   */
  { reductionsOf: onLine("taxesAndLicenses", tipCreditReductions), californiaAddsBack: false },
  /*
   * Form 8826 line 6 comes off the expense line or the Part V entry that holds
   * the expenditures: "To the extent of the credit shown on line 6, the
   * eligible access expenditures may not be claimed as a deduction in figuring
   * taxable income" (irs-8826-form-2025::sec::line-6::b01). The fact names
   * the line; its stated amount holds the expenditures before the credit.
   */
  { reductionsOf: disabledAccessReductions, californiaAddsBack: true },
  /*
   * Form 8881 lines 5 and 6g come off the plan's business: the startup costs
   * line the fact names and line 19 (smallEmployerPlan.ts). No California text
   * names this credit, so California starts from the reduced amounts
   * (federal/8881/QUESTIONS.md item 2).
   */
  {
    reductionsOf: (facts) => byLine(smallEmployerPlanReductions(facts)),
    californiaAddsBack: false,
  },
  /*
   * Form 8882 line 7 comes off where the business has the expenditures: "You
   * must reduce: The basis of any qualified childcare facility by the amount of
   * the credit on line 7 allocable to capital expenditures ... Any otherwise
   * allowable deductions used to figure the credit by the amount of the credit
   * on line 7 allocable to those deductions" (irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01):
   * a Schedule C expense line, a Part V expense, or the cost of a 2025 asset,
   * which is its basis for depreciation on Form 4562 (column (c),
   * irs-4562-inst-2025::sec::section-b::b08). No California text names this
   * credit (federal/8882/QUESTIONS.md item 8).
   */
  { reductionsOf: childcareCreditReductions, californiaAddsBack: false },
  /*
   * Form 8820 without the reduced credit election: "reduce your otherwise
   * allowable deduction for qualified clinical testing expenses by the amount
   * of the credit" (irs-8820-form-2025::sec::line-2a::b02), on the lines that
   * hold the expenses as the credits above left them (federal/8820/reduction.ts).
   * California gives it back (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b08).
   */
  { reductionsOf: orphanDrugReductions, californiaAddsBack: true },
  /*
   * Line 14: "You must reduce your line 14 deduction by the amount of any
   * credit for small employer health insurance premiums determined on Form
   * 8941" (irs-1040sc-inst-2025::sec::line-14::b01): Form 8941 line 12 of the
   * business the fact names (federal/8941/figures.ts). California gives it
   * back: "For California purposes, the full amount of insurance is deductible"
   * (ftb-pub-1001-2025::sec::small-employer-health::b01), on line 3 column B
   * (::enter-on-schedule-ca-540-part-i-or-10::b01).
   */
  {
    reductionsOf: onLine("employeeBenefitPrograms", (facts, joint) =>
      healthCreditReductions(facts, joint, "business"),
    ),
    californiaAddsBack: true,
  },
  /*
   * Form 6765 without the reduced credit election: the research expenses the
   * business deducts go down by line 28, on the lines the credits above left
   * (federal/6765/reduction.ts), Form 8820's among them, so it is last. California is a named gap on
   * Schedule CA line 3, not an add-back (CA_RESEARCH_GAP).
   */
  { reductionsOf: researchReductions, californiaAddsBack: false },
];

type Business = { key: string; value: BusinessFactValue };

/*
 * The research business's expenses less Form 6765 line 28; undefined with no
 * reduction, placed undefined when the business is not on the return or its
 * clinical testing may be in the research expenses (federal/8820/coordination.ts).
 */
function researchPlacement(
  businesses: ReadonlyArray<Business>,
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
) {
  const fact = readResearchCreditFact(facts).fact;
  if (fact === undefined) return undefined;
  const reduction = deductionReductionOf(fact.value);
  if (reduction === undefined) return undefined;
  const { businessKey, expenses, businessComponents } = fact.value;
  const business = businesses.find((each) => each.key === businessKey);
  if (business === undefined || clinicalAndResearchOverlapGap(facts, joint) !== undefined)
    return { businessKey, reduction, placed: undefined };
  const paid = paidByCategory(expenses, businessComponents);
  const placed = placeReduction(business.value.expenses, reduction, paid);
  return { businessKey, reduction, placed, before: business.value.expenses };
}

/* Line 28 on each Schedule C line it uses; none while the reduction does not fit (a gap on line 28). */
function researchReductions(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
  businesses: ReadonlyArray<Business>,
): ReductionsByBusiness {
  const placement = researchPlacement(businesses, facts, joint);
  const placed = placement?.placed;
  if (placement === undefined || placed === undefined || placed.left > 0) return new Map();
  const reductions = REDUCTION_ORDER.map(({ line }) => ({
    line,
    amount: sum(placement.before?.[line]) - sum(placed.expenses[line]),
  }));
  return new Map([[placement.businessKey, reductions.filter((each) => each.amount !== 0)]]);
}

/* The business less one reduction, never below 0, and the dollars it took; a line it does not state has nothing to lower. */
function lessOne(value: BusinessFactValue, reduction: BusinessCreditReduction) {
  if ("line" in reduction) {
    const stated = value.expenses?.[reduction.line];
    if (stated === undefined) return { value, taken: 0 };
    const lowered = atLeast(0, stated - reduction.amount);
    const expenses = { ...value.expenses, [reduction.line]: lowered };
    return { value: { ...value, expenses }, taken: stated - lowered };
  }
  if ("asset" in reduction) return lessOnAsset(value, reduction);
  const entries = value.otherExpenses ?? [];
  const at = entries.findIndex((entry) => entry.description === reduction.otherExpense);
  if (at < 0) return { value, taken: 0 };
  const lowered = atLeast(0, entries[at].amount - reduction.amount);
  const otherExpenses = entries.map((entry, index) =>
    index === at ? { ...entry, amount: lowered } : entry,
  );
  return { value: { ...value, otherExpenses }, taken: entries[at].amount - lowered };
}

/* The business with the cost of its first 2025 asset of the description lowered, and the dollars taken. */
function lessOnAsset(value: BusinessFactValue, reduction: { asset: string; amount: number }) {
  const assets = value.depreciation?.assets ?? [];
  const at = assets.findIndex((asset) => asset.description === reduction.asset);
  if (value.depreciation === undefined || at < 0) return { value, taken: 0 };
  const cost = atLeast(0, assets[at].cost - reduction.amount);
  const lowered = assets.map((asset, index) => (index === at ? { ...asset, cost } : asset));
  const depreciation = { ...value.depreciation, assets: lowered };
  return { value: { ...value, depreciation }, taken: assets[at].cost - cost };
}

function lessAll<T extends Business>(
  business: T,
  reductions: ReadonlyArray<BusinessCreditReduction>,
) {
  return reductions.reduce(
    (state, reduction) => {
      if (reduction.amount === 0) return state;
      const next = lessOne(state.business.value, reduction);
      return {
        business: { ...state.business, value: next.value },
        taken: sum(state.taken, next.taken),
      };
    },
    { business, taken: 0 },
  );
}

/*
 * Each business with its stated expenses less the credits that lower them, in
 * the list's order, and the dollars that the credits California gives back
 * took off. The credits of one line add, and the line is never below 0, so no
 * dollar of the line is taken off twice.
 */
function withCredits<T extends Business>(
  businesses: T[],
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
  credits: ReadonlyArray<CreditReduction> = BUSINESS_CREDIT_REDUCTIONS,
): { businesses: T[]; addBack: number } {
  return credits.reduce(
    (state, { reductionsOf, californiaAddsBack }) => {
      const byBusiness = reductionsOf(facts, joint, state.businesses);
      if (byBusiness.size === 0) return state;
      const lowered = state.businesses.map((business) =>
        lessAll(business, byBusiness.get(business.key) ?? []),
      );
      const taken = californiaAddsBack ? sum(...lowered.map((each) => each.taken)) : 0;
      return {
        businesses: lowered.map((each) => each.business),
        addBack: sum(state.addBack, taken),
      };
    },
    { businesses, addBack: 0 },
  );
}

/*
 * The Schedule C expenses the federal credits that California gives back took
 * off, in total over the return's businesses: what Schedule CA line 3 column B
 * gives back (state/ca/schedule-ca/answerLines.ts).
 */
export function businessCreditAddBack(facts: ReadonlyArray<FactRow>, joint: boolean): number {
  return withCredits(statedBusinessesOnReturn(facts, joint).businesses, facts, joint).addBack;
}

/* The stated businesses as the credits before the one of reductionsOf in the list leave them. */
function businessesBefore(
  reductionsOf: CreditReduction["reductionsOf"],
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
) {
  const at = BUSINESS_CREDIT_REDUCTIONS.findIndex((each) => each.reductionsOf === reductionsOf);
  const before = BUSINESS_CREDIT_REDUCTIONS.slice(0, at);
  return withCredits(statedBusinessesOnReturn(facts, joint).businesses, facts, joint, before)
    .businesses;
}

/* Form 6765 line 28's reduction on the research business after the other credits, for the form's gap: undefined with no reduction. */
export function researchCreditPlacement(facts: ReadonlyArray<FactRow>, joint: boolean) {
  return researchPlacement(businessesBefore(researchReductions, facts, joint), facts, joint);
}

/* Form 8820's figures, its reduction placed on the business as the credits before it left it. */
export function orphanDrugCreditFigures(facts: ReadonlyArray<FactRow>, joint: boolean) {
  return orphanDrugFigures(facts, joint, businessesBefore(orphanDrugReductions, facts, joint));
}

/* The research expenses line 28 takes off the business's Schedule C lines (Schedule CA line 3 gap); 0 with none. */
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
 * Part IV recapture and its expenses less the credits that lower them.
 */
export function businessesOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedBusinessesOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  const businesses = withRecapture(marked(result.businesses, shared), facts, joint);
  return { ...result, businesses: withCredits(businesses, facts, joint).businesses };
}

/* statedRentalsOnReturn, with the return's depreciation scope. */
export function rentalsOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedRentalsOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  return { ...result, properties: marked(result.properties, shared) };
}
