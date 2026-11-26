/*
 * Form 8828 on a whole return: who files, the notice it asks for, the cases the
 * engine does not print, the worksheet, and Schedule 2 line 17b. The synthetic
 * melaine scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeMortgageSubsidyNoticeKey,
  makeMortgageSubsidySaleKey,
  type MortgageSubsidyNoticeFactValue,
  type MortgageSubsidySaleFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { melaineScenario as base } from "../../../scenarios/synthetic/melaine/index.js";

const isSubsidy = (fact: TaxFactRow) => fact.key.startsWith("mortgage_subsidy.");
const otherFacts = base.facts.filter((fact) => !isSubsidy(fact));
const noticeTemplate = base.facts.find((fact) => fact.key.endsWith(".notice"))!;
const saleTemplate = base.facts.find((fact) => fact.key.endsWith(".sale"))!;
const baseNotice = noticeTemplate.value as MortgageSubsidyNoticeFactValue;
const baseSale = saleTemplate.value as MortgageSubsidySaleFactValue;

const notice = (slug: string, value: Partial<MortgageSubsidyNoticeFactValue> = {}): TaxFactRow => ({
  ...noticeTemplate,
  id: `f-notice-${slug}`,
  key: makeMortgageSubsidyNoticeKey(slug),
  value: { ...baseNotice, ...value },
});

const sale = (slug: string, value: Partial<MortgageSubsidySaleFactValue> = {}): TaxFactRow => ({
  ...saleTemplate,
  id: `f-sale-${slug}`,
  key: makeMortgageSubsidySaleKey(slug),
  value: { ...baseSale, ...value },
});

const home = (
  notices: Partial<MortgageSubsidyNoticeFactValue> = {},
  sales: Partial<MortgageSubsidySaleFactValue> = {},
) => [notice("home", notices), sale("home", sales)];

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8828-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...extra],
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
  const line = (id: string) => value("form-8828", id);
  return { result, files, field, value, line };
}

const LINE_13 = "0.line.13_gain_or_loss";
const LINE_14 = "0.line.14_half_of_gain";
const LINE_16 = "0.line.16_adjusted_qualifying_income";
const LINE_17 = "0.line.17_income_over_qualifying";
const LINE_18 = "0.line.18_income_percentage";
const LINE_20 = "0.line.20_holding_period_percentage";
const LINE_23 = "0.line.23_recapture_tax";
const LINE_17B = "1.line.17b_recapture_federal_mortgage_subsidy";
const UNSUPPORTED = { ok: false, unsupported: true };

describe("Form 8828 who files", () => {
  it("files, with Schedule 2, for a sold home with a subsidy", () => {
    const run = evaluate(home());
    expect([run.files("form-8828"), run.files("schedule-2")]).toEqual([true, true]);
    expect(run.value("schedule-2", LINE_17B)).toBe(6962);
  });

  it("does not file with no facts, and Schedule 2 line 17b stays blank", () => {
    const run = evaluate([]);
    expect(run.files("form-8828")).toBe(false);
    expect(run.files("schedule-2")).toBe(false);
    expect(run.value("form-1040", "line.23")).toBeUndefined();
    expect(run.value("form-1040", "line.24")).toBe(6349);
  });

  it("does not file for a notice with no sale", () => {
    expect(evaluate([notice("home")]).files("form-8828")).toBe(false);
  });

  it("does not file for a loan closed before 1991", () => {
    expect(evaluate(home({ loanClosingDate: "1990-12-31" })).files("form-8828")).toBe(false);
  });

  it("does not file for a sale more than 9 years after the closing", () => {
    const late = home({ loanClosingDate: "2016-08-28" });
    expect(evaluate(late).files("form-8828")).toBe(false);
  });

  it("files by decision after 9 years, with lines 16 to 23 unsupported", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_8828", true)];
    const run = evaluate(home({ loanClosingDate: "2016-08-28" }), decisions);
    expect(run.line(LINE_14)).toBe(23850);
    expect(run.field("form-8828", LINE_16)).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-2", LINE_17B)).toMatchObject(UNSUPPORTED);
  });

  it("asks for the notice of a sold home and waits for it", () => {
    const run = evaluate([sale("home")]);
    expect(run.files("form-8828")).toBe(true);
    expect(pendingInputs(run.result).pendingFacts).toContain(makeMortgageSubsidyNoticeKey("home"));
    expect(run.line(LINE_13)).toBeUndefined();
  });
});

describe("Form 8828 stops", () => {
  it("stops at a loss on line 13: no tax, Schedule 2 does not file", () => {
    const run = evaluate(home({}, { adjustedBasis: 340000 }));
    expect(run.line(LINE_13)).toBe(-29800);
    expect([run.line(LINE_14), run.line(LINE_23)]).toEqual([undefined, undefined]);
    expect(run.files("schedule-2")).toBe(false);
  });

  it("stops when line 17 is zero or less", () => {
    const run = evaluate(home({}, { familySizeAtSale: 3 }));
    expect([run.line(LINE_16), run.line(LINE_17)]).toEqual([75001, 68150 - 75001]);
    expect([run.line(LINE_18), run.line(LINE_23)]).toEqual([undefined, undefined]);
    expect(run.value("schedule-2", LINE_17B)).toBeUndefined();
  });
});

describe("Form 8828 lines", () => {
  it("checks line 2b for a mortgage credit certificate", () => {
    const run = evaluate(home({ subsidyType: "mortgage_credit_certificate" }));
    expect(run.line("0.line.2b_mortgage_credit_certificate")).toBe(true);
    expect(run.line("0.line.2a_tax_exempt_bond_loan")).toBeUndefined();
  });

  it("uses the worksheet for a loan repaid in year 2 and a sale later", () => {
    const run = evaluate(home({}, { fullRepaymentDate: "2022-03-01" }));
    expect([run.line(LINE_20), run.line("0.line.21_subsidized_amount_times_holding")]).toEqual([
      "16",
      2360,
    ]);
    expect(run.line(LINE_23)).toBe(1392);
  });

  it("subtracts the gain included in income on line 15", () => {
    const run = evaluate(home({}, { gainIncludedInIncome: 1000 }));
    expect(run.line("0.line.15_modified_agi")).toBe(67150);
    expect(run.line(LINE_18)).toBe("39");
  });

  it("multiplies line 19 by the ownership share", () => {
    const run = evaluate(home({}, { ownershipShare: 0.5 }));
    expect(run.line("0.line.19_federally_subsidized_amount")).toBe(7375);
  });
});

describe("Form 8828 cases the engine does not print", () => {
  it("a QSML gain share makes line 13 on unsupported", () => {
    const run = evaluate(home({}, { qsmlShareOfGain: 20000 }));
    expect(run.line("0.line.12_adjusted_basis")).toBe(262500);
    expect(run.field("form-8828", LINE_13)).toMatchObject(UNSUPPORTED);
    expect(run.field("form-8828", LINE_23)).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-2", LINE_17B)).toMatchObject(UNSUPPORTED);
  });
});
