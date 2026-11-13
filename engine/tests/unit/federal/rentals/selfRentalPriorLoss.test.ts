/*
 * A self-rental's net income over a prior-year unallowed loss allows that loss
 * outside Form 8582 (irs-pub-925-2025::sec::disclosure-requirement::b05), which the
 * engine does not model. Form 8582 does not file for it, so Schedule E must keep
 * the property pending. Built on tcb-us-009: wages and the income self-rental only.
 */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { tcbUs009Scenario as scenario } from "../../../scenarios/tcb-us-009/index.js";

const RENTAL_KEY = "rental.property.2-add";

const factsWith = (change: Partial<RentalFactValue>): TaxFactRow[] =>
  scenario.facts
    .filter((fact) => fact.category !== "investment_income")
    .filter(
      (fact) =>
        fact.category !== "rental" ||
        !fact.key.startsWith("rental.property.") ||
        fact.key === RENTAL_KEY,
    )
    .map((fact) =>
      fact.key === RENTAL_KEY
        ? {
            ...fact,
            value: { ...(fact.value as RentalFactValue), qualifiedBusiness: false, ...change },
          }
        : fact,
    );

function evaluatedWith(change: Partial<RentalFactValue>) {
  return evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts: factsWith(change),
    decisions: scenario.decisions,
    authEmail: null,
  });
}

const PRIOR_LOSS = { priorYearUnallowedLoss: 3000, activeParticipationWhenLossArose: true };

describe("a self-rental's income over a prior-year loss", () => {
  it("adds nothing pending for the self-rental without one", () => {
    expect(pendingInputs(evaluatedWith({})).pendingFacts).not.toContain(RENTAL_KEY);
  });

  it("does not file Form 8582", () => {
    const form = evaluatedWith(PRIOR_LOSS).forms.get("form-8582");
    expect(form?.mustFile.ok ? form.mustFile.value : undefined).toBe(false);
  });

  it("is listed by Schedule E and pending", () => {
    const missing = resolveFilingInfo({
      facts: factsWith(PRIOR_LOSS),
      decisions: scenario.decisions,
    }).missingInputs;
    expect(missing?.["schedule-e"]).toContain(RENTAL_KEY);
    expect(pendingInputs(evaluatedWith(PRIOR_LOSS)).pendingFacts).toContain(RENTAL_KEY);
  });
});
