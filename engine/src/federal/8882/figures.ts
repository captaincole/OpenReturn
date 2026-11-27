/*
 * Form 8882 from the expenditure facts (facts/kinds/childcareCredit.ts):
 * lines 1 to 4 for the return, and each expenditure's part of line 7. The part
 * comes off the place the business deducts or depreciates the amount
 * (facts/kinds/activitiesOnReturn.ts), and the own credit is the Form 3800
 * line 1k source (form3800.ts). This file reads only facts, so the facts
 * layer can call it.
 */

import { statedBusinessesOnReturn, type BusinessFactValue } from "../../facts/kinds/business.js";
import {
  readChildcareExpenditureFacts,
  type ChildcareExpenditureFact,
} from "../../facts/kinds/childcareCredit.js";
import { workOpportunityCreditByActivity } from "../../facts/kinds/workOpportunity.js";
import { sum } from "../../money.js";
import { tipCreditReductions } from "../8846/figures.js";
import { line7Shares, ownLines, type ExpenditureLine, type OwnLines } from "./lines.js";
import { assetGap, deductionGap, placeOf } from "./places.js";

type FactRow = { key: string; value: unknown; category: string };

/* One expenditure on this return, with its business and its whole-dollar part of line 7. */
export interface ExpenditureOnReturn extends ChildcareExpenditureFact {
  business: BusinessFactValue;
  share: number;
}

export interface ChildcareCreditFigures {
  /* The expenditure facts on this return, in the order recorded. */
  factKeys: string[];
  /* With their shares; empty while a gap stops the form. */
  expenditures: ExpenditureOnReturn[];
  /* Lines 1 to 4; undefined with no expenditure or with a gap. */
  lines?: OwnLines;
  /* Why the engine cannot figure lines 1 to 4 and their reductions. */
  gap?: string;
  /* Expenditure facts whose shape is wrong: Cade records them again. */
  malformedKeys: string[];
}

export const lineOf = (fact: ChildcareExpenditureFact): ExpenditureLine =>
  fact.value.kind === "resource_and_referral" ? "resource_and_referral" : "facility";

const NOT_A_BUSINESS = (fact: ChildcareExpenditureFact) =>
  `The childcare expenditure ${fact.key} names ${fact.value.businessKey}, which is not a Schedule C business on this return: the credit lowers the deduction or the basis on the schedule that holds the amount (irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01), and the engine lowers only a Schedule C business's.`;

/* The credits Form 5884 and Form 8846 already take off a business's wages and taxes. */
function otherCredits(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const wages = workOpportunityCreditByActivity(facts);
  const taxes = tipCreditReductions(facts, joint);
  return (businessKey: string, line: string): number => {
    if (line === "wages") return wages.get(businessKey) ?? 0;
    if (line === "taxesAndLicenses") return taxes.get(businessKey) ?? 0;
    return 0;
  };
}

/* Why the shares cannot come off their places; undefined when they can. */
function reductionGap(
  expenditures: ExpenditureOnReturn[],
  taken: (businessKey: string, line: string) => number,
): string | undefined {
  const byPlace = new Map<string, ExpenditureOnReturn[]>();
  for (const each of expenditures) {
    const place = placeOf(each);
    byPlace.set(place, [...(byPlace.get(place) ?? []), each]);
  }
  for (const group of byPlace.values()) {
    const total = sum(...group.map((each) => each.share));
    const found =
      group[0].value.kind === "facility_property"
        ? assetGap(group[0], total)
        : deductionGap(group[0], total, taken);
    if (found !== undefined) return found;
  }
  return undefined;
}

/*
 * The figures of the return. An expenditure of a spouse's business on a
 * separate return is not on this return, like the business.
 */
export function childcareCreditFigures(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): ChildcareCreditFigures {
  const { expenditures: all, malformedKeys } = readChildcareExpenditureFacts(facts);
  const { businesses, spouseKeys } = statedBusinessesOnReturn(facts, joint);
  const onReturn = all.filter((fact) => !spouseKeys.includes(fact.value.businessKey));
  const base = {
    factKeys: onReturn.map((fact) => fact.key),
    expenditures: [],
    malformedKeys,
  };
  // A malformed fact is part of line 1 or 3 too: the lines and the reductions wait until it is recorded again.
  if (onReturn.length === 0 || malformedKeys.length > 0) return base;
  const businessOf = (fact: ChildcareExpenditureFact) =>
    businesses.find((each) => each.key === fact.value.businessKey)?.value;
  const unplaced = onReturn.find((fact) => businessOf(fact) === undefined);
  if (unplaced !== undefined) return { ...base, gap: NOT_A_BUSINESS(unplaced) };
  const amountsOf = (line: ExpenditureLine) =>
    onReturn.filter((fact) => lineOf(fact) === line).map((fact) => fact.value.amount);
  const lines = ownLines(amountsOf("facility"), amountsOf("resource_and_referral"));
  const shares = line7Shares(
    lines,
    onReturn.map((fact) => ({ line: lineOf(fact), amount: fact.value.amount })),
  );
  const expenditures = onReturn.map((fact, index) => ({
    ...fact,
    business: businessOf(fact) as BusinessFactValue,
    share: shares[index],
  }));
  const gap = reductionGap(expenditures, otherCredits(facts, joint));
  if (gap !== undefined) return { ...base, gap };
  return { ...base, expenditures, lines };
}

/* What the credit takes off one business: expense lines, Part V expenses and 2025 assets, by name. */
export interface ChildcareReductions {
  expenses: Map<string, number>;
  otherExpenses: Map<string, number>;
  assets: Map<string, number>;
}

const add = (map: Map<string, number>, name: string, amount: number) =>
  map.set(name, sum(map.get(name), amount));

/*
 * Each business's reductions: "You must reduce: The basis of any qualified
 * childcare facility by the amount of the credit on line 7 allocable to
 * capital expenditures related to the facility, Any otherwise allowable
 * deductions used to figure the credit by the amount of the credit on line 7
 * allocable to those deductions" (irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01).
 * Empty while Form 8882 has a gap. Property not placed in service in 2025 has
 * no 2025 depreciation to lower.
 */
export function childcareCreditReductions(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): Map<string, ChildcareReductions> {
  const out = new Map<string, ChildcareReductions>();
  for (const each of childcareCreditFigures(facts, joint).expenditures) {
    const reductions = out.get(each.value.businessKey) ?? {
      expenses: new Map(),
      otherExpenses: new Map(),
      assets: new Map(),
    };
    const { asset, deductedOn, otherExpense } = each.value;
    if (asset !== undefined) add(reductions.assets, asset, each.share);
    else if (otherExpense !== undefined) add(reductions.otherExpenses, otherExpense, each.share);
    else if (deductedOn !== undefined) add(reductions.expenses, deductedOn, each.share);
    out.set(each.value.businessKey, reductions);
  }
  return out;
}
