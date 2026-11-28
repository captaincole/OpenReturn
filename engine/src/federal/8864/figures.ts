/*
 * Form 8864 lines 7 to 9 from the agri-biodiesel production facts
 * (facts/kinds/agriBiodiesel.ts), and each business's part of line 9. The part
 * is that business's Schedule C line 6 income (facts/kinds/activitiesOnReturn.ts)
 * and its Form 3800 line 1l source (form3800.ts). This file reads only facts,
 * so the facts layer can call it.
 */

import {
  k1AgriBiodieselStatements,
  readAgriBiodieselFacts,
  type AgriBiodieselProductionFact,
} from "../../facts/kinds/agriBiodiesel.js";
import { statedBusinessesOnReturn, type BusinessFactValue } from "../../facts/kinds/business.js";
import { sum } from "../../money.js";
import {
  PRODUCTIVE_CAPACITY_LIMIT_GALLONS,
  QUALIFIED_PRODUCTION_LIMIT_GALLONS,
  line9Shares,
  ownProductionLines,
  unroundedCredit,
  withinCombinedLimits,
  type OwnProductionLines,
} from "./lines.js";

type FactRow = { key: string; value: unknown; category: string };

/* One business's production on this return. */
export interface ProductionOfBusiness {
  /* The production fact. */
  key: string;
  businessKey: string;
  business: BusinessFactValue;
  fact: AgriBiodieselProductionFact["value"];
  /* Its whole-dollar part of line 9; undefined while a gap stops the lines. */
  share?: number;
}

export interface AgriBiodieselFigures {
  /* The productions of an eligible small producer, with their business, in the order recorded. */
  productions: ProductionOfBusiness[];
  /* Lines 7 to 9; undefined with no eligible production, or when a gap stops them. */
  lines?: OwnProductionLines;
  /* Why the engine cannot figure lines 7 to 9. */
  gap?: string;
  /* Production facts that claim no credit: not registered, or over the capacity limit. */
  ineligibleKeys: string[];
  /* Production facts whose shape is wrong: Cade records them again. */
  malformedKeys: string[];
  /* The businesses whose Schedule C line 6 waits on the gap: line 9 is their income. */
  gapBusinessKeys: string[];
  /* The production facts of an eligible producer, with or without their business. */
  eligibleKeys: string[];
  /* More than one source of agri-biodiesel together pass a limit (COMBINED_LIMIT_GAP). */
  combinedLimitsExceeded: boolean;
}

/*
 * "To claim the small agri-biodiesel producer credit, all producers must be
 * registered with the IRS"; an eligible producer has "at all times during the
 * tax year ... a productive capacity for agri-biodiesel not in excess of 60
 * million gallons" (irs-8864-inst-2025::sec::qualified-agri-biodiesel-production::b02).
 */
const isEligible = (fact: AgriBiodieselProductionFact) =>
  fact.value.registeredOnForm637 &&
  fact.value.productiveCapacityGallons <= PRODUCTIVE_CAPACITY_LIMIT_GALLONS;

const gallonsOf = (fact: AgriBiodieselProductionFact["value"]) =>
  fact.gallonsBeforeJuly + fact.gallonsAfterJune;

const notOnReturnGap = (fact: AgriBiodieselProductionFact) =>
  `The agri-biodiesel production ${fact.key} names ${fact.value.businessKey}, which is not a Schedule C business on this return: line 9 is that business's other income (irs-1040sc-inst-2025::sec::line-6::b01).`;

const OVER_LIMIT_GAP =
  "The production facts state more than 15 million gallons: qualified agri-biodiesel production is at most 15 million gallons (irs-8864-inst-2025::sec::qualified-agri-biodiesel-production::b01), and the instructions do not say which gallons count. State the qualified gallons of each period.";

export const COMBINED_LIMIT_GAP =
  "The return has agri-biodiesel from more than one source (its own production and K-1 statements), and together they pass 15 million gallons or 60 million gallons of productive capacity. The limits apply at the partner level too (irs-8864-inst-2025::sec::line-10::b01), and the instructions do not say how the sources are counted together.";

/* The sources of agri-biodiesel together pass a limit the engine cannot apply. */
function combinedLimitsExceededOf(
  facts: ReadonlyArray<FactRow>,
  eligible: AgriBiodieselProductionFact[],
): boolean {
  const sources = [
    ...eligible.map((fact) => ({
      gallons: gallonsOf(fact.value),
      productiveCapacityGallons: fact.value.productiveCapacityGallons,
    })),
    ...k1AgriBiodieselStatements(facts),
  ];
  return !withinCombinedLimits(sources);
}

/* Why lines 7 to 9 cannot be figured; undefined when they can (or when there is no production). */
function linesGap(
  eligible: AgriBiodieselProductionFact[],
  businesses: ReadonlyMap<string, BusinessFactValue>,
  combinedLimitsExceeded: boolean,
): string | undefined {
  if (eligible.length === 0) return undefined;
  const offReturn = eligible.find((fact) => !businesses.has(fact.value.businessKey));
  if (offReturn !== undefined) return notOnReturnGap(offReturn);
  if (sum(...eligible.map((fact) => gallonsOf(fact.value))) > QUALIFIED_PRODUCTION_LIMIT_GALLONS) {
    return OVER_LIMIT_GAP;
  }
  return combinedLimitsExceeded ? COMBINED_LIMIT_GAP : undefined;
}

/* Lines 7 to 9 for the return, and each business's part of line 9. */
export function agriBiodieselFigures(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): AgriBiodieselFigures {
  const { productions, malformedKeys } = readAgriBiodieselFacts(facts);
  const stated = statedBusinessesOnReturn(facts, joint);
  const spouseKeys = new Set(stated.spouseKeys);
  const businesses = new Map(stated.businesses.map((business) => [business.key, business.value]));
  const onReturn = productions.filter((fact) => !spouseKeys.has(fact.value.businessKey));
  const eligible = onReturn.filter(isEligible);
  const combinedLimitsExceeded = combinedLimitsExceededOf(facts, eligible);
  const base = {
    ineligibleKeys: onReturn.filter((fact) => !isEligible(fact)).map((fact) => fact.key),
    malformedKeys,
    eligibleKeys: eligible.map((fact) => fact.key),
    combinedLimitsExceeded,
  };
  const gap = linesGap(eligible, businesses, combinedLimitsExceeded);
  const withBusiness = eligible.flatMap((fact) => {
    const business = businesses.get(fact.value.businessKey);
    return business === undefined
      ? []
      : [{ key: fact.key, businessKey: fact.value.businessKey, business, fact: fact.value }];
  });
  if (gap !== undefined) {
    const gapBusinessKeys = withBusiness.map((production) => production.businessKey);
    return { ...base, productions: withBusiness, gap, gapBusinessKeys };
  }
  if (eligible.length === 0) return { ...base, productions: [], gapBusinessKeys: [] };
  const lines = ownProductionLines(
    sum(...eligible.map((fact) => fact.value.gallonsBeforeJuly)),
    sum(...eligible.map((fact) => fact.value.gallonsAfterJune)),
  );
  const credits = withBusiness.map(({ fact }) =>
    unroundedCredit(fact.gallonsBeforeJuly, fact.gallonsAfterJune),
  );
  const shares = line9Shares(lines.line9, credits);
  const withShares = withBusiness.map((production, index) => ({
    ...production,
    share: shares[index],
  }));
  return { ...base, productions: withShares, lines, gapBusinessKeys: [] };
}

/*
 * Each business's part of line 9, by business fact key: "Include this amount
 * in income, under 'other income'" (irs-8864-inst-2025::sec::line-9::b01), on
 * Schedule C line 6 (the DECISION in resolveInfo.ts). Empty while a gap stops
 * the lines: Schedule C line 6 of those businesses is then a gap (receivers.ts).
 */
export function agriBiodieselIncomeByBusiness(
  facts: ReadonlyArray<FactRow>,
  joint: boolean,
): ReadonlyMap<string, number> {
  const income = new Map<string, number>();
  for (const { businessKey, share } of agriBiodieselFigures(facts, joint).productions) {
    if (share !== undefined && share !== 0) {
      income.set(businessKey, sum(income.get(businessKey), share));
    }
  }
  return income;
}
