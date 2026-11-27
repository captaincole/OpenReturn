/*
 * Form 8882 from the expenditure facts (facts/kinds/childcareCredit.ts):
 * lines 1 to 4 for the return, and each expenditure's part of line 7. The part
 * comes off the place the business deducts or depreciates the amount
 * (facts/kinds/activitiesOnReturn.ts), and the own credit is the Form 3800
 * line 1k source (form3800.ts). This file reads only facts, so the facts
 * layer can call it.
 */

import type { BusinessCreditReduction } from "../../facts/kinds/activitiesOnReturn.js";
import { statedBusinessesOnReturn, type BusinessFactValue } from "../../facts/kinds/business.js";
import {
  OTHER_EXPENSE,
  readChildcareExpenditureFacts,
  type ChildcareExpenditureFact,
} from "../../facts/kinds/childcareCredit.js";
import { empowermentZoneFigures } from "../../facts/kinds/empowermentZone.js";
import { smallEmployerPlanReductions } from "../../facts/kinds/smallEmployerPlan.js";
import { workOpportunityCreditByActivity } from "../../facts/kinds/workOpportunity.js";
import { sum } from "../../money.js";
import { disabledAccessReductions } from "../8826/figures.js";
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

/*
 * What the credits before Form 8882 in BUSINESS_CREDIT_REDUCTIONS
 * (facts/kinds/activitiesOnReturn.ts) take off a business's expense line:
 * Forms 5884 and 8844 on wages, Form 8846 on taxes, Forms 8826 and 8881 on the
 * lines their facts name.
 */
function otherCredits(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const wages = [
    workOpportunityCreditByActivity(facts),
    empowermentZoneFigures(facts, joint).creditByEmployer,
  ];
  const taxes = tipCreditReductions(facts, joint);
  const access = disabledAccessReductions(facts, joint);
  const plan = smallEmployerPlanReductions(facts);
  return (businessKey: string, line: string): number =>
    sum(
      ...(line === "wages" ? wages.map((byBusiness) => byBusiness.get(businessKey)) : []),
      line === "taxesAndLicenses" ? taxes.get(businessKey) : 0,
      ...(access.get(businessKey) ?? []).map((each) =>
        "line" in each && each.line === line ? each.amount : 0,
      ),
      plan.get(businessKey)?.[line],
    );
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
): Map<string, BusinessCreditReduction[]> {
  const out = new Map<string, BusinessCreditReduction[]>();
  for (const each of childcareCreditFigures(facts, joint).expenditures) {
    const reduction = reductionOf(each.value, each.share);
    const { businessKey } = each.value;
    if (reduction) out.set(businessKey, [...(out.get(businessKey) ?? []), reduction]);
  }
  return out;
}

/* Where one expenditure's part comes off; property not placed in service in 2025 has none. */
function reductionOf(
  { asset, deductedOn, otherExpense }: ChildcareExpenditureFact["value"],
  amount: number,
): BusinessCreditReduction | undefined {
  if (asset !== undefined) return { asset, amount };
  if (otherExpense !== undefined) return { otherExpense, amount };
  if (deductedOn === undefined || deductedOn === OTHER_EXPENSE) return undefined;
  return { line: deductedOn, amount };
}
