import { evaluateScenario } from "@openreturn/engine";
import { alexScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import { buildCaseStateForScenario } from "../../src/mastra/tools/caseState";

const { facts: alexFacts, decisions: alexDecisions } = alexScenario;

/*
 * generate-tax-documents renders only when nothing is pending, so the
 * pending lists are the hand-off gate. A complete return must pass it, and a
 * missing filing status must block it (without one, the 1040 computes
 * with zero standard deduction and zero tax).
 */
function caseStateFor(decisions = alexDecisions) {
  const scenario = evaluateScenario({
    filing: { id: "alex", taxYear: 2025 },
    facts: alexFacts,
    decisions,
    authEmail: "alex@example.com",
  });
  return buildCaseStateForScenario(scenario);
}

const withoutFilingStatus = alexDecisions.filter(
  (d) => d.decisionKey !== "decisions.scope.filing_status",
);

describe("case-state pending lists", () => {
  it("are empty for a complete Alex return", () => {
    const { pendingDecisions, pendingFacts } = caseStateFor();
    expect({ pendingDecisions, pendingFacts }).toEqual({ pendingDecisions: [], pendingFacts: [] });
  });

  it("name the filing status when it is missing", () => {
    expect(caseStateFor(withoutFilingStatus).pendingDecisions).toEqual([
      "decisions.scope.filing_status",
    ]);
  });
});

/* money is final values only: null while anything is pending. */
describe("case-state money", () => {
  it("holds the return's values when nothing is pending", () => {
    expect(caseStateFor().money).toMatchObject({
      totalWages: 79000,
      federalAgi: 79000,
      federalRefund: 585,
      federalOwed: null,
    });
  });

  it("is null while the filing status is pending", () => {
    expect(caseStateFor(withoutFilingStatus).money).toBeNull();
  });
});
