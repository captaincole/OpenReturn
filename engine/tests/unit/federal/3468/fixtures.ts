/* Property facts for the Form 3468 unit tests: a facility with every Part I answer, and one copy's cells. */

import type {
  InvestmentCreditFacility,
  InvestmentCreditPart,
  InvestmentCreditPropertyFact,
  InvestmentCreditPropertyFactValue,
} from "../../../../src/facts/index.js";
import { propertyCopy } from "../../../../src/federal/3468/copies.js";

export const FACILITY: InvestmentCreditFacility = {
  propertyType: "Test property",
  constructionBegan: "2024-06-01",
  placedInService: "2025-06-01",
  netOutputUnder1Mw: "no",
  prevailingWage: "no",
  domesticContent: "no",
  energyCommunity: "no",
  lowIncome: "no",
};

export function propertyFact(
  credit: InvestmentCreditPart,
  facility: Partial<InvestmentCreditFacility> = {},
  rest: Partial<InvestmentCreditPropertyFactValue> = {},
): InvestmentCreditPropertyFact {
  return {
    key: "investment_credit.property.test",
    value: { facility: { ...FACILITY, ...facility }, credit, passive: false, ...rest },
  };
}

/* The cells of one property's copy, and its total. */
export function copyOf(
  credit: InvestmentCreditPart,
  facility: Partial<InvestmentCreditFacility> = {},
  rest: Partial<InvestmentCreditPropertyFactValue> = {},
) {
  const copy = propertyCopy(propertyFact(credit, facility, rest));
  return { ...copy, cell: (key: string) => copy.cells[key] };
}

export const energy = (
  property: Extract<InvestmentCreditPart, { part: "energy" }>["investment"]["property"],
  financing?: { proceeds: number; capitalAccountAdditions: number },
): InvestmentCreditPart => ({ part: "energy", investment: { property, financing } });
