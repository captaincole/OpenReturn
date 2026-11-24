/*
 * FTB 3510 on a whole return: who files, what it asks, the stops, Schedule P
 * (540) line 10 and Form 540 line 43. The synthetic setalle scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CA_PRIOR_YEAR_AMT_KEYS,
  type CaPriorYearAmtExclusionsFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { setalleScenario as base } from "../../../../scenarios/synthetic/setalle/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const exclusionsOf = () =>
  base.facts.find((fact) => fact.key === CA_PRIOR_YEAR_AMT_KEYS.exclusions)!
    .value as CaPriorYearAmtExclusionsFactValue;

/* The base facts with each fact for a key replaced (undefined drops it). */
function factsWith(changes: Record<string, unknown>): TaxFactRow[] {
  return base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
}

const NO_3510_FACTS = {
  [CA_PRIOR_YEAR_AMT_KEYS.amt]: undefined,
  [CA_PRIOR_YEAR_AMT_KEYS.creditCarryover]: undefined,
  [CA_PRIOR_YEAR_AMT_KEYS.exclusions]: undefined,
};

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3510-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-3510", id);
  const missing = result.forms.get("form-3510")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

describe("FTB 3510 who files", () => {
  it("files with a 2024 AMT and a carryover, with Schedule P (540), and asks nothing", () => {
    const run = evaluate(base.facts);
    expect([run.files("form-3510"), run.files("schedule-p")]).toEqual([true, true]);
    expect(run.missing).toEqual([]);
  });

  it("no facts: no FTB 3510, no Schedule P, and Form 540 line 43 stays unsupported as on main", () => {
    const run = evaluate(factsWith(NO_3510_FACTS));
    expect([run.files("form-3510"), run.files("schedule-p")]).toEqual([false, false]);
    expect(isGap(run.field("form-540", "line.43_credit_amount"))).toBe(true);
    expect(isGap(run.field("form-540", "line.43_credit_name"))).toBe(true);
    expect(run.value("form-540", "line.48_tax_after_credits")).toBe(
      run.value("form-540", "line.35_total_tax_after_credits"),
    );
  });

  it("an explicit decision false wins", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_3510", false),
    ]);
    expect(run.files("form-3510")).toBe(false);
    expect(
      run.value("schedule-p", "2.part3.10_prior_year_amt_credit_amount_col_a"),
    ).toBeUndefined();
    expect(run.value("form-540", "line.43_credit_amount")).toBeUndefined();
  });

  it("an explicit decision true with nothing stated asks for the 2024 AMT and the carryover", () => {
    const run = evaluate(factsWith(NO_3510_FACTS), [
      ...base.decisions,
      decision("decisions.scope.must_file_3510", true),
    ]);
    expect(run.missing).toEqual([
      CA_PRIOR_YEAR_AMT_KEYS.amt,
      CA_PRIOR_YEAR_AMT_KEYS.creditCarryover,
    ]);
    expect(run.line("0.line.32_combine_lines_30_and_31")).toBeUndefined();
    expect(run.value("form-540", "line.47_total_credits")).toBeUndefined();
  });

  it("a 2024 AMT with no Part I figures asks for them, and the credit waits", () => {
    const run = evaluate(factsWith({ [CA_PRIOR_YEAR_AMT_KEYS.exclusions]: undefined }));
    expect(run.missing).toEqual([CA_PRIOR_YEAR_AMT_KEYS.exclusions]);
    expect(run.line("0.line.29_net_amt_on_exclusions")).toBeUndefined();
    expect(run.value("form-540", "line.48_tax_after_credits")).toBeUndefined();
  });

  it("Part I figures for a 2024 Form 540 with no regular tax are not complete", () => {
    const run = evaluate(
      factsWith({
        [CA_PRIOR_YEAR_AMT_KEYS.exclusions]: { ...exclusionsOf(), regularTax: undefined },
      }),
    );
    expect(run.missing).toEqual([CA_PRIOR_YEAR_AMT_KEYS.exclusions]);
  });

  it("a carryover alone files the form; Part I is blank and line 29 is 0", () => {
    const run = evaluate(
      factsWith({
        [CA_PRIOR_YEAR_AMT_KEYS.amt]: 0,
        [CA_PRIOR_YEAR_AMT_KEYS.exclusions]: undefined,
      }),
    );
    expect(run.files("form-3510")).toBe(true);
    expect(run.missing).toEqual([]);
    expect(run.line("0.line.1_prior_year_schedule_p_amounts")).toBeUndefined();
    expect([
      run.line("0.line.28_prior_year_amt"),
      run.line("0.line.29_net_amt_on_exclusions"),
    ]).toEqual([0, 0]);
    expect(run.line("0.line.38_prior_year_amt_credit")).toBe(1_200);
    expect(run.value("form-540", "line.43_credit_amount")).toBe(1_200);
  });

  it("line 32 at 0 or less: the form leaves the return and Form 540 has no credit", () => {
    const run = evaluate(
      factsWith({
        [CA_PRIOR_YEAR_AMT_KEYS.amt]: 1_000,
        [CA_PRIOR_YEAR_AMT_KEYS.creditCarryover]: 0,
      }),
    );
    // Line 29 (1,623) is more than the 2024 AMT: no deferral AMT, no credit.
    expect(run.files("form-3510")).toBe(false);
    expect(run.value("form-540", "line.43_credit_amount")).toBeUndefined();
    expect(run.value("form-540", "line.48_tax_after_credits")).toBe(
      run.value("form-540", "line.35_total_tax_after_credits"),
    );
  });
});

describe("FTB 3510 credit and the forms it reaches", () => {
  it("the whole credit is used: Schedule P line 10 and Form 540 lines 43, 47 and 48", () => {
    const run = evaluate(base.facts);
    const credit = run.line("0.line.38_prior_year_amt_credit");
    expect(credit).toBe(6_450);
    expect(run.value("schedule-p", "2.part3.10_prior_year_amt_credit_used_col_b")).toBe(credit);
    expect(run.value("schedule-p", "2.part3.10_prior_year_amt_credit_carryover_col_d")).toBe(0);
    expect(run.value("form-540", "line.43_credit_code")).toBe("188");
    expect(run.value("form-540", "line.47_total_credits")).toBe(credit);
    // Schedule P line 11, column (c) is the tax after the Section A credits, as Form 540 line 48.
    expect(run.value("schedule-p", "2.part3.11_tax_balance_col_c")).toBe(
      run.value("form-540", "line.48_tax_after_credits"),
    );
  });

  it("the credit is never more than line 37: the rest carries to 2026", () => {
    const run = evaluate(factsWith({ [CA_PRIOR_YEAR_AMT_KEYS.creditCarryover]: 20_000 }));
    const [line32, line37, line38, line39] = [
      "0.line.32_combine_lines_30_and_31",
      "0.line.37_line_35_minus_line_36",
      "0.line.38_prior_year_amt_credit",
      "0.line.39_amt_credit_carryover_to_2026",
    ].map((id) => run.line(id)) as number[];
    expect(line38).toBe(line37);
    expect(line38 + line39).toBe(line32);
    expect(run.value("schedule-p", "2.part3.10_prior_year_amt_credit_carryover_col_d")).toBe(
      line39,
    );
    expect(run.value("schedule-p", "2.part3.10_prior_year_amt_tax_balance_col_c")).toBe(0);
  });

  it("a 2025 Form 540NR filer: lines 33 to 39 are unsupported", () => {
    const decisions = base.decisions
      .filter((each) => each.decisionKey !== "decisions.scope.must_file_ca_540")
      .concat(decision("decisions.scope.must_file_540nr", true));
    const run = evaluate(base.facts, decisions);
    expect(run.files("form-3510")).toBe(true);
    expect(run.line("0.line.32_combine_lines_30_and_31")).toBe(6_450);
    expect(isGap(run.field("form-3510", "0.line.33_current_year_regular_tax"))).toBe(true);
    expect(isGap(run.field("form-3510", "0.line.38_prior_year_amt_credit"))).toBe(true);
  });
});
