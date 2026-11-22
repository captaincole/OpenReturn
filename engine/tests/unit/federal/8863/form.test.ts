/*
 * Form 8863 on a whole return: who files, the forms that take its results
 * (Form 1040 line 29, Schedule 3 line 3), the line 7 box, the answers it asks
 * for, the page 2 copies, the gaps, and "no facts, nothing changes". The
 * synthetic perrin scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  EDUCATION_CREDIT_KEYS,
  makeEducationCreditStudentFactKey,
  type EducationCreditStudentFactValue,
  type EducationRefundAnswersFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { FEDERAL_FORMS } from "../../../../src/federal/index.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { perrinScenario as base } from "../../../scenarios/synthetic/perrin/index.js";

const PERRIN_KEY = makeEducationCreditStudentFactKey("perrin");
const MARISOL_KEY = makeEducationCreditStudentFactKey("marisol");
const isEducation = (fact: TaxFactRow) => fact.category === "education";
const factAt = (key: string) => base.facts.find((fact) => fact.key === key)!;
const perrinValue = factAt(PERRIN_KEY).value as EducationCreditStudentFactValue;

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const withDecision = (key: string, value: unknown): AIDecisionRow[] => [
  ...base.decisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

const replace = (facts: TaxFactRow[], key: string, value: unknown): TaxFactRow[] =>
  facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));

function evaluate(facts: TaxFactRow[] = base.facts, decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8863-test", taxYear: base.taxYear },
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
  const pending = pendingInputs(result);
  return {
    result,
    files,
    field,
    value,
    pending: [...pending.pendingDecisions, ...pending.pendingFacts],
  };
}

const FORM = "form-8863";
const LINE_7_BOX = "0.line.7_under_24_no_refundable_credit";
const LINE_8 = "0.line.8_refundable_american_opportunity_credit";
const LINE_9 = "0.line.9_nonrefundable_american_opportunity_credit";
const LINE_19 = "0.line.19_nonrefundable_education_credits";
const UNSUPPORTED = { ok: false, unsupported: true };

/* A single filer: Perrin alone, his W-2 only, the two Forms 1098-T and his student fact. */
const single = (dob: string, extra: TaxFactRow[] = []) => {
  const facts = base.facts
    .filter((fact) => !fact.key.startsWith("identity.spouse."))
    .filter((fact) => fact.key !== "employer.tularosa-basin")
    .filter((fact) => fact.key !== MARISOL_KEY && !fact.key.endsWith(".1098t.marisol"));
  return evaluate(
    [...replace(facts, "identity.dob", dob), ...extra],
    withDecision("decisions.scope.filing_status", "single"),
  );
};

const refundAnswers = (value: EducationRefundAnswersFactValue): TaxFactRow => ({
  ...factAt(PERRIN_KEY),
  id: "f-refund",
  key: EDUCATION_CREDIT_KEYS.refundAnswers,
  value,
});

describe("Form 8863 who files", () => {
  it("files, with Schedule 3, for a student fact", () => {
    const run = evaluate();
    expect([run.files(FORM), run.files("schedule-3")]).toEqual([true, true]);
    expect(run.pending).toEqual([]);
  });

  it("does not file with no education facts, and nothing else changes", () => {
    const run = evaluate(base.facts.filter((fact) => !isEducation(fact)));
    expect([run.files(FORM), run.files("schedule-3")]).toEqual([false, false]);
    expect(run.value("form-1040", "line.29")).toBeUndefined();
    expect(run.field("form-1040", "line.29")?.ok).toBe(false);
    expect(run.value("form-1040", "line.22")).toBe(20628);
    expect(run.value("form-1040", "line.33")).toBe(16000);
  });

  it("the explicit decision wins both ways", () => {
    expect(
      evaluate(base.facts, withDecision("decisions.scope.must_file_8863", false)).files(FORM),
    ).toBe(false);
    const noFacts = base.facts.filter((fact) => !isEducation(fact));
    expect(
      evaluate(noFacts, withDecision("decisions.scope.must_file_8863", true)).files(FORM),
    ).toBe(true);
  });

  it("does not file for married filing separately", () => {
    const run = evaluate(
      base.facts,
      withDecision("decisions.scope.filing_status", "married_filing_separately"),
    );
    expect(run.files(FORM)).toBe(false);
  });

  it("does not file when the least AGI the facts allow is at the limit", () => {
    const rich = replace(base.facts, "employer.tularosa-basin", {
      ...(factAt("employer.tularosa-basin").value as object),
      box1: 200000,
    });
    expect(evaluate(rich).files(FORM)).toBe(false);
  });

  it("a Form 1098-T that no student fact names files the form and asks for the student", () => {
    const run = evaluate(base.facts.filter((fact) => fact.key !== PERRIN_KEY));
    expect(run.files(FORM)).toBe(true);
    expect(run.pending).toContain(PERRIN_KEY);
    expect(run.value(FORM, "0.line.10_total_part3_line_31")).toBeUndefined();
    expect(run.value(FORM, LINE_19)).toBeUndefined();
  });
});

describe("the forms that take its results", () => {
  it("Form 1040 line 29 is line 8; Schedule 3 line 3 is line 19", () => {
    const run = evaluate();
    expect(run.value("form-1040", "line.29")).toBe(run.value(FORM, LINE_8));
    expect(run.value("schedule-3", "0.line.3")).toBe(run.value(FORM, LINE_19));
    expect([run.value(FORM, LINE_8), run.value(FORM, LINE_19)]).toEqual([425, 1267]);
  });

  it("line 19 is limited by the tax: worksheet line 6", () => {
    const low = replace(base.facts, "employer.tularosa-basin", {
      ...(factAt("employer.tularosa-basin").value as object),
      box1: 0,
    });
    const run = evaluate(low);
    // AGI 58,000: taxable 26,500, tax 2,812 (MFJ table); credits 1,600 + 1,500 = 3,100.
    const tax = run.value("form-1040", "line.18") as number;
    expect(run.value(FORM, LINE_19)).toBe(Math.min(tax, 3100));
    expect(run.value("form-1040", "line.22")).toBe(Math.max(0, tax - 3100));
  });

  it("a foreign tax credit the engine does not compute is a gap on line 19 and Schedule 3 line 3", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_1116", true));
    expect(run.field(FORM, LINE_19)).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-3", "0.line.3")).toMatchObject(UNSUPPORTED);
    expect(run.value("form-1040", "line.29")).toBe(425);
  });

  it("Form 2555 makes the MAGI lines, line 8 and Form 1040 line 29 gaps", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_2555", true));
    expect(run.field(FORM, "0.line.3_modified_agi")).toMatchObject(UNSUPPORTED);
    expect(run.field(FORM, LINE_8)).toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.29")).toMatchObject(UNSUPPORTED);
  });
});

describe("line 7: the refundable part", () => {
  it("a filer 24 or older: line 8 is 40% of line 7", () => {
    const run = single("03/14/1991");
    // Single, AGI 58,000: line 6 is 1.000, line 7 2,500.
    expect([
      run.value(FORM, "0.line.7_tentative_american_opportunity_credit"),
      run.value(FORM, LINE_8),
    ]).toEqual([2500, 1000]);
    expect(run.value(FORM, LINE_7_BOX)).toBeUndefined();
  });

  it("a full-time student of 22, earned income under half of support, a parent alive: the box, no line 8", () => {
    const answers = {
      fullTimeStudent: true,
      earnedIncomeLessThanHalfOfSupport: true,
      parentAlive: true,
    };
    const run = single("05/20/2003", [refundAnswers(answers)]);
    expect(run.value(FORM, LINE_7_BOX)).toBe(true);
    expect(run.value(FORM, LINE_8)).toBeUndefined();
    expect(run.value(FORM, LINE_9)).toBe(2500);
    expect(run.value("form-1040", "line.29")).toBeUndefined();
  });

  it("under 24 with no answers: lines 7–9 wait and the form asks", () => {
    const run = single("05/20/2003");
    expect(run.pending).toContain(EDUCATION_CREDIT_KEYS.refundAnswers);
    expect(run.value(FORM, LINE_9)).toBeUndefined();
    expect(run.value(FORM, "0.line.4_limit_minus_agi")).toBe(32000);
    expect(run.value(FORM, LINE_19)).toBeUndefined();
  });

  it("a joint return is never asked", () => {
    const run = evaluate(replace(base.facts, "identity.dob", "05/20/2003"));
    expect(run.pending).toEqual([]);
    expect(run.value(FORM, LINE_8)).toBe(425);
  });
});

describe("Part III", () => {
  it("a third institution prints on another page 2, completed only through line 22", () => {
    const three = {
      ...perrinValue,
      institutions: [
        ...perrinValue.institutions,
        {
          name: "Mesa Online Institute",
          address: "PO Box 12, Tucson, AZ 85701",
          ein: "00-0008869",
          received2025Form1098T: true,
          received2024Form1098TBox7: false,
        },
      ],
    };
    const run = evaluate(replace(base.facts, PERRIN_KEY, three));
    const info = run.result.filingInfo.form8863!;
    expect(info.pages).toEqual([
      { student: 0, firstInstitution: 0, continuation: false },
      { student: 0, firstInstitution: 2, continuation: true },
      { student: 1, firstInstitution: 0, continuation: false },
    ]);
    const spec = FEDERAL_FORMS.find((form) => form.formId === FORM)!;
    expect(spec.copies?.count(run.result.filingInfo)).toBe(3);
    expect(spec.copies?.laterCopyPages).toEqual([1]);
  });

  it("an institution with no Form 1098-T and no answer on (2) waits, and the form asks", () => {
    const unknown = {
      ...perrinValue,
      institutions: [
        {
          name: "Mesa Online Institute",
          address: "PO Box 12",
          ein: "00-0008869",
          received2024Form1098TBox7: false,
        },
      ],
    };
    const run = evaluate(replace(base.facts, PERRIN_KEY, unknown));
    expect(run.pending).toContain(PERRIN_KEY);
  });

  it("an AOC student with no EIN for an institution waits; the dollar lines do not", () => {
    const noEin = {
      ...perrinValue,
      institutions: [
        {
          name: "Mesa Online Institute",
          address: "PO Box 12",
          received2025Form1098T: false,
          received2024Form1098TBox7: false,
        },
      ],
    };
    const run = evaluate(replace(base.facts, PERRIN_KEY, noEin));
    expect(run.pending).toContain(PERRIN_KEY);
    expect(run.value(FORM, "1.line.30_aoc_tentative_credit_student")).toBe(2500);
  });

  it("line 23 Yes sends the student to line 31 and leaves 24–30 blank (Sharon, american-opportunity-credit::b03)", () => {
    const sharon = { ...perrinValue, aocClaimedFourPriorYears: true };
    const run = evaluate(replace(base.facts, PERRIN_KEY, sharon));
    expect(run.value(FORM, "1.line.23_aoc_claimed_4_prior_years_yes")).toBe(true);
    expect(run.value(FORM, "1.line.24_enrolled_at_least_half_time_yes")).toBeUndefined();
    expect(run.value(FORM, "1.line.27_aoc_adjusted_qualified_expenses")).toBeUndefined();
    // Without the $380 of books bought elsewhere: 650 + 1,900 + 2,000.
    expect(run.value(FORM, "1.line.31_llc_adjusted_qualified_expenses")).toBe(4550);
    expect(run.value(FORM, "0.line.1_total_part3_line_30")).toBeUndefined();
    expect(run.value(FORM, "0.line.10_total_part3_line_31")).toBe(11950);
    expect(run.value(FORM, "0.line.11_smaller_of_line_10_or_10000")).toBe(10000);
    expect(run.value(FORM, LINE_9)).toBeUndefined();
  });
});
