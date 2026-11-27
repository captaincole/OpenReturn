/*
 * Form 8826 from the disabled access facts (facts/kinds/disabledAccess.ts):
 * the eligible small business test, lines 1 to 6 for the return, and each
 * business's part of line 6. The part reduces that business's deduction for
 * the expenditures (facts/kinds/activitiesOnReturn.ts) and is its Form 3800
 * line 1e source (form3800.ts). This file reads only facts, so the facts layer
 * can call it.
 */

import type { BusinessCreditReduction } from "../../facts/kinds/activitiesOnReturn.js";
import { statedBusinessesOnReturn, type BusinessFactValue } from "../../facts/kinds/business.js";
import {
  DISABLED_ACCESS_KEYS,
  readDisabledAccessFacts,
  readDisabledAccessPriorYear,
  type DisabledAccessDeductedOn,
  type DisabledAccessFact,
} from "../../facts/kinds/disabledAccess.js";
import { prorateDollars, roundDollars, sum } from "../../money.js";
import { creditLines, eligibleSmallBusiness, type CreditLines } from "./lines.js";

type FactRow = { key: string; value: unknown; category: string };

/* One business's disabled access expenditures on this return. */
export interface DisabledAccessOfBusiness {
  /* The disabled access fact. */
  key: string;
  businessKey: string;
  business: BusinessFactValue;
  deductedOn: DisabledAccessDeductedOn;
  /* The Part V entry's description, when deductedOn is "otherExpenses". */
  otherExpense?: string;
  /* Its whole-dollar part of line 6; undefined while the form waits or has a gap. */
  share?: number;
}

export interface DisabledAccessFigures {
  /* The disabled access facts on this return, in the order recorded. */
  factKeys: string[];
  /* Those with their business, in the same order. */
  credits: DisabledAccessOfBusiness[];
  /* The eligible small business test; undefined while an answer is missing. */
  eligible?: boolean;
  /* Lines 1 to 6; undefined while an answer is missing or a gap stops them. */
  lines?: CreditLines;
  /* Why the engine cannot figure lines 1 to 6. */
  gap?: string;
  /* The prior-year answers the test still waits on. */
  missing: string[];
  /* Disabled access facts whose shape is wrong: Cade records them again. */
  malformedKeys: string[];
}

export const NOT_ELIGIBLE_GAP =
  "The business is not an eligible small business: its 2024 gross receipts were above $1,000,000 and it had more than 30 full-time employees in 2024 (irs-8826-form-2025::sec::purpose-of-form::b01), so it cannot claim the disabled access credit.";

const CAPITALIZED_GAP = (key: string) =>
  `The expenditures of ${key} were capitalized: the basis of the property is reduced by the credit (irs-8826-form-2025::sec::line-6::b01; irs-pub-551-2025::sec::deducting-vs-capitalizing-costs::b02), and the depreciation facts hold the basis as stated.`;

const GROUP_GAP = (key: string) =>
  `${key} is a member of a controlled group or of businesses under common control: line 6 is its share of the group's credit, with an attached statement (irs-8826-form-2025::sec::member-of-controlled-group-or::b01), and the facts do not hold the group's expenditures.`;

const NOT_A_BUSINESS_GAP = (fact: DisabledAccessFact) =>
  `The disabled access expenditures ${fact.key} name ${fact.value.businessKey}, which is not a Schedule C business on this return: the credit reduces that business's deduction for the expenditures (irs-8826-form-2025::sec::line-6::b01).`;

/* Why one fact's expenditures cannot be figured; undefined when they can. */
function factGap(fact: DisabledAccessFact, business: BusinessFactValue | undefined) {
  if (business === undefined) return NOT_A_BUSINESS_GAP(fact);
  if (fact.value.memberOfControlledGroup === true) return GROUP_GAP(fact.key);
  if (fact.value.deductedOn === "capitalized") return CAPITALIZED_GAP(fact.key);
  return undefined;
}

/* The first Part V entry of the business with the fact's description. */
export function namedOtherExpense(business: BusinessFactValue, description: string | undefined) {
  return (business.otherExpenses ?? []).find((entry) => entry.description === description);
}

/* The stated amount of the expense line that holds the expenditures. */
function statedExpense(credit: DisabledAccessOfBusiness): number {
  if (credit.deductedOn === "capitalized") return 0;
  if (credit.deductedOn === "otherExpenses") {
    return namedOtherExpense(credit.business, credit.otherExpense)?.amount ?? 0;
  }
  return credit.business.expenses?.[credit.deductedOn] ?? 0;
}

/* The expense line a credit comes off, as one name: the line, and the Part V entry. */
const lineOf = (credit: DisabledAccessOfBusiness) =>
  credit.deductedOn === "otherExpenses"
    ? `${credit.businessKey}|otherExpenses|${credit.otherExpense}`
    : `${credit.businessKey}|${credit.deductedOn}`;

const lineName = (credit: DisabledAccessOfBusiness) =>
  credit.deductedOn === "otherExpenses"
    ? `other expense "${credit.otherExpense}"`
    : credit.deductedOn;

/* Why the parts of line 6 cannot come off their expense lines; undefined when they can. */
function expenseGap(credits: DisabledAccessOfBusiness[]): string | undefined {
  for (const line of new Set(credits.map(lineOf))) {
    const onLine = credits.filter((credit) => lineOf(credit) === line);
    const reduction = sum(...onLine.map((credit) => credit.share));
    const stated = roundDollars(statedExpense(onLine[0]));
    if (reduction > stated) {
      return `The disabled access credit of ${onLine[0].businessKey} ($${reduction}) is more than its stated ${lineName(onLine[0])} ($${stated}), the expense line that holds the expenditures the credit reduces (irs-8826-form-2025::sec::line-6::b01).`;
    }
  }
  return undefined;
}

/* The test from the prior-year answers, and the answer it waits on. */
function eligibilityOf(facts: ReadonlyArray<FactRow>) {
  const result = eligibleSmallBusiness(readDisabledAccessPriorYear(facts));
  if (typeof result === "boolean") return { eligible: result, missing: [] };
  const key =
    result.waitsOn === "grossReceipts"
      ? DISABLED_ACCESS_KEYS.priorYearGrossReceipts
      : DISABLED_ACCESS_KEYS.priorYearFullTimeEmployees;
  return { eligible: undefined, missing: [key] };
}

/*
 * The figures of the return. Expenditures of a spouse's business on a
 * separate return are not on this return, like the business. Each business's
 * part of line 6 is line 6 prorated by its expenditures, so the parts add to
 * line 6.
 */
export function disabledAccessFigures(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): DisabledAccessFigures {
  const { expenditures: all, malformedKeys } = readDisabledAccessFacts(facts);
  const { businesses, spouseKeys } = statedBusinessesOnReturn(facts, joint);
  const onReturn = all.filter((fact) => !spouseKeys.includes(fact.value.businessKey));
  const base = { factKeys: onReturn.map((fact) => fact.key), missing: [], malformedKeys };
  if (onReturn.length === 0) return { ...base, credits: [] };
  const businessOf = (fact: DisabledAccessFact) =>
    businesses.find((each) => each.key === fact.value.businessKey)?.value;
  const credits = onReturn.flatMap((fact) => {
    const business = businessOf(fact);
    if (business === undefined) return [];
    const { businessKey, deductedOn, otherExpense } = fact.value;
    return [{ key: fact.key, businessKey, business, deductedOn, otherExpense }];
  });
  const { eligible, missing } = eligibilityOf(facts);
  const known = { ...base, credits, eligible, missing };
  if (eligible === false) return { ...known, gap: NOT_ELIGIBLE_GAP };
  const gap = onReturn.map((fact) => factGap(fact, businessOf(fact))).find(Boolean);
  if (gap !== undefined) return { ...known, gap };
  if (eligible === undefined) return known;
  const amounts = onReturn.map((fact) => fact.value.expenditures);
  const lines = creditLines(amounts);
  const shares = prorateDollars(lines.line6, amounts);
  const withShares = credits.map((credit, index) => ({ ...credit, share: shares[index] }));
  const expense = expenseGap(withShares);
  if (expense !== undefined) return { ...known, gap: expense };
  return { ...known, credits: withShares, lines };
}

/*
 * The deduction of each business, less its part of line 6: "To the extent of
 * the credit shown on line 6, the eligible access expenditures may not be
 * claimed as a deduction in figuring taxable income"
 * (irs-8826-form-2025::sec::line-6::b01). By business key and expense line;
 * empty while Form 8826 waits or has a gap. A credit from a K-1 (line 7) is
 * not taken off: the entity's own deduction carries it.
 *
 * DECISION (2026-11-27, by the author): the deduction falls by the credit, not
 * by the whole expenditures. Text A, the Schedule C instructions: "you can't
 * take both a credit (on Form 8826) and a deduction for the same expenditures"
 * (irs-1040sc-inst-2025::sec::part-v::b03); the Schedule E instructions say the
 * same (irs-1040se-inst-2025::sec::general-instructions-for-lines-5-through-21::b02).
 * Text B, Form 8826: "To the extent of the credit shown on line 6"
 * (irs-8826-form-2025::sec::line-6::b01), and Publication 551: "reduce the
 * amount you deduct or capitalize by the amount of the credit"
 * (irs-pub-551-2025::sec::deducting-vs-capitalizing-costs::b02). The engine
 * follows text B, the form's own instruction; section 44(d)(7) denies a
 * deduction for "such amount", the credit (docs/rule-decisions.md).
 */
export function disabledAccessReductions(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): Map<string, BusinessCreditReduction[]> {
  const figures = disabledAccessFigures(facts, joint);
  const out = new Map<string, BusinessCreditReduction[]>();
  if (figures.lines === undefined) return out;
  for (const line of new Set(figures.credits.map(lineOf))) {
    const onLine = figures.credits.filter((credit) => lineOf(credit) === line);
    const { businessKey, deductedOn, otherExpense } = onLine[0];
    const amount = sum(...onLine.map((credit) => credit.share));
    const reduction = reductionOf(deductedOn, otherExpense, amount);
    if (reduction) out.set(businessKey, [...(out.get(businessKey) ?? []), reduction]);
  }
  return out;
}

/* The reduction of one expense line; capitalized expenditures are a gap, so they have none. */
function reductionOf(
  deductedOn: DisabledAccessDeductedOn,
  otherExpense: string | undefined,
  amount: number,
): BusinessCreditReduction | undefined {
  if (deductedOn === "capitalized") return undefined;
  if (deductedOn === "otherExpenses") {
    return otherExpense === undefined ? undefined : { otherExpense, amount };
  }
  return { line: deductedOn, amount };
}
