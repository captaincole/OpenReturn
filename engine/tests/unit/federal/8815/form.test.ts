/*
 * Form 8815 on a whole return: who files, Schedule B line 3, the line 9 cases
 * the engine does not figure, the stops, and the forms that read the
 * exclusion. The synthetic odessa scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  isSavingsBondCashedFactKey,
  isSavingsBondExpenseFactKey,
  makeSavingsBondExpenseFactKey,
  makeSocialSecurityFactKey,
  makeTraditionalIraFactKey,
  type SavingsBondExpenseFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { IRA_CONTRIBUTION_GAP } from "../../../../src/federal/8815/line9Gaps.js";
import { evaluateScenario } from "../../../../src/index.js";
import { socialSecurityTaxable } from "../../../../src/worksheets/socialSecurityBenefits.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { odessaScenario as base } from "../../../scenarios/synthetic/odessa/index.js";

const is8815Fact = (fact: TaxFactRow) =>
  isSavingsBondCashedFactKey(fact.key) || isSavingsBondExpenseFactKey(fact.key);
const otherFacts = base.facts.filter((fact) => !is8815Fact(fact));
const bondFacts = base.facts.filter((fact) => isSavingsBondCashedFactKey(fact.key));
const expenseFacts = base.facts.filter((fact) => isSavingsBondExpenseFactKey(fact.key));
const template = expenseFacts[0];

const row = (slug: string, value: Partial<SavingsBondExpenseFactValue>): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeSavingsBondExpenseFactKey(slug),
  value: { ...(template.value as SavingsBondExpenseFactValue), ...value },
});

const factRow = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8815-test", taxYear: base.taxYear },
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
  return { files, field, value };
}

const withDecision = (key: string, value: unknown) => [
  ...base.decisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

const LINE_3 = "0.line.3_excludable_savings_bond_interest";
const LINE_4 = "0.line.4_taxable_interest";
const LINE_14 = "0.line.14_excludable_bond_interest";

describe("Form 8815 who files", () => {
  it("files, with Schedule B, for qualified bonds and expenses", () => {
    const run = evaluate(base.facts);
    expect([run.files("form-8815"), run.files("schedule-b")]).toEqual([true, true]);
    expect(run.value("schedule-b", LINE_3)).toBe(1888);
  });

  it("does not file when married filing separately", () => {
    const run = evaluate(
      base.facts,
      withDecision("decisions.scope.filing_status", "married_filing_separately"),
    );
    expect(run.files("form-8815")).toBe(false);
  });

  it("does not file when line 4 is zero or less", () => {
    const covered = expenseFacts.map((fact) => {
      const value = fact.value as SavingsBondExpenseFactValue;
      return { ...fact, value: { ...value, nontaxableBenefits: value.qualifiedExpenses } };
    });
    expect(evaluate([...otherFacts, ...bondFacts, ...covered]).files("form-8815")).toBe(false);
  });

  it("does not file with only bonds that do not qualify", () => {
    const unqualified = bondFacts.map((fact) => ({
      ...fact,
      value: { ...(fact.value as object), ownerQualifies: false },
    }));
    expect(evaluate([...otherFacts, ...unqualified, ...expenseFacts]).files("form-8815")).toBe(
      false,
    );
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_8815", false));
    expect(run.files("form-8815")).toBe(false);
    expect(run.value("schedule-b", LINE_3)).toBeUndefined();
    expect(run.value("schedule-b", LINE_4)).toBe(14042);
  });
});

describe("no Form 8815 facts, nothing changes", () => {
  it("Schedule B line 3 is blank and line 4 is line 2", () => {
    const run = evaluate(otherFacts);
    expect(run.files("form-8815")).toBe(false);
    expect(run.field("schedule-b", LINE_3)?.ok).toBe(false);
    expect(run.value("schedule-b", LINE_4)).toBe(14042);
    expect(run.value("form-1040", "line.2b")).toBe(14042);
  });
});

describe("the stops", () => {
  it("line 9 at the joint limit: lines 10–14 blank, nothing excluded", () => {
    const raise = factRow("wages", "employer.extra-wages", {
      ...(otherFacts.find((fact) => fact.key === "employer.comstock-tile")!.value as object),
      employerName: "Extra Wages Co",
      box1: 10553,
    });
    const run = evaluate([...base.facts, raise]);
    expect(run.value("form-8815", "0.line.9_modified_adjusted_gross_income")).toBe(179250);
    expect(run.value("form-8815", "0.line.10_phaseout_threshold")).toBeUndefined();
    expect(run.value("form-8815", LINE_14)).toBeUndefined();
    expect(run.value("schedule-b", LINE_3)).toBeUndefined();
    expect(run.value("schedule-b", LINE_4)).toBe(14042);
  });

  it("more than three line 1 rows: the rows are unsupported, line 2 counts all", () => {
    const extra = row("extra-row", { studentName: "A Fourth Row", qualifiedExpenses: 1000 });
    const run = evaluate([...base.facts, extra]);
    expect(run.field("form-8815", "0.line.1_row1_col_a")).toMatchObject({ unsupported: true });
    expect(run.value("form-8815", "0.line.2_qualified_education_expenses")).toBe(19000);
  });
});

describe("line 9 cases the engine does not figure", () => {
  it("a traditional IRA contribution makes line 9, line 14 and Schedule B line 3 unsupported", () => {
    const ira = factRow("retirement", makeTraditionalIraFactKey("taxpayer"), {
      contributions: 3000,
    });
    const run = evaluate([...base.facts, ira]);
    expect(run.field("form-8815", "0.line.9_modified_adjusted_gross_income")).toMatchObject({
      unsupported: true,
      reason: IRA_CONTRIBUTION_GAP,
    });
    expect(run.field("form-8815", LINE_14)).toMatchObject({ unsupported: true });
    expect(run.field("schedule-b", LINE_3)).toMatchObject({ unsupported: true });
    expect(run.value("schedule-b", LINE_4)).toBe(14042);
  });

  it("Form 2555 filing makes line 9 unsupported", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_2555", true));
    expect(run.field("form-8815", "0.line.9_modified_adjusted_gross_income")).toMatchObject({
      unsupported: true,
    });
  });
});

describe("forms that read the exclusion", () => {
  it("Form 1040 line 2b is Schedule B line 4", () => {
    expect(evaluate(base.facts).value("form-1040", "line.2b")).toBe(12154);
  });

  it("line 6b takes Schedule B line 2, not line 2b (Pub. 915 Worksheet 1)", () => {
    const benefits = factRow("retirement", makeSocialSecurityFactKey("ssa"), {
      payerName: "SSA",
      box5: 18000,
    });
    const run = evaluate([...base.facts, benefits]);
    const expected = socialSecurityTaxable({
      benefits: 18000,
      otherIncome: 154700 + 14042,
      taxExemptInterest: 0,
      adjustments: 45,
      filingStatus: "married_filing_jointly",
    }).taxable;
    expect(run.value("form-1040", "line.6b")).toBe(expected);
    const line9 = run.value("form-8815", "0.line.9_modified_adjusted_gross_income");
    expect(line9).toBe(168697 + expected);
  });
});
