/*
 * FTB 5805F on a whole return: who files, the answers it waits on, the gaps,
 * and Form 540 line 113 with its FTB 5805F box. The synthetic zerah scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CA_FARMER_ESTIMATED_TAX_KEYS,
  FARMER_OR_FISHERMAN_KEYS,
  PRIOR_YEAR_KEYS,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { jordanScenario } from "../../../../scenarios/jordan/index.js";
import { zerahScenario as base } from "../../../../scenarios/synthetic/zerah/index.js";

const FORM = "form-5805f";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

/* The base facts with each fact for a key replaced (undefined drops it). */
function factsWith(changes: Record<string, unknown>): TaxFactRow[] {
  return base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
}

function evaluate(facts: TaxFactRow[] = base.facts, decisions: AIDecisionRow[] = base.decisions) {
  return evaluateScenario({
    filing: { id: "form-5805f-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
}

function withDecision(key: string, value: unknown) {
  return [...base.decisions.filter((row) => row.decisionKey !== key), decision(key, value)];
}

type Evaluated = ReturnType<typeof evaluate>;

function files(scenario: Evaluated, formId: string): boolean {
  const form = scenario.forms.get(formId);
  return form?.mustFile.ok === true && form.mustFile.value === true;
}

function value(scenario: Evaluated, fieldId: string): unknown {
  const formId = fieldId.split(".")[0]!;
  const field = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
  return field?.result.ok ? field.result.value : undefined;
}

function isGap(scenario: Evaluated, fieldId: string): boolean {
  const formId = fieldId.split(".")[0]!;
  const field = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
  return (field?.result as { unsupported?: boolean } | undefined)?.unsupported === true;
}

const pending = (scenario: Evaluated) => pendingInputs(scenario).pendingFacts;

const LINE_113 = "form-540.line.113_underpayment_estimated_tax";
const BOX_113 = "form-540.line.112_ftb_5805f_attached";

describe("FTB 5805F on a return", () => {
  it("zerah: line 113 takes line 16 after the waiver, and the box is checked", () => {
    const scenario = evaluate();
    expect(files(scenario, FORM)).toBe(true);
    expect(value(scenario, "form-5805f.0.line.15_penalty")).toBe(62);
    expect(value(scenario, "form-5805f.0.line.16_waiver_amount")).toBe(42);
    expect(value(scenario, LINE_113)).toBe(42);
    expect(value(scenario, BOX_113)).toBe(true);
    expect(files(scenario, "form-5805")).toBe(false);
  });

  it("with no waiver request, line 113 takes line 15 and the line 16 box is unchecked", () => {
    const scenario = evaluate(factsWith({ [CA_FARMER_ESTIMATED_TAX_KEYS.waiver]: undefined }));
    expect(value(scenario, "form-5805f.0.line.16_waiver_request_checkbox")).toBe(false);
    expect(value(scenario, "form-5805f.0.line.16_waiver_amount")).toBeUndefined();
    expect(value(scenario, LINE_113)).toBe(62);
  });

  it("with no payment date, line 13 is April 15, 2026: 90 days", () => {
    const scenario = evaluate(
      factsWith({ [CA_FARMER_ESTIMATED_TAX_KEYS.underpaymentPaidOn]: undefined }),
    );
    expect(value(scenario, "form-5805f.0.line.13_date_underpayment_paid")).toBe("04/15/2026");
    expect(value(scenario, "form-5805f.0.line.14_number_of_days")).toBe(90);
  });

  it("filed and paid by March 2: Part I stands, no penalty on line 113, the box still checked", () => {
    const scenario = evaluate(
      factsWith({ [CA_FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2]: true }),
    );
    expect(value(scenario, "form-5805f.0.line.12_underpayment")).toBe(3967);
    expect(value(scenario, "form-5805f.0.line.15_penalty")).toBeUndefined();
    expect(value(scenario, LINE_113)).toBeUndefined();
    expect(value(scenario, BOX_113)).toBe(true);
  });

  it("a payment date that is not a calendar date is a gap on Part II", () => {
    const scenario = evaluate(
      factsWith({ [CA_FARMER_ESTIMATED_TAX_KEYS.underpaymentPaidOn]: "April 6" }),
    );
    expect(isGap(scenario, "form-5805f.0.line.15_penalty")).toBe(true);
    expect(value(scenario, "form-5805f.0.line.12_underpayment")).toBe(3967);
  });
});

describe("who files", () => {
  const noTest = {
    [FARMER_OR_FISHERMAN_KEYS.grossIncome2025]: undefined,
    [FARMER_OR_FISHERMAN_KEYS.grossIncome2024]: undefined,
  };

  it("not a farmer: FTB 5805 files instead, and line 113 has no FTB 5805F box", () => {
    const scenario = evaluate(factsWith(noTest));
    expect(files(scenario, FORM)).toBe(false);
    expect(files(scenario, "form-5805")).toBe(true);
    expect(value(scenario, BOX_113)).toBeUndefined();
  });

  it("one passing year is enough; two failing years are not", () => {
    const failing = { totalGrossIncome: 300000, farmingOrFishingGrossIncome: 100000 };
    const oneYear = evaluate(factsWith({ [FARMER_OR_FISHERMAN_KEYS.grossIncome2025]: failing }));
    expect(files(oneYear, FORM)).toBe(true);
    const neither = evaluate(
      factsWith({
        [FARMER_OR_FISHERMAN_KEYS.grossIncome2025]: failing,
        [FARMER_OR_FISHERMAN_KEYS.grossIncome2024]: failing,
      }),
    );
    expect(files(neither, FORM)).toBe(false);
  });

  it("the explicit decision wins both ways", () => {
    expect(
      files(evaluate(base.facts, withDecision("decisions.scope.must_file_5805f", false)), FORM),
    ).toBe(false);
    const on = evaluate(factsWith(noTest), withDecision("decisions.scope.must_file_5805f", true));
    expect(files(on, FORM)).toBe(true);
    expect(files(on, "form-5805")).toBe(false);
  });

  it("with no Form 540 the fallback does not file it; the decision alone makes the lines a gap", () => {
    const no540 = withDecision("decisions.scope.must_file_ca_540", false);
    expect(files(evaluate(base.facts, no540), FORM)).toBe(false);
    const forced = evaluate(base.facts, [
      ...no540.filter((row) => row.decisionKey !== "decisions.scope.must_file_5805f"),
      decision("decisions.scope.must_file_5805f", true),
    ]);
    expect(isGap(forced, "form-5805f.0.line.1_current_year_tax_after_credits")).toBe(true);
  });
});

describe("the answers it waits on", () => {
  it("each asked answer is pending when missing, and its lines are blank", () => {
    const march = evaluate(
      factsWith({ [CA_FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2]: undefined }),
    );
    expect(pending(march)).toContain(CA_FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2);
    expect(value(march, "form-5805f.0.line.12_underpayment")).toBe(3967);
    expect(value(march, "form-5805f.0.line.15_penalty")).toBeUndefined();

    const january = evaluate(
      factsWith({ [CA_FARMER_ESTIMATED_TAX_KEYS.estimatedTaxByJanuary15]: undefined }),
    );
    expect(pending(january)).toContain(CA_FARMER_ESTIMATED_TAX_KEYS.estimatedTaxByJanuary15);
    expect(value(january, "form-5805f.0.line.9_prior_year_tax_less_lump_sum")).toBe(9100);
    expect(
      value(january, "form-5805f.0.line.11_withholding_and_estimated_payments"),
    ).toBeUndefined();

    const tax = evaluate(factsWith({ [PRIOR_YEAR_KEYS.caTax]: undefined }));
    expect(pending(tax)).toContain(PRIOR_YEAR_KEYS.caTax);
    expect(value(tax, "form-5805f.0.line.6_current_year_tax_less_withholding")).toBe(9900);
    expect(value(tax, "form-5805f.0.line.7_prior_year_tax_after_credits")).toBeUndefined();

    const withheld = evaluate(factsWith({ [PRIOR_YEAR_KEYS.caWithholding]: undefined }));
    expect(pending(withheld)).toContain(PRIOR_YEAR_KEYS.caWithholding);
    expect(value(withheld, "form-5805f.0.line.15_penalty")).toBeUndefined();
  });

  it("no 12-month 2024 return: the 2024 tax is not asked and line 10 is line 4", () => {
    const scenario = evaluate([
      ...factsWith({ [PRIOR_YEAR_KEYS.caTax]: undefined }),
      {
        ...base.facts[0]!,
        id: "f-no-12",
        category: "estimated_payments",
        key: PRIOR_YEAR_KEYS.caNoTwelveMonthReturn,
        value: true,
      },
    ]);
    expect(pending(scenario)).not.toContain(PRIOR_YEAR_KEYS.caTax);
    expect(value(scenario, "form-5805f.0.line.7_prior_year_tax_after_credits")).toBeUndefined();
    expect(value(scenario, "form-5805f.0.line.10_required_annual_payment")).toBe(7267);
  });
});

describe("no farmer facts, nothing changes", () => {
  it("jordan: FTB 5805F does not file and line 113 is still FTB 5805 line 13", () => {
    const scenario = evaluateScenario({
      filing: { id: jordanScenario.name, taxYear: jordanScenario.taxYear },
      facts: jordanScenario.facts,
      decisions: jordanScenario.decisions,
      authEmail: null,
    });
    expect(files(scenario, FORM)).toBe(false);
    expect(value(scenario, BOX_113)).toBeUndefined();
    expect(value(scenario, LINE_113)).toBe(value(scenario, "form-5805.1.part2.line_13"));
  });
});
