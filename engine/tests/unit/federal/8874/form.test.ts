/*
 * Form 8874 on a whole return: who files, the rows of line 1, line 2, the
 * gaps, and Form 3800 line 1i. The synthetic lamgwin scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeGeneralBusinessCreditFactKey,
  makeNewMarketsInvestmentFactKey,
  type NewMarketsInvestmentFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { INVESTMENTS, investmentValue } from "../../../scenarios/synthetic/lamgwin/facts.js";
import { lamgwinScenario as lamgwin } from "../../../scenarios/synthetic/lamgwin/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: lamgwin.userId,
    taxYear: lamgwin.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...lamgwin.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const isInvestment = (fact: TaxFactRow) => fact.key.startsWith("new_markets_investment.");
const isK1 = (fact: TaxFactRow) => fact.key.includes("tallow-row-partners");
const OLD_MILL_KEY = makeNewMarketsInvestmentFactKey("old-mill");

/* The base facts with one investment's value changed. */
function withInvestment(key: string, change: Partial<NewMarketsInvestmentFactValue>) {
  return lamgwin.facts.map((fact) =>
    fact.key === key
      ? { ...fact, value: { ...(fact.value as NewMarketsInvestmentFactValue), ...change } }
      : fact,
  );
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = lamgwin.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8874-test", taxYear: lamgwin.taxYear },
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
  const line = (id: string) => value("form-8874", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const isGap = (result: unknown) =>
  (result as { ok?: boolean; unsupported?: boolean } | undefined)?.ok === false;

const L2 = "0.line.2_credit_from_pass_through_entities";
const L3 = "0.line.3_add_lines_1_and_2";
const ROW6_A = "0.line.1_row6_cde_name_address_col_a";
const ROW6_F = "0.line.1_row6_credit_col_f";
const COL_D = "2.part3.1i_form_8874_col_d";
const COL_E = "2.part3.1i_form_8874_col_e";
const COL_G = "2.part3.1i_form_8874_col_g";

describe("the lamgwin return", () => {
  const out = evaluate(lamgwin.facts);

  it("files Form 8874 with six rows, line 2 and line 3", () => {
    expect(out.files("form-8874")).toBe(true);
    expect(out.line("0.line.1_row1_credit_rate_col_e")).toBe("5");
    expect(out.line("0.line.1_row4_credit_rate_col_e")).toBe("6");
    expect(out.line("0.line.1_row1_initial_investment_date_col_c")).toBe("03/14/2025");
    expect(out.line(L2)).toBe(1180);
    expect(out.line(L3)).toBe(25530);
    expect(out.missing("form-8874")).toEqual([]);
  });

  it("sends line 3 to Form 3800 line 1i, column (e)", () => {
    expect(out.value("form-3800", COL_E)).toBe(25530);
    expect(out.value("form-3800", COL_G)).toBe(25530);
    expect(out.value("schedule-3", "0.line.6a")).toBe(25530);
  });
});

describe("who files", () => {
  it("does not file with no investment, and nothing else of the credit changes", () => {
    const out = evaluate(lamgwin.facts.filter((fact) => !isInvestment(fact)));
    expect(out.files("form-8874")).toBe(false);
    // The K-1 credit alone goes straight to Form 3800 line 1i (purpose-of-form::b01).
    expect(out.value("form-3800", COL_E)).toBe(1180);
    expect(out.value("form-1040", "line.20")).toBe(1180);
  });

  it("files with no fact of the form at all only by the decision", () => {
    const none = lamgwin.facts.filter((fact) => !isInvestment(fact) && !isK1(fact));
    const out = evaluate(none);
    expect(out.files("form-8874")).toBe(false);
    expect(out.files("form-3800")).toBe(false);
    expect(out.value("form-1040", "line.20")).toBeUndefined();
  });

  it("files with a K-1 alone when the decision says so: line 2 and line 3 only", () => {
    const out = evaluate(
      lamgwin.facts.filter((fact) => !isInvestment(fact)),
      [...lamgwin.decisions, decision("decisions.scope.must_file_8874", true)],
    );
    expect(out.files("form-8874")).toBe(true);
    expect(out.line("0.line.1_row1_credit_col_f")).toBeUndefined();
    expect(out.line(L2)).toBe(1180);
    expect(out.line(L3)).toBe(1180);
    expect(out.value("form-3800", COL_E)).toBe(1180);
  });

  it("does not file, and claims no direct credit, when the decision says no", () => {
    const out = evaluate(lamgwin.facts, [
      ...lamgwin.decisions,
      decision("decisions.scope.must_file_8874", false),
    ]);
    expect(out.files("form-8874")).toBe(false);
    expect(out.value("form-3800", COL_E)).toBe(1180);
  });

  it("does not file for an investment whose credit period ended", () => {
    const harbor = lamgwin.facts.filter(
      (fact) => !isInvestment(fact) || fact.key.endsWith("harbor-light"),
    );
    expect(evaluate(harbor).files("form-8874")).toBe(false);
  });

  it("leaves a spouse's investment off a single return", () => {
    const facts = lamgwin.facts
      .filter((fact) => !isInvestment(fact) || fact.key === OLD_MILL_KEY)
      .map((fact) =>
        fact.key === OLD_MILL_KEY
          ? {
              ...fact,
              value: { ...(fact.value as NewMarketsInvestmentFactValue), owner: "spouse" },
            }
          : fact,
      );
    expect(evaluate(facts).files("form-8874")).toBe(false);
  });
});

describe("passive and missing answers", () => {
  it("puts a passive investment's credit in column (d) for Form 8582-CR", () => {
    const out = evaluate(withInvestment(OLD_MILL_KEY, { passive: true }));
    expect(out.value("form-3800", COL_D)).toBe(5400);
    expect(out.value("form-3800", COL_E)).toBe(25530 - 5400);
    expect(out.files("form-8582-cr")).toBe(true);
  });

  it("waits on the passive answer and the CDE's address", () => {
    const facts = withInvestment(OLD_MILL_KEY, {
      passive: undefined as unknown as boolean,
      cdeAddress: "",
    });
    const out = evaluate(facts);
    expect(out.missing("form-8874")).toContain(OLD_MILL_KEY);
    expect(out.missing("form-3800")).toContain(OLD_MILL_KEY);
  });
});

describe("gaps", () => {
  it("a recapture event in 2025 is a gap on its row, line 3 and Form 3800 line 1i", () => {
    const out = evaluate(withInvestment(OLD_MILL_KEY, { recaptureEventOn: "2025-10-01" }));
    expect(isGap(out.field("form-8874", ROW6_F))).toBe(true);
    expect(isGap(out.field("form-8874", L3))).toBe(true);
    expect(isGap(out.field("form-3800", COL_G))).toBe(true);
  });

  it("a seventh investment with a 2025 date goes on an attached statement, a gap", () => {
    const seventh = row(
      "other",
      makeNewMarketsInvestmentFactKey("seventh"),
      investmentValue({ ...INVESTMENTS[1], slug: "seventh", cdeEin: "00-0008899" }),
    );
    const out = evaluate([...lamgwin.facts, seventh]);
    expect(out.line(ROW6_A)).toBe("See attached");
    expect(isGap(out.field("form-8874", ROW6_F))).toBe(true);
    expect(isGap(out.field("form-8874", L3))).toBe(true);
    expect(isGap(out.field("form-3800", COL_G))).toBe(true);
  });

  it("a line 1i credit stated by hand is a gap: Form 8874 figures that line", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("nmc"), {
      sourceForm: "8874",
      line: "1i",
      amount: 500,
      passive: false,
    });
    const out = evaluate([...lamgwin.facts, stated]);
    expect(isGap(out.field("form-3800", COL_G))).toBe(true);
    expect(out.line(L3)).toBe(25530);
  });
});
