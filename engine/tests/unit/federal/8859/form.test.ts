/*
 * Form 8859 on a whole return: who files, what it asks, Credit Limit Worksheet
 * B line 14 or Form 1040 line 19 on worksheet line 2, Schedule 3 line 6h and
 * Schedule 8812 line 13, the case the engine leaves to a person, and "no
 * facts, nothing changes". The synthetic takima scenario is the base.
 */

import { describe, expect, it } from "vitest";
import { DC_HOMEBUYER_CREDIT_KEYS } from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { takimaScenario as base } from "../../../scenarios/synthetic/takima/index.js";

const KEY = DC_HOMEBUYER_CREDIT_KEYS.carryforwardFrom2024;
const carryFact = base.facts.find((fact) => fact.key === KEY)!;
const withoutCarry = base.facts.filter((fact) => fact.key !== KEY);
const withCarry = (amount: number, facts = withoutCarry): TaxFactRow[] => [
  ...facts,
  { ...carryFact, value: amount },
];

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const withDecision = (key: string, value: unknown, decisions = base.decisions) => [
  ...decisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8859-test", taxYear: base.taxYear },
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
  const lines = () =>
    [
      "0.line.1_credit_carryforward_from_2024",
      "0.line.2_tax_liability_limitation",
      "0.line.3_current_year_credit",
      "0.line.4_credit_carryforward_to_2026",
    ].map((id) => value("form-8859", id));
  return { files, field, value, lines, pending: pendingInputs(result) };
}

const LINE_6H = "0.line.6h";
const LINE_13 = "0.line.13_credit_limit_worksheet_a";
const WORKSHEET_2 = "0.worksheet.2_total_other_credits";

describe("Form 8859 who files and what it asks", () => {
  it("files with a carryforward above 0, and Schedule 3 files with it", () => {
    const run = evaluate(base.facts);
    expect([run.files("form-8859"), run.files("schedule-3")]).toEqual([true, true]);
    expect(run.pending.pendingFacts).toEqual([]);
  });

  it("does not file with a carryforward of 0", () => {
    const run = evaluate(withCarry(0));
    expect([run.files("form-8859"), run.files("schedule-3")]).toEqual([false, false]);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_8859", false));
    expect(run.files("form-8859")).toBe(false);
  });

  it("an explicit decision true with no carryforward asks for it, and line 1 waits", () => {
    const run = evaluate(withoutCarry, withDecision("decisions.scope.must_file_8859", true));
    expect(run.files("form-8859")).toBe(true);
    expect(run.pending.pendingFacts).toContain(KEY);
    expect(run.lines()).toEqual([undefined, undefined, undefined, undefined]);
  });
});

describe("Form 8859 lines with a qualifying child (Credit Limit Worksheet B)", () => {
  it("the tax limits the credit; worksheet line 2 is Worksheet B line 14", () => {
    const run = evaluate(base.facts);
    expect(run.lines()).toEqual([3800, 3045, 3045, 755]);
    expect(run.value("form-8859", WORKSHEET_2)).toBe(500);
    expect(run.value("schedule-3", LINE_6H)).toBe(3045);
    expect(run.value("schedule-8812", LINE_13)).toBe(500);
  });

  it("the credits never take Form 1040 line 22 below 0", () => {
    const run = evaluate(base.facts);
    const credits =
      Number(run.value("form-1040", "line.19")) + Number(run.value("form-1040", "line.20"));
    expect(credits).toBe(run.value("form-1040", "line.18"));
    expect(run.value("form-1040", "line.22")).toBe(0);
  });

  it("a carryforward under the limit is used in full; line 4 is 0", () => {
    const run = evaluate(withCarry(1000));
    expect(run.lines()).toEqual([1000, 3045, 1000, 0]);
    expect(run.value("schedule-8812", LINE_13)).toBe(2545);
    expect(run.value("form-1040", "line.19")).toBe(2200);
    expect(run.value("form-1040", "line.22")).toBe(345);
  });

  it("a carryforward with cents rounds on line 1", () => {
    expect(evaluate(withCarry(1000.5)).lines()[0]).toBe(1001);
  });
});

describe("Form 8859 lines with no qualifying child (Form 1040 line 19)", () => {
  const single = withDecision("decisions.scope.filing_status", "single");
  const noChild = withCarry(
    3800,
    withoutCarry.filter((fact) => fact.category !== "dependents"),
  );

  it("worksheet line 2 is Form 1040 line 19 (no credit here), and line 1 of the worksheet is line 18", () => {
    const run = evaluate(noChild, single);
    const line18 = Number(run.value("form-1040", "line.18"));
    expect(run.value("form-1040", "line.19")).toBeUndefined();
    expect(run.value("form-8859", WORKSHEET_2)).toBe(0);
    expect(run.value("form-8859", "0.worksheet.1_tax_liability_before_credits")).toBe(line18);
    expect(run.lines()).toEqual([
      3800,
      line18,
      Math.min(3800, line18),
      3800 - Math.min(3800, line18),
    ]);
  });
});

describe("Form 8859 gaps", () => {
  it("Form 2555 with a qualifying child: line 2 is unsupported, and Schedule 8812 line 13 leaves 6h out", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_2555", true));
    expect(run.field("form-8859", "0.line.2_tax_liability_limitation")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.field("schedule-3", LINE_6H)).toMatchObject({ ok: false, unsupported: true });
  });
});

describe("no Form 8859 facts, nothing changes", () => {
  it("Schedule 3 line 6h keeps its old reason, and the child tax credit is not limited by 6h", () => {
    const run = evaluate(withoutCarry, withDecision("decisions.scope.must_file_schedule_3", true));
    expect(run.files("form-8859")).toBe(false);
    expect(run.field("schedule-3", LINE_6H)).toMatchObject({
      ok: false,
      unsupported: true,
      reason: "No scenario uses this credit or payment yet.",
    });
    expect(run.value("schedule-8812", LINE_13)).toBe(3545);
    expect(run.value("form-1040", "line.19")).toBe(2200);
  });
});
