/*
 * The businesses and rentals on this return, with the return's depreciation
 * scope added. The mid-quarter test (irs-4562-inst-2025::sec::recovery-period-for-most-property::b02)
 * counts all the personal property the return places in service in 2025, in
 * every activity. When two or more activities place it in service, each
 * activity's depreciation is marked personalPropertyInOtherActivities, and
 * Form 4562 reports the test as a gap (federal/4562/lines.ts).
 */

import { orphanDrugReductionOn } from "../../federal/8820/figures.js";
import { REDUCTION_ORDER, type ReducedExpenseLine } from "../../federal/8820/reduction.js";
import { tipCreditReductions } from "../../federal/8846/figures.js";
import { atLeast, sum } from "../../money.js";
import { statedBusinessesOnReturn, type BusinessFactValue } from "./business.js";
import { placesPersonalProperty, type ScopedDepreciation } from "./depreciation.js";
import { empowermentZoneFigures } from "./empowermentZone.js";
import { statedRentalsOnReturn, type RentalFactValue } from "./rental.js";
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

type ReducedLine = "taxesAndLicenses" | ReducedExpenseLine;

/* The lines a credit can lower, in the order of BusinessExpenses. */
const REDUCED_LINES: ReadonlyArray<ReducedLine> = [
  "contractLabor",
  "rentVehiclesMachinery",
  "supplies",
  "taxesAndLicenses",
  "wages",
];

interface CreditReduction {
  line: ReducedLine;
  /* Each business's credit, by fact key. */
  creditByBusiness: (facts: ReadonlyArray<FactRow>, joint: boolean) => ReadonlyMap<string, number>;
}

/*
 * The credits of the taxpayer's own employees that lower a Schedule C expense
 * line. A new credit form adds one entry. A credit from a K-1 is not here: "Do
 * not reduce your deduction for any portion of a credit that was passed
 * through to you from a pass-through entity" (irs-1040sc-inst-2025::sec::line-26::b01).
 */
const BUSINESS_CREDIT_REDUCTIONS: ReadonlyArray<CreditReduction> = [
  /*
   * Line 26: "Enter the total salaries and wages for the tax year reduced by
   * the amount of the following credit(s) ... Work Opportunity Credit (Form
   * 5884). Empowerment Zone Employment Credit (Form 8844)" (line-26::b01): Form
   * 5884 line 2 of the business's targeted group employees (workOpportunity.ts)
   * and the business's share of Form 8844 line 2 (empowermentZone.ts).
   */
  { line: "wages", creditByBusiness: (facts) => workOpportunityCreditByActivity(facts) },
  {
    line: "wages",
    creditByBusiness: (facts, joint) => empowermentZoneFigures(facts, joint).creditByEmployer,
  },
  /*
   * Line 23: "Reduce your deduction by the amount shown on Form 8846, line 4"
   * (irs-1040sc-inst-2025::sec::line-23::b01). The stated taxesAndLicenses hold
   * the employer taxes before the credit.
   */
  { line: "taxesAndLicenses", creditByBusiness: tipCreditReductions },
  /*
   * Form 8820 without the reduced credit election: "reduce your otherwise
   * allowable deduction for qualified clinical testing expenses by the amount
   * of the credit" (irs-8820-form-2025::sec::line-2a::b02), placed on the
   * lines that hold the expenses (federal/8820/reduction.ts).
   */
  ...REDUCTION_ORDER.map(({ line }) => ({ line, creditByBusiness: orphanDrugReductionOn(line) })),
];

/*
 * Each business with its stated lines less the credits that lower them. The
 * credits of one line add, and the line is never below 0, so no dollar of the
 * line is taken off twice. A line the business does not state stays blank.
 */
function withCredits<T extends { key: string; value: BusinessFactValue }>(
  businesses: T[],
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): T[] {
  const reductions = BUSINESS_CREDIT_REDUCTIONS.map(({ line, creditByBusiness }) => ({
    line,
    credits: creditByBusiness(facts, joint),
  }));
  if (reductions.every(({ credits }) => credits.size === 0)) return businesses;
  const creditOf = (key: string, line: ReducedLine) =>
    sum(...reductions.filter((each) => each.line === line).map((each) => each.credits.get(key)));
  return businesses.map((business) => {
    const expenses = business.value.expenses;
    const reduced = REDUCED_LINES.flatMap((line) => {
      const stated = expenses?.[line];
      const credit = creditOf(business.key, line);
      return stated === undefined || credit === 0
        ? []
        : [[line, atLeast(0, stated - credit)] as const];
    });
    if (reduced.length === 0) return business;
    const lowered = { ...expenses, ...Object.fromEntries(reduced) };
    return { ...business, value: { ...business.value, expenses: lowered } };
  });
}

/*
 * The Schedule C expenses the federal credits take off that California gives
 * back, in total over the return's businesses: what Schedule CA line 3 column
 * B adds (state/ca/schedule-ca/answerLines.ts). These are the wages of the work
 * opportunity and empowerment zone credits, and every line the orphan drug
 * credit lowers (wages, supplies, machinery rent, contract labor). Form 8846's
 * line 23 reduction is not given back.
 */
const GIVEN_BACK_LINES = REDUCED_LINES.filter((line) => line !== "taxesAndLicenses");

export function wageCreditReduction(facts: ReadonlyArray<FactRow>, joint: boolean): number {
  const stated = statedBusinessesOnReturn(facts, joint).businesses;
  const reduced = withCredits(stated, facts, joint);
  const lowered = (line: ReducedLine) =>
    sum(
      ...stated.map(
        (business, index) =>
          sum(business.value.expenses?.[line]) - sum(reduced[index].value.expenses?.[line]),
      ),
    );
  return sum(...GIVEN_BACK_LINES.map(lowered));
}

/*
 * statedBusinessesOnReturn, with the return's depreciation scope, its Form 4797
 * Part IV recapture and its expense lines less the credits that lower them.
 */
export function businessesOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedBusinessesOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  const businesses = withRecapture(marked(result.businesses, shared), facts);
  return { ...result, businesses: withCredits(businesses, facts, joint) };
}

/* statedRentalsOnReturn, with the return's depreciation scope. */
export function rentalsOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedRentalsOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  return { ...result, properties: marked(result.properties, shared) };
}
