/* Facts for the Form 7207 unit tests: the bran scenario's plant, and helpers to change it. */

import {
  CRITICAL_MINERALS,
  makeAdvancedManufacturingFacilityFactKey,
  makeInvestmentCreditPropertyFactKey,
  type AdvancedManufacturingFacilityFactValue,
  type InvestmentCreditPropertyFactValue,
  type OffshoreWindVessel,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { PLANT, PLANT_ADDRESS, PLANT_KEY } from "../../../scenarios/synthetic/bran/facts.js";
import { branScenario as bran } from "../../../scenarios/synthetic/bran/index.js";

export { bran, PLANT, PLANT_ADDRESS, PLANT_KEY };

export const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...bran.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

export const facilityRow = (slug: string, value: AdvancedManufacturingFacilityFactValue) =>
  row("self_employment", makeAdvancedManufacturingFacilityFactKey(slug), value);

export const isFacility = (fact: TaxFactRow) => fact.key.startsWith("advanced_manufacturing");

/* bran's facts with the plant replaced. */
export const withPlant = (value: AdvancedManufacturingFacilityFactValue) =>
  bran.facts.map((fact) => (fact.key === PLANT_KEY ? { ...fact, value } : fact));

export const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({ userId: bran.userId, taxYear: 2025, key, decision: value, rationale: "test" });

/* A section 48C project (Form 3468 Part III) at an address. */
export function section48cProperty(address?: string): TaxFactRow {
  const value: InvestmentCreditPropertyFactValue = {
    facility: {
      propertyType: "Advanced energy project",
      address,
      constructionBegan: "2024-06-01",
      placedInService: "2025-06-01",
      netOutputUnder1Mw: "no",
      prevailingWage: "yes_48c",
      domesticContent: "no",
      energyCommunity: "no",
      lowIncome: "no",
    },
    credit: {
      part: "advanced_energy",
      investment: {
        qualifiedInvestment: 100_000,
        allocationControlNumber: "48C-TEST",
        energyCommunityCensusTract: false,
      },
    },
    passive: false,
  };
  return row("other", makeInvestmentCreditPropertyFactKey("project"), value);
}

export const vessel = (index: number, retrofitted: boolean): OffshoreWindVessel => ({
  name: `Vessel ${index}`,
  purpose: "Crew transfer",
  officialNumber: String(1_000_000 + index),
  retrofitted,
  salesPrice: 1_000,
});

/* Every Part III row and every Part IV line, the owner and the yes boxes: the coverage facility. */
export const COVERAGE: AdvancedManufacturingFacilityFactValue = {
  ...PLANT,
  owner: { name: "Coverage Owner LLC", tin: "00-0007207" },
  relatedPersonElection: true,
  section48cProperty: true,
  vessels: Array.from({ length: 49 }, (_, index) => vessel(index + 1, index % 2 === 0)),
  criticalMineralCosts: Object.fromEntries(CRITICAL_MINERALS.map((mineral) => [mineral, 100])),
};

/* The other box of every Yes/No pair and of every vessel's "New or retrofitted". */
export const COVERAGE_OTHER_BOXES: AdvancedManufacturingFacilityFactValue = {
  ...COVERAGE,
  relatedPersonElection: false,
  section48cProperty: false,
  vessels: Array.from({ length: 49 }, (_, index) => vessel(index + 1, index % 2 === 1)),
};

export function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = bran.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-7207-test", taxYear: 2025 },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, missing };
}

export const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;
