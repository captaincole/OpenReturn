/*
 * Source: 2025 Instructions for Schedule C, line 26: "Enter the total salaries
 * and wages for the tax year reduced by the amount of the following credit(s)
 * ... Credit for Employer Differential Wage Payments (Form 8932). Employer
 * Credit for Paid Family and Medical Leave (Form 8994). Do not reduce your
 * deduction for any portion of a credit that was passed through to you from a
 * pass-through entity" (irs-1040sc-inst-2025::sec::line-26::b01).
 */

import { describe, expect, it } from "vitest";
import {
  ORPHAN_DRUG_CREDIT_KEY,
  businessCreditAddBack,
  businessesOnReturn,
  makeBusinessFactKey,
  makeGeneralBusinessCreditFactKey,
  type GeneralBusinessCreditFactValue,
} from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows.js";
import { evaluateScenario } from "../../src/index.js";
import { TRIALS_KEY, orphanDrugCredit as ewardCredit } from "../scenarios/synthetic/eward/facts.js";
import { ewardScenario as eward } from "../scenarios/synthetic/eward/index.js";
import type { Scenario } from "../types.js";

const SHOP_KEY = makeBusinessFactKey("shop");
const shop = {
  key: SHOP_KEY,
  category: "self_employment",
  value: { activity: "Repairs", grossReceipts: 200000, expenses: { wages: 60000 } },
};

const credit = (value: Partial<GeneralBusinessCreditFactValue>, slug = "form-8932") => ({
  key: makeGeneralBusinessCreditFactKey(slug),
  category: "other",
  value: { sourceForm: "8932", line: "1w", amount: 2400.4, passive: false, ...value },
});

const wagesOf = (facts: Array<{ key: string; value: unknown; category: string }>) =>
  businessesOnReturn(facts, false).businesses[0]?.value.expenses?.wages;

describe("Schedule C line 26 less the stated wage credits", () => {
  it("a Form 8932 credit of the business's own employees lowers its wages, rounded", () => {
    expect(wagesOf([shop, credit({ businessKey: SHOP_KEY })])).toBe(57600);
  });

  it("a Form 8994 credit lowers them the same way, and the two add", () => {
    const leave = credit({ sourceForm: "8994", line: "4j", amount: 1000 }, "form-8994");
    const both = [
      shop,
      credit({ businessKey: SHOP_KEY }),
      { ...leave, value: { ...leave.value, businessKey: SHOP_KEY } },
    ];
    expect(wagesOf(both)).toBe(56600);
  });

  it("a credit a pass-through entity allocated lowers nothing", () => {
    const k1 = credit({ businessKey: SHOP_KEY, passThroughEin: "00-0000001" });
    expect(wagesOf([shop, k1])).toBe(60000);
  });

  it("a credit that names another business, or none, lowers nothing here", () => {
    expect(wagesOf([shop, credit({ businessKey: makeBusinessFactKey("other") })])).toBe(60000);
    expect(wagesOf([shop, credit({})])).toBe(60000);
  });

  it("another credit form on the return lowers nothing", () => {
    expect(wagesOf([shop, credit({ sourceForm: "8826", line: "1e", businessKey: SHOP_KEY })])).toBe(
      60000,
    );
  });

  it("California gives the wages back: section 280C(a) does not apply (ca-rtc-2025::sec::s17270::b)", () => {
    expect(businessCreditAddBack([shop, credit({ businessKey: SHOP_KEY })], false)).toBe(2400);
  });
});

/*
 * eward's facts, his orphan drug credit with no Form 8932 credit on the same
 * wages (Form 8820 line 2b of 0, so it does not wait), and the extra facts.
 */
function evaluate(base: Scenario, extra: TaxFactRow[]) {
  const facts = base.facts.map((fact) =>
    fact.key === ORPHAN_DRUG_CREDIT_KEY
      ? { ...fact, value: { ...ewardCredit, differentialWageCreditOnSameWages: 0 } }
      : fact,
  );
  const result = evaluateScenario({
    filing: { id: "stated-wage-credit-test", taxYear: base.taxYear },
    facts: [...facts, ...extra],
    decisions: base.decisions,
    authEmail: null,
  });
  return (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
}

const asRow = (base: Scenario, fact: ReturnType<typeof credit>): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${fact.key}`,
  ...fact,
});

describe("on a whole return", () => {
  it("a Form 8932 credit that names no business is a gap on Form 3800 line 1w", () => {
    const field = evaluate(eward, [asRow(eward, credit({}))]);
    const line1w = field("form-3800", "2.part3.1w_form_8932_col_e") as { unsupported?: boolean };
    expect(line1w?.unsupported).toBe(true);
  });

  it("a named one lowers Schedule C line 26, Form 3800 takes it and Schedule CA gives it back", () => {
    const field = evaluate(eward, [asRow(eward, credit({ businessKey: TRIALS_KEY }))]);
    const value = (formId: string, id: string) => (field(formId, id) as { value?: number }).value;
    // eward's line 26 is $120,000 after the orphan drug reduction; the Form 8932 credit takes $2,400 more.
    expect(value("schedule-c", "0.line.26")).toBe(117600);
    expect(value("form-3800", "2.part3.1w_form_8932_col_e")).toBe(2400);
    expect(value("schedule-ca", "0.line.b3_subtractions")).toBe(52400);
  });
});
