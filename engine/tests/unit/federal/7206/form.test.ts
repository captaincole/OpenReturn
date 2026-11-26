/*
 * Form 7206 on a whole return: who files, the lines that read other forms
 * (Schedule 1 lines 15 and 16, W-2 box 5), the forms that take line 14
 * (Schedule 1 line 17, QBI on Form 8995), and the cases the engine does not
 * figure. The synthetic ispan scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  ADJUSTMENT_KEYS,
  makeBusinessFactKey,
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  makeSelfEmployedHealthPlanFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type SelfEmployedHealthPlanFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ispanScenario as base } from "../../../scenarios/synthetic/ispan/index.js";

const isPlan = (fact: TaxFactRow) => fact.key.startsWith("se_health_plan.");
const template = base.facts.find(isPlan)!;
const basePlan = template.value as SelfEmployedHealthPlanFactValue;
const businessFact = base.facts.find((fact) => fact.key.startsWith("business."))!;
const SEP = ADJUSTMENT_KEYS.selfEmployedPlanDeduction;

const plan = (slug: string, value: Partial<SelfEmployedHealthPlanFactValue> = {}): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeSelfEmployedHealthPlanFactKey(slug),
  value: { ...basePlan, ...value },
});

const extraFact = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});

const secondBusiness = (profit: number): TaxFactRow =>
  extraFact("self_employment", makeBusinessFactKey("corvane-drafting"), {
    ...(businessFact.value as BusinessFactValue),
    name: "Corvane Drafting",
    grossReceipts: profit,
    expenses: {},
  });

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
  drop: (fact: TaxFactRow) => boolean = isPlan,
) {
  const result = evaluateScenario({
    filing: { id: "form-7206-test", taxYear: base.taxYear },
    facts: [...base.facts.filter((fact) => !drop(fact)), ...facts],
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
  const gap = (formId: string, id: string) => {
    const found = field(formId, id) as { unsupported?: boolean } | undefined;
    return found?.unsupported === true;
  };
  const reason = (formId: string, id: string) =>
    (field(formId, id) as { reason?: string } | undefined)?.reason ?? "";
  return { files, value, gap, reason };
}

const LINE_17 = "1.line.17";
const QBI = "0.line.1i_c";
const line = (name: string) => `0.line.${name}`;
const LINE_5 = line("5_total_net_profits");
const LINE_6 = line("6_business_profit_ratio");
const LINE_9 = line("9_retirement_plan_deduction");
const LINE_11 = line("11_s_corp_medicare_wages");
const LINE_13 = line("13_earned_income_limit");
const LINE_14 = line("14_se_health_insurance_deduction");

describe("No plan fact: nothing changes", () => {
  it("Form 7206 does not file; Schedule 1 line 17 is blank, not a gap; AGI and QBI have no deduction", () => {
    const run = evaluate([]);
    expect(run.files("form-7206")).toBe(false);
    expect(run.value("schedule-1", LINE_17)).toBeUndefined();
    expect(run.gap("schedule-1", LINE_17)).toBe(false);
    expect(run.value("form-1040", "line.10")).toBe(23337);
    expect(run.value("form-8995", QBI)).toBe(94663);
  });
});

describe("Form 7206 who files", () => {
  it("files for long-term care premiums (the base scenario)", () => {
    const run = evaluate([plan("ppo")]);
    expect(run.files("form-7206")).toBe(true);
    expect(run.value("schedule-1", LINE_17)).toBe(16060);
  });

  it("one business and no long-term care: the worksheet, no form, the same line 17", () => {
    const run = evaluate([plan("ppo", { longTermCare: undefined })]);
    expect(run.files("form-7206")).toBe(false);
    expect(run.value("schedule-1", LINE_17)).toBe(14260);
  });

  it("an explicit decision false still wins, and line 17 keeps the worksheet amount", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_7206", false)];
    const run = evaluate([plan("ppo")], decisions);
    expect(run.files("form-7206")).toBe(false);
    expect(run.value("schedule-1", LINE_17)).toBe(16060);
  });

  it("a second business files the form (more than one source of self-employment income)", () => {
    const run = evaluate(
      [plan("ppo", { longTermCare: undefined }), secondBusiness(20000)],
      undefined,
      (fact) => isPlan(fact) || fact.key === SEP,
    );
    expect(run.files("form-7206")).toBe(true);
  });
});

describe("Lines 5, 6 and 9 with two businesses", () => {
  const dropPlanAndSep = (fact: TaxFactRow) => isPlan(fact) || fact.key === SEP;

  it("line 5 adds both profits and line 6 shares line 15", () => {
    const run = evaluate([plan("ppo"), secondBusiness(20000)], undefined, dropPlanAndSep);
    expect(run.value("form-7206", LINE_5)).toBe(138000);
    expect(run.value("form-7206", LINE_6)).toBe("0.8551");
    expect(run.value("form-7206", LINE_9)).toBe(0);
  });

  it("a losing business adds nothing to line 5", () => {
    const losing = extraFact("self_employment", makeBusinessFactKey("corvane-drafting"), {
      ...(businessFact.value as BusinessFactValue),
      name: "Corvane Drafting",
      grossReceipts: 1000,
      expenses: { supplies: 4000 },
      allInvestmentAtRisk: true,
    });
    const run = evaluate([plan("ppo"), losing], undefined, dropPlanAndSep);
    expect(run.value("form-7206", LINE_5)).toBe(118000);
    expect(run.value("form-7206", LINE_6)).toBe("1.0000");
  });

  it("a SEP deduction that names no business is a gap; a stated part fills line 9", () => {
    const gap = evaluate([plan("ppo"), secondBusiness(20000)], undefined, isPlan);
    expect(gap.gap("form-7206", LINE_14)).toBe(true);
    expect(gap.gap("schedule-1", LINE_17)).toBe(true);
    const stated = evaluate(
      [plan("ppo", { retirementPlanDeduction: 9000.4 }), secondBusiness(20000)],
      undefined,
      isPlan,
    );
    expect(stated.value("form-7206", LINE_9)).toBe(9000);
  });
});

describe("Line 11: a plan under an S corporation", () => {
  const W2_KEY = makeW2FactKey("corvane-studio-inc");
  const w2 = extraFact("wages", W2_KEY, {
    owner: "taxpayer",
    employerName: "Corvane Studio Inc",
    employerEin: "00-0072061",
    box1: 40000,
    box2: 4000,
    box3: 33000,
    box5: 33000,
  });
  const sCorpPlan = plan("s-corp", {
    establishedUnder: { kind: "s_corporation", factKey: W2_KEY },
    healthPremiums: 7000,
    longTermCare: undefined,
  });

  it("lines 4–10 are blank, line 13 is box 5, and the form files next to a Schedule C (DECISION)", () => {
    const run = evaluate([w2, sCorpPlan]);
    expect(run.files("form-7206")).toBe(true);
    expect(run.value("form-7206", LINE_5)).toBeUndefined();
    expect([run.value("form-7206", LINE_11), run.value("form-7206", LINE_13)]).toEqual([
      33000, 33000,
    ]);
    expect(run.value("schedule-1", LINE_17)).toBe(7000);
  });

  it("the plan's S corporation K-1 QBI is a gap", () => {
    const k1 = extraFact("k1", makeSCorporationK1FactKey("corvane-studio"), {
      form: "1120-S",
      entityName: "Corvane Studio Inc",
      entityEin: "00-0072061",
      boxes: [{ box: "1", amount: 5000 }],
      section199A: {
        businessName: "Corvane Studio Inc",
        qualifiedBusinessIncome: 5000,
        w2Wages: 33000,
        qualifiedPropertyUbia: 0,
      },
    });
    const holding = extraFact("k1", makeK1HoldingFactKey("corvane-studio"), {
      materiallyParticipated: true,
      allInvestmentAtRisk: true,
      stockBasisAtStart: 50000,
      stockAcquiredAs: "original_shareholder",
    });
    const run = evaluate([w2, sCorpPlan, k1, holding]);
    expect(run.reason("form-8995", "0.line.1ii_c")).toContain("established under an S corporation");
  });
});

describe("Cases the engine does not figure", () => {
  it("a partnership plan: lines and Schedule 1 line 17 are gaps", () => {
    const run = evaluate([
      plan("partner", { establishedUnder: { kind: "partnership", factKey: "k1.1065.any" } }),
    ]);
    expect(run.gap("form-7206", LINE_14)).toBe(true);
    expect(run.gap("schedule-1", LINE_17)).toBe(true);
  });

  it("a Marketplace plan with Form 8962 filing is a gap (Pub. 974)", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_8962", true)];
    const run = evaluate([plan("ppo", { throughMarketplace: true })], decisions);
    expect(run.gap("schedule-1", LINE_17)).toBe(true);
  });

  it("a Marketplace plan with no premium tax credit is figured as usual", () => {
    const run = evaluate([plan("ppo", { throughMarketplace: true })]);
    expect(run.value("schedule-1", LINE_17)).toBe(16060);
  });
});

describe("Line 14 takes QBI down (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b15)", () => {
  it("Form 8995 line 1(c) is line 31 less lines 15, 16 and 17", () => {
    const run = evaluate([plan("ppo")]);
    expect(run.value("form-8995", QBI)).toBe(118000 - 8337 - 15000 - 16060);
  });
});
