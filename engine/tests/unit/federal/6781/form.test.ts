/*
 * Form 6781 on a whole return: who files, the line 1 rows, the overflow case and
 * Schedule D lines 4 and 11. The synthetic hollis scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeSection1256ContractFactKey,
  makeSection1256StatementFactKey,
  type Section1256StatementFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { hollisScenario as base } from "../../../scenarios/synthetic/hollis/index.js";

const isSection1256 = (fact: TaxFactRow) => fact.category === "capital_gains";
const otherFacts = base.facts.filter((fact) => !isSection1256(fact));
const template = base.facts.find(isSection1256)!;

const statement = (slug: string, value: Section1256StatementFactValue): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeSection1256StatementFactKey(slug),
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

function evaluate(section1256: TaxFactRow[], extraDecisions: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "form-6781-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...section1256],
    decisions: [...base.decisions, ...extraDecisions],
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

const LINE_4 = "0.line.4_short_term_gain_other_forms";
const LINE_11 = "0.line.11_long_term_gain_other_forms";

describe("Form 6781 who files", () => {
  it("files, with Schedule D, when a section 1256 fact exists", () => {
    const run = evaluate([statement("one", { brokerName: "One", box11: 10 })]);
    expect([run.files("form-6781"), run.files("schedule-d"), run.files("form-8949")]).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(
      [statement("one", { brokerName: "One", box11: 10 })],
      [decision("decisions.scope.must_file_6781", false)],
    );
    expect(run.files("form-6781")).toBe(false);
  });
});

describe("Schedule D lines 4 and 11 with no Form 6781", () => {
  it("stay unsupported with the reasons they had before", () => {
    const run = evaluate([]);
    expect(run.files("form-6781")).toBe(false);
    expect(run.files("schedule-d")).toBe(false);
    const withSale = evaluate([], [decision("decisions.scope.must_file_schedule_d", true)]);
    const line4 = withSale.field("schedule-d", LINE_4);
    const line11 = withSale.field("schedule-d", LINE_11);
    expect(line4).toMatchObject({ ok: false, unsupported: true });
    expect(line11).toMatchObject({ ok: false, unsupported: true });
    expect(line4 && !line4.ok && line4.reason).toMatch(
      /^Requires data from Forms 6252, 4684, 6781/,
    );
    expect(line11 && !line11.ok && line11.reason).toMatch(/^Requires gain figures from Form 4797/);
  });
});

describe("Form 6781 rows and Schedule D", () => {
  it("a contract with no 1099-B is its own row", () => {
    const contract: TaxFactRow = {
      ...template,
      id: "f-contract",
      key: makeSection1256ContractFactKey("euro-fx"),
      value: { description: "Euro FX futures, no 1099-B", gainOrLoss: -1205 },
    };
    const run = evaluate([statement("one", { brokerName: "One", box11: 3000 }), contract]);
    expect(run.value("form-6781", "0.line.1_row2_col_a")).toBe("Euro FX futures, no 1099-B");
    expect(run.value("form-6781", "0.line.1_row2_col_b")).toBe(1205);
    expect(run.value("form-6781", "0.line.7_combine_lines_5_and_6")).toBe(1795);
    expect(run.value("schedule-d", LINE_4)).toBe(718);
    expect(run.value("schedule-d", LINE_11)).toBe(1077);
  });

  it("more than three statements: the rows are unsupported, the totals count every row", () => {
    const four = [1000, -250, 4001, -3].map((box11, index) =>
      statement(`broker-${index}`, { brokerName: `Broker ${index}`, box11 }),
    );
    const run = evaluate(four);
    expect(run.field("form-6781", "0.line.1_row1_col_c")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.value("form-6781", "0.line.2_total_col_b")).toBe(253);
    expect(run.value("form-6781", "0.line.2_total_col_c")).toBe(5001);
    expect(run.value("form-6781", "0.line.7_combine_lines_5_and_6")).toBe(4748);
    expect(run.value("schedule-d", LINE_4)).toBe(1899);
    expect(run.value("schedule-d", LINE_11)).toBe(2849);
  });

  it("a net loss reaches Schedule D as losses", () => {
    const run = evaluate([statement("one", { brokerName: "One", box8: -9000 })]);
    expect(run.value("form-6781", "0.line.6_loss_carried_back")).toBe(0);
    expect(run.value("schedule-d", LINE_4)).toBe(-3600);
    expect(run.value("schedule-d", LINE_11)).toBe(-5400);
    expect(run.value("schedule-d", "1.line.21_allowable_loss")).toBe(3000);
  });

  it("another form that feeds line 11 keeps line 11 unsupported", () => {
    const run = evaluate(
      [statement("one", { brokerName: "One", box11: 1000 })],
      [decision("decisions.scope.must_file_4797", true)],
    );
    expect(run.value("schedule-d", LINE_4)).toBe(400);
    expect(run.field("schedule-d", LINE_11)).toMatchObject({ ok: false, unsupported: true });
  });
});
