/*
 * Form 8820 from the orphan drug credit fact (facts/kinds/orphanDrugCredit.ts):
 * lines 1 to 2c, Part II, and the part of line 2a that each Schedule C line of
 * the business gives up (reduction.ts). The reduction lowers the business's
 * expenses wherever the business is read: it is one entry of the list of
 * credits that lower a deduction (facts/kinds/activitiesOnReturn.ts), placed
 * on the lines as the credits before it left them. Line 2c is the business's
 * Form 3800 line 1h source (form3800.ts). This file reads only facts, so the
 * facts layer can call it.
 */

import type { BusinessCreditReduction } from "../../facts/kinds/activitiesOnReturn.js";
import { statedBusinessesOnReturn, type BusinessFactValue } from "../../facts/kinds/business.js";
import {
  DIFFERENTIAL_WAGE_SOURCE_FORM,
  differentialWageCreditOf,
} from "../../facts/kinds/differentialWage.js";
import { getGeneralBusinessCreditFacts } from "../../facts/kinds/generalBusinessCredit.js";
import {
  readOrphanDrugCreditFact,
  type OrphanDrugCreditFact,
} from "../../facts/kinds/orphanDrugCredit.js";
import { roundDollars, sum } from "../../money.js";
import { creditLines, deductionReductionOf, type CreditLines } from "./lines.js";
import { placeReduction, type PlacedReduction, type ReducedExpenseLine } from "./reduction.js";

type FactRow = { key: string; value: unknown; category: string };
type Business = { key: string; value: BusinessFactValue };

export interface OrphanDrugFigures {
  /* The fact, when its business is on this return. */
  fact?: OrphanDrugCreditFact;
  business?: BusinessFactValue;
  /* The fact's shape is wrong: Cade records it again. */
  malformed: boolean;
  /* Lines 1 to 2c; undefined while an answer is missing or a gap stops them. */
  lines?: CreditLines;
  /* The deduction the credit takes off, by Schedule C line; undefined with the election or no credit. */
  reduction?: PlacedReduction;
  /* Why the engine cannot figure the credit or its reduction. */
  gap?: string;
  /* Fact keys still waiting on an answer. */
  missing: string[];
}

/*
 * The return's own Form 8932 credit on the business's wages; undefined with
 * none. With employee facts, Form 8932 figures it (facts/kinds/differentialWage.ts):
 * line 2's part for the business, or the answers it waits on. Without them, a
 * stated credit no pass-through entity allocated. The figured credit takes
 * the place of the stated one, so line 2b is never checked against both.
 */
function ownDifferentialWageCredit(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
  businessKey: string,
): { amount?: number; waitingOn: string[] } {
  const figured = differentialWageCreditOf(facts, joint);
  if (figured !== undefined) {
    if ("waitingOn" in figured) return { waitingOn: figured.waitingOn };
    const part = figured.byActivity.get(businessKey);
    return { amount: part === undefined || part === 0 ? undefined : part, waitingOn: [] };
  }
  const own = getGeneralBusinessCreditFacts(facts).filter(
    ({ value }) =>
      value.sourceForm === DIFFERENTIAL_WAGE_SOURCE_FORM && value.passThroughEin === undefined,
  );
  return {
    amount: own.length === 0 ? undefined : sum(...own.map(({ value }) => value.amount)),
    waitingOn: [],
  };
}

/* Why line 2b cannot be placed; undefined when it can. */
function line2bGap(fact: OrphanDrugCreditFact, credit8932: number | undefined): string | undefined {
  const stated = fact.value.differentialWageCreditOnSameWages;
  if (stated === undefined || stated === 0) return undefined;
  if (credit8932 === undefined) {
    return "Line 2b is the part of the Form 8932 credit on wages also used for line 2a (irs-8820-form-2025::sec::line-2b::b01), and the return has no Form 8932 credit of its own on the business's wages.";
  }
  if (roundDollars(stated) > roundDollars(credit8932)) {
    return `Line 2b ($${roundDollars(stated)}) is more than the Form 8932 credit the return states ($${roundDollars(credit8932)}), of which it is a part (irs-8820-form-2025::sec::line-2b::b01).`;
  }
  return undefined;
}

/* The answers the fact still waits on: Part II, and line 2b when the return has a Form 8932 credit on wages. */
function missingOf(fact: OrphanDrugCreditFact, credit8932: number | undefined): string[] {
  const { value } = fact;
  const hasExpenses = sum(...Object.values(value.expenses)) > 0;
  const needsDrugs = hasExpenses && value.drugs.length === 0;
  const needs2b =
    credit8932 !== undefined &&
    (value.expenses.wages ?? 0) > 0 &&
    value.differentialWageCreditOnSameWages === undefined;
  return needsDrugs || needs2b ? [fact.key] : [];
}

const placementGap = (left: number) =>
  `The Schedule C lines that hold the clinical testing expenses (wages, supplies, machinery rent, contract labor) cannot take $${roundDollars(left)} of the line 2a reduction: each line gives up at most what the credits before this one left of it and the expenses of its kind (irs-8820-form-2025::sec::line-2a::b02; reduction.ts). Capitalized expenses reduce the capital account instead, which the engine does not figure.`;

/*
 * The figures of the return. A fact for a spouse's business on a separate
 * return is not on this return, like the business. The reduction is placed on
 * the business as placedOn holds it (the credits before Form 8820 applied);
 * without it, on the stated business.
 */
export function orphanDrugFigures(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
  placedOn?: ReadonlyArray<Business>,
): OrphanDrugFigures {
  const { fact, malformed } = readOrphanDrugCreditFact(facts);
  if (fact === undefined) return { malformed, missing: [] };
  const { businesses, spouseKeys } = statedBusinessesOnReturn(facts, joint);
  if (spouseKeys.includes(fact.value.businessKey)) return { malformed, missing: [] };
  const business = businesses.find((each) => each.key === fact.value.businessKey)?.value;
  const base = { fact, business, malformed, missing: [] as string[] };
  if (business === undefined) {
    return {
      ...base,
      gap: `The orphan drug credit names ${fact.value.businessKey}, which is not a Schedule C business on this return: the credit reduces that business's deduction for the expenses (irs-8820-form-2025::sec::line-2a::b02).`,
    };
  }
  const own8932 = ownDifferentialWageCredit(facts, joint, fact.value.businessKey);
  if (own8932.waitingOn.length > 0) return { ...base, missing: own8932.waitingOn };
  const credit8932 = own8932.amount;
  const gap = line2bGap(fact, credit8932);
  if (gap !== undefined) return { ...base, gap };
  const missing = missingOf(fact, credit8932);
  if (missing.length > 0) return { ...base, missing };
  const elected = fact.value.reducedCreditElection;
  const lines = creditLines(
    fact.value.expenses,
    elected,
    fact.value.differentialWageCreditOnSameWages,
  );
  const amount = deductionReductionOf(lines, elected);
  if (amount === 0) return { ...base, lines };
  const lowered = placedOn?.find((each) => each.key === fact.value.businessKey)?.value ?? business;
  const reduction = placeReduction(lowered.expenses, amount, fact.value.expenses);
  if (reduction.left > 0) return { ...base, gap: placementGap(reduction.left) };
  return { ...base, lines, reduction };
}

/*
 * The reduction on each Schedule C line of the business, as one entry of the
 * credits that lower a deduction (facts/kinds/activitiesOnReturn.ts), placed
 * on the business as the credits before it left it. Empty while the form
 * waits, has a gap or the election is made.
 */
export function orphanDrugReductions(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
  businesses: ReadonlyArray<Business>,
): Map<string, BusinessCreditReduction[]> {
  const figures = orphanDrugFigures(facts, joint, businesses);
  if (figures.fact === undefined || figures.reduction === undefined) return new Map();
  const byLine = Object.entries(figures.reduction.byLine) as Array<[ReducedExpenseLine, number]>;
  const reductions = byLine.map(([line, amount]) => ({ line, amount }));
  return new Map([[figures.fact.value.businessKey, reductions]]);
}
