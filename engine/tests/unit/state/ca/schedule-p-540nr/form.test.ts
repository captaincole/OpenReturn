/*
 * Schedule P (540NR) on a whole return: who files, the stated California part
 * of the ISO spread, the gaps of the forms figured for Form 540 only, the
 * non-itemizer path, Form 540NR lines 71 and 74, and that a return without
 * this schedule does not change. The synthetic pevin scenario (a part-year
 * resident who exercised ISOs and itemizes) is the base.
 */

import { describe, expect, it } from "vitest";
import {
  AMT_KEYS,
  CA_AMT_CALIFORNIA_KEYS,
  CA_MISC_DEDUCTION_KEYS,
  CA_PRIOR_YEAR_AMT_KEYS,
  INVESTMENT_INTEREST_KEYS,
  MORTGAGE_KEYS,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { pevinScenario as base } from "../../../../scenarios/synthetic/pevin/index.js";
import { pritalleScenario } from "../../../../scenarios/synthetic/pritalle/index.js";
import { tcbCa005Scenario } from "../../../../scenarios/tcb-ca-005/index.js";
import type { Scenario } from "../../../../types.js";

const categoryOf = (key: string) => (key.startsWith("ca_540nr.") ? "state_local_tax" : "other");

function evaluate(
  facts: Record<string, unknown> = {},
  decisions: Record<string, unknown> = {},
  scenario: Scenario = base,
) {
  const template = scenario.facts[0]!;
  const kept = scenario.facts.filter((fact) => !(fact.key in facts));
  const added: TaxFactRow[] = Object.entries(facts)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({
      ...template,
      id: `f-${key}`,
      key,
      category: scenario.facts.find((fact) => fact.key === key)?.category ?? categoryOf(key),
      value,
    }));
  const decided: AIDecisionRow[] = [
    ...scenario.decisions.filter((row) => !(row.decisionKey in decisions)),
    ...Object.entries(decisions)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) =>
        decisionRow({
          userId: scenario.userId,
          taxYear: scenario.taxYear,
          key,
          decision: value,
          rationale: "test",
        }),
      ),
  ];
  const result = evaluateScenario({
    filing: { id: "schedule-p-540nr-test", taxYear: scenario.taxYear },
    facts: [...kept, ...added],
    decisions: decided,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (id: string) => {
    const [formId] = id.split(".");
    return result.forms.get(formId!)?.fields.find((each) => each.fieldId === id)?.result;
  };
  const value = (id: string) => {
    const each = field(id);
    return each?.ok ? each.value : undefined;
  };
  const reason = (id: string) => {
    const each = field(id) as { ok: boolean; reason?: string } | undefined;
    return each && !each.ok ? each.reason : undefined;
  };
  return { result, files, field, value, reason, pending: pendingInputs(result) };
}

const SP = (line: string) => `schedule-p-540nr.${line}`;
const NR = (line: string) => `form-540nr.${line}`;
const ISO_PART = CA_AMT_CALIFORNIA_KEYS.isoExerciseSpread;
const ISO_KEY = base.facts.find((fact) => fact.key.includes(".iso_exercise."))!.key;

describe("who files", () => {
  it("a part-year resident with an ISO exercise files Schedule P (540NR), not Schedule P (540)", () => {
    const run = evaluate();
    expect(run.files("schedule-p-540nr")).toBe(true);
    expect(run.files("schedule-p")).toBe(false);
  });

  it("the explicit decision decides", () => {
    const run = evaluate({}, { "decisions.scope.must_file_schedule_p_540nr": false });
    expect(run.files("schedule-p-540nr")).toBe(false);
    expect(run.value(NR("2.line.71_alternative_minimum_tax"))).toBeUndefined();
  });

  it("a return that files no Form 540NR does not file it", () => {
    const run = evaluate({}, { "decisions.scope.must_file_540nr": false });
    expect(run.files("schedule-p-540nr")).toBe(false);
  });

  it("with no ISO exercise and the standard deduction it does not file (pritalle)", () => {
    const run = evaluate({}, {}, pritalleScenario);
    expect(run.files("schedule-p-540nr")).toBe(false);
    expect(run.value(NR("2.line.71_alternative_minimum_tax"))).toBeUndefined();
    expect(run.value(NR("2.line.74_total_tax"))).toBe(4613);
  });

  it("a full-year resident with an ISO exercise files Schedule P (540) only, unchanged (tcb-ca-005)", () => {
    const run = evaluate({}, {}, tcbCa005Scenario);
    expect(run.files("schedule-p-540nr")).toBe(false);
    expect(run.files("schedule-p")).toBe(true);
    expect(run.value("schedule-p.1.line.26_alternative_minimum_tax")).toBe(13446);
  });

  it("an itemizer with no ISO exercise files it, and owes no AMT", () => {
    const run = evaluate({ [ISO_KEY]: undefined, [AMT_KEYS.isoSharesHeldAtYearEnd]: undefined });
    expect(run.files("schedule-p-540nr")).toBe(true);
    expect(run.value(SP("0.line.10_iso_cqso"))).toBeUndefined();
    expect(run.value(SP("1.line.45_alternative_minimum_tax"))).toBe(0);
    expect(run.value(NR("2.line.71_alternative_minimum_tax"))).toBe(0);
    expect(run.value(NR("2.line.74_total_tax"))).toBe(run.value(NR("2.line.63_tax_after_credits")));
  });
});

describe("the California part of the ISO spread (line 29d)", () => {
  it("is asked while Part I line 10 holds a spread, never taken as 0", () => {
    const run = evaluate({ [ISO_PART]: undefined });
    expect(run.pending.pendingFacts).toContain(ISO_PART);
    expect(run.value(SP("1.line.29d_iso_cqso"))).toBeUndefined();
    expect(run.value(SP("1.line.29_adjustments_preferences_total"))).toBeUndefined();
    expect(run.value(SP("1.line.45_alternative_minimum_tax"))).toBeUndefined();
    expect(run.value(NR("2.line.71_alternative_minimum_tax"))).toBeUndefined();
  });

  it("a stated part flows to line 29 and lowers the AMT", () => {
    const all = evaluate();
    const part = evaluate({ [ISO_PART]: 50000 });
    expect(part.value(SP("1.line.29d_iso_cqso"))).toBe(50000);
    expect(part.value(SP("1.line.32_california_amt_agi"))).toBe(318250);
    expect(part.value(SP("1.line.45_alternative_minimum_tax")) as number).toBeLessThan(
      all.value(SP("1.line.45_alternative_minimum_tax")) as number,
    );
  });

  it("a stated 0 leaves line 29d blank and California AMTI without the spread", () => {
    const run = evaluate({ [ISO_PART]: 0 });
    expect(run.value(SP("1.line.29d_iso_cqso"))).toBeUndefined();
    expect(run.value(SP("1.line.32_california_amt_agi"))).toBe(268250);
    expect(run.value(SP("1.line.45_alternative_minimum_tax"))).toBe(0);
    // Part III line 3: "Subtract line 2 from line 1": regular tax above the TMT.
    const line1 = run.value(SP("2.part3.1_tax_from_form_540nr_line_42")) as number;
    const line2 = run.value(SP("2.part3.2_tentative_minimum_tax")) as number;
    expect(line1).toBeGreaterThan(line2);
    expect(run.value(SP("2.part3.3_excess_tax_offset_by_credits_col_c"))).toBe(line1 - line2);
  });

  it("shares sold in the year of exercise: line 10 and line 29d are gaps", () => {
    const run = evaluate({ [AMT_KEYS.isoSharesHeldAtYearEnd]: false });
    expect(run.field(SP("0.line.10_iso_cqso"))?.ok).toBe(false);
    expect(run.reason(SP("1.line.29d_iso_cqso"))).toContain("sold in the year of exercise");
  });
});

describe("Form 540NR lines 71 and 74 take the schedule's amounts", () => {
  it("line 71 is Part III line 25 and line 74 adds it", () => {
    const run = evaluate();
    const amt = run.value(SP("2.part3.25_adjusted_amt_col_c")) as number;
    expect(amt).toBe(7829);
    expect(run.value(NR("2.line.71_alternative_minimum_tax"))).toBe(amt);
    expect(run.value(NR("2.line.74_total_tax"))).toBe(
      (run.value(NR("2.line.63_tax_after_credits")) as number) + amt,
    );
  });

  it("Part III line 25 equals line 45 with no Section C credit", () => {
    const run = evaluate();
    expect(run.value(SP("2.part3.22_alternative_minimum_tax_col_c"))).toBe(
      run.value(SP("1.line.45_alternative_minimum_tax")),
    );
  });
});

describe("the non-itemizer path", () => {
  const standard = {
    "medical.expenses_total": 0,
    "state_local_tax.real_estate": 0,
    "charitable.cash": 0,
    [CA_MISC_DEDUCTION_KEYS.investmentFees]: 0,
    [MORTGAGE_KEYS.interestForm1098]: undefined,
    [MORTGAGE_KEYS.outstandingPrincipalForm1098]: undefined,
    [MORTGAGE_KEYS.originationDateForm1098]: undefined,
  };
  const standardDecisions = {
    "decisions.itemize_vs_standard": "standard",
    "decisions.scope.must_file_schedule_a": false,
  };

  it("line 1 holds the standard deduction, lines 33 to 39 are blank and line 40 is line 32", () => {
    const run = evaluate(standard, standardDecisions);
    expect(run.files("schedule-p-540nr")).toBe(true);
    expect(run.value(SP("0.line.1_standard_deduction"))).toBe(5706);
    expect(run.value(SP("1.line.33_itemized_deductions"))).toBeUndefined();
    expect(run.value(SP("1.line.38_amt_itemized_deduction_percentage"))).toBeUndefined();
    expect(run.value(SP("1.line.40_california_amti"))).toBe(
      run.value(SP("1.line.32_california_amt_agi")),
    );
  });

  it("investment interest enters no adjustment: line 14 keeps the standard deduction and the ISO spread", () => {
    // "If you did not itemize deductions and had investment interest expense, do not enter an adjustment" (::line-7…::b02).
    const run = evaluate(
      { ...standard, [INVESTMENT_INTEREST_KEYS.expensePaid]: 4000 },
      standardDecisions,
    );
    expect(run.reason(SP("0.line.7_investment_interest_adjustment"))).not.toContain("FTB 3526");
    expect(run.value(SP("0.line.7_investment_interest_adjustment"))).toBeUndefined();
    expect(run.value(SP("0.line.14_total_adjustments_preferences"))).toBe(205706);
    expect(run.value(SP("0.line.21_alternative_minimum_taxable_income"))).toBe(481000);
    expect(run.value(SP("1.line.24_total_tentative_minimum_tax"))).toBe(29508);
    expect(run.reason(SP("1.line.29a_investment_interest_expense"))).not.toContain("FTB 3526");
    expect(run.value(SP("1.line.45_alternative_minimum_tax"))).toBe(7653);
    expect(run.value(NR("2.line.71_alternative_minimum_tax"))).toBe(7653);
    expect(run.value(NR("2.line.74_total_tax"))).toBe(28627);
  });
});

describe("forms the engine figures for Form 540 only", () => {
  it("a credit for prior year AMT makes line 10 FTB 3510's gap, and Form 540NR lines 60 to 63 too", () => {
    const run = evaluate({ [CA_PRIOR_YEAR_AMT_KEYS.creditCarryover]: 3000 });
    expect(run.reason(SP("2.part3.10_prior_year_amt_credit_amount_col_a"))).toContain("FTB 3510");
    expect(run.reason(NR("2.line.63_tax_after_credits"))).toContain("FTB 3510");
    expect(run.value(SP("1.line.45_alternative_minimum_tax"))).toBe(7829);
  });

  it("investment interest makes Part I lines 7 and 14 FTB 3526's gap, and Form 540NR line 71 too", () => {
    const run = evaluate({ [INVESTMENT_INTEREST_KEYS.expensePaid]: 4000 });
    expect(run.reason(SP("0.line.7_investment_interest_adjustment"))).toContain("FTB 3526");
    expect(run.reason(SP("0.line.14_total_adjustments_preferences"))).toContain("FTB 3526");
    expect(run.reason(SP("1.line.34e_investment_interest_adjustment"))).toContain("FTB 3526");
    expect(run.value(NR("2.line.71_alternative_minimum_tax"))).toBeUndefined();
  });
});

describe("every field has its rule", () => {
  it("no field of the base return reports a read the maps do not name", () => {
    const run = evaluate();
    const form = run.result.forms.get("schedule-p-540nr")!;
    const threw = form.fields.filter((each) => {
      const result = each.result as { ok: boolean; reason?: string };
      return !result.ok && (result.reason ?? "").includes("threw");
    });
    expect(threw.map((each) => each.fieldId)).toEqual([]);
  });
});
