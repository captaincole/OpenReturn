/*
 * Form 2210-F on a whole return: who files, what it waits on, its gaps, Form
 * 1040 line 38, and the line between Form 2210-F and Form 2210. The synthetic
 * cerandin scenario is the base; wren has no Form 2210 facts at all.
 */

import { describe, expect, it } from "vitest";
import {
  ESTIMATED_TAX_KEYS,
  FARMER_ESTIMATED_TAX_KEYS,
  FARMER_OR_FISHERMAN_KEYS,
  makeEstimatedTaxPaymentFactKey,
  PRIOR_YEAR_KEYS,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { cerandinScenario as base } from "../../../scenarios/synthetic/cerandin/index.js";
import { dyelinScenario as dyelin } from "../../../scenarios/synthetic/dyelin/index.js";
import { wrenScenario as wren } from "../../../scenarios/synthetic/wren/index.js";

const FORM = "form-2210-f";

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

/* The base facts with each fact for a key replaced (undefined drops it). */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const row = (key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category: "estimated_payments",
  key,
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

function evaluate(facts = base.facts, decisions = base.decisions, scenario = base) {
  const result = evaluateScenario({
    filing: { id: "form-2210-f-test", taxYear: scenario.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const form = (formId: string) => result.forms.get(formId);
  const files = (formId: string) => {
    const found = form(formId);
    return found?.mustFile.ok ? found.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    form(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const missing = (formId: string) => form(formId)?.missingInputs ?? [];
  return { files, field, value, missing, line1040: (id: string) => value("form-1040", id) };
}

const NOT_A_FARMER = {
  [FARMER_OR_FISHERMAN_KEYS.grossIncome2025]: {
    totalGrossIncome: 274000,
    farmingOrFishingGrossIncome: 100000,
  },
  [FARMER_OR_FISHERMAN_KEYS.grossIncome2024]: {
    totalGrossIncome: 251000,
    farmingOrFishingGrossIncome: 90000,
  },
};

describe("Form 2210-F: who files", () => {
  it("cerandin: a farmer with a waiver request files Form 2210-F, not Form 2210", () => {
    const result = evaluate();
    expect(result.files(FORM)).toBe(true);
    expect(result.files("form-2210")).toBe(false);
    expect(result.value(FORM, "0.line.box_a_waiver_request")).toBe(true);
    expect(result.line1040("line.38")).toBe(62);
    expect(result.line1040("line.37")).toBe(17643);
  });

  it("a farmer with neither box: no Form 2210-F, no Form 2210, line 38 blank (the IRS bills)", () => {
    const result = evaluate(
      factsWith({
        [ESTIMATED_TAX_KEYS.waiverRequest]: undefined,
        [ESTIMATED_TAX_KEYS.waiverAmount]: undefined,
      }),
    );
    expect(result.files(FORM)).toBe(false);
    expect(result.files("form-2210")).toBe(false);
    expect(result.line1040("line.38")).toBeUndefined();
    expect(result.line1040("line.37")).toBe(17581);
  });

  it("no farmer facts, farm income on the return: Form 2210 files and waits for the two-thirds test", () => {
    const facts = factsWith({
      [FARMER_OR_FISHERMAN_KEYS.grossIncome2025]: undefined,
      [FARMER_OR_FISHERMAN_KEYS.grossIncome2024]: undefined,
    });
    const result = evaluate(facts);
    expect(result.files(FORM)).toBe(false);
    expect(result.files("form-2210")).toBe(true);
    expect(result.missing("form-2210")).toEqual(
      expect.arrayContaining(Object.values(FARMER_OR_FISHERMAN_KEYS)),
    );
    expect(result.line1040("line.38")).toBeUndefined();
  });

  it("both years fail the test: Form 2210 figures the penalty with farm income", () => {
    const result = evaluate(factsWith(NOT_A_FARMER));
    expect(result.files(FORM)).toBe(false);
    expect(result.files("form-2210")).toBe(true);
    expect(result.missing("form-2210")).toEqual([]);
    expect(isGap(result.field("form-2210", "0.line.1_tax_after_credits"))).toBe(false);
    expect(result.value("form-2210", "0.line.5_ninety_percent_current_tax")).toBe(25003);
  });

  it("the explicit decision files Form 2210-F and keeps Form 2210 off", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_2210_f", true)];
    const result = evaluate(factsWith(NOT_A_FARMER), decisions);
    expect(result.files(FORM)).toBe(true);
    expect(result.files("form-2210")).toBe(false);
  });

  it("the farmer test wins over Form 2210's own decision", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_2210", true)];
    const result = evaluate(base.facts, decisions);
    expect(result.files("form-2210")).toBe(false);
    expect(result.files(FORM)).toBe(true);
  });

  it("filed and paid by March 2: the form leaves the return and line 38 is blank", () => {
    const result = evaluate(factsWith({ [FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2]: true }));
    expect(result.files(FORM)).toBe(false);
    expect(result.line1040("line.38")).toBeUndefined();
  });
});

describe("Form 2210-F: a joint 2025 return (dyelin)", () => {
  const evaluateDyelin = (facts = dyelin.facts) => evaluate(facts, dyelin.decisions, dyelin);

  it("dyelin: box B, and the penalty comes off the line 35a refund", () => {
    const result = evaluateDyelin();
    expect(result.value(FORM, "0.line.box_b_joint_return_one_year")).toBe(true);
    expect(result.line1040("line.38")).toBe(38);
    expect(result.line1040("line.35a")).toBe(6632);
  });

  it("no answer for 2024: the form files and asks whether 2024 was joint", () => {
    const facts = dyelin.facts.filter((fact) => fact.key !== PRIOR_YEAR_KEYS.filedJointReturn);
    const result = evaluateDyelin(facts);
    expect(result.files(FORM)).toBe(true);
    expect(result.missing(FORM)).toContain(PRIOR_YEAR_KEYS.filedJointReturn);
    expect(result.line1040("line.38")).toBeUndefined();
  });

  it("a joint 2024 return too: no box applies and the form does not file", () => {
    const facts = dyelin.facts.map((fact) =>
      fact.key === PRIOR_YEAR_KEYS.filedJointReturn ? { ...fact, value: true } : fact,
    );
    const result = evaluateDyelin(facts);
    expect(result.files(FORM)).toBe(false);
    expect(result.line1040("line.38")).toBeUndefined();
    expect(result.line1040("line.35a")).toBe(6670);
  });
});

describe("Form 2210-F: answers it waits on", () => {
  it.each([
    FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2,
    PRIOR_YEAR_KEYS.federalTax,
    PRIOR_YEAR_KEYS.filedJointReturn,
    ESTIMATED_TAX_KEYS.waiverAmount,
  ])("missing %s: the form stays, asks for it, and line 38 waits", (key) => {
    const result = evaluate(factsWith({ [key]: undefined }));
    expect(result.files(FORM)).toBe(true);
    expect(result.missing(FORM)).toContain(key);
    expect(result.value(FORM, "0.line.16_penalty")).toBeUndefined();
    expect(result.line1040("line.38")).toBeUndefined();
  });

  it("no 12-month 2024 return: the 2024 tax is not asked, and line 11 is line 7", () => {
    const facts = factsWith({ [PRIOR_YEAR_KEYS.federalTax]: undefined }, [
      row(PRIOR_YEAR_KEYS.noTwelveMonthReturn, true),
    ]);
    const result = evaluate(facts);
    expect(result.missing(FORM)).toEqual([]);
    expect(result.value(FORM, "0.line.10_prior_year_tax")).toBeUndefined();
    expect(result.value(FORM, "0.line.11_required_annual_payment")).toBe(18530);
  });
});

describe("Form 2210-F: payments and gaps", () => {
  it("a payment date that cannot be read makes the lines and line 38 unsupported", () => {
    const facts = factsWith({
      [makeEstimatedTaxPaymentFactKey("2025-farmer")]: { date: "January 12", amount: 9000 },
    });
    const result = evaluate(facts);
    expect(isGap(result.field(FORM, "0.line.12_estimated_payments_withholding"))).toBe(true);
    expect(isGap(result.field("form-1040", "line.38"))).toBe(true);
  });

  it("a payment after January 15 is not on line 12, and covering line 13 sets line 14", () => {
    const facts = factsWith({ [FARMER_ESTIMATED_TAX_KEYS.underpaymentPaidOn]: undefined }, [
      row(makeEstimatedTaxPaymentFactKey("2025-late"), { date: "2026-02-02", amount: 9000 }),
    ]);
    const result = evaluate(facts);
    expect(result.value(FORM, "0.line.12_estimated_payments_withholding")).toBe(10200);
    expect(result.value(FORM, "0.line.14_payment_date_month")).toBe("02");
    expect(result.value(FORM, "0.line.14_payment_date_day")).toBe("02");
    expect(result.value(FORM, "0.line.15_days_from_jan_15")).toBe(18);
  });

  it("the 2024 overpayment applied counts on line 12", () => {
    const facts = factsWith({}, [row(ESTIMATED_TAX_KEYS.priorYearOverpaymentApplied, 1500)]);
    expect(evaluate(facts).value(FORM, "0.line.12_estimated_payments_withholding")).toBe(11700);
  });

  it("a section 1062 election adds 75% of its liability to line 4", () => {
    const facts = factsWith({}, [row(FARMER_ESTIMATED_TAX_KEYS.section1062NetTaxLiability, 2000)]);
    expect(evaluate(facts).value(FORM, "0.line.4_refundable_credits")).toBe(2472);
  });
});

describe("Form 2210-F: no facts, nothing changes", () => {
  it("wren: no Form 2210-F, and Form 1040 line 38 is blank", () => {
    const result = evaluate(wren.facts, wren.decisions, wren);
    expect(result.files(FORM)).toBe(false);
    expect(result.line1040("line.38")).toBeUndefined();
  });
});
