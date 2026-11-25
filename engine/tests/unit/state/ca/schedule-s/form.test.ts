/*
 * Schedule S on a whole return: who files, what is asked, the copies, Form 540
 * line 43 (with and without Schedule P (540)) and the return with no Schedule S
 * facts. The synthetic elyas and morgase scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  isOtherStateTaxFactKey,
  makeOtherStateTaxFactKey,
  type OtherStateTaxFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { elyasScenario as elyas } from "../../../../scenarios/synthetic/elyas/index.js";
import { morgaseScenario as morgase } from "../../../../scenarios/synthetic/morgase/index.js";
import type { Scenario } from "../../../../types.js";

const isOtherState = (fact: TaxFactRow) => isOtherStateTaxFactKey(fact.key);
const template = elyas.facts.find(isOtherState)!;
const massachusetts = template.value as OtherStateTaxFactValue;

const otherState = (slug: string, value: Partial<OtherStateTaxFactValue> = {}): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeOtherStateTaxFactKey(slug),
  value: { ...massachusetts, ...value },
});

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({ userId: base.userId, taxYear: base.taxYear, key, decision: value, rationale: "t" });

function evaluate(base: Scenario, stateFacts: TaxFactRow[], extra: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "schedule-s-test", taxYear: base.taxYear },
    facts: [...base.facts.filter((fact) => !isOtherState(fact)), ...stateFacts],
    decisions: [
      ...base.decisions.filter(
        (each) => !extra.some((one) => one.decisionKey === each.decisionKey),
      ),
      ...extra,
    ],
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
  const gap = (formId: string, id: string) =>
    (field(formId, id) as { unsupported?: boolean } | undefined)?.unsupported === true;
  const asked = () => result.forms.get("schedule-s")?.missingInputs ?? [];
  return { files, value, gap, asked };
}

const SCHEDULE_S = "schedule-s";
const LINE_12 = "0.line.12_other_state_tax_credit";
const credits540 = (run: ReturnType<typeof evaluate>) =>
  ["line.43_credit_amount", "line.47_total_credits", "line.48_tax_after_credits"].map((id) =>
    run.value("form-540", id),
  );

describe("Schedule S who files", () => {
  it("files on Form 540 with tax paid to a state California allows", () => {
    expect(evaluate(elyas, [template]).files(SCHEDULE_S)).toBe(true);
  });

  it("does not file for a state outside the list (Oregon, Texas)", () => {
    expect(evaluate(elyas, [otherState("or", { state: "OR" })]).files(SCHEDULE_S)).toBe(false);
    expect(evaluate(elyas, [otherState("tx", { state: "TX" })]).files(SCHEDULE_S)).toBe(false);
  });

  it("files for Oregon on a group nonresident return", () => {
    const run = evaluate(elyas, [otherState("or", { state: "OR", groupNonresidentReturn: true })]);
    expect(run.files(SCHEDULE_S)).toBe(true);
  });

  it("does not file with no tax paid", () => {
    expect(evaluate(elyas, [otherState("ma", { taxPaid: 0 })]).files(SCHEDULE_S)).toBe(false);
  });

  it("does not file without Form 540", () => {
    const run = evaluate(
      elyas,
      [template],
      [decision(elyas, "decisions.scope.must_file_ca_540", false)],
    );
    expect(run.files(SCHEDULE_S)).toBe(false);
  });

  it("an explicit decision false still wins, and line 43 stays unsupported", () => {
    const run = evaluate(
      elyas,
      [template],
      [decision(elyas, "decisions.scope.must_file_schedule_s", false)],
    );
    expect(run.files(SCHEDULE_S)).toBe(false);
    expect(run.gap("form-540", "line.43_credit_amount")).toBe(true);
  });
});

describe("with no Schedule S facts, Form 540 is unchanged", () => {
  it("line 43 is unsupported, line 47 is blank and line 48 is line 35", () => {
    const run = evaluate(elyas, []);
    expect(run.files(SCHEDULE_S)).toBe(false);
    for (const id of ["line.43_credit_name", "line.43_credit_code", "line.43_credit_amount"]) {
      expect(run.gap("form-540", id)).toBe(true);
    }
    expect(run.value("form-540", "line.47_total_credits")).toBeUndefined();
    expect(run.value("form-540", "line.48_tax_after_credits")).toBe(
      run.value("form-540", "line.35_total_tax_after_credits"),
    );
  });

  it("Schedule P (540) line 20 stays unsupported", () => {
    const run = evaluate(morgase, []);
    expect(run.files("schedule-p")).toBe(true);
    expect(run.gap("schedule-p", "3.part3.20_other_state_tax_credit_used_col_b")).toBe(true);
    expect(run.value("form-540", "line.48_tax_after_credits")).toBe(
      run.value("form-540", "line.35_total_tax_after_credits"),
    );
  });
});

describe("Schedule S asks for a missing amount", () => {
  it("lists the fact while the tax paid is missing, and the credit lines wait", () => {
    const run = evaluate(elyas, [otherState("ma", { taxPaid: undefined as unknown as number })]);
    expect(run.files(SCHEDULE_S)).toBe(true);
    expect(run.asked()).toEqual([makeOtherStateTaxFactKey("ma")]);
    expect(run.value(SCHEDULE_S, LINE_12)).toBeUndefined();
    expect(credits540(run)).toEqual([undefined, undefined, undefined]);
  });
});

describe("Schedule S on Form 540 line 43", () => {
  it("with no Schedule P, line 43 is line 12 with the name and code 187", () => {
    const run = evaluate(elyas, [template]);
    expect(run.value("form-540", "line.43_credit_name")).toBe("Other State Tax");
    expect(run.value("form-540", "line.43_credit_code")).toBe("187");
    expect(credits540(run)).toEqual([1450, 1450, 3141]);
  });

  it("adds the line 12 of every state's copy", () => {
    const run = evaluate(elyas, [template, otherState("ny", { state: "NY", taxPaid: 900 })]);
    // New York copy: line 6 is 1,450 again, line 11 is 900.
    expect(credits540(run)).toEqual([2350, 2350, 4591 - 2350]);
    expect(run.value(SCHEDULE_S, LINE_12)).toBe(1450);
  });

  it("with Schedule P (540), line 43 is line 20 column (b) and column (c) is the balance", () => {
    const run = evaluate(morgase, morgase.facts.filter(isOtherState));
    const lineP = (id: string) => run.value("schedule-p", `3.part3.20_${id}`);
    expect([
      lineP("other_state_tax_credit_amount_col_a"),
      lineP("other_state_tax_credit_used_col_b"),
      lineP("other_state_tax_tax_balance_col_c"),
    ]).toEqual([4420, 4420, 22402 - 4420]);
    expect(credits540(run)).toEqual([4420, 4420, 17982]);
  });
});

describe("Schedule S Part I rows", () => {
  it("a fourth item makes row 3 unsupported and line 1 still adds every item", () => {
    const items = [1, 2, 3, 4].map((count) => ({
      description: `Item ${count}`,
      californiaAmount: 1000 * count,
      otherStateAmount: 1000 * count,
    }));
    const run = evaluate(elyas, [otherState("ma", { items })]);
    expect(run.value(SCHEDULE_S, "0.part1.row2_taxable_by_california_col_b")).toBe(2000);
    expect(run.gap(SCHEDULE_S, "0.part1.row3_taxable_by_california_col_b")).toBe(true);
    expect(run.value(SCHEDULE_S, "0.line.1_total_double_taxed_income_col_b")).toBe(10000);
  });
});
