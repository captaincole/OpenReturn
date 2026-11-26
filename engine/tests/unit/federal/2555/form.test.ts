/*
 * Form 2555 on a whole return: who files, the answers it waits for, the gaps,
 * and the lines of other forms that take its results. The synthetic bair and
 * romanda scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeForeignEarnedIncomeFactKey,
  type ForeignEarnedIncomeFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { bairScenario as bair } from "../../../scenarios/synthetic/bair/index.js";
import { romandaScenario as romanda } from "../../../scenarios/synthetic/romanda/index.js";
import type { Scenario } from "../../../types.js";

const KEY = makeForeignEarnedIncomeFactKey("taxpayer");

const without2555 = (scenario: Scenario) => scenario.facts.filter((fact) => fact.key !== KEY);
const answersOf = (scenario: Scenario) =>
  scenario.facts.find((fact) => fact.key === KEY)!.value as ForeignEarnedIncomeFactValue;

function withAnswers(scenario: Scenario, change: Partial<ForeignEarnedIncomeFactValue>) {
  const row = scenario.facts.find((fact) => fact.key === KEY)!;
  return [...without2555(scenario), { ...row, value: { ...answersOf(scenario), ...change } }];
}

const decision = (scenario: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: scenario.userId,
    taxYear: scenario.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(scenario: Scenario, facts: TaxFactRow[], decisions = scenario.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-2555-test", taxYear: scenario.taxYear },
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
  const isGap = (formId: string, id: string) =>
    (field(formId, id) as { unsupported?: boolean } | undefined)?.unsupported === true;
  return { result, files, value, isGap, pending: pendingInputs(result) };
}

describe("who files Form 2555", () => {
  it("a person who qualifies and claims the exclusion files it", () => {
    expect(evaluate(bair, bair.facts).files("form-2555")).toBe(true);
  });

  it("no Form 2555 fact: no form, and every line that would take its results keeps its old value", () => {
    const run = evaluate(bair, without2555(bair));
    expect(run.files("form-2555")).toBe(false);
    // Schedule 1 filed only for line 8d; Schedule 8812 line 2b keeps its old reason.
    expect(run.files("schedule-1")).toBe(false);
    expect(run.isGap("schedule-8812", "0.line.2b_form_2555_lines_45_50")).toBe(true);
    expect(run.value("schedule-8812", "0.line.3_modified_agi")).toBe(229_800);
    // Line 16 is the plain QDCG worksheet: the wages are all taxed.
    expect(run.value("form-1040", "line.11b")).toBe(229_800);
  });

  it("the explicit decision still wins", () => {
    const decisions = [...bair.decisions, decision(bair, "decisions.scope.must_file_2555", false)];
    expect(evaluate(bair, bair.facts, decisions).files("form-2555")).toBe(false);
  });

  it("the decision with no fact files the form and asks for the fact", () => {
    const decisions = [...bair.decisions, decision(bair, "decisions.scope.must_file_2555", true)];
    const run = evaluate(bair, without2555(bair), decisions);
    expect(run.files("form-2555")).toBe(true);
    expect(run.pending.pendingFacts).toContain(KEY);
  });

  it("a person who fails the test files no form (line 13a Yes, line 13b No)", () => {
    const residence = {
      ...answersOf(bair).bonaFideResidence!,
      nonresidentStatement: true,
      foreignIncomeTaxRequired: false,
    };
    const run = evaluate(bair, withAnswers(bair, { bonaFideResidence: residence }));
    expect(run.files("form-2555")).toBe(false);
  });

  it("a spouse's fact on a return that is not joint is left out", () => {
    const row = bair.facts.find((fact) => fact.key === KEY)!;
    const spouseRow = { ...row, id: "f-spouse", key: makeForeignEarnedIncomeFactKey("spouse") };
    const run = evaluate(bair, [...without2555(bair), spouseRow]);
    expect(run.files("form-2555")).toBe(false);
  });
});

describe("the answers Form 2555 waits for", () => {
  it("no test named: the form files and asks for the fact again", () => {
    const run = evaluate(bair, withAnswers(bair, { bonaFideResidence: undefined }));
    expect(run.files("form-2555")).toBe(true);
    expect(run.pending.pendingFacts).toContain(KEY);
    expect(run.value("schedule-1", "0.line.8d")).toBeUndefined();
  });

  it("line 20a with no answer about Schedule SE: line 44 waits", () => {
    const run = evaluate(romanda, withAnswers(romanda, { allSelfEmploymentOnForm: undefined }));
    expect(run.pending.pendingFacts).toContain(KEY);
    expect(
      run.value("form-2555", "2.line.44_deductions_allocable_excluded_income"),
    ).toBeUndefined();
  });

  it("other self-employment on Schedule SE: line 44 is a gap", () => {
    const run = evaluate(romanda, withAnswers(romanda, { allSelfEmploymentOnForm: false }));
    expect(run.isGap("form-2555", "2.line.44_deductions_allocable_excluded_income")).toBe(true);
    expect(run.isGap("schedule-1", "0.line.8d")).toBe(true);
  });
});

describe("the gaps", () => {
  it("a location Notice 2025-16 lists makes Parts VI to IX a gap", () => {
    const housing = { ...answersOf(bair).housing!, listedLocation: "London, United Kingdom" };
    const run = evaluate(bair, withAnswers(bair, { housing }));
    expect(run.isGap("form-2555", "2.line.29b_housing_expenses_limit")).toBe(true);
    expect(run.value("form-2555", "1.line.26_foreign_earned_income")).toBe(216_300);
    expect(run.isGap("schedule-1", "0.line.8d")).toBe(true);
  });

  it("a business where capital is material makes the form a gap", () => {
    const business = { ...answersOf(romanda).business!, capitalMaterial: true };
    const run = evaluate(romanda, withAnswers(romanda, { business }));
    expect(run.isGap("form-2555", "1.line.20a_business_or_profession_income")).toBe(true);
  });

  it("a currency the engine lacks makes the housing lines a gap", () => {
    const housing = { expenses: { amount: 1_000, currency: "XYZ" } };
    const run = evaluate(bair, withAnswers(bair, { housing }));
    expect(run.isGap("form-2555", "2.line.28_qualified_housing_expenses")).toBe(true);
  });
});

describe("the lines that take Form 2555's results", () => {
  const run = evaluate(bair, bair.facts);

  it("Schedule 1 line 8d is line 45, and line 9 subtracts it", () => {
    expect(run.value("schedule-1", "0.line.8d")).toBe(148_200);
    expect(run.value("schedule-1", "0.line.9")).toBe(-148_200);
  });

  it("Form 1040 line 16 is the Foreign Earned Income Tax Worksheet's line 6", () => {
    expect(run.value("form-1040", "line.16")).toBe(13_474);
  });

  it("Schedules 1-A and 8812 add lines 45 and 50 back to the modified AGI", () => {
    expect(run.value("schedule-1-a", "0.line.2b_form_2555_line_45")).toBe(148_200);
    expect(run.value("schedule-8812", "0.line.2b_form_2555_lines_45_50")).toBe(148_200);
  });

  it("Form 8960 line 13 adds back line 42", () => {
    expect(run.value("form-8960", "0.line.13")).toBe(81_600 + 130_000);
  });

  it("no additional child tax credit and no earned income credit with Form 2555", () => {
    expect(run.value("schedule-8812", "1.line.16a_line12_minus_line14")).toBeUndefined();
    expect(run.value("form-1040", "line.27a")).toBeUndefined();
  });

  it("the housing deduction reaches Schedule 1 line 24j and Schedule CA (romanda)", () => {
    const ca = evaluate(romanda, romanda.facts);
    expect(ca.value("schedule-1", "1.line.24j")).toBe(17_757);
    expect(ca.value("schedule-ca", "3.line.c24j_subtractions")).toBe(17_757);
    expect(ca.value("schedule-ca", "1.line.b8d_additions")).toBe(87_743);
  });
});
