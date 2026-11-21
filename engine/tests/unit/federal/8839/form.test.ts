/*
 * Form 8839 on a whole return: who files, the answers it asks for, its gaps,
 * and the lines that take its results (Form 1040 lines 1f and 30, Schedule 3
 * line 6c). The synthetic wren scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  ADOPTION_KEYS,
  makeAdoptionChildFactKey,
  makeW2FactKey,
  type AdoptionChildFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import {
  creditLimitOf,
  socialSecurityWithExclusion,
} from "../../../../src/federal/8839/results.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { wrenScenario as base } from "../../../scenarios/synthetic/wren/index.js";

const isAdoption = (fact: TaxFactRow) => fact.key.startsWith("adoption.");
const W2_KEY = makeW2FactKey("larkspur-biomedical");
const baseW2 = base.facts.find((fact) => fact.key === W2_KEY)!;
/* Lower wages keep these returns under the phase-out: AGI 198,000 with no adoption. */
const lowWages = (box12: W2FactValue["box12"]): TaxFactRow => ({
  ...baseW2,
  value: { ...(baseW2.value as W2FactValue), box1: 100_000, box12 },
});
const withoutCodeT = lowWages([]);
const withCodeT = lowWages([{ code: "T", amount: 15_500 }]);
/* The base return with no adoption facts and no code T. */
const plainFacts = base.facts
  .filter((fact) => !isAdoption(fact))
  .map((fact) => (fact.key === W2_KEY ? withoutCodeT : fact));

const row = (key: string, value: unknown): TaxFactRow => ({
  ...baseW2,
  id: `f-${key}`,
  category: "dependents",
  key,
  value,
});
const childFact = (slug: string, value: Partial<AdoptionChildFactValue>) =>
  row(makeAdoptionChildFactKey(slug), {
    firstName: "Kit",
    lastName: "Albescu",
    birthYear: 2022,
    ...value,
  });
const carryforward = (amount: number) => row(ADOPTION_KEYS.creditCarryforward, amount);
const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8839-test", taxYear: base.taxYear },
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
  const reason = (formId: string, id: string) => {
    const found = field(formId, id) as { unsupported?: boolean; reason?: string } | undefined;
    return found?.unsupported ? found.reason : undefined;
  };
  return { files, value, reason, pending: pendingInputs(result) };
}

const OLD_1F =
  "Requires Form 8839 (Adoption Benefits) computation — no Form 8839 ingestion or scenario built yet.";
const OLD_30 =
  "Refundable adoption credit from Form 8839 line 13 — Form 8839 not ingested and no adoption expense scenario built yet.";

describe("no adoption facts: nothing changes", () => {
  const run = evaluate(plainFacts);
  it("Form 8839 does not file", () => expect(run.files("form-8839")).toBe(false));
  it("1040 lines 1f and 30 keep their reasons", () => {
    expect(run.reason("form-1040", "line.1f")).toBe(OLD_1F);
    expect(run.reason("form-1040", "line.30")).toBe(OLD_30);
  });
  it("Schedule 3 does not file", () => expect(run.files("schedule-3")).toBe(false));
  it("line 9 is wages and interest only", () =>
    expect(run.value("form-1040", "line.9")).toBe(198_000));
});

describe("who files", () => {
  it("a child fact files the form and Schedule 3", () => {
    const run = evaluate([
      ...plainFacts,
      childFact("kit", { finalYear: 2025, expensesPaid2025: 4_000 }),
      carryforward(0),
    ]);
    expect([run.files("form-8839"), run.files("schedule-3")]).toEqual([true, true]);
    expect(run.value("form-8839", "0.line.5_qualified_adoption_expenses_child_1")).toBe(4_000);
  });

  it("a carryforward alone files the form", () => {
    const run = evaluate([...plainFacts, carryforward(900)]);
    expect(run.files("form-8839")).toBe(true);
    expect(run.value("form-8839", "0.line.15_credit_carryforward_prior_years")).toBe(900);
    expect(run.value("form-8839", "0.line.18_nonrefundable_adoption_credit")).toBe(900);
    expect(run.value("schedule-3", "0.line.6c")).toBe(900);
  });

  it("code T alone files the form; with no child, Part III and 1040 line 1f are unsupported", () => {
    const run = evaluate([
      ...plainFacts.filter((fact) => fact.key !== W2_KEY),
      withCodeT,
      carryforward(0),
    ]);
    expect(run.files("form-8839")).toBe(true);
    expect(run.reason("form-8839", "1.line.23_total_employer_benefits")).toMatch(
      /no adoption child/,
    );
    expect(run.reason("form-1040", "line.1f")).toMatch(/no adoption child/);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8839", false),
    ]);
    expect(run.files("form-8839")).toBe(false);
    expect(run.reason("form-1040", "line.30")).toBe(OLD_30);
  });
});

describe("answers", () => {
  it("asks for the carryforward when the form files", () => {
    const run = evaluate([
      ...plainFacts,
      childFact("kit", { finalYear: 2025, expensesPaid2025: 4_000 }),
    ]);
    expect(run.pending.pendingFacts).toContain(ADOPTION_KEYS.creditCarryforward);
    expect(run.value("form-8839", "0.line.15_credit_carryforward_prior_years")).toBeUndefined();
    expect(run.value("form-8839", "0.line.13_refundable_adoption_credit")).toBe(4_000);
  });

  it("asks whether the employer has a program for a special needs child with no code T", () => {
    const special = childFact("kit", { specialNeeds: true, finalYear: 2025 });
    const waits = evaluate([...plainFacts, special, carryforward(0)]);
    expect(waits.pending.pendingFacts).toContain(ADOPTION_KEYS.employerHasQualifiedProgram);
    const yes = evaluate([
      ...plainFacts,
      special,
      carryforward(0),
      row(ADOPTION_KEYS.employerHasQualifiedProgram, true),
    ]);
    expect(yes.value("form-8839", "1.line.24_smaller_of_21_or_22_child_1")).toBe(17_280);
    expect(yes.value("form-8839", "1.line.31_line_30_more_than_23_yes")).toBe(true);
    expect(yes.value("form-1040", "line.1f")).toBeLessThan(0);
    const no = evaluate([
      ...plainFacts,
      special,
      carryforward(0),
      row(ADOPTION_KEYS.employerHasQualifiedProgram, false),
    ]);
    expect(no.value("form-8839", "1.line.23_total_employer_benefits")).toBeUndefined();
    expect(no.value("form-8839", "0.line.5_qualified_adoption_expenses_child_1")).toBe(17_280);
  });

  it("married filing separately waits for the lived-apart answer, and false is a gap", () => {
    const mfs = base.decisions.map((each) =>
      each.decisionKey === "decisions.scope.filing_status"
        ? { ...each, decision: "married_filing_separately" }
        : each,
    );
    const waits = evaluate(base.facts, mfs);
    expect(waits.pending.pendingFacts).toContain(ADOPTION_KEYS.marriedSeparatelyTreatedAsUnmarried);
    expect(waits.value("form-8839", "0.line.13_refundable_adoption_credit")).toBeUndefined();
    const gap = evaluate(
      [...base.facts, row(ADOPTION_KEYS.marriedSeparatelyTreatedAsUnmarried, false)],
      mfs,
    );
    expect(gap.reason("form-8839", "0.line.13_refundable_adoption_credit")).toMatch(
      /Married filing separately/,
    );
  });
});

describe("gaps", () => {
  it("a foreign child not final is unsupported, and so are 1040 lines 1f and 30", () => {
    const run = evaluate([
      ...base.facts,
      childFact("kit", { foreign: true, expensesPaid2025: 3_000 }),
    ]);
    expect(run.reason("form-8839", "0.line.13_refundable_adoption_credit")).toMatch(
      /foreign child/,
    );
    expect(run.reason("form-1040", "line.30")).toMatch(/foreign child/);
    expect(run.reason("form-1040", "line.1f")).toMatch(/foreign child/);
  });

  it("code T with two children and no split is unsupported in Part III only", () => {
    const facts = [
      ...plainFacts.filter((fact) => fact.key !== W2_KEY),
      withCodeT,
      childFact("kit", { finalYear: 2025, expensesPaid2025: 1_000 }),
      childFact("lee", { finalYear: 2025, expensesPaid2025: 1_000 }),
      carryforward(0),
    ];
    const run = evaluate(facts);
    expect(run.reason("form-8839", "1.line.31_taxable_benefits")).toMatch(/code T is one total/);
    expect(run.value("form-8839", "0.line.13_refundable_adoption_credit")).toBe(2_000);
  });

  it("more than three children: the columns are unsupported, the totals count every child", () => {
    const kids = ["a", "b", "c", "d"].map((slug) =>
      childFact(slug, { finalYear: 2025, expensesPaid2025: 1_000 }),
    );
    const run = evaluate([...plainFacts, ...kids, carryforward(0)]);
    expect(run.reason("form-8839", "0.line.1_row1_col_a_first")).toMatch(/More than three/);
    expect(run.reason("form-8839", "0.line.6_smaller_of_4_or_5_child_1")).toMatch(
      /More than three/,
    );
    expect(run.value("form-8839", "0.line.12_total_line_11a")).toBe(4_000);
    expect(run.value("form-1040", "line.30")).toBe(4_000);
  });

  it("Worksheet B: a Schedule 8812 qualifying child makes line 17 unsupported", () => {
    const info = {
      mustFile: { "form-8839": { decisionKey: "x", value: true, derivation: undefined } },
      adoptionChildren: [],
      adoptionCarryforward: 1_000,
      adoptionPartII: "applies" as const,
    };
    const reader = {
      "form-1040.line.11b": 100_000,
      "form-1040.line.18": 9_000,
      "schedule-8812.0.line.4_qualifying_children_under_17": 1,
    };
    const limit = creditLimitOf(reader, info);
    expect(limit && "unsupported" in limit ? limit.reason : limit).toMatch(/Worksheet B/);
    const noChild = creditLimitOf(
      { ...reader, "schedule-8812.0.line.4_qualifying_children_under_17": 0 },
      info,
    );
    expect(noChild).toEqual({ line17: 1_000, line18: 1_000 });
  });

  it("social security benefits with Part III: 1040 line 6b and 8839 line 25 are unsupported", () => {
    const info = {
      mustFile: { "form-8839": { decisionKey: "x", value: true, derivation: undefined } },
      adoptionPartIII: "applies" as const,
      socialSecurityBenefits: 12_000,
    };
    expect(socialSecurityWithExclusion(info)).toBe(true);
    expect(socialSecurityWithExclusion({ ...info, socialSecurityBenefits: undefined })).toBe(false);
  });
});

describe("the receiving lines (the wren scenario)", () => {
  const run = evaluate(base.facts);
  it("1040 line 1f is 8839 line 31; line 30 is line 13; Schedule 3 line 6c is line 18", () => {
    expect(run.value("form-1040", "line.1f")).toBe(
      run.value("form-8839", "1.line.31_taxable_benefits"),
    );
    expect(run.value("form-1040", "line.30")).toBe(
      run.value("form-8839", "0.line.13_refundable_adoption_credit"),
    );
    expect(run.value("schedule-3", "0.line.6c")).toBe(
      run.value("form-8839", "0.line.18_nonrefundable_adoption_credit"),
    );
  });
  it("8839 line 7 is 1040 line 11b", () =>
    expect(run.value("form-8839", "0.line.7_modified_adjusted_gross_income")).toBe(
      run.value("form-1040", "line.11b"),
    ));
});
