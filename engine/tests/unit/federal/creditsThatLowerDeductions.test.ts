/*
 * Two credits on one business: the work opportunity credit (Form 5884) lowers
 * Schedule C line 26, wages, and the tip credit (Form 8846) lowers line 23,
 * taxes. Each form was written without the other; this test holds them
 * together. The salon is the synthetic natti scenario's; the certified
 * employees are the synthetic daved scenario's, moved to the salon.
 */

import { describe, expect, it } from "vitest";
import { makeWorkOpportunityEmployeeFactKey } from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { evaluateScenario } from "../../../src/index.js";
import { EMPLOYEES } from "../../scenarios/synthetic/daved/facts.js";
import { SALON_KEY, salon } from "../../scenarios/synthetic/natti/facts.js";
import { nattiScenario as natti } from "../../scenarios/synthetic/natti/index.js";

const TIP_CREDIT = 12_686;
const TIP_CREDIT_WITH_K1 = 15_036;

const employeesOfTheSalon: TaxFactRow[] = Object.entries(EMPLOYEES).map(([slug, value]) => ({
  ...natti.facts[0]!,
  id: `f-${slug}`,
  category: "self_employment",
  key: makeWorkOpportunityEmployeeFactKey(slug),
  value: { ...value, activityKey: SALON_KEY },
}));

function evaluate(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "credits-that-lower-deductions-test", taxYear: natti.taxYear },
    facts,
    decisions: natti.decisions,
    authEmail: null,
  });
  return (formId: string, id: string) => {
    const found = result.forms
      .get(formId)
      ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
    return found?.ok ? found.value : undefined;
  };
}

describe("a business with the work opportunity credit and the tip credit", () => {
  const value = evaluate([...natti.facts, ...employeesOfTheSalon]);
  const workOpportunityCredit = value("form-5884", "0.line.2_add_lines");

  it("figures both credits", () => {
    expect(typeof workOpportunityCredit).toBe("number");
    expect(workOpportunityCredit as number).toBeGreaterThan(0);
    expect(value("form-8846", "0.line.4_multiply_3_by_7_65_percent")).toBe(TIP_CREDIT);
  });

  it("each credit lowers its own Schedule C line, and only that line", () => {
    const wages = salon.expenses?.wages ?? 0;
    const taxes = salon.expenses?.taxesAndLicenses ?? 0;
    expect(value("schedule-c", "0.line.26")).toBe(wages - (workOpportunityCredit as number));
    expect(value("schedule-c", "0.line.23")).toBe(taxes - TIP_CREDIT);
  });

  it("each credit has its own row on Form 3800 Part III", () => {
    expect(value("form-3800", "3.part3.4b_form_5884_col_g")).toBe(workOpportunityCredit);
    expect(value("form-3800", "3.part3.4f_form_8846_col_g")).toBe(TIP_CREDIT_WITH_K1);
  });
});

describe("the tip credit alone is unchanged by the join", () => {
  const value = evaluate(natti.facts);

  it("Schedule C line 26 is the stated wages", () => {
    expect(value("schedule-c", "0.line.26")).toBe(salon.expenses?.wages);
    expect(value("schedule-c", "0.line.23")).toBe(
      (salon.expenses?.taxesAndLicenses ?? 0) - TIP_CREDIT,
    );
  });
});
