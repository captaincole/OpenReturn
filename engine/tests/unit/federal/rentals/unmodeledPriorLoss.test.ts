/*
 * A prior-year unallowed loss the engine does not model makes lines wait; the
 * property must then be pending, so the return does not read as ready to file.
 * Built on tcb-us-005: a real estate professional's nonpassive QBI rental.
 */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { tcbUs005Scenario as scenario } from "../../../scenarios/tcb-us-005/index.js";

const RENTAL_KEY = "rental.property.1-add";

const factsWith = (change: Partial<RentalFactValue>): TaxFactRow[] =>
  scenario.facts.map((fact) =>
    fact.key === RENTAL_KEY
      ? { ...fact, value: { ...(fact.value as RentalFactValue), ...change } }
      : fact,
  );

function missingWith(change: Partial<RentalFactValue>) {
  return resolveFilingInfo({ facts: factsWith(change), decisions: scenario.decisions })
    .missingInputs;
}

function pendingWith(change: Partial<RentalFactValue>) {
  const facts = factsWith(change);
  const evaluated = evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts,
    decisions: scenario.decisions,
    authEmail: null,
  });
  return pendingInputs(evaluated).pendingFacts;
}

describe("an unmodeled prior-year loss on a rental", () => {
  it("adds nothing pending for the rental without one", () => {
    expect(pendingWith({})).not.toContain(RENTAL_KEY);
  });

  it("is pending when the nonpassive QBI rental has one", () => {
    expect(pendingWith({ priorYearUnallowedLoss: 5000 })).toContain(RENTAL_KEY);
  });

  it("is listed by Schedule E (a former passive activity) and by Form 8995-A (its QBI)", () => {
    const missing = missingWith({ priorYearUnallowedLoss: 5000 });
    expect(missing?.["schedule-e"]).toContain(RENTAL_KEY);
    expect(missing?.["form-8995-a"]).toContain(RENTAL_KEY);
  });

  it("is listed by Schedule E alone when the rental is not a QBI trade or business", () => {
    const missing = missingWith({ priorYearUnallowedLoss: 5000, qualifiedBusiness: false });
    expect(missing?.["schedule-e"]).toContain(RENTAL_KEY);
    expect(missing?.["form-8995-a"] ?? []).not.toContain(RENTAL_KEY);
    expect(pendingWith({ priorYearUnallowedLoss: 5000, qualifiedBusiness: false })).toContain(
      RENTAL_KEY,
    );
  });
});
