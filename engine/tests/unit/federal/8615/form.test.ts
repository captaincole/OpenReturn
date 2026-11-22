/*
 * Form 8615 on a whole return: who files, the answers it asks for, the stops,
 * line 7 and the gaps, and Form 1040 line 16, the one line that takes its
 * result. The synthetic nynaeve scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CHILD_UNEARNED_INCOME_KEYS as KEYS,
  makeDividendFactKey,
  makeInterestFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type DividendFactValue,
  type ParentReturnFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { PARENT_RETURN } from "../../../scenarios/synthetic/nynaeve/facts.js";
import { nynaeveScenario as base } from "../../../scenarios/synthetic/nynaeve/index.js";

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
      category: categoryOf(key),
      value,
    }));
  const decided = base.decisions.filter((row) => !(row.decisionKey in decisions));
  const result = evaluateScenario({
    filing: { id: "form-8615-test", taxYear: base.taxYear },
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

/* A replaced fact keeps its category; a new one is an identity fact, a sale, or a Form 8615 answer. */
function categoryOf(key: string): string {
  const existing = base.facts.find((fact) => fact.key === key);
  if (existing) return existing.category;
  if (key.startsWith("account.")) return "investment_income";
  return key.startsWith("identity.") ? "identity" : "other";
}

const parentWith = (overrides: Partial<ParentReturnFactValue>) => ({
  [KEYS.parentReturn]: { ...PARENT_RETURN, ...overrides },
});

const LINE = (id: string) => `form-8615.0.line.${id}`;
const LINE_16 = "form-1040.line.16";
const UNSUPPORTED = { ok: false, unsupported: true };
/* The child's tax as if Form 8615 did not file: the QDCG worksheet on $18,550, single. */
const REGULAR_TAX = 1_008;

describe("Form 8615 who files (who-must-file::b01, ::b02)", () => {
  it("files for a child under 18 with more than $2,700 of unearned income", () => {
    const run = evaluate();
    expect(run.files("form-8615")).toBe(true);
    expect(run.value(LINE_16)).toBe(2_774);
  });

  it("a child born January 1, 2008 is 18 and needs the support answer", () => {
    const run = evaluate({ "identity.dob": "01/01/2008" });
    expect(run.files("form-8615")).toBe(true);
    expect(run.pending.pendingFacts).toContain(KEYS.earnedIncomeOverHalfOfSupport);
    expect(run.value(LINE_16)).toBeUndefined();
  });

  it("an 18-year-old whose earned income was more than half of support does not file", () => {
    const run = evaluate({
      "identity.dob": "01/01/2008",
      [KEYS.earnedIncomeOverHalfOfSupport]: true,
    });
    expect(run.files("form-8615")).toBe(false);
    expect(run.value(LINE_16)).toBe(REGULAR_TAX);
  });

  it("a 20-year-old files only as a full-time student", () => {
    const answers = { "identity.dob": "05/02/2005", [KEYS.earnedIncomeOverHalfOfSupport]: false };
    expect(evaluate({ ...answers, [KEYS.fullTimeStudent]: true }).files("form-8615")).toBe(true);
    expect(evaluate({ ...answers, [KEYS.fullTimeStudent]: false }).files("form-8615")).toBe(false);
    expect(evaluate(answers).pending.pendingFacts).toContain(KEYS.fullTimeStudent);
  });

  it("a child born January 1, 2002 is 24: no Form 8615", () => {
    const run = evaluate({
      "identity.dob": "01/01/2002",
      [KEYS.fullTimeStudent]: true,
      [KEYS.earnedIncomeOverHalfOfSupport]: false,
    });
    expect(run.files("form-8615")).toBe(false);
    expect(run.value(LINE_16)).toBe(REGULAR_TAX);
  });

  it("no living parent, or a joint return: no Form 8615", () => {
    expect(evaluate({ [KEYS.parentAlive]: false }).files("form-8615")).toBe(false);
    expect(
      evaluate({}, { "decisions.scope.filing_status": "married_filing_jointly" }).files(
        "form-8615",
      ),
    ).toBe(false);
  });

  it("the explicit decision wins", () => {
    const run = evaluate({}, { "decisions.scope.must_file_8615": false });
    expect(run.files("form-8615")).toBe(false);
    expect(run.value(LINE_16)).toBe(REGULAR_TAX);
  });

  it("asks for the parent's return and waits for it", () => {
    const run = evaluate({ [KEYS.parentReturn]: undefined });
    expect(run.files("form-8615")).toBe(true);
    expect(run.pending.pendingFacts).toContain(KEYS.parentReturn);
    expect(run.value(LINE("1_child_unearned_income"))).toBeUndefined();
    expect(run.value(LINE_16)).toBeUndefined();
  });

  it("asks whether someone can claim the child as a dependent and waits for it", () => {
    const run = evaluate({ [KEYS.claimableAsDependent]: undefined });
    expect(run.pending.pendingFacts).toContain(KEYS.claimableAsDependent);
    expect(run.value(LINE_16)).toBeUndefined();
  });

  it("a gain from a sale, with the parent's return recorded, is taxed at the parent's rate (unearned-income::b01)", () => {
    /*
     * Nynaeve without her 1099s: a $12,000 long-term gain alone. The fallback does not
     * count sales (QUESTIONS.md item 1), so the parent's return files the form. With no
     * other child: line 3 = 12,000 − 2,700 = 9,300, all net capital gain (Worksheet #1),
     * so line 13 = 15% × 9,300 = 1,395; line 15 is the tax on 6,950 with 2,700 of gain
     * at 0%, 428; line 16 = 1,823 beats line 17's 428.
     */
    const priced = evaluate({
      [makeInterestFactKey("inland-empire-savings")]: undefined,
      [dividendFact.key]: undefined,
      [makeTradeFactKey("palouse-brokerage", "t1")]: {
        tradeId: "t1",
        description: "100 sh PALOUSE FUND",
        dateAcquired: "03/01/20",
        dateSold: "06/02/25",
        proceeds: 20_000,
        costBasis: 8_000,
      },
      ...parentWith({ otherChildren: [] }),
    });
    expect(priced.files("form-8615")).toBe(true);
    expect(priced.value(LINE("5_net_unearned_income"))).toBe(9_300);
    expect(priced.value(LINE("13_child_share_parent_rate_tax"))).toBe(1_395);
    expect(priced.value(LINE("15_tax_on_line_14"))).toBe(428);
    expect(priced.value(LINE("17_tax_on_line_4"))).toBe(428);
    expect(priced.value(LINE_16)).toBe(1_823);
  });

  it("a child who itemizes is asked for the directly connected deductions", () => {
    const run = evaluate({}, { "decisions.itemize_vs_standard": "itemized" });
    expect(run.pending.pendingFacts).toEqual(
      expect.arrayContaining([KEYS.itemizedForUnearnedIncome, KEYS.itemizedForDividendsAndGains]),
    );
  });
});

const dividendFact = base.facts.find(
  (fact) => fact.key === makeDividendFactKey("palouse-balanced"),
)!;
const w2Fact = base.facts.find((fact) => fact.key === makeW2FactKey("latah-creek-garden"))!;

describe("Form 8615 stops (line-3::b01, line-5::b01)", () => {
  it("line 3 zero or less: lines 1 to 3 print, the rest is blank, line 16 is the regular tax", () => {
    // Without the 1099-DIV, line 1 is the $2,600 of interest: line 3 is 2,600 − 2,700.
    const run = evaluate({ [dividendFact.key]: undefined });
    const regular = evaluate(
      { [dividendFact.key]: undefined },
      { "decisions.scope.must_file_8615": false },
    );
    expect(run.files("form-8615")).toBe(true);
    expect(run.value(LINE("1_child_unearned_income"))).toBe(2_600);
    expect(run.value(LINE("3_line_1_minus_line_2"))).toBe(-100);
    expect(run.value(LINE("4_child_taxable_income"))).toBeUndefined();
    expect(run.value(LINE_16)).toBe(regular.value(LINE_16));
  });

  it("line 5 zero: no taxable income, lines 1 to 5 print, line 16 is the regular tax", () => {
    const run = evaluate({ [w2Fact.key]: undefined });
    expect(run.value(LINE("4_child_taxable_income"))).toBe(0);
    expect(run.value(LINE("5_net_unearned_income"))).toBe(0);
    expect(run.value(LINE("6_parent_taxable_income"))).toBeUndefined();
    expect(run.value(LINE_16)).toBe(0);
  });
});

describe("Form 8615 line 7 and lines 12a to 13", () => {
  it("Persimmon: line 7 adds every other child's line 5 (line-7::b01)", () => {
    const others = [{ netUnearnedIncome: 2_800 }, { netUnearnedIncome: 3_200 }];
    const run = evaluate(parentWith({ otherChildren: others }));
    expect(run.value(LINE("7_other_children_net_unearned_income"))).toBe(6_000);
  });

  it("with no other child, 12a and 12b are blank and line 13 is line 11 (line-11::b01)", () => {
    const run = evaluate(parentWith({ otherChildren: [] }));
    expect(run.value(LINE("7_other_children_net_unearned_income"))).toBeUndefined();
    expect(run.value(LINE("12a_add_lines_5_7"))).toBeUndefined();
    expect(run.value(LINE("12b_line_5_share_decimal"))).toBeUndefined();
    expect(run.value(LINE("13_child_share_parent_rate_tax"))).toBe(
      run.value(LINE("11_line_9_minus_line_10")),
    );
  });
});

describe("Form 8615 totals and limits", () => {
  it("line 16 is lines 13 and 15; line 18 is the larger of 16 and 17 and goes to Form 1040 line 16", () => {
    const run = evaluate();
    const [l13, l15, l16, l17, l18] = [
      "13_child_share_parent_rate_tax",
      "15_tax_on_line_14",
      "16_add_lines_13_15",
      "17_tax_on_line_4",
      "18_child_tax",
    ].map((id) => run.value(LINE(id)) as number);
    expect(l16).toBe(l13! + l15!);
    expect(l18).toBe(Math.max(l16!, l17!));
    expect(run.value(LINE_16)).toBe(l18);
  });

  it("line 17 is the child's regular tax, and line 18 is never less", () => {
    const run = evaluate();
    expect(run.value(LINE("17_tax_on_line_4"))).toBe(REGULAR_TAX);
    expect(run.value(LINE("18_child_tax")) as number).toBeGreaterThanOrEqual(REGULAR_TAX);
  });

  it("a parent with a low rate: line 17 sets line 18", () => {
    const run = evaluate(
      parentWith({
        taxableIncome: 0,
        tax: 0,
        qualifiedDividends: 0,
        netCapitalGain: 0,
        otherChildren: [],
      }),
    );
    expect(run.value(LINE("18_child_tax"))).toBe(run.value(LINE("17_tax_on_line_4")));
  });
});

describe("Form 8615 cases the engine does not handle", () => {
  it("the parent's Schedule J: line 9 and the lines after it, and Form 1040 line 16", () => {
    const run = evaluate(parentWith({ usedScheduleJ: true }));
    expect(run.field(LINE("9_tax_on_line_8"))).toMatchObject(UNSUPPORTED);
    expect(run.field(LINE("18_child_tax"))).toMatchObject(UNSUPPORTED);
    expect(run.field(LINE_16)).toMatchObject(UNSUPPORTED);
    expect(run.value(LINE("8_add_lines_5_6_7"))).toBe(253_400);
  });

  it("the parent's Form 2555: lines 6 and 10", () => {
    const run = evaluate(parentWith({ filesForm2555: true }));
    expect(run.field(LINE("6_parent_taxable_income"))).toMatchObject(UNSUPPORTED);
    expect(run.field(LINE("10_parent_tax"))).toMatchObject(UNSUPPORTED);
    expect(run.value(LINE("5_net_unearned_income"))).toBe(11_600);
  });

  it("the child's unrecaptured section 1250 gain: lines 15 and 17 (Schedule D Tax Worksheet)", () => {
    const run = evaluate({
      [dividendFact.key]: { ...(dividendFact.value as DividendFactValue), box2b: 300 },
    });
    expect(run.field(LINE("15_tax_on_line_14"))).toMatchObject(UNSUPPORTED);
    expect(run.field(LINE("17_tax_on_line_4"))).toMatchObject(UNSUPPORTED);
    expect(run.field(LINE("9_tax_on_line_8"))).toMatchObject(UNSUPPORTED);
  });

  it("a child someone can claim as a dependent: every line, and Form 1040 line 16 (who-must-file::b01)", () => {
    // Form 1040 line 12e has no Standard Deduction Worksheet for Dependents, so line 4 would be wrong.
    const run = evaluate({ [KEYS.claimableAsDependent]: true, [KEYS.parentReturn]: undefined });
    expect(run.files("form-8615")).toBe(true);
    expect(run.field(LINE("4_child_taxable_income"))).toMatchObject(UNSUPPORTED);
    expect(run.field(LINE_16)).toMatchObject(UNSUPPORTED);
    // The form cannot be figured, so the parent's return is not asked for.
    expect(run.pending.pendingFacts).not.toContain(KEYS.parentReturn);
  });

  it("the child's Form 2555: every line", () => {
    const run = evaluate({}, { "decisions.scope.must_file_2555": true });
    expect(run.field(LINE("1_child_unearned_income"))).toMatchObject(UNSUPPORTED);
    expect(run.field(LINE_16)).toMatchObject(UNSUPPORTED);
  });
});

describe("Form 8615 with none of its facts", () => {
  it("an adult with the same income: no Form 8615 and the regular tax", () => {
    const run = evaluate({
      "identity.dob": "06/14/1990",
      [KEYS.parentAlive]: undefined,
      [KEYS.parentReturn]: undefined,
    });
    expect(run.files("form-8615")).toBe(false);
    expect(run.value(LINE_16)).toBe(REGULAR_TAX);
    expect(
      run.pending.pendingFacts.filter((key) => key.startsWith("child_unearned_income.")),
    ).toEqual([]);
  });
});
