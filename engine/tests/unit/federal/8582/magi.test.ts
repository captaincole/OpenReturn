/*
 * Form 8582 line 6 (irs-8582-inst-2025::sec::line-6::b01, ::b02): modified AGI
 * leaves out passive income and loss, but includes net income recharacterized
 * as nonpassive, such as a self-rental's (irs-pub-925-2025::sec::rental-of-property-to::b01).
 */

import { describe, expect, it } from "vitest";
import type { FormAccessor } from "../../../../src/defineForm.js";
import type { RentalFactValue, W2FactValue } from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import type { Form8582FilingInfo } from "../../../../src/federal/8582/filingInfo.js";
import { modifiedAgi } from "../../../../src/federal/8582/magi.js";
import type { Form8582 } from "../../../../src/federal/8582/types.js";
import type { RentalProperty } from "../../../../src/federal/schedule-e/filingInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { tcbUs009Scenario as scenario } from "../../../scenarios/tcb-us-009/index.js";

const selfRental: RentalFactValue = {
  propertyType: "self_rental",
  address: { street: "2 Elm St", city: "Tampa", state: "FL", zip: "33601" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 10000,
  activeParticipation: true,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0,
};

const property = (value: Partial<RentalFactValue>, passive = true): RentalProperty => ({
  factKey: "rental.property.2-elm",
  column: "a",
  value: { ...selfRental, ...value },
  passive,
});

const line6 = (line21: number, rental: RentalProperty) =>
  modifiedAgi(
    {
      "form-1040.line.1z": 120000,
      "schedule-e.0.line.21_income_or_loss_a": line21,
    } as unknown as FormAccessor<Form8582>,
    { rentalProperties: [rental] } as Form8582FilingInfo,
  );

describe("Form 8582 line 6 with a self-rental", () => {
  it("includes a self-rental's net income", () => {
    expect(line6(10000, property({}))).toBe(130000);
  });

  it("leaves out a self-rental's net loss", () => {
    expect(line6(-4000, property({}))).toBe(120000);
  });

  it("leaves out a self-rental's income below its prior-year loss (a net loss)", () => {
    expect(line6(10000, property({ priorYearUnallowedLoss: 12000 }))).toBe(120000);
  });

  it("leaves out a passive rental's income that is not a self-rental", () => {
    expect(line6(10000, property({ propertyType: "single_family" }))).toBe(120000);
  });
});

/* tcb-us-009 as a single filer with $120,000 of wages: a $25,000 allowance applies. */
describe("Form 8582 Part II with a self-rental's income", () => {
  const facts: TaxFactRow[] = scenario.facts.map((fact) =>
    fact.category === "wages"
      ? { ...fact, value: { ...(fact.value as W2FactValue), box1: 120000 } }
      : fact,
  );
  const decisions = scenario.decisions.map((decision) =>
    decision.decisionKey === "decisions.scope.filing_status"
      ? { ...decision, decision: "single" }
      : decision,
  );
  const form = evaluateScenario({
    filing: { id: "form-8582-magi-test", taxYear: scenario.taxYear },
    facts,
    decisions,
    authEmail: null,
  }).forms.get("form-8582");
  const value = (fieldId: string) => {
    const field = form?.fields.find((each) => each.fieldId === `form-8582.0.${fieldId}`);
    return field?.result.ok ? field.result.value : undefined;
  };

  it("counts the income in line 6 and allows the loss from it", () => {
    expect(
      [
        "line.6_modified_agi",
        "line.7_line5_minus_line6",
        "line.9_special_allowance",
        "line.11_total_losses_allowed",
      ].map(value),
    ).toEqual([132100, 17900, 8950, 10950]);
  });
});
