/*
 * FTB 3800 on a whole return: who files, the answers it asks for, the stops,
 * line 7, the gaps, and Form 540 line 31, the one line that takes its result.
 * The synthetic karede scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CA_CHILD_UNEARNED_INCOME_KEYS as CA_KEYS,
  CHILD_UNEARNED_INCOME_KEYS as KEYS,
  makeDividendFactKey,
  makeInterestFactKey,
  type ParentCaliforniaReturnFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { PARENT_CA_RETURN } from "../../../../scenarios/synthetic/karede/facts.js";
import { karedeScenario as base } from "../../../../scenarios/synthetic/karede/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

/* The base return with facts replaced by key (undefined drops one) and decisions added or replaced. */
function evaluate(facts: Record<string, unknown> = {}, decisions: Record<string, unknown> = {}) {
  const template = base.facts[0]!;
  const kept = base.facts.filter((fact) => !(fact.key in facts));
  const added: TaxFactRow[] = Object.entries(facts)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({
      ...template,
      id: `f-${key}`,
      key,
      category: base.facts.find((fact) => fact.key === key)?.category ?? categoryOf(key),
      value,
    }));
  const decided = base.decisions.filter((row) => !(row.decisionKey in decisions));
  const result = evaluateScenario({
    filing: { id: "form-3800-ca-test", taxYear: base.taxYear },
    facts: [...kept, ...added],
    decisions: [
      ...decided,
      ...Object.entries(decisions).map(([key, value]) => decision(key, value)),
    ],
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (id: string) => {
    const [formId] = id.split(".");
    return result.forms.get(formId!)?.fields.find((each) => each.fieldId === id)?.result;
  };
  const value = (id: string) => {
    const found = field(id);
    return found?.ok ? found.value : undefined;
  };
  return { files, field, value, pending: pendingInputs(result) };
}

const categoryOf = (key: string) => (key.startsWith("identity.") ? "identity" : "other");

const parentWith = (overrides: Partial<ParentCaliforniaReturnFactValue>) => ({
  [CA_KEYS.parentCaliforniaReturn]: { ...PARENT_CA_RETURN, ...overrides },
});

const FORM = "form-3800-ca";
const LINE = (id: string) => `form-3800-ca.0.line.${id}`;
const LINE_31 = "form-540.line.31_tax_amount";
const BOX_3800 = "form-540.line.31_tax_from_ftb_3800";
const UNSUPPORTED = { ok: false, unsupported: true };
/* The child's tax with no FTB 3800: the table on $25,294, single. */
const REGULAR_TAX = 395;
const NO_INTEREST = { [makeInterestFactKey("american-river-savings")]: undefined };
const NO_DIVIDENDS = { [makeDividendFactKey("sierra-foothill-growth")]: undefined };

describe("FTB 3800 who files (ca-3800-inst-2025::sec::purpose::b01)", () => {
  it("files for a resident child under 18 with more than $2,700 of unearned income", () => {
    const run = evaluate();
    expect(run.files(FORM)).toBe(true);
    expect(run.value(LINE_31)).toBe(1_147);
    expect(run.value(BOX_3800)).toBe(true);
  });

  it("an 18-year-old whose earned income was more than half of support does not file", () => {
    const run = evaluate({
      "identity.dob": "01/01/2008",
      [KEYS.earnedIncomeOverHalfOfSupport]: true,
    });
    expect(run.files(FORM)).toBe(false);
    expect(run.value(LINE_31)).toBe(REGULAR_TAX);
    expect(run.value(BOX_3800)).toBeUndefined();
  });

  it("DECISION: a full-time student of 20 is held to the support test too", () => {
    const student = { "identity.dob": "05/02/2005", [KEYS.fullTimeStudent]: true };
    const over = evaluate({ ...student, [KEYS.earnedIncomeOverHalfOfSupport]: true });
    expect(over.files(FORM)).toBe(false);
    const under = evaluate({ ...student, [KEYS.earnedIncomeOverHalfOfSupport]: false });
    expect(under.files(FORM)).toBe(true);
  });

  it("a child born January 1, 2002 is 24: no FTB 3800", () => {
    const run = evaluate({
      "identity.dob": "01/01/2002",
      [KEYS.fullTimeStudent]: true,
      [KEYS.earnedIncomeOverHalfOfSupport]: false,
    });
    expect(run.files(FORM)).toBe(false);
  });

  it("no living parent, a joint return, or no California return: no FTB 3800", () => {
    expect(evaluate({ [KEYS.parentAlive]: false }).files(FORM)).toBe(false);
    const joint = { "decisions.scope.filing_status": "married_filing_jointly" };
    expect(evaluate({}, joint).files(FORM)).toBe(false);
    expect(evaluate({}, { "decisions.scope.must_file_ca_540": false }).files(FORM)).toBe(false);
  });

  it("the explicit decision wins", () => {
    const run = evaluate({}, { "decisions.scope.must_file_3800_ca": false });
    expect(run.files(FORM)).toBe(false);
    expect(run.value(LINE_31)).toBe(REGULAR_TAX);
  });

  it("line 1 at $2,700 or less: the form is not filed and line 31 is the regular tax", () => {
    // No 1099s: the parent's recorded return files the form, line 1 = 18,000 − 18,000 = 0.
    const low = evaluate({ ...NO_DIVIDENDS, ...NO_INTEREST });
    expect(low.files(FORM)).toBe(false);
    expect(low.value(BOX_3800)).toBeUndefined();
  });
});

describe("FTB 3800 answers", () => {
  it("asks for the parent's California return and waits for it", () => {
    const run = evaluate({ [CA_KEYS.parentCaliforniaReturn]: undefined });
    expect(run.files(FORM)).toBe(true);
    expect(run.pending.pendingFacts).toContain(CA_KEYS.parentCaliforniaReturn);
    expect(run.value(LINE("1_child_unearned_income"))).toBeUndefined();
    expect(run.value(LINE_31)).toBeUndefined();
  });

  it("with no federal parent fact, the California fact must name the parent", () => {
    const run = evaluate({ [KEYS.parentReturn]: undefined });
    expect(run.pending.pendingFacts).toContain(CA_KEYS.parentCaliforniaReturn);
    const named = evaluate({
      [KEYS.parentReturn]: undefined,
      ...parentWith({
        name: "Galen R. Ashfordly",
        ssn: "400-00-3802",
        filingStatus: "married_filing_jointly",
      }),
    });
    expect(named.value("form-3800-ca.0.header.parent_name")).toBe("Galen R. Ashfordly");
    expect(named.value(LINE("18_child_tax"))).toBe(1_147);
  });

  it("a California filing status replaces the federal one (registered domestic partners)", () => {
    const run = evaluate(parentWith({ filingStatus: "single" }));
    expect(run.value("form-3800-ca.0.header.parent_filing_status")).toBe("single");
  });

  it("someone can claim the child: every line and Form 540 line 31 are unsupported", () => {
    const run = evaluate({ [KEYS.claimableAsDependent]: true });
    expect(run.files(FORM)).toBe(true);
    expect(run.field(LINE("1_child_unearned_income"))).toMatchObject(UNSUPPORTED);
    expect(run.field(LINE_31)).toMatchObject(UNSUPPORTED);
  });

  it("a part-year resident: the Form 540NR worksheets are unsupported", () => {
    const run = evaluate({}, { "decisions.scope.ca_residency": "part_year" });
    expect(run.field(LINE("18_child_tax"))).toMatchObject(UNSUPPORTED);
  });

  it("a child who may itemize is asked for the connected deductions", () => {
    const run = evaluate({}, { "decisions.itemize_vs_standard": "itemized" });
    expect(run.pending.pendingFacts).toContain(CA_KEYS.californiaItemizedForUnearnedIncome);
  });
});

describe("FTB 3800 lines on the return", () => {
  it("no other child: line 7, 12a and 12b are blank and line 13 is line 11", () => {
    const run = evaluate(parentWith({ otherChildren: [] }));
    expect(run.value(LINE("7_other_children_net_unearned_income"))).toBeUndefined();
    expect(run.value(LINE("12a_all_children_net_unearned_income"))).toBeUndefined();
    expect(run.value(LINE("12b_child_share_decimal"))).toBeUndefined();
    // Line 8 = 10,300 + 280,000; Schedule Y: 6,403.94 + 9.3% × 144,852 = 19,875.18 → 19,875.
    expect(run.value(LINE("9_tax_on_line_8"))).toBe(19_875);
    expect(run.value(LINE("11_tax_difference_at_parent_rate"))).toBe(958);
    expect(run.value(LINE("13_child_share_of_tentative_tax"))).toBe(958);
  });

  it("line 10 leaves out the parent's FTB 3803 tax", () => {
    const run = evaluate(parentWith({ tax: 18_985, ftb3803Tax: 68 }));
    expect(run.value(LINE("10_parent_tax"))).toBe(18_917);
    expect(run.value(LINE_31)).toBe(1_147);
  });

  it("a parent with a loss enters 0 on line 6", () => {
    const run = evaluate(parentWith({ taxableIncome: -5_000, tax: 0, otherChildren: [] }));
    expect(run.value(LINE("6_parent_taxable_income"))).toBe(0);
    // Line 8 = 10,300; line 9 is the MFJ table on 10,300 and line 18 is never below line 17.
    expect(run.value(LINE("18_child_tax"))).toBeGreaterThanOrEqual(REGULAR_TAX);
  });

  it("a Form 540NR parent: lines 9 and 10 come from the worksheets", () => {
    const run = evaluate(
      parentWith({
        returnForm: "540nr",
        taxableIncome: 280_000,
        tax: 9_000,
        otherChildren: [],
        form540NR: {
          californiaAdjustedGrossIncome: 145_706,
          adjustedGrossIncome: 291_412,
          deductions: 11_412,
          taxOnTotalTaxableIncome: 18_917,
          californiaTaxableIncome: 140_000,
        },
      }),
    );
    expect(run.value(LINE("10_parent_tax"))).toBe(9_000);
    /*
     * C 156,006; F 301,712; I = 11,412 × C/F = 5,901; J 150,105; K 290,300;
     * L = 6,403.94 + 9.3% × 144,852 = 19,875; N = 150,105 × 19,875 / 290,300 = 10,277.
     */
    expect(run.value(LINE("9_tax_on_line_8"))).toBe(10_277);
  });

  it("line 18 equals the larger of lines 16 and 17, and lines 16 = 13 + 15", () => {
    const run = evaluate();
    const line13 = run.value(LINE("13_child_share_of_tentative_tax")) as number;
    const line15 = run.value(LINE("15_tax_on_line_14")) as number;
    const line16 = run.value(LINE("16_tax_at_parent_rate_total")) as number;
    const line17 = run.value(LINE("17_tax_on_line_4")) as number;
    expect(line16).toBe(line13 + line15);
    expect(run.value(LINE("18_child_tax"))).toBe(Math.max(line16, line17));
    expect(line17).toBe(REGULAR_TAX);
  });
});

describe("no FTB 3800 facts, nothing changes", () => {
  it("without the child's answers or a parent's return, line 31 is the regular tax and the box is blank", () => {
    const run = evaluate(
      {
        [KEYS.parentAlive]: undefined,
        [KEYS.claimableAsDependent]: undefined,
        [KEYS.parentReturn]: undefined,
        [CA_KEYS.parentCaliforniaReturn]: undefined,
        "identity.dob": "06/14/1990",
      },
      {},
    );
    expect(run.files(FORM)).toBe(false);
    expect(run.value(LINE_31)).toBe(REGULAR_TAX);
    expect(run.value(BOX_3800)).toBeUndefined();
    expect(run.pending.pendingFacts).not.toContain(CA_KEYS.parentCaliforniaReturn);
  });
});
