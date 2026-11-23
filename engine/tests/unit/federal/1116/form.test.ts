/*
 * Form 1116 on a whole return: who files, the election, the two copies, the
 * answers it asks for, the gaps, and the forms that take its result (Schedule 3
 * line 1, Form 1040 line 20). The synthetic rand scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  PRIOR_YEAR_KEYS,
  makeDividendFactKey,
  makeForeignIncomeStatementKey,
  makeStatedForeignTaxKey,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { form1116Set } from "../../../../src/federal/1116/copies.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { faileScenario } from "../../../scenarios/synthetic/faile/index.js";
import { randScenario as base } from "../../../scenarios/synthetic/rand/index.js";

const FORM = "form-1116";
const UNSUPPORTED = { ok: false, unsupported: true };

const isForeign = (fact: TaxFactRow) =>
  fact.category === "foreign" ||
  fact.key.startsWith("prior_year.foreign") ||
  fact.key.endsWith(".foreign_income") ||
  (fact.category === "investment_income" &&
    typeof (fact.value as { box7?: unknown }).box7 === "number") ||
  (fact.category === "investment_income" &&
    typeof (fact.value as { box6?: unknown }).box6 === "number");
const withoutForeign = base.facts.filter((fact) => !isForeign(fact));

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0],
  id: `f-${key}`,
  category,
  key,
  value,
});

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-1116-test", taxYear: base.taxYear },
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
  const values: Record<string, unknown> = {};
  for (const form of result.forms.values()) {
    for (const each of form.fields) if (each.result.ok) values[each.fieldId] = each.result.value;
  }
  const set = () => form1116Set(values, result.filingInfo);
  const missing = result.forms.get(FORM)?.missingInputs ?? [];
  return { files, field, value, set, missing };
}

const dividend = (slug: string, box7: number, box1a = 2000): TaxFactRow =>
  row("investment_income", makeDividendFactKey(slug), {
    payerName: `${slug} fund`,
    box1a,
    box1b: box1a,
    box7,
  });

describe("no foreign tax: nothing changes", () => {
  it("Form 1116 does not file and Schedule 3 line 1 is blank", () => {
    const run = evaluate(withoutForeign);
    expect(run.files(FORM)).toBe(false);
    expect(run.files("schedule-3")).toBe(false);
    expect(run.value("form-1040", "line.20")).toBeUndefined();
  });
});

describe("the rand return: two copies", () => {
  const run = evaluate(base.facts);

  it("files, with the general copy first (the larger line 24) and Part IV on it", () => {
    const set = run.set() as Exclude<ReturnType<typeof run.set>, undefined | { unsupported: true }>;
    expect(set.copies.map((copy) => copy.category)).toEqual(["general", "passive"]);
    expect(set.copies.map((copy) => copy.line24)).toEqual([7828, 3275]);
    expect(run.value(FORM, "0.header.d_general_category_income")).toBe(true);
    expect(run.value(FORM, "1.line.27_credit_passive_category_income")).toBe(3275);
    expect(run.value(FORM, "1.line.35_foreign_tax_credit")).toBe(11103);
  });

  it("Schedule 3 line 1 and Form 1040 line 20 take line 35", () => {
    expect(run.files("schedule-3")).toBe(true);
    expect(run.value("schedule-3", "0.line.1")).toBe(11103);
    expect(run.value("form-1040", "line.20")).toBe(11103);
    expect(run.value("form-1040", "line.22")).toBe(37472 - 11103);
  });

  it("asks nothing more: every answer is stated", () => {
    expect(run.missing).toEqual([]);
  });

  it("the passive copy adjusts the qualified dividends; line 18 is the worksheet's line 12", () => {
    const set = run.set() as {
      copies: Array<{ partI: Array<{ line1a: number; line3d: number }> }>;
    };
    const passive = set.copies[1].partI;
    expect(passive.map((column) => [column.line1a, column.line3d])).toEqual([
      [14148, 26880],
      [1277, 3150],
      [4280, 4280],
    ]);
    expect(run.value(FORM, "1.line.18_taxable_income_all_sources")).toBe(179720);
  });
});

describe("who files, and the election", () => {
  it("$300 or less, all on 1099s: the election, no Form 1116, Schedule 3 line 1 the tax", () => {
    const run = evaluate([...withoutForeign, dividend("small", 300)]);
    expect(run.files(FORM)).toBe(false);
    expect(run.value("schedule-3", "0.line.1")).toBe(300);
  });

  it("$300.01: Form 1116 files", () => {
    const run = evaluate([...withoutForeign, dividend("small", 300.01)]);
    expect(run.files(FORM)).toBe(true);
  });

  it("a joint return may elect up to $600", () => {
    const joint = base.decisions.map((each) =>
      each.decisionKey === "decisions.scope.filing_status"
        ? { ...each, decision: "married_filing_jointly" }
        : each,
    );
    const facts = [...withoutForeign, dividend("small", 600)];
    expect(evaluate(facts, joint).files(FORM)).toBe(false);
  });

  it("a stated tax with no payee statement ends the election", () => {
    const stated = base.facts.find((fact) => fact.category === "foreign")!;
    const small = { ...(stated.value as object), foreignTaxPaid: 50 };
    const run = evaluate([...withoutForeign, row("foreign", stated.key, small)]);
    expect(run.files(FORM)).toBe(true);
  });

  it("a stated carryover above 0 files Form 1116 instead of the election", () => {
    const carryover = row("other", PRIOR_YEAR_KEYS.foreignTaxCarryoverPassive, 40);
    const run = evaluate([...withoutForeign, dividend("small", 100), carryover]);
    expect(run.files(FORM)).toBe(true);
  });

  it("the explicit decision wins: true files the form instead of the election", () => {
    const run = evaluate(
      [...withoutForeign, dividend("small", 100)],
      [...base.decisions, decision("decisions.scope.must_file_1116", true)],
    );
    expect(run.files(FORM)).toBe(true);
  });

  it("false with no election: no credit, Schedule 3 line 1 blank (a choice, not a gap)", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_1116", false),
    ]);
    expect(run.files(FORM)).toBe(false);
    expect(run.field("schedule-3", "0.line.1")).not.toMatchObject(UNSUPPORTED);
  });

  it("faile: the election puts $150 on Schedule 3 line 1 with no Form 1116", () => {
    const run = evaluate(faileScenario.facts, faileScenario.decisions);
    expect(run.files(FORM)).toBe(false);
    expect(run.value("schedule-3", "0.line.1")).toBe(150);
  });
});

describe("the answers a filed Form 1116 asks for", () => {
  it("a 1099 with foreign tax and no foreign income statement: the statement is asked for, Part I waits", () => {
    const key = makeForeignIncomeStatementKey(makeDividendFactKey("larchmont-international"));
    const run = evaluate(base.facts.filter((fact) => fact.key !== key));
    expect(run.missing).toContain(key);
    expect(run.value(FORM, "0.line.7_net_foreign_source_income")).toBeUndefined();
    expect(run.field(FORM, "0.line.7_net_foreign_source_income")).not.toMatchObject(UNSUPPORTED);
  });

  it("the carryover and the loss-account answers are asked for", () => {
    const run = evaluate(base.facts.filter((fact) => !fact.key.startsWith("prior_year.foreign")));
    expect(run.missing).toEqual(
      expect.arrayContaining([
        PRIOR_YEAR_KEYS.foreignTaxCarryoverPassive,
        PRIOR_YEAR_KEYS.foreignTaxCarryoverGeneral,
        PRIOR_YEAR_KEYS.foreignLossAccounts,
      ]),
    );
  });
});

describe("the gaps", () => {
  const replaced = (key: string, value: unknown) =>
    base.facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));

  it("a loss account from an earlier year: line 16 and the credit are gaps, Part II still prints", () => {
    // With every line 24 a gap, the copies keep category order: passive first.
    const run = evaluate(replaced(PRIOR_YEAR_KEYS.foreignLossAccounts, true));
    expect(run.field(FORM, "1.line.16_adjustments_to_line_15")).toMatchObject(UNSUPPORTED);
    expect(run.field(FORM, "1.line.35_foreign_tax_credit")).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-3", "0.line.1")).toMatchObject(UNSUPPORTED);
    expect(run.value(FORM, "0.line.8_total_foreign_taxes_paid")).toBe(3338);
  });

  it("Form 2555: lines 12 and Part I are gaps", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_2555", true),
    ]);
    expect(run.field(FORM, "1.line.12_reduction_in_foreign_taxes")).toMatchObject(UNSUPPORTED);
    expect(run.field(FORM, "0.line.7_net_foreign_source_income")).toMatchObject(UNSUPPORTED);
  });

  it("a category other than passive or general: the whole form is a gap", () => {
    const stated = base.facts.find((fact) => fact.category === "foreign")!;
    const branch = { ...(stated.value as object), category: "foreign_branch" };
    const run = evaluate(replaced(stated.key, branch));
    expect(run.field(FORM, "1.line.35_foreign_tax_credit")).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-3", "0.line.1")).toMatchObject(UNSUPPORTED);
  });

  it("the decision files Form 1116 with no foreign tax: a gap, not a blank", () => {
    const run = evaluate(withoutForeign, [
      ...base.decisions,
      decision("decisions.scope.must_file_1116", true),
    ]);
    expect(run.field("schedule-3", "0.line.1")).toMatchObject(UNSUPPORTED);
  });

  it("passive tax above 37% of the column's income: line 13 (high-taxed income) is a gap", () => {
    const key = makeDividendFactKey("northgate-brokerage");
    const dutch = base.facts.find((fact) => fact.key === key)!;
    const run = evaluate(replaced(key, { ...(dutch.value as object), box7: 1500 }));
    expect(run.field(FORM, "1.line.13_taxes_reclassified_high_tax_kickout")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("the UK fact keeps its key shape", () => {
    expect(
      base.facts.some((fact) => fact.key === makeStatedForeignTaxKey("uk-assignment-2025")),
    ).toBe(true);
  });
});

describe("Form 6251 with Form 1116", () => {
  it("the AMT foreign tax credit needs AMT Forms 1116: lines 8 and 11 are gaps when AMT may apply", () => {
    const iso = row("amt", "amt.iso_exercise_spread", 9000);
    const run = evaluate(
      [...base.facts, iso],
      [...base.decisions, decision("decisions.scope.must_file_6251", true)],
    );
    expect(run.value("form-6251", "0.line.10_regular_tax_less_credits")).toBe(37472 - 11103);
    const line7 = run.value("form-6251", "0.line.7_tax_on_line_6") as number;
    expect(line7).toBeGreaterThan(37472 - 11103);
    expect(run.field("form-6251", "0.line.8_amt_foreign_tax_credit")).toMatchObject(UNSUPPORTED);
    expect(run.field("form-6251", "0.line.11_amt")).toMatchObject(UNSUPPORTED);
  });
});

describe("the adjustment exception", () => {
  it("foreign qualified dividends under $20,000 and line 5 under the limit: no adjustment", () => {
    const key = makeForeignIncomeStatementKey(makeDividendFactKey("larchmont-international"));
    const smaller = base.facts.map((fact) =>
      fact.key === key ? { ...fact, value: { grossIncome: 9000, qualifiedDividends: 7000 } } : fact,
    );
    const run = evaluate(smaller);
    const set = run.set() as {
      copies: Array<{ category: string; partI: Array<{ line1a: number }> }>;
    };
    const passive = set.copies.find((copy) => copy.category === "passive")!;
    expect(passive.partI[0].line1a).toBe(9000);
    // Line 18 is taxable income for the limit: 1040 line 11b − line 14.
    expect(run.value(FORM, "1.line.18_taxable_income_all_sources")).toBe(
      (run.value("form-1040", "line.15") as number) + 0,
    );
  });
});
