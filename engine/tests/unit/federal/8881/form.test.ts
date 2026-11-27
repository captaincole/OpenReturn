/*
 * Form 8881 on a whole return: who files, the deduction reductions on
 * Schedule C and Schedule F, the Form 3800 sources, the gaps, and "no facts,
 * nothing changes". The synthetic gill (a business, every line) and hari (a
 * farm) scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeGeneralBusinessCreditFactKey,
  makeSmallEmployerPlanFactKey,
  type GeneralBusinessCreditFactValue,
  type SmallEmployerPlanFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  CATERING_KEY,
  PLAN_KEY as GILL_PLAN_KEY,
  catering,
  plan as gillPlan,
} from "../../../scenarios/synthetic/gill/facts.js";
import { gillScenario as gill } from "../../../scenarios/synthetic/gill/index.js";
import { PLAN_KEY as HARI_PLAN_KEY } from "../../../scenarios/synthetic/hari/facts.js";
import { hariScenario as hari } from "../../../scenarios/synthetic/hari/index.js";
import type { Scenario } from "../../../types.js";

const isPlan = (fact: TaxFactRow) => fact.key.startsWith("small_employer_plan.");
const isK1 = (fact: TaxFactRow) => fact.category === "k1";

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (base: Scenario, category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

/* The facts with one fact's value replaced. */
const replaced = (facts: TaxFactRow[], key: string, value: unknown) =>
  facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));

const withPlan = (base: Scenario, key: string, value: SmallEmployerPlanFactValue) =>
  replaced(base.facts, key, value);

function evaluate(base: Scenario, facts: TaxFactRow[], decisions = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8881-test", taxYear: base.taxYear },
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
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line: (id: string) => value("form-8881", id), missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_8 = "0.line.8_total_part_i_credits";
const LINE_11 = "0.line.11_total_auto_enrollment_credit";
const LINE_15 = "0.line.15_total_military_spouse_credit";
const ROW_1J = "2.part3.1j_form_8881_part_i_col_g";
const ROW_1J_PASSIVE = "2.part3.1j_form_8881_part_i_col_d";
const ROW_1DD = "2.part3.1dd_form_8881_part_ii_col_g";
const ROW_1EE = "2.part3.1ee_form_8881_part_iii_col_g";
const LEGAL = "0.line.17";
const PENSION = "0.line.19";
const FARM_PENSION = "0.line.23_pension_profit_sharing";

describe("Form 8881 who files", () => {
  it("a plan fact files it; each part reaches its Form 3800 row and Schedule 3 line 6a", () => {
    const run = evaluate(gill, gill.facts);
    expect(run.files("form-8881")).toBe(true);
    expect([run.line(LINE_8), run.line(LINE_11), run.line(LINE_15)]).toEqual([6_710, 600, 1_040]);
    expect(run.value("form-3800", ROW_1J)).toBe(6_710);
    expect(run.value("form-3800", ROW_1DD)).toBe(600);
    expect(run.value("form-3800", ROW_1EE)).toBe(1_040);
    expect(run.value("schedule-3", "0.line.6a")).toBe(8_350);
  });

  it("a K-1 credit alone does not file it: the credits go directly on Form 3800 (general-instructions::b01)", () => {
    const run = evaluate(
      gill,
      gill.facts.filter((fact) => !isPlan(fact)),
    );
    expect(run.files("form-8881")).toBe(false);
    expect(run.value("form-3800", ROW_1J)).toBe(640);
    expect(run.value("form-3800", ROW_1DD)).toBe(100);
    expect(run.value("form-3800", ROW_1EE)).toBe(90);
  });

  it("the decision turns it off: only the K-1 credits reach Form 3800", () => {
    const off = [...gill.decisions, decision(gill, "decisions.scope.must_file_8881", false)];
    const run = evaluate(gill, gill.facts, off);
    expect(run.files("form-8881")).toBe(false);
    expect(run.value("form-3800", ROW_1J)).toBe(640);
  });

  it("a plan past every credit period leaves the return, and no deduction is reduced", () => {
    const old: SmallEmployerPlanFactValue = {
      ...gillPlan,
      startupCosts: { ...gillPlan.startupCosts!, creditYear: 4 },
      contributions: { ...gillPlan.contributions!, planYear: 6 },
      autoEnrollmentCreditYear: 4,
      militarySpouses: [{ participationYear: 4, contributions: 300 }],
    };
    const run = evaluate(gill, withPlan(gill, GILL_PLAN_KEY, old));
    expect(run.files("form-8881")).toBe(false);
    expect(run.value("schedule-c", LEGAL)).toBe(catering.expenses?.legalAndProfessional);
    expect(run.value("schedule-c", PENSION)).toBe(catering.expenses?.pensionAndProfitSharing);
  });

  it("only the parts with a credit print: Part II alone", () => {
    const partII: SmallEmployerPlanFactValue = {
      name: gillPlan.name,
      activityKey: CATERING_KEY,
      autoEnrollmentCreditYear: 2,
    };
    const facts = withPlan(gill, GILL_PLAN_KEY, partII).filter((fact) => !isK1(fact));
    const run = evaluate(gill, facts);
    expect(run.files("form-8881")).toBe(true);
    expect(run.line("0.line.9_auto_enrollment_credit")).toBe(500);
    expect(run.line(LINE_11)).toBe(500);
    expect(run.line(LINE_8)).toBeUndefined();
    expect(run.line(LINE_15)).toBeUndefined();
    expect(run.value("schedule-c", PENSION)).toBe(catering.expenses?.pensionAndProfitSharing);
  });
});

describe("the deductions that the credits reduce", () => {
  it("Schedule C line 17 loses line 5 and line 19 loses line 6g", () => {
    const run = evaluate(gill, gill.facts);
    expect(run.value("schedule-c", LEGAL)).toBe(26_500 - 1_900);
    expect(run.value("schedule-c", PENSION)).toBe(14_250 - 4_170);
  });

  it("Schedule F line 23 loses lines 5 and 6g when the costs sit in it", () => {
    const run = evaluate(hari, hari.facts);
    expect(run.line("0.line.5_smaller_of_2_or_4")).toBe(500);
    expect(run.line("0.line.6g_applicable_percentage_amount")).toBe(3_900);
    expect(run.value("schedule-f", FARM_PENSION)).toBe(6_150 - 500 - 3_900);
  });

  it("a reduction larger than the stated deduction stops at 0", () => {
    const small = {
      ...catering,
      expenses: { ...catering.expenses, pensionAndProfitSharing: 1_000 },
    };
    const run = evaluate(gill, replaced(gill.facts, CATERING_KEY, small));
    expect(run.value("schedule-c", PENSION)).toBe(0);
  });
});

describe("no plan facts, nothing changes", () => {
  it("Schedule C lines 17 and 19 are the stated amounts", () => {
    const run = evaluate(
      gill,
      gill.facts.filter((fact) => !isPlan(fact)),
    );
    expect(run.value("schedule-c", LEGAL)).toBe(26_500);
    expect(run.value("schedule-c", PENSION)).toBe(14_250);
  });

  it("Schedule F line 23 is the stated amount, and Form 3800 has no line 1j", () => {
    const run = evaluate(
      hari,
      hari.facts.filter((fact) => !isPlan(fact)),
    );
    expect(run.value("schedule-f", FARM_PENSION)).toBe(6_150);
    expect(run.files("form-8881")).toBe(false);
    expect(run.value("form-3800", ROW_1J)).toBeUndefined();
  });
});

describe("Form 3800 sources, gaps and waits", () => {
  it("a business without material participation makes a passive source, so Form 8582-CR files for it", () => {
    const passive = { ...catering, materiallyParticipated: false };
    const facts = replaced(gill.facts, CATERING_KEY, passive).filter((fact) => !isK1(fact));
    const run = evaluate(gill, facts);
    expect(run.files("form-8582-cr")).toBe(true);
    // A passive business's own line 31 waits on Form 8582, so the tax and Form 3800 wait on it.
    expect(run.value("form-3800", ROW_1J_PASSIVE)).toBeUndefined();
    expect(run.value("schedule-c", PENSION)).toBe(14_250 - 4_170);
  });

  it("with material participation, Form 8582-CR does not file", () => {
    expect(evaluate(gill, gill.facts).files("form-8582-cr")).toBe(false);
  });

  it("a sponsor that is not a business or farm of the return is a gap, never a dropped credit", () => {
    const elsewhere = { ...gillPlan, activityKey: "business.closed-bakery" };
    const run = evaluate(gill, withPlan(gill, GILL_PLAN_KEY, elsewhere));
    expect(run.files("form-8881")).toBe(true);
    expect(isGap(run.field("form-8881", "0.line.5_smaller_of_2_or_4"))).toBe(true);
    expect(isGap(run.field("form-8881", LINE_8))).toBe(true);
  });

  it("two plan facts are both asked again: all plans of one employer are one plan", () => {
    const second = row(gill, "self_employment", makeSmallEmployerPlanFactKey("second"), gillPlan);
    const run = evaluate(gill, [...gill.facts, second]);
    expect(run.files("form-8881")).toBe(true);
    expect(run.missing("form-8881")).toEqual(
      expect.arrayContaining([GILL_PLAN_KEY, makeSmallEmployerPlanFactKey("second")]),
    );
    expect(run.value("schedule-c", PENSION)).toBe(14_250);
  });

  it("a malformed plan fact files the form and is asked again", () => {
    const broken = { ...gillPlan, contributions: { planYear: 0, employees: [] } };
    const run = evaluate(hari, replaced(hari.facts, HARI_PLAN_KEY, broken));
    expect(run.files("form-8881")).toBe(true);
    expect(run.missing("form-8881")).toEqual([HARI_PLAN_KEY]);
  });

  it("the same credit stated on Form 3800 line 1j with no entity is a gap", () => {
    const stated: GeneralBusinessCreditFactValue = {
      sourceForm: "8881 Part I",
      line: "1j",
      amount: 6_070,
      passive: false,
    };
    const key = makeGeneralBusinessCreditFactKey("pension-startup");
    const run = evaluate(gill, [...gill.facts, row(gill, "other", key, stated)]);
    expect(isGap(run.field("form-3800", ROW_1J))).toBe(true);
  });
});
