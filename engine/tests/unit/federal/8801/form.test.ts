/*
 * Form 8801 on a whole return: who files, the answers it asks for, the gaps,
 * and the lines of other forms that take its credit (Schedule 3 line 6b, Form
 * 1040 line 20). The synthetic logain scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  PRIOR_YEAR_MINIMUM_TAX_KEYS as KEYS,
  type PriorYearForm6251,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { logainScenario as base } from "../../../scenarios/synthetic/logain/index.js";

const PRIOR_KEYS = new Set<string>(Object.values(KEYS));
const isPriorYear = (fact: TaxFactRow) => PRIOR_KEYS.has(fact.key);
const otherFacts = base.facts.filter((fact) => !isPriorYear(fact));
const priorFacts = base.facts.filter(isPriorYear);
const baseForm6251 = priorFacts.find((fact) => fact.key === KEYS.form6251)!
  .value as PriorYearForm6251;

/* The base answers with some replaced (a value) or dropped (undefined). */
function answers(changes: Partial<Record<string, unknown>> = {}): TaxFactRow[] {
  const kept = priorFacts
    .filter((fact) => !(fact.key in changes))
    .concat(
      Object.entries(changes)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => ({ ...priorFacts[0], id: `f-${key}`, key, value })),
    );
  return kept;
}

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({ userId: base.userId, taxYear: base.taxYear, key, decision: value, rationale: "t" });

function evaluate(prior: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8801-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...prior],
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
  const isGap = (formId: string, id: string) => {
    const found = field(formId, id);
    return found !== undefined && !found.ok && found.unsupported === true;
  };
  const missing = result.forms.get("form-8801")?.missingInputs ?? [];
  return { files, value, isGap, missing };
}

const LINE = {
  line3: "0.line.3_minimum_tax_credit_nol_deduction",
  line10: "0.line.10_amount_after_exemption",
  line11: "0.line.11_tax_on_line_10",
  line12: "0.line.12_minimum_tax_foreign_tax_credit",
  line13: "0.line.13_tentative_minimum_tax_exclusion_items",
  line14: "0.line.14_prior_year_form_6251_line_10",
  line15: "0.line.15_net_minimum_tax_exclusion_items",
  line21: "1.line.21_combine_lines_18_through_20",
  line22: "1.line.22_regular_tax_minus_credits",
  line23: "1.line.23_current_year_tentative_minimum_tax",
  line25: "1.line.25_minimum_tax_credit",
  line26: "1.line.26_credit_carryforward_next_year",
  line27: "2.line.27_amount_from_line_10",
  line55: "3.line.55_smaller_of_53_or_54",
};

describe("No minimum tax answers: nothing changes", () => {
  it("Form 8801 and Form 6251 do not file; Schedule 3 line 6b keeps its old reason", () => {
    const run = evaluate([]);
    expect([run.files("form-8801"), run.files("form-6251")]).toEqual([false, false]);
    expect(run.isGap("schedule-3", "0.line.6b")).toBe(true);
    expect(run.value("schedule-3", "0.line.7")).toBeUndefined();
    expect(run.value("form-1040", "line.20")).toBe(250);
    expect(run.value("form-1040", "line.22")).toBe(201_143);
  });

  it("the 2024 filing status alone does not put the form in scope", () => {
    const run = evaluate(answers({}).filter((fact) => fact.key === KEYS.filingStatus));
    expect(run.files("form-8801")).toBe(false);
  });
});

describe("Form 8801 who files", () => {
  it("files with Form 6251 and Schedule 3 when line 21 is above 0", () => {
    const run = evaluate(answers());
    expect([run.files("form-8801"), run.files("form-6251"), run.files("schedule-3")]).toEqual([
      true,
      true,
      true,
    ]);
    expect(run.value("form-8801", LINE.line21)).toBe(164_820);
  });

  it("does not file when line 21 is zero or less (no 2024 AMT, no carryforward)", () => {
    const form6251 = { ...baseForm6251, line11: 0 };
    const run = evaluate(answers({ [KEYS.form6251]: form6251, [KEYS.creditCarryforward]: 0 }));
    expect(run.files("form-8801")).toBe(false);
    expect(run.files("form-6251")).toBe(false);
  });

  it("an explicit decision false wins", () => {
    const run = evaluate(answers(), [
      ...base.decisions,
      decision("decisions.scope.must_file_8801", false),
    ]);
    expect(run.files("form-8801")).toBe(false);
    expect(run.isGap("schedule-3", "0.line.6b")).toBe(true);
  });

  it("an explicit decision true with line 21 not above 0 stops at line 21", () => {
    const form6251 = { ...baseForm6251, line11: 0 };
    const run = evaluate(answers({ [KEYS.form6251]: form6251, [KEYS.creditCarryforward]: 0 }), [
      ...base.decisions,
      decision("decisions.scope.must_file_8801", true),
    ]);
    expect(run.files("form-8801")).toBe(true);
    expect(run.value("form-8801", LINE.line21)).toBeLessThanOrEqual(0);
    expect([run.value("form-8801", LINE.line22), run.value("form-8801", LINE.line25)]).toEqual([
      undefined,
      undefined,
    ]);
  });
});

describe("The answers it asks for", () => {
  it("files and asks for the 2024 Form 6251 when only the carryforward is stated", () => {
    const run = evaluate(answers({ [KEYS.form6251]: undefined }));
    expect(run.files("form-8801")).toBe(true);
    expect(run.missing).toContain(KEYS.form6251);
    expect(run.value("form-8801", LINE.line21)).toBeUndefined();
  });

  it("asks line 3 only with a 2024 net operating loss deduction", () => {
    const asked = evaluate(answers({ [KEYS.minimumTaxCreditNolDeduction]: undefined }));
    expect(asked.missing).toContain(KEYS.minimumTaxCreditNolDeduction);
    const form6251 = { ...baseForm6251, line2e: undefined };
    const notAsked = evaluate(
      answers({ [KEYS.form6251]: form6251, [KEYS.minimumTaxCreditNolDeduction]: undefined }),
    );
    expect(notAsked.missing).not.toContain(KEYS.minimumTaxCreditNolDeduction);
    expect(notAsked.value("form-8801", LINE.line3)).toBeUndefined();
  });

  it("asks the worksheet, Form 2555 and the foreign tax credit while line 10 is above 0", () => {
    const run = evaluate(
      answers({
        [KEYS.capitalGainWorksheet]: undefined,
        [KEYS.filedForm2555]: undefined,
        [KEYS.foreignTaxCredit]: undefined,
      }),
    );
    expect(run.missing).toEqual([
      KEYS.capitalGainWorksheet,
      KEYS.filedForm2555,
      KEYS.foreignTaxCredit,
    ]);
    expect(run.value("form-8801", LINE.line10)).toBe(618_213);
    expect(run.value("form-8801", LINE.line11)).toBeUndefined();
  });

  it("line 10 at 0: lines 11–14 blank, line 15 is 0, and the worksheet is not asked", () => {
    const form6251 = { ...baseForm6251, line1: 20_000, line2e: undefined, line2g: undefined };
    const run = evaluate(
      answers({
        [KEYS.form6251]: form6251,
        [KEYS.minimumTaxCreditNolDeduction]: undefined,
        [KEYS.capitalGainWorksheet]: undefined,
      }),
    );
    expect(run.missing).toEqual([]);
    expect(run.value("form-8801", LINE.line10)).toBe(0);
    expect([run.value("form-8801", LINE.line11), run.value("form-8801", LINE.line14)]).toEqual([
      undefined,
      undefined,
    ]);
    expect(run.value("form-8801", LINE.line15)).toBe(0);
    expect(run.value("form-8801", LINE.line21)).toBe(160_493 + 12_000);
  });
});

describe("Line 11 and line 12 routes", () => {
  it("no 2024 worksheet: line 11 taxes line 10 at the 2024 AMT rates and Part III is blank", () => {
    const run = evaluate(answers({ [KEYS.capitalGainWorksheet]: { worksheet: "none" } }));
    expect(run.value("form-8801", LINE.line11)).toBe(168_448);
    expect(run.value("form-8801", LINE.line27)).toBeUndefined();
  });

  it("a 2024 Form 2555 makes line 11, Part III and the credit gaps", () => {
    const run = evaluate(answers({ [KEYS.filedForm2555]: true }));
    expect(run.isGap("form-8801", LINE.line11)).toBe(true);
    expect(run.isGap("form-8801", LINE.line55)).toBe(true);
    expect(run.isGap("form-8801", LINE.line15)).toBe(true);
    expect(run.isGap("form-8801", LINE.line25)).toBe(true);
    expect(run.isGap("schedule-3", "0.line.6b")).toBe(true);
    expect(run.value("form-8801", LINE.line12)).toBe(280);
  });

  it("a 2024 credit figured on Form 1116 makes line 12 a gap; line 11 still computes", () => {
    const run = evaluate(answers({ [KEYS.foreignTaxCredit]: { method: "form_1116" } }));
    expect(run.isGap("form-8801", LINE.line12)).toBe(true);
    expect(run.isGap("form-8801", LINE.line13)).toBe(true);
    expect(run.value("form-8801", LINE.line11)).toBe(159_303);
    expect(run.value("form-8801", LINE.line14)).toBe(151_350);
  });

  it("no 2024 AMT foreign tax credit: line 12 blank and not asked", () => {
    const form6251 = { ...baseForm6251, line8: undefined };
    const run = evaluate(
      answers({ [KEYS.form6251]: form6251, [KEYS.foreignTaxCredit]: undefined }),
    );
    expect(run.missing).toEqual([]);
    expect(run.value("form-8801", LINE.line12)).toBeUndefined();
    expect(run.value("form-8801", LINE.line13)).toBe(159_303);
  });
});

describe("The credit on the 2025 return", () => {
  it("line 22 leaves out line 6b itself; line 23 is Form 6251 line 9", () => {
    const run = evaluate(answers());
    expect(run.value("form-8801", LINE.line22)).toBe(201_393 - 250);
    expect(run.value("form-8801", LINE.line23)).toBe(
      run.value("form-6251", "0.line.9_tentative_minimum_tax"),
    );
  });

  it("Schedule 3 line 6b and Form 1040 line 20 take line 25; the tax falls to the TMT", () => {
    const run = evaluate(answers());
    const credit = run.value("form-8801", LINE.line25);
    expect(run.value("schedule-3", "0.line.6b")).toBe(credit);
    expect(run.value("form-1040", "line.20")).toBe(250 + (credit as number));
    expect(run.value("form-1040", "line.22")).toBe(165_806);
  });

  it("a carryforward smaller than line 24 is used in full: line 26 is 0", () => {
    const form6251 = { ...baseForm6251, line11: 10_000 };
    const run = evaluate(answers({ [KEYS.form6251]: form6251, [KEYS.creditCarryforward]: 0 }));
    expect(run.value("form-8801", LINE.line21)).toBe(10_000 - 7_673);
    expect(run.value("form-8801", LINE.line25)).toBe(2_327);
    expect(run.value("form-8801", LINE.line26)).toBe(0);
  });

  it("Form 6251 kept off by its decision: line 23 is a gap", () => {
    const run = evaluate(answers(), [
      ...base.decisions,
      decision("decisions.scope.must_file_6251", false),
    ]);
    expect(run.isGap("form-8801", LINE.line23)).toBe(true);
    expect(run.isGap("schedule-3", "0.line.6b")).toBe(true);
  });
});
