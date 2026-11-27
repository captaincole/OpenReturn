/*
 * The businesses and rentals on this return, with the return's depreciation
 * scope added. The mid-quarter test (irs-4562-inst-2025::sec::recovery-period-for-most-property::b02)
 * counts all the personal property the return places in service in 2025, in
 * every activity. When two or more activities place it in service, each
 * activity's depreciation is marked personalPropertyInOtherActivities, and
 * Form 4562 reports the test as a gap (federal/4562/lines.ts).
 */

import { disabledAccessReductions } from "../../federal/8826/figures.js";
import { tipCreditReductions } from "../../federal/8846/figures.js";
import { atLeast, sum } from "../../money.js";
import {
  statedBusinessesOnReturn,
  type BusinessExpenses,
  type BusinessFactValue,
} from "./business.js";
import { placesPersonalProperty, type ScopedDepreciation } from "./depreciation.js";
import { empowermentZoneFigures } from "./empowermentZone.js";
import { statedRentalsOnReturn, type RentalFactValue } from "./rental.js";
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
 * One amount a credit takes off one business: a Schedule C expense line, or a
 * Part V entry by its description (the first entry with it).
 */
export type BusinessCreditReduction =
  { line: keyof BusinessExpenses; amount: number } | { otherExpense: string; amount: number };

type ReductionsByBusiness = ReadonlyMap<string, ReadonlyArray<BusinessCreditReduction>>;

interface CreditReduction {
  /* Each business's reductions, by fact key. */
  reductionsOf: (facts: ReadonlyArray<FactRow>, joint: boolean) => ReductionsByBusiness;
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
];

type Business = { key: string; value: BusinessFactValue };

/* The business less one reduction, never below 0, and the dollars it took; a line it does not state has nothing to lower. */
function lessOne(value: BusinessFactValue, reduction: BusinessCreditReduction) {
  if ("line" in reduction) {
    const stated = value.expenses?.[reduction.line];
    if (stated === undefined) return { value, taken: 0 };
    const lowered = atLeast(0, stated - reduction.amount);
    const expenses = { ...value.expenses, [reduction.line]: lowered };
    return { value: { ...value, expenses }, taken: stated - lowered };
  }
  const entries = value.otherExpenses ?? [];
  const at = entries.findIndex((entry) => entry.description === reduction.otherExpense);
  if (at < 0) return { value, taken: 0 };
  const lowered = atLeast(0, entries[at].amount - reduction.amount);
  const otherExpenses = entries.map((entry, index) =>
    index === at ? { ...entry, amount: lowered } : entry,
  );
  return { value: { ...value, otherExpenses }, taken: entries[at].amount - lowered };
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
): { businesses: T[]; addBack: number } {
  return BUSINESS_CREDIT_REDUCTIONS.reduce(
    (state, { reductionsOf, californiaAddsBack }) => {
      const byBusiness = reductionsOf(facts, joint);
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

/*
 * statedBusinessesOnReturn, with the return's depreciation scope, its Form 4797
 * Part IV recapture and its expenses less the credits that lower them.
 */
export function businessesOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedBusinessesOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  const businesses = withRecapture(marked(result.businesses, shared), facts);
  return { ...result, businesses: withCredits(businesses, facts, joint).businesses };
}

/* statedRentalsOnReturn, with the return's depreciation scope. */
export function rentalsOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedRentalsOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  return { ...result, properties: marked(result.properties, shared) };
}
