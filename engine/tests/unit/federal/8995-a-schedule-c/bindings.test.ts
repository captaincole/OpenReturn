/*
 * Schedule C (Form 8995-A) loss netting
 * (irs-8995a-inst-2025::sec::schedule-c-form-8995-a-loss-netting-and::b01, ::line-2::b01):
 * line 5 is apportioned among the trades with QBI in proportion to their QBI.
 * Built on tcb-us-005: the rental (row A, a loss), a second rental in place of the
 * royalty (row B, income) and the Schedule C business (row C, QBI 48,865).
 */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { tcbUs005Scenario as scenario } from "../../../scenarios/tcb-us-005/index.js";

const FORM = "form-8995-a-schedule-c";

/* Row B: a nonpassive QBI rental with $10,000 of net income. */
const secondRental: RentalFactValue = {
  owner: "joint",
  propertyType: "single_family",
  address: { street: "2 Oak St", city: "City", state: "FL", zip: "33003" },
  fairRentalDays: 365,
  personalUseDays: 0,
  qualifiedJointVenture: false,
  rentsReceived: 11000,
  expenses: { repairs: 1000 },
  activeParticipation: true,
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  priorYearUnallowedLoss: 0,
  qualifiedBusiness: true,
  tradeOrBusiness: true,
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

function lines(rentalAdvertising: number): Record<string, unknown> {
  const facts: TaxFactRow[] = scenario.facts.map((fact) => {
    if (fact.key === "rental.property.royalties") return { ...fact, value: secondRental };
    if (fact.key !== "rental.property.1-add") return fact;
    const rental = fact.value as RentalFactValue;
    return { ...fact, value: { ...rental, expenses: { advertising: rentalAdvertising } } };
  });
  const decisions = [
    ...scenario.decisions,
    decisionRow({
      userId: scenario.userId,
      taxYear: scenario.taxYear,
      key: "decisions.scope.must_file_8995_a",
      decision: true,
      rationale: "Pinned: this test checks Schedule C (Form 8995-A) only.",
    }),
  ];
  const evaluated = evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const out: Record<string, unknown> = {};
  for (const field of evaluated.forms.get(FORM)?.fields ?? []) {
    out[field.fieldId.slice(FORM.length + 1)] = field.result.ok ? field.result.value : undefined;
  }
  return out;
}

describe("Schedule C (Form 8995-A) loss netting", () => {
  it("apportions line 5 to the income rows in proportion to their QBI", () => {
    // Row A: 1,000 rents less 30,000 advertising = −29,000.
    const form = lines(30000);
    expect(form["0.line.1_col_a_qbi_a"]).toBe(-29000);
    expect(form["0.line.1_col_a_qbi_b"]).toBe(10000);
    expect(form["0.line.1_col_a_qbi_c"]).toBe(48865);
    expect(form["0.line.3_total_losses"]).toBe(29000);
    expect(form["0.line.4_total_income"]).toBe(58865);
    expect(form["0.line.5_losses_netted"]).toBe(29000);
    // 29,000 × 10,000 / 58,865 = 4,926.53 → 4,927; the last row takes the rest, 24,073.
    expect(form["0.line.1_col_b_loss_netting_a"]).toBeUndefined();
    expect(form["0.line.1_col_b_loss_netting_b"]).toBe(4927);
    expect(form["0.line.1_col_b_loss_netting_c"]).toBe(24073);
    expect(
      (form["0.line.1_col_b_loss_netting_b"] as number) +
        (form["0.line.1_col_b_loss_netting_c"] as number),
    ).toBe(form["0.line.5_losses_netted"]);
    expect(form["0.line.1_col_c_adjusted_qbi_a"]).toBe(0);
    expect(form["0.line.1_col_c_adjusted_qbi_b"]).toBe(5073);
    expect(form["0.line.1_col_c_adjusted_qbi_c"]).toBe(24792);
    expect(form["0.line.6_net_loss_carryforward"]).toBe(0);
  });

  it("carries the loss forward on line 6 when line 3 is more than line 4", () => {
    // Row A: 1,000 rents less 100,000 advertising = −99,000.
    const form = lines(100000);
    expect(form["0.line.3_total_losses"]).toBe(99000);
    expect(form["0.line.4_total_income"]).toBe(58865);
    expect(form["0.line.5_losses_netted"]).toBe(58865);
    expect(form["0.line.1_col_b_loss_netting_b"]).toBe(10000);
    expect(form["0.line.1_col_b_loss_netting_c"]).toBe(48865);
    expect(form["0.line.1_col_c_adjusted_qbi_b"]).toBe(0);
    expect(form["0.line.1_col_c_adjusted_qbi_c"]).toBe(0);
    // Line 6: line 3 less line 5, a loss carried forward (printed in parentheses).
    expect(form["0.line.6_net_loss_carryforward"]).toBe(40135);
  });
});
