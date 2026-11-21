import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { makeChildInvestmentIncomeFactKey } from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { tcbCa003Scenario as base } from "../scenarios/tcb-ca-003/index.js";

/*
 * Form 8814 on a return that has none: tcb-ca-003, a joint return with two sons
 * (born 2018 and 2019), W-2 wages, a Schedule C loss, no Schedule D and a 1040
 * line 15 of 0. Adding Fred's income (irs-8814-inst-2025::sec::line-3::b04–b06:
 * $2,190 of qualified dividends and a $610 capital gain distribution) to the
 * first son, with the election, changes exactly the lines the instructions
 * name, and the lines that read AGI or the tax.
 */
const FRED = {
  ordinaryDividends: 2190,
  qualifiedDividends: 2190,
  capitalGainDistributions: 610,
  estimatedTaxPaid: false,
  hadOtherIncome: false,
};

const childIncome = (slug: string, value: object): TaxFactRow =>
  ({
    key: makeChildInvestmentIncomeFactKey(slug),
    category: "dependents",
    value,
    sourceNote: "test: the child's Forms 1099-DIV and the parents' answers",
  }) as TaxFactRow;

const ELECTION = {
  decisionKey: "decisions.scope.must_file_8814",
  decision: true,
} as AIDecisionRow;

type Lines = Map<string, unknown>;

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[]): Lines {
  const scenario = evaluateScenario({
    filing: { id: "form-8814-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const lines: Lines = new Map();
  for (const [formId, form] of scenario.forms) {
    lines.set(`${formId}.mustFile`, form.mustFile.ok && form.mustFile.value);
    if (!form.mustFile.ok || !form.mustFile.value) continue;
    for (const field of form.fields) {
      lines.set(field.fieldId, field.result.ok ? field.result.value : undefined);
    }
  }
  return lines;
}

/* The fields whose value differs, as [before, after]; Form 8814 itself left out. */
function changes(before: Lines, after: Lines, prefixes: string[]) {
  const ids = [...new Set([...before.keys(), ...after.keys()])].filter((id) =>
    prefixes.some((prefix) => id.startsWith(prefix)),
  );
  return Object.fromEntries(
    ids
      .filter((id) => before.get(id) !== after.get(id))
      .map((id) => [id, [before.get(id), after.get(id)]]),
  );
}

const FEDERAL = ["form-1040.", "schedule-", "form-2441.", "form-8995."];

describe("Form 8814 on tcb-ca-003", () => {
  const before = evaluate(base.facts, base.decisions);
  const slug = "terrier-hound";
  const after = evaluate([...base.facts, childIncome(slug, FRED)], [...base.decisions, ELECTION]);

  it("fills Fred's form as the instructions do", () => {
    expect(after.get("form-8814.mustFile")).toBe(true);
    expect(after.get("form-8814.0.line.4_total_interest_dividends")).toBe(2800);
    expect(after.get("form-8814.0.line.6_amount_over_base")).toBe(100);
    expect(after.get("form-8814.0.line.7_qualified_dividends_ratio_whole")).toBe("0");
    expect(after.get("form-8814.0.line.7_qualified_dividends_ratio_decimal")).toBe("782");
    expect(after.get("form-8814.0.line.8_capital_gain_ratio_decimal")).toBe("218");
    expect(after.get("form-8814.0.line.9_qualified_dividends_to_report")).toBe(78);
    expect(after.get("form-8814.0.line.10_capital_gain_to_report")).toBe(22);
    expect(after.get("form-8814.0.line.12_other_income_schedule_1")).toBe(0);
    expect(after.get("form-8814.0.line.15_line_14_less_than_1350_no")).toBe(true);
    expect(after.get("form-8814.0.line.15_tax")).toBe(135);
    expect(after.get("form-8814.0.header.c_more_than_one_form_8814")).toBeUndefined();
  });

  /*
   * Lines 3a and 3b take line 9 (::line-2b::b01, ::line-9::b01); with no Schedule
   * D, line 7a takes line 10 and line 7b's boxes and amount (::line-10::b01,
   * irs-1040-inst-2025::sec::line-7b::b01); line 16 adds line 15 and checks box
   * 1 (::line-15::b01). Schedule 1 line 8z does not move: Fred's line 12 is 0.
   * The rest follows: AGI rises by line 6 ($100); line 15 stays 0, so line 16
   * is the $135 alone; the child tax credit (Schedule 8812 line 14, limited by
   * the tax) and Form 2441's limit rise with it, and the refundable part (16a)
   * falls by the same $135; Form 8995 line 11 reads AGI.
   */
  it("changes only the federal lines that take Form 8814 amounts, and those that follow", () => {
    expect(changes(before, after, FEDERAL)).toEqual({
      "form-1040.line.3a": [0, 78],
      "form-1040.line.3b": [0, 78],
      "form-1040.line.3c_box1": [undefined, true],
      "form-1040.line.3c_box2": [undefined, true],
      "form-1040.line.7a": [undefined, 22],
      "form-1040.line.7b_schedule_d_not_required": [undefined, true],
      "form-1040.line.7b_includes_childs_capital_gain": [undefined, true],
      "form-1040.line.7b_childs_capital_gain_amount": [undefined, 22],
      "form-1040.line.9": [16500, 16600],
      "form-1040.line.11a": [16500, 16600],
      "form-1040.line.11b": [16500, 16600],
      "form-1040.line.16": [0, 135],
      "form-1040.line.16_from_form_8814": [undefined, true],
      "form-1040.line.18": [0, 135],
      "form-1040.line.19": [0, 135],
      "form-1040.line.21": [0, 135],
      "form-2441.0.line.7_agi": [16500, 16600],
      "form-2441.0.line.10_tax_liability_limit": [undefined, 135],
      "schedule-8812.0.line.1_form_1040_line_11a": [16500, 16600],
      "schedule-8812.0.line.3_modified_agi": [16500, 16600],
      "schedule-8812.0.line.13_credit_limit_worksheet_a": [0, 135],
      "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": [0, 135],
      "schedule-8812.1.line.16a_line12_minus_line14": [4400, 4265],
      "form-8995.0.line.11": [-15000, -14900],
      "form-8995.0.line.12": [0, 100],
    });
    expect(after.get("schedule-1.0.line.8z")).toBe(before.get("schedule-1.0.line.8z"));
  });

  it("two children: box C on each form, and lines 12 and 15 added across them", () => {
    const both = evaluate(
      [
        ...base.facts,
        childIncome(slug, FRED),
        // Pub. 550 (irs-pub-550-2025::sec::net-investment-income::b03): $2,800 of interest only.
        childIncome("dachshund-hound", {
          taxableInterest: 2800,
          estimatedTaxPaid: false,
          hadOtherIncome: false,
        }),
      ],
      [...base.decisions, ELECTION],
    );
    expect(both.get("form-8814.0.header.c_more_than_one_form_8814")).toBe(true);
    expect(both.get("form-1040.line.16")).toBe(270);
    expect(both.get("schedule-1.0.line.8z")).toBe(100);
    expect(both.get("schedule-1.0.line.8z_type")).toBe("Form 8814");
    expect(both.get("form-1040.line.11b")).toBe(16700);
  });
});
