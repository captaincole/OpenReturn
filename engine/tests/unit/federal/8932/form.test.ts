/*
 * Form 8932 on a whole return: who files, the lines, the wage reductions on
 * Schedule C line 26 and Schedule F line 22, the Form 3800 line 1w sources,
 * the stated credit it replaces (also on Form 8820 line 2b), the gaps, and
 * "no facts, nothing changes". The synthetic basel (a business and a K-1),
 * cilia (a farm) and jon (a stated Form 8932 credit next to Form 8820)
 * scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  DIFFERENTIAL_WAGE_CREDIT_KEYS,
  makeDifferentialWageEmployeeFactKey,
  makeGeneralBusinessCreditFactKey,
  makeRentalFactKey,
  type GeneralBusinessCreditFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { FREIGHT_KEY, freight } from "../../../scenarios/synthetic/basel/facts.js";
import { baselScenario as basel } from "../../../scenarios/synthetic/basel/index.js";
import { ciliaScenario as cilia } from "../../../scenarios/synthetic/cilia/index.js";
import { LAB_KEY } from "../../../scenarios/synthetic/jon/facts.js";
import { jonScenario as jon } from "../../../scenarios/synthetic/jon/index.js";
import type { Scenario } from "../../../types.js";

const isEmployee = (fact: TaxFactRow) => fact.key.startsWith("differential_wage_employee.");
const isOrder = (fact: TaxFactRow) =>
  fact.key === DIFFERENTIAL_WAGE_CREDIT_KEYS.underReemploymentOrder;
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

const replaced = (facts: TaxFactRow[], key: string, value: unknown) =>
  facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));

function evaluate(base: Scenario, facts: TaxFactRow[], decisions = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8932-test", taxYear: base.taxYear },
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
  return { files, field, value, line: (id: string) => value("form-8932", id), missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_1 = "0.line.1_eligible_differential_wage_payments";
const LINE_2 = "0.line.2_line1_times_20_percent";
const LINE_3 = "0.line.3_credit_from_pass_through_entities";
const LINE_4 = "0.line.4_add_lines_2_and_3";
const WAGES = "0.line.26";
const LABOR = "0.line.22_labor_hired";
const ROW_1W = "2.part3.1w_form_8932_col_g";
const ROW_1W_PASSIVE = "2.part3.1w_form_8932_col_d";
const LINE_2B = "0.line.2b_form_8932_wages_portion_dollars";

const statedCredit = (amount: number, extra: Partial<GeneralBusinessCreditFactValue> = {}) =>
  row(basel, "other", makeGeneralBusinessCreditFactKey("form-8932"), {
    sourceForm: "8932",
    line: "1w",
    amount,
    passive: false,
    businessKey: FREIGHT_KEY,
    ...extra,
  } satisfies GeneralBusinessCreditFactValue);

describe("Form 8932: basel (a business and a K-1)", () => {
  const result = evaluate(basel, basel.facts);

  it("files from the employee facts and fills lines 1 to 4", () => {
    expect(result.files("form-8932")).toBe(true);
    expect(result.line(LINE_1)).toBe(28_451);
    expect(result.line(LINE_2)).toBe(5_690);
    expect(result.line(LINE_3)).toBe(1_840);
    expect(result.line(LINE_4)).toBe(7_530);
    expect(result.line("0.line.5_amount_allocated_to_patrons_beneficiaries")).toBeUndefined();
    expect(result.line("0.line.6_cooperatives_estates_trusts_credit")).toBeUndefined();
  });

  it("takes line 2 off Schedule C line 26 (line-2::b01)", () => {
    expect(result.value("schedule-c", WAGES)).toBe(214_000 - 5_690);
  });

  it("puts line 4 on Form 3800 Part III line 1w (face-page-1::b01)", () => {
    expect(result.value("form-3800", ROW_1W)).toBe(7_530);
    expect(result.value("schedule-3", "0.line.6a")).toBe(7_530);
  });
});

describe("Form 8932: no facts, nothing changes", () => {
  const facts = basel.facts.filter((fact) => !isEmployee(fact) && !isOrder(fact));
  const result = evaluate(basel, facts);

  it("does not file with only a K-1 credit (purpose-of-form::b01)", () => {
    expect(result.files("form-8932")).toBe(false);
    expect(result.value("form-3800", ROW_1W)).toBe(1_840);
  });

  it("leaves the stated wages whole", () => {
    expect(result.value("schedule-c", WAGES)).toBe(214_000);
  });

  it("still files with the explicit decision, with line 3 only", () => {
    const decided = evaluate(basel, facts, [
      ...basel.decisions,
      decision(basel, "decisions.scope.must_file_8932", true),
    ]);
    expect(decided.files("form-8932")).toBe(true);
    expect(decided.line(LINE_1)).toBeUndefined();
    expect(decided.line(LINE_3)).toBe(1_840);
    expect(decided.line(LINE_4)).toBe(1_840);
  });

  it("leaves jon's stated Form 8932 credit as it was", () => {
    const stated = evaluate(jon, jon.facts);
    expect(stated.files("form-8932")).toBe(false);
    expect(stated.value("schedule-c", WAGES)).toBe(187_600);
    expect(stated.value("form-3800", ROW_1W)).toBe(2_400);
    expect(stated.value("form-8820", LINE_2B)).toBe(900);
  });
});

describe("Form 8932: who files and what it waits on", () => {
  it("waits on the final order answer (disallowance-for-failure-to-comply-with::b01)", () => {
    const result = evaluate(
      basel,
      basel.facts.filter((fact) => !isOrder(fact)),
    );
    expect(result.files("form-8932")).toBe(true);
    expect(result.missing("form-8932")).toContain(
      DIFFERENTIAL_WAGE_CREDIT_KEYS.underReemploymentOrder,
    );
    expect(result.line(LINE_2)).toBeUndefined();
    expect(result.value("schedule-c", WAGES)).toBe(214_000);
  });

  it("does not file and lowers no wages under a final order", () => {
    const result = evaluate(
      basel,
      replaced(basel.facts, DIFFERENTIAL_WAGE_CREDIT_KEYS.underReemploymentOrder, true),
    );
    expect(result.files("form-8932")).toBe(false);
    expect(result.value("schedule-c", WAGES)).toBe(214_000);
    expect(result.value("form-3800", ROW_1W)).toBe(1_840);
  });

  it("asks again for a malformed employee fact", () => {
    const key = makeDifferentialWageEmployeeFactKey("joran-velde");
    const result = evaluate(basel, replaced(basel.facts, key, { name: "Joran Velde" }));
    expect(result.missing("form-8932")).toContain(key);
    expect(result.line(LINE_1)).toBeUndefined();
    expect(result.value("schedule-c", WAGES)).toBe(214_000);
  });

  it("leaves the form off the return when no employee is qualified (line 4 is 0)", () => {
    const facts = basel.facts.map((fact) =>
      isEmployee(fact)
        ? { ...fact, value: { ...(fact.value as object), employedPrior91Days: false } }
        : fact,
    );
    const result = evaluate(
      basel,
      facts.filter((fact) => !isK1(fact)),
    );
    expect(result.files("form-8932")).toBe(false);
    expect(result.value("schedule-c", WAGES)).toBe(214_000);
  });
});

describe("Form 8932: the stated credit it replaces", () => {
  it("makes a stated own credit next to employee facts a gap, and lowers the wages once", () => {
    const result = evaluate(basel, [...basel.facts, statedCredit(5_690)]);
    expect(isGap(result.field("form-3800", ROW_1W))).toBe(true);
    expect(result.value("schedule-c", WAGES)).toBe(214_000 - 5_690);
  });

  it("keeps a stated credit of a pass-through entity on line 3 (other notice)", () => {
    const notice = statedCredit(300, { businessKey: undefined, passThroughEin: "00-0001099" });
    const result = evaluate(basel, [...basel.facts, notice]);
    expect(result.line(LINE_3)).toBe(2_140);
    expect(result.line(LINE_4)).toBe(7_830);
    expect(result.value("form-3800", ROW_1W)).toBe(7_830);
  });

  it("checks Form 8820 line 2b against the figured credit of the same business", () => {
    const employee = (payments: number) =>
      row(jon, "self_employment", makeDifferentialWageEmployeeFactKey("reservist"), {
        name: "Reservist",
        activityKey: LAB_KEY,
        differentialWagePayments: payments,
        employedPrior91Days: true,
      });
    const order = row(
      jon,
      "self_employment",
      DIFFERENTIAL_WAGE_CREDIT_KEYS.underReemploymentOrder,
      false,
    );
    const withoutStated = jon.facts.filter(
      (fact) => !fact.key.startsWith("general_business_credit."),
    );
    const figured = evaluate(jon, [...withoutStated, employee(12_000), order]);
    expect(figured.line(LINE_2)).toBe(2_400);
    expect(figured.value("form-8820", LINE_2B)).toBe(900);
    expect(figured.value("schedule-c", WAGES)).toBe(187_600);
    expect(figured.value("form-3800", ROW_1W)).toBe(2_400);
    const tooSmall = evaluate(jon, [...withoutStated, employee(4_000), order]);
    expect(isGap(tooSmall.field("form-8820", LINE_2B))).toBe(true);
  });
});

describe("Form 8932: gaps and other branches", () => {
  it("makes line 1w a gap when the decision says no but the facts lower the wages", () => {
    const result = evaluate(basel, basel.facts, [
      ...basel.decisions,
      decision(basel, "decisions.scope.must_file_8932", false),
    ]);
    expect(result.files("form-8932")).toBe(false);
    expect(isGap(result.field("form-3800", ROW_1W))).toBe(true);
  });

  it("makes lines 1 and 2 a gap for an employee of a rental", () => {
    const rentalKey = makeRentalFactKey("duplex");
    const facts = basel.facts.map((fact) =>
      fact.key === makeDifferentialWageEmployeeFactKey("marith-sone")
        ? { ...fact, value: { ...(fact.value as object), activityKey: rentalKey } }
        : fact,
    );
    const result = evaluate(basel, facts);
    expect(isGap(result.field("form-8932", LINE_1))).toBe(true);
    expect(isGap(result.field("form-8932", LINE_4))).toBe(true);
  });

  it("makes lines 1 and 2 a gap when the stated wages cannot take the reduction", () => {
    const small = { ...freight, expenses: { ...freight.expenses, wages: 4_000 } };
    const result = evaluate(basel, replaced(basel.facts, FREIGHT_KEY, small));
    expect(isGap(result.field("form-8932", LINE_2))).toBe(true);
  });

  it("makes the credit of a passive business a passive source, so Form 8582-CR files", () => {
    const passive = { ...freight, materiallyParticipated: false };
    const result = evaluate(basel, replaced(basel.facts, FREIGHT_KEY, passive));
    expect(result.line(LINE_2)).toBe(5_690);
    expect(result.files("form-8582-cr")).toBe(true);
    // A passive business's own line 31 waits (Form 8582), so column (d) and the tax wait on it, as for Form 5884.
    expect(result.value("form-3800", ROW_1W_PASSIVE)).toBeUndefined();
    expect(result.value("schedule-c", WAGES)).toBe(214_000 - 5_690);
  });

  it("takes a farm's part off Schedule F line 22 (cilia)", () => {
    const result = evaluate(cilia, cilia.facts);
    expect(result.line(LINE_1)).toBe(18_251);
    expect(result.line(LINE_2)).toBe(3_650);
    expect(result.line(LINE_3)).toBeUndefined();
    expect(result.line(LINE_4)).toBe(3_650);
    expect(result.value("schedule-f", LABOR)).toBe(64_000 - 3_650);
    const none = evaluate(
      cilia,
      cilia.facts.filter((fact) => !isEmployee(fact) && !isOrder(fact)),
    );
    expect(none.value("schedule-f", LABOR)).toBe(64_000);
    expect(none.files("form-8932")).toBe(false);
  });
});
