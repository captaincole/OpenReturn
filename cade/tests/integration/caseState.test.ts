import { evaluateScenario } from "@openreturn/engine";
import { alexScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import { buildCaseStateForScenario } from "../../src/mastra/tools/caseState";

const { facts: alexFacts, decisions: alexDecisions } = alexScenario;

/* generate-tax-documents renders only when nothing is pending, so these lists gate the hand-off. */
function caseStateFor(
  decisions = alexDecisions,
  facts = alexFacts,
  assumptions: typeof alexFacts = [],
) {
  const scenario = evaluateScenario({
    filing: { id: "alex", taxYear: 2025 },
    facts,
    assumptions,
    decisions,
    authEmail: "alex@example.com",
  });
  return buildCaseStateForScenario(scenario);
}

/* Alex's use tax as an assumption instead of a fact. */
const USE_TAX = "use_tax.owed_amount";
const useTax = alexFacts.find((fact) => fact.key === USE_TAX)!;
const withAssumedUseTax = () =>
  caseStateFor(
    alexDecisions,
    alexFacts.filter((fact) => fact.key !== USE_TAX),
    [{ ...useTax, id: "assumed-use-tax", sourceNote: "About nothing, verbal." }],
  );

const withoutFilingStatus = alexDecisions.filter(
  (decision) => decision.decisionKey !== "decisions.scope.filing_status",
);

describe("case-state pending lists", () => {
  it("are empty for a complete Alex return", () => {
    const { pendingDecisions, pendingFacts, pendingAssumptions, readyToFile } = caseStateFor();
    expect({ pendingDecisions, pendingFacts, pendingAssumptions }).toEqual({
      pendingDecisions: [],
      pendingFacts: [],
      pendingAssumptions: [],
    });
    expect(readyToFile).toBe(true);
  });

  it("list an assumption in use: the return is not ready to file", () => {
    const state = withAssumedUseTax();
    expect(state.pendingFacts).toEqual([]);
    expect(state.pendingAssumptions).toEqual([USE_TAX]);
    expect(state.assumptionsInUse).toEqual([
      { key: USE_TAX, value: useTax.value, sourceNote: "About nothing, verbal." },
    ]);
    expect(state.readyToFile).toBe(false);
  });

  it("name the filing status when it is missing", () => {
    expect(caseStateFor(withoutFilingStatus).pendingDecisions).toEqual([
      "decisions.scope.filing_status",
    ]);
  });
});

describe("case-state money", () => {
  it("holds the return's values when nothing is pending", () => {
    expect(caseStateFor().money).toMatchObject({
      totalWages: 79000,
      federalAgi: 79000,
      federalRefund: 585,
      federalOwed: null,
    });
  });

  it("still holds the values while an assumption is in use", () => {
    expect(withAssumedUseTax().money).toMatchObject({ federalRefund: 585 });
  });

  it("is null while the filing status is pending", () => {
    expect(caseStateFor(withoutFilingStatus).money).toBeNull();
  });
});
