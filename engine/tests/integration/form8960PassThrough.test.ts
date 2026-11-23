import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import {
  isW2FactKey,
  makeInterestFactKey,
  type InterestFactValue,
  type W2FactValue,
} from "../../src/facts";
import type { TaxFactRow } from "../../src/facts/rows";
import { roundDollars } from "../../src/money";
import { elaidaScenario } from "../scenarios/synthetic/elaida";
import { minScenario } from "../scenarios/synthetic/min";
import type { Scenario } from "../types";

/*
 * Form 8960 line 4b takes a materially participating owner's S corporation
 * income or loss back out of line 4a (irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01):
 * it is not net investment income.
 */

function run(scenario: Scenario, facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts,
    decisions: scenario.decisions,
    authEmail: null,
  });
  const value = (fieldId: string) => {
    const formId = fieldId.split(".")[0];
    const found = result.forms.get(formId)?.fields.find((entry) => entry.fieldId === fieldId);
    return found?.result.ok ? found.result.value : undefined;
  };
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return { value, files };
}

/* A bank's 1099-INT on the scenario's return. */
const bankInterest = (scenario: Scenario, amount: number): TaxFactRow => {
  const value: InterestFactValue = {
    payerName: "Caemlyn Savings Bank",
    payerTin: "00-0008960",
    box1: amount,
  };
  return {
    ...scenario.facts[0],
    id: "f-interest",
    category: "investment_income",
    key: makeInterestFactKey("caemlyn-savings"),
    value,
  };
};

/* Each W-2's box 1, raised by the same amount, and a bank's interest added. */
const withHighWagesAndInterest = (scenario: Scenario, raise: number, interest: number) => [
  ...scenario.facts.map((fact) =>
    isW2FactKey(fact.key)
      ? {
          ...fact,
          value: {
            ...(fact.value as W2FactValue),
            box1: (fact.value as W2FactValue).box1 + raise,
          },
        }
      : fact,
  ),
  bankInterest(scenario, interest),
];

describe("Form 8960 line 4b takes out a nonpassive S corporation's income (min)", () => {
  const high = run(minScenario, withHighWagesAndInterest(minScenario, 120000, 5000));

  it("puts the S corporation income on line 4a and takes it out on line 4b", () => {
    expect(high.files("form-8960")).toBe(true);
    expect(high.value("schedule-e.1.line.28_row_a_col_k_nonpassive_income")).toBe(3200);
    expect(high.value("form-8960.0.line.1")).toBe(5000);
    expect(high.value("form-8960.0.line.4a")).toBe(3200);
    expect(high.value("form-8960.0.line.4b")).toBe(-3200);
    expect(high.value("form-8960.0.line.4c")).toBe(0);
  });

  it("taxes the interest only", () => {
    expect(high.value("form-8960.0.line.8")).toBe(5000);
    expect(high.value("form-8960.0.line.12")).toBe(5000);
    expect(high.value("form-8960.0.line.16")).toBe(5000);
    expect(high.value("form-8960.0.line.17")).toBe(190);
  });
});

describe("Form 8960 line 4b adds back a nonpassive S corporation loss (elaida)", () => {
  const high = run(elaidaScenario, withHighWagesAndInterest(elaidaScenario, 300000, 8000));

  it("adds the allowed loss back, next to the Schedule C income it takes out", () => {
    expect(high.files("form-8960")).toBe(true);
    expect(high.value("schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed")).toBe(29233);
    expect(high.value("schedule-1.0.line.3")).toBe(400);
    expect(high.value("form-8960.0.line.4a")).toBe(400 - 29233);
    expect(high.value("form-8960.0.line.4b")).toBe(29233 - 400);
    expect(high.value("form-8960.0.line.4c")).toBe(0);
  });

  it("does not let the business loss lower net investment income", () => {
    const capital = high.value("form-8960.0.line.5a") as number;
    expect(high.value("form-8960.0.line.8")).toBe(8000 + capital);
    const line16 = high.value("form-8960.0.line.16") as number;
    expect(line16).toBe(8000 + capital);
    expect(high.value("form-8960.0.line.17")).toBe(roundDollars(line16 * 0.038));
  });
});
