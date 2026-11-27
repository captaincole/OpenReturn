/*
 * FTB 3809 on a whole return: who files, what it asks, the operator and
 * investor branches, the NOL suspension, the gaps, the credit through Form
 * 540 lines 43 to 48, Schedule S line 2 and Schedule P (540) Section B2, and
 * "no facts, nothing changes". The synthetic zarya scenario is the base (no
 * Schedule P); toveine and kiruna are the others.
 */

import { describe, expect, it } from "vitest";
import {
  CA_TTA_KEYS,
  isCaPassiveCreditFactKey,
  type CaTtaBusinessFactValue,
  type CaTtaBusinessIncomeFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { kirunaScenario } from "../../../../scenarios/synthetic/kiruna/index.js";
import { toveineScenario } from "../../../../scenarios/synthetic/toveine/index.js";
import { zaryaScenario as base } from "../../../../scenarios/synthetic/zarya/index.js";
import type { Scenario } from "../../../../types.js";

const TTA_KEYS: string[] = Object.values(CA_TTA_KEYS);
const withoutTta = (facts: TaxFactRow[]) => facts.filter((fact) => !TTA_KEYS.includes(fact.key));
const factOf = (scenario: Scenario, key: string) =>
  scenario.facts.find((fact) => fact.key === key) as TaxFactRow;

const row = (scenario: Scenario, key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: scenario.userId,
  taxYear: scenario.taxYear,
  category: "state_local_tax",
  key,
  value,
  sourceNote: "test",
  createdAt: "2026-11-26T00:00:00Z",
});

/* The base facts with some TTA facts replaced; null drops a key. */
function withTta(overrides: Record<string, unknown>, scenario: Scenario = base): TaxFactRow[] {
  const kept = scenario.facts.filter((fact) => !(fact.key in overrides));
  const added = Object.entries(overrides)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => row(scenario, key, value));
  return [...kept, ...added];
}

const decision = (scenario: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: scenario.userId,
    taxYear: scenario.taxYear,
    key,
    decision: value,
    rationale: "t",
  });
const withDecision = (key: string, value: unknown, scenario: Scenario = base) => [
  ...scenario.decisions.filter((each) => each.decisionKey !== key),
  decision(scenario, key, value),
];

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3809-test", taxYear: base.taxYear },
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
  const side1 = (id: string) => value("form-3809", `0.${id}`);
  const scheduleZ = (id: string) => value("form-3809", `1.line.${id}`);
  const form540 = (id: string) => value("form-540", `line.${id}`);
  const missing = result.forms.get("form-3809")?.missingInputs ?? [];
  return { files, field, value, side1, scheduleZ, form540, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;
const reasonOf = (result: unknown) => (result as { reason?: string } | undefined)?.reason ?? "";

const business = factOf(base, CA_TTA_KEYS.business).value as CaTtaBusinessFactValue;
const NINE_B_THREE = "2.line.b9b3_subtractions";

describe("FTB 3809 who files", () => {
  it("files with zarya's and toveine's carryovers and asks nothing", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-3809")).toBe(true);
    expect(run.missing).toEqual([]);
    const toveine = evaluate(toveineScenario.facts, toveineScenario.decisions);
    expect(toveine.files("form-3809")).toBe(true);
    expect(toveine.missing).toEqual([]);
  });

  it("files with one carryover alone: a hiring credit, a sales or use tax credit, an NOL", () => {
    const none = { rows: [] };
    const hiring = withTta({ [CA_TTA_KEYS.nolCarryovers]: none });
    expect(evaluate(hiring).files("form-3809")).toBe(true);
    const sales = withTta({
      [CA_TTA_KEYS.hiringCreditCarryover]: 0,
      [CA_TTA_KEYS.salesUseTaxCreditCarryover]: 700,
      [CA_TTA_KEYS.nolCarryovers]: none,
    });
    expect(evaluate(sales).side1("line.1b_sales_use_tax_credit_carryover")).toBe(700);
    const nol = withTta({ [CA_TTA_KEYS.hiringCreditCarryover]: 0 });
    const run = evaluate(nol);
    expect(run.files("form-3809")).toBe(true);
    // No credit carryover: Schedule Z and Part I stay blank.
    expect(run.side1("line.1a_hiring_credit_carryover")).toBeUndefined();
    expect(run.scheduleZ("7_tta_business_income_limitation")).toBeUndefined();
    expect(run.side1("line.3b_nol_deduction_current_year")).toBe(23000);
  });

  it("does not file with carryovers of 0, without a California return, or when the decision says no", () => {
    const zero = withTta({
      [CA_TTA_KEYS.hiringCreditCarryover]: 0,
      [CA_TTA_KEYS.nolCarryovers]: { rows: [{ lossYear: 2009, carryover: 0 }] },
    });
    expect(evaluate(zero).files("form-3809")).toBe(false);
    const no540 = withDecision("decisions.scope.must_file_ca_540", false);
    expect(evaluate(base.facts, no540).files("form-3809")).toBe(false);
    const no = withDecision("decisions.scope.must_file_3809", false);
    expect(evaluate(base.facts, no).files("form-3809")).toBe(false);
  });
});

describe("FTB 3809 asks", () => {
  it("lists each missing answer while the form files", () => {
    const run = evaluate(
      withTta({
        [CA_TTA_KEYS.business]: null,
        [CA_TTA_KEYS.businessIncome]: null,
        [CA_TTA_KEYS.salesUseTaxCreditCarryover]: null,
      }),
    );
    // Section A waits for the role: only an operator completes it.
    expect(run.missing).toEqual([
      CA_TTA_KEYS.business,
      CA_TTA_KEYS.businessIncome,
      CA_TTA_KEYS.salesUseTaxCreditCarryover,
    ]);
    expect(run.side1("line.1a_hiring_credit_carryover")).toBeUndefined();
    const operator = evaluate(withTta({ [CA_TTA_KEYS.apportionment]: null }));
    expect(operator.missing).toEqual([CA_TTA_KEYS.apportionment]);
    expect(operator.scheduleZ("1_trade_or_business_income")).toBeUndefined();
  });

  it("asks again for a business with a hiring credit and no SIC code", () => {
    const run = evaluate(withTta({ [CA_TTA_KEYS.business]: { ...business, sicCode: "" } }));
    expect(run.missing).toEqual([CA_TTA_KEYS.business]);
  });

  it("asks again for a row with no percentage outside the own business, or a year twice", () => {
    const items: CaTtaBusinessIncomeFactValue = {
      items: [{ line: "wages", description: "W-2", amount: 1000 }],
    };
    const twice = { rows: [2009, 2009].map((lossYear) => ({ lossYear, carryover: 10 })) };
    const run = evaluate(
      withTta({ [CA_TTA_KEYS.businessIncome]: items, [CA_TTA_KEYS.nolCarryovers]: twice }),
    );
    expect(run.missing).toEqual([CA_TTA_KEYS.businessIncome, CA_TTA_KEYS.nolCarryovers]);
  });
});

describe("FTB 3809 branches", () => {
  it("an investor fills items A to D only, and no line 2", () => {
    const investor = { ...business, role: "investor" as const };
    const items: CaTtaBusinessIncomeFactValue = {
      items: [{ line: "pass_through", description: "K-1", amount: 50000, ttaPercentage: 0.6 }],
    };
    const run = evaluate(
      withTta({
        [CA_TTA_KEYS.business]: investor,
        [CA_TTA_KEYS.apportionment]: null,
        [CA_TTA_KEYS.businessIncome]: items,
      }),
    );
    expect(run.missing).toEqual([]);
    expect(run.side1("header.b_tta_business_name")).toBe("Oskeld Hearth Bakery");
    expect(run.side1("header.e_principal_business_activity_code")).toBeUndefined();
    expect(run.side1("header.g_gross_annual_receipts")).toBeUndefined();
    expect(run.side1("line.2_average_apportionment_percentage")).toBeUndefined();
    expect(run.scheduleZ("1_trade_or_business_income")).toBe(30000);
  });

  it("no TTA business income uses no NOL and no credit", () => {
    const loss: CaTtaBusinessIncomeFactValue = {
      items: [{ line: "schedule_c", description: "Loss", amount: -8000 }],
    };
    const run = evaluate(withTta({ [CA_TTA_KEYS.businessIncome]: loss }));
    expect(run.scheduleZ("1_trade_or_business_income")).toBe(-8000);
    expect(run.scheduleZ("7_tta_business_income_limitation")).toBe(0);
    expect(run.side1("line.1c_total_credit_carryover")).toBe(0);
    expect(run.side1("line.3b_nol_deduction_current_year")).toBe(0);
    expect(run.side1("line.3c_nol_carryover_future_years")).toBe(23000);
    expect(run.value("schedule-ca", NINE_B_THREE)).toBeUndefined();
    expect(run.form540("43_credit_name")).toBe("Other State Tax");
  });

  it("the NOL is suspended with $1,000,000 of net business income and modified AGI", () => {
    const bakery = base.facts.find((fact) => fact.key.startsWith("business."));
    const big = { ...(bakery?.value as object), grossReceipts: 1360000 };
    const facts = base.facts.map((fact) => (fact === bakery ? { ...fact, value: big } : fact));
    const run = evaluate(facts);
    expect(run.side1("line.3b_nol_deduction_current_year")).toBe(0);
    expect(run.side1("line.3c_nol_carryover_future_years")).toBe(23000);
    expect(run.value("schedule-ca", NINE_B_THREE)).toBeUndefined();
  });

  it("a hiring credit above line 7 carries the rest", () => {
    const run = evaluate(withTta({ [CA_TTA_KEYS.hiringCreditCarryover]: 20000 }));
    expect(run.scheduleZ("7_tta_business_income_limitation")).toBe(12435);
    expect(run.side1("line.1a_hiring_credit_carryover")).toBe(12435);
    expect(run.scheduleZ("8b_hiring_credit_carryover_col_g")).toBe(7565);
    expect(run.form540("43_credit_amount")).toBe(12435);
    expect(run.value("schedule-s", "0.line.2_california_tax_liability")).toBe(15861 - 12435);
  });
});

describe("FTB 3809 gaps", () => {
  it("a disregarded entity's credit is a gap that reaches Form 540", () => {
    const run = evaluate(
      withTta({ [CA_TTA_KEYS.business]: { ...business, throughDisregardedEntity: true } }),
    );
    expect(isGap(run.field("form-3809", "0.line.1a_hiring_credit_carryover"))).toBe(true);
    expect(isGap(run.field("form-540", "line.43_credit_amount"))).toBe(true);
    expect(isGap(run.field("schedule-s", "0.line.2_california_tax_liability"))).toBe(true);
    // The NOL deduction does not depend on it.
    expect(run.side1("line.3b_nol_deduction_current_year")).toBe(23000);
  });

  it("an NOL on FTB 3805V too is a gap on line 3b and Schedule CA line 9b3", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_3805v", true));
    expect(reasonOf(run.field("form-3809", "0.line.3b_nol_deduction_current_year"))).toMatch(
      /FTB 3805V/,
    );
    expect(isGap(run.field("schedule-ca", NINE_B_THREE))).toBe(true);
  });

  it("more than three Section B2 credits is a gap", () => {
    const facts = [...kirunaScenario.facts, ...ttaFactsFor(kirunaScenario)];
    const run = evaluate(facts, kirunaScenario.decisions);
    expect(isGap(run.field("schedule-p", "3.part3.16_credit_code"))).toBe(true);
  });
});

/* zarya's TTA facts moved onto another scenario, as an investor with a K-1 row. */
function ttaFactsFor(scenario: Scenario): TaxFactRow[] {
  const items: CaTtaBusinessIncomeFactValue = {
    items: [{ line: "pass_through", description: "K-1", amount: 60000, ttaPercentage: 1 }],
  };
  return [
    row(scenario, CA_TTA_KEYS.business, { ...business, role: "investor" }),
    row(scenario, CA_TTA_KEYS.businessIncome, items),
    row(scenario, CA_TTA_KEYS.hiringCreditCarryover, 1000),
    row(scenario, CA_TTA_KEYS.salesUseTaxCreditCarryover, 0),
    row(scenario, CA_TTA_KEYS.nolCarryovers, { rows: [] }),
  ];
}

describe("FTB 3809 in Schedule P (540) Section B2", () => {
  it("takes line 16, and the passive credit moves to line 17 with the tax left", () => {
    const research = kirunaScenario.facts.filter(
      (fact) =>
        isCaPassiveCreditFactKey(fact.key) &&
        (fact.value as { creditCode?: string }).creditCode === "183",
    );
    expect(research.length).toBeGreaterThan(0);
    const facts = [
      ...kirunaScenario.facts.filter((fact) => !isCaPassiveCreditFactKey(fact.key)),
      ...research,
      ...ttaFactsFor(kirunaScenario),
    ];
    const decisions = withDecision("decisions.scope.must_file_schedule_p", true, kirunaScenario);
    const run = evaluate(facts, decisions);
    expect(run.value("schedule-p", "3.part3.16_credit_code")).toBe("210");
    expect(run.value("schedule-p", "3.part3.16_credit_used_col_b")).toBe(1000);
    expect(run.value("schedule-p", "3.part3.17_credit_code")).toBe("183");
    const balance16 = run.value("schedule-p", "3.part3.16_tax_balance_col_c") as number;
    const used17 = run.value("schedule-p", "3.part3.17_credit_used_col_b") as number;
    expect(used17).toBeLessThanOrEqual(balance16);
    expect(run.side1("line.1a_hiring_credit_carryover")).toBe(1000);
  });
});

describe("FTB 3809 with no facts, nothing changes", () => {
  it("zarya without TTA facts: no FTB 3809, line 9b3 keeps its reason, one credit on line 43", () => {
    const run = evaluate(withoutTta(base.facts));
    expect(run.files("form-3809")).toBe(false);
    expect(reasonOf(run.field("schedule-ca", NINE_B_THREE))).toMatch(/3805Z, 3807, or 3809/);
    expect(run.value("schedule-ca", "2.line.b10_subtractions")).toBeUndefined();
    expect(run.form540("43_credit_name")).toBe("Other State Tax");
    expect(run.form540("44_credit_amount")).toBeUndefined();
    expect(run.form540("17_ca_agi")).toBe(239196);
  });
});
