/*
 * Form 2210 on a whole return: who files, what it waits on, its gaps, and
 * Form 1040 lines 26, 35a, 37 and 38. The synthetic bashere and talmanes
 * scenarios are the bases; wren has no Form 2210 facts at all.
 */

import { describe, expect, it } from "vitest";
import {
  ESTIMATED_TAX_KEYS,
  makeAnnualizedPeriodFactKey,
  makeEstimatedTaxPaymentFactKey,
  PRIOR_YEAR_KEYS,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { bashereScenario as bashere } from "../../../scenarios/synthetic/bashere/index.js";
import { talmanesScenario as talmanes } from "../../../scenarios/synthetic/talmanes/index.js";
import { wrenScenario as wren } from "../../../scenarios/synthetic/wren/index.js";
import type { Scenario } from "../../../types.js";

type Base = Pick<Scenario, "facts" | "decisions" | "taxYear" | "userId">;

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

function factsWith(base: Base, changes: Record<string, unknown>, extra: TaxFactRow[] = []) {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const row = (base: Base, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category: "estimated_payments",
  key,
  value,
});

const decision = (base: Base, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(base: Base, facts = base.facts, decisions = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-2210-test", taxYear: base.taxYear },
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
  const line1040 = (id: string) => value("form-1040", id);
  return { files, field, value, line1040, missing: form("form-2210")?.missingInputs ?? [] };
}

describe("Form 2210: no facts, nothing changes", () => {
  it("wren: the form does not file, and Form 1040 lines 26 and 38 are blank", () => {
    const result = evaluate(wren);
    expect(result.files("form-2210")).toBe(false);
    expect(result.line1040("line.26")).toBeUndefined();
    expect(result.line1040("line.38")).toBeUndefined();
    expect(isGap(result.field("form-1040", "line.38"))).toBe(false);
  });

  it("estimated payments alone: line 26 holds them, no Form 2210, no penalty line", () => {
    const facts = [
      ...wren.facts,
      row(wren, makeEstimatedTaxPaymentFactKey("q1"), { date: "2025-04-15", amount: 1000.4 }),
      row(wren, ESTIMATED_TAX_KEYS.priorYearOverpaymentApplied, 250),
    ];
    const result = evaluate(wren, facts);
    expect(result.files("form-2210")).toBe(false);
    expect(result.line1040("line.26")).toBe(1250);
    const before = evaluate(wren);
    expect(result.line1040("line.34")).toBe((before.line1040("line.34") as number) + 1250);
  });
});

describe("Form 2210: who files", () => {
  it("bashere files with box C; the explicit decision false takes it off", () => {
    expect(evaluate(bashere).files("form-2210")).toBe(true);
    const off = [...bashere.decisions, decision(bashere, "decisions.scope.must_file_2210", false)];
    const result = evaluate(bashere, bashere.facts, off);
    expect(result.files("form-2210")).toBe(false);
    expect(result.line1040("line.38")).toBeUndefined();
    expect(result.line1040("line.37")).toBe(1891);
  });

  it("no Part II box ends up checked: the form leaves the return", () => {
    const decisions = [...wren.decisions, decision(wren, "decisions.scope.must_file_2210", true)];
    const facts = [
      ...wren.facts,
      row(wren, PRIOR_YEAR_KEYS.federalTax, 1000),
      row(wren, PRIOR_YEAR_KEYS.federalAgi, 60000),
      row(wren, PRIOR_YEAR_KEYS.filedJointReturn, true),
    ];
    expect(evaluate(wren, facts, decisions).files("form-2210")).toBe(false);
  });

  it("a missing prior-year answer keeps the form on the return and asks for it", () => {
    const facts = factsWith(bashere, { [PRIOR_YEAR_KEYS.federalTax]: undefined });
    const result = evaluate(bashere, facts);
    expect(result.files("form-2210")).toBe(true);
    expect(result.missing).toContain(PRIOR_YEAR_KEYS.federalTax);
    expect(result.line1040("line.37")).toBeUndefined();
  });

  it("a stated Schedule AI period without the others waits for them", () => {
    const facts = factsWith(bashere, { [makeAnnualizedPeriodFactKey("b")]: undefined });
    const result = evaluate(bashere, facts);
    expect(result.missing).toEqual([makeAnnualizedPeriodFactKey("b")]);
    expect(result.value("form-2210", "0.line.box_c_annualized_income_method")).toBeUndefined();
  });

  it("no 12-month 2024 return: no 2024 tax asked, and line 9 is line 5", () => {
    const facts = factsWith(
      bashere,
      { [PRIOR_YEAR_KEYS.federalTax]: undefined, [PRIOR_YEAR_KEYS.federalAgi]: undefined },
      [row(bashere, PRIOR_YEAR_KEYS.noTwelveMonthReturn, true)],
    );
    const result = evaluate(bashere, facts);
    expect(result.missing).toEqual([]);
    expect(result.value("form-2210", "0.line.8_prior_year_tax_payment")).toBeUndefined();
    expect(result.value("form-2210", "0.line.9_required_annual_payment")).toBe(9352);
  });
});

describe("Form 2210: gaps", () => {
  it("a payment date that cannot be read makes the form's lines unsupported", () => {
    const key = makeEstimatedTaxPaymentFactKey("2025-09");
    const facts = factsWith(bashere, { [key]: { date: "09/15/2025", amount: 1500 } });
    const result = evaluate(bashere, facts);
    expect(isGap(result.field("form-2210", "0.line.1_tax_after_credits"))).toBe(true);
    expect(isGap(result.field("form-1040", "line.38"))).toBe(true);
    expect(isGap(result.field("form-1040", "line.37"))).toBe(true);
  });

  it("withholding by date that does not add up to line 6 leaves box D unsupported", () => {
    const facts = factsWith(talmanes, {
      "estimated_tax_penalty.withholding_on.2025-12": { date: "2025-12-31", amount: 100 },
    });
    const result = evaluate(talmanes, facts);
    expect(result.value("form-2210", "0.line.6_withholding_taxes")).toBe(56900);
    expect(isGap(result.field("form-2210", "0.line.box_d_withholding_actual_dates"))).toBe(true);
    expect(isGap(result.field("form-1040", "line.35a"))).toBe(true);
  });
});

describe("Form 2210: Form 1040 lines 35a, 37 and 38", () => {
  it("bashere: line 38 is line 19 and line 37 adds it to the tax due", () => {
    const result = evaluate(bashere);
    expect(result.line1040("line.38")).toBe(50);
    expect(result.line1040("line.37")).toBe(1941);
    expect(result.line1040("line.26")).toBe(5900);
  });

  it("talmanes: the penalty comes off the refund (figuring-the-penalty::b01)", () => {
    const result = evaluate(talmanes);
    expect(result.line1040("line.34")).toBe(2256);
    expect(result.line1040("line.38")).toBe(56);
    expect(result.line1040("line.35a")).toBe(2200);
    expect(result.line1040("line.37")).toBeUndefined();
  });

  it("a penalty larger than the overpayment: line 35a is 0, line 37 is line 38 − line 34", () => {
    const payment = makeEstimatedTaxPaymentFactKey("2026-01");
    const facts = factsWith(talmanes, {
      [payment]: { date: "2026-01-15", amount: 19770 },
      [ESTIMATED_TAX_KEYS.waiverAmount]: 1,
    });
    const result = evaluate(talmanes, facts);
    const overpaid = result.line1040("line.34") as number;
    const penalty = result.line1040("line.38") as number;
    expect(penalty).toBeGreaterThan(overpaid);
    expect(result.line1040("line.35a")).toBe(0);
    expect(result.line1040("line.37")).toBe(penalty - overpaid);
  });

  it("box B with no amount waits for it", () => {
    const facts = factsWith(talmanes, { [ESTIMATED_TAX_KEYS.waiverAmount]: undefined });
    const result = evaluate(talmanes, facts);
    expect(result.missing).toEqual([ESTIMATED_TAX_KEYS.waiverAmount]);
    expect(result.line1040("line.35a")).toBeUndefined();
  });
});
