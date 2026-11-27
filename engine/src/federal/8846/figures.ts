/*
 * Form 8846 from the tip credit facts (facts/kinds/tipCredit.ts): lines 1 to
 * 4 for the return, and each business's part of line 4. The part reduces that
 * business's deduction for employer taxes (Schedule C line 23,
 * facts/kinds/activitiesOnReturn.ts) and is its Form 3800 line 4f source
 * (form3800.ts). This file reads only facts, so the facts layer can call it.
 */

import { statedBusinessesOnReturn, type BusinessFactValue } from "../../facts/kinds/business.js";
import { readTipCreditFacts, type TipCreditFact } from "../../facts/kinds/tipCredit.js";
import { prorateDollars, roundDollars, sum } from "../../money.js";
import {
  BEAUTY_SERVICE_RATE,
  FOOD_OR_BEVERAGE_RATE,
  creditLines,
  line4Unrounded,
  nonCreditableTipsOfMonth,
  type CreditLines,
} from "./lines.js";

type FactRow = { key: string; value: unknown; category: string };

/* One business's tip credit on this return. */
export interface TipCreditOfBusiness {
  /* The tip credit fact. */
  key: string;
  businessKey: string;
  business: BusinessFactValue;
  /* Its whole-dollar part of line 4; undefined while the form waits or has a gap. */
  share?: number;
}

export interface TipCreditFigures {
  /* The tip credit facts claimed on this return, in the order recorded. */
  factKeys: string[];
  /* Those with their business, in the same order. */
  credits: TipCreditOfBusiness[];
  /* The line 4 box: a tipped employee passed the wage base. */
  overWageBase: boolean;
  /* Lines 1 to 4; undefined while an answer is missing or a gap stops them. */
  lines?: CreditLines;
  /* Why the engine cannot figure line 4. */
  gap?: string;
  /* Tip credit facts that still wait on an answer. */
  missing: string[];
  /* Tip credit facts whose shape is wrong: Cade records them again. */
  malformedKeys: string[];
}

const rateOf = (fact: TipCreditFact) =>
  fact.value.kind === "beauty_service" ? BEAUTY_SERVICE_RATE : FOOD_OR_BEVERAGE_RATE;

/* Line 2 for one business: every listed employee month, cents kept (irs-8846-form-2025::sec::line-2::b01). */
export function nonCreditableTipsOf(fact: TipCreditFact): number {
  return sum(
    ...fact.value.belowRateMonths.map((month) => nonCreditableTipsOfMonth(month, rateOf(fact))),
  );
}

const medicareOnlyOf = (fact: TipCreditFact) =>
  fact.value.employeeOverWageBase ? (fact.value.tipsSubjectOnlyToMedicare ?? 0) : 0;

/* Why one business's amounts cannot be figured; undefined when they can. */
function factGap(fact: TipCreditFact, business: BusinessFactValue | undefined): string | undefined {
  const { value } = fact;
  if (business === undefined) {
    return `The tip credit ${fact.key} names ${value.businessKey}, which is not a Schedule C business on this return: the credit reduces that business's deduction for the employer taxes (irs-1040sc-inst-2025::sec::line-23::b01).`;
  }
  const monthTips = sum(...value.belowRateMonths.map((month) => month.tips));
  if (roundDollars(monthTips) > roundDollars(value.tipsReceived)) {
    return `The tips of the months listed for ${fact.key} are more than its line 1 tips: each month's tips are part of line 1 (irs-8846-form-2025::sec::line-2::b01).`;
  }
  const creditable = value.tipsReceived - nonCreditableTipsOf(fact);
  if (roundDollars(medicareOnlyOf(fact)) > roundDollars(creditable)) {
    return `The tips subject only to the Medicare tax for ${fact.key} are more than its creditable tips (line 3, irs-8846-form-2025::sec::line-4::b01).`;
  }
  return undefined;
}

/* Why a business's part of line 4 cannot come off its stated taxes; undefined when it can. */
function taxesGap(credit: TipCreditOfBusiness): string | undefined {
  const taxes = credit.business.expenses?.taxesAndLicenses ?? 0;
  if ((credit.share ?? 0) <= roundDollars(taxes)) return undefined;
  return `The credit of ${credit.businessKey} ($${credit.share}) is more than its stated taxes and licenses ($${roundDollars(taxes)}), which hold the employer social security and Medicare taxes the credit reduces (irs-1040sc-inst-2025::sec::line-23::b01).`;
}

const claimed = (fact: TipCreditFact) => fact.value.electNotToClaim !== true;

/*
 * The figures of the return. A credit of a spouse's business on a separate
 * return is not on this return, like the business. Each business's part of
 * line 4 is line 4 prorated by its own credit, so the parts add to line 4.
 */
export function tipCreditFigures(facts: ReadonlyArray<FactRow>, joint: boolean): TipCreditFigures {
  const { credits: all, malformedKeys } = readTipCreditFacts(facts);
  const { businesses, spouseKeys } = statedBusinessesOnReturn(facts, joint);
  const onReturn = all.filter(
    (fact) => claimed(fact) && !spouseKeys.includes(fact.value.businessKey),
  );
  const businessOf = (fact: TipCreditFact) =>
    businesses.find((each) => each.key === fact.value.businessKey)?.value;
  const missing = onReturn
    .filter((fact) => fact.value.employeeOverWageBase)
    .filter((fact) => fact.value.tipsSubjectOnlyToMedicare === undefined)
    .map((fact) => fact.key);
  const base = {
    factKeys: onReturn.map((fact) => fact.key),
    overWageBase: onReturn.some((fact) => fact.value.employeeOverWageBase),
    missing,
    malformedKeys,
  };
  const credits = onReturn.flatMap((fact) => {
    const business = businessOf(fact);
    return business ? [{ key: fact.key, businessKey: fact.value.businessKey, business }] : [];
  });
  const gap = onReturn.map((fact) => factGap(fact, businessOf(fact))).find(Boolean);
  if (gap !== undefined) return { ...base, credits, gap };
  if (missing.length > 0) return { ...base, credits };
  const lines = creditLines(
    sum(...onReturn.map((fact) => fact.value.tipsReceived)),
    sum(...onReturn.map(nonCreditableTipsOf)),
    sum(...onReturn.map(medicareOnlyOf)),
  );
  const own = onReturn.map((fact) =>
    line4Unrounded(fact.value.tipsReceived - nonCreditableTipsOf(fact), medicareOnlyOf(fact)),
  );
  const shares = prorateDollars(lines.line4, own);
  const withShares = credits.map((credit, index) => ({ ...credit, share: shares[index] }));
  const taxes = withShares.map(taxesGap).find(Boolean);
  if (taxes !== undefined) return { ...base, credits, gap: taxes };
  return { ...base, credits: withShares, lines };
}

/*
 * Schedule C line 23 of each business: "Social security and Medicare taxes
 * paid to match required withholding from your employees' wages. Reduce your
 * deduction by the amount shown on Form 8846, line 4"
 * (irs-1040sc-inst-2025::sec::line-23::b01; irs-8846-form-2025::sec::line-4::b01).
 * The reduction by business key; empty while Form 8846 waits or has a gap.
 */
export function tipCreditReductions(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): Map<string, number> {
  const figures = tipCreditFigures(facts, joint);
  const out = new Map<string, number>();
  if (figures.lines === undefined) return out;
  for (const credit of figures.credits) {
    out.set(credit.businessKey, sum(out.get(credit.businessKey), credit.share));
  }
  return out;
}
