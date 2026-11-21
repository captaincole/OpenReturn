/*
 * FTB 3506 on a whole return: who files, Form 540 lines 40, 47 and 48 and
 * Schedule P (540) line 5, what is asked, and the gaps. The synthetic ottilie
 * scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CA_DEPENDENT_CARE_KEYS,
  DEPENDENT_CARE_KEYS,
  makeDependentCareProviderFactKey,
  makeDependentCareQualifyingPersonFactKey,
  makeW2FactKey,
  type DependentCareProviderFactValue,
  type DependentCareQualifyingPersonFactValue,
  type W2FactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { ottilieScenario as base } from "../../../../scenarios/synthetic/ottilie/index.js";

const PRESCHOOL = makeDependentCareProviderFactKey("sunflower-hill");
const SITTER = makeDependentCareProviderFactKey("lupe-arroyo");
const MATEO = makeDependentCareQualifyingPersonFactKey("mateo-quintana");
const INES = makeDependentCareQualifyingPersonFactKey("ines-varela");
const ORCHARD_W2 = makeW2FactKey("valley-orchard");

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const factOf = (key: string) => base.facts.find((fact) => fact.key === key)!;

/* The base facts with some values replaced (by key), some dropped, some added. */
function factsWith(
  replace: Record<string, unknown> = {},
  drop: string[] = [],
  add: TaxFactRow[] = [],
): TaxFactRow[] {
  return [
    ...base.facts
      .filter((fact) => !drop.includes(fact.key))
      .map((fact) => (fact.key in replace ? { ...fact, value: replace[fact.key] } : fact)),
    ...add,
  ];
}

const added = (key: string, value: unknown, category = "dependents"): TaxFactRow => ({
  ...factOf(DEPENDENT_CARE_KEYS.expensesIncurred),
  id: `f-${key}`,
  category,
  key,
  value,
});

function evaluate(facts: TaxFactRow[] = base.facts, extra: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "form-3506-test", taxYear: base.taxYear },
    facts,
    // An extra decision replaces the base one with its key.
    decisions: [
      ...base.decisions.filter(
        (each) => !extra.some((one) => one.decisionKey === each.decisionKey),
      ),
      ...extra,
    ],
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
  const gap = (formId: string, id: string) => {
    const found = field(formId, id) as { unsupported?: boolean } | undefined;
    return found?.unsupported === true;
  };
  const pending = () => {
    const { pendingDecisions, pendingFacts } = pendingInputs(result);
    return [...pendingDecisions, ...pendingFacts];
  };
  return { files, value, gap, pending };
}

const ftb = (run: ReturnType<typeof evaluate>, id: string) => run.value("form-3506", id);
const LINE_12 = "0.line.12_child_dependent_care_credit";
const preschool = factOf(PRESCHOOL).value as DependentCareProviderFactValue;
const ines = factOf(INES).value as DependentCareQualifyingPersonFactValue;
const orchard = factOf(ORCHARD_W2).value as W2FactValue;

describe("FTB 3506 who files", () => {
  it("files on a California return with care in California", () => {
    expect(evaluate().files("form-3506")).toBe(true);
  });

  it("does not file without Form 540", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_ca_540", false)]);
    expect(run.files("form-3506")).toBe(false);
  });

  it("does not file when every provider gave care outside California", () => {
    const outside = { line1: "1 Peach St", city: "Reno", state: "NV", zip: "89501" };
    const run = evaluate(
      factsWith({
        [PRESCHOOL]: { ...preschool, careAddress: outside },
        [SITTER]: { ...(factOf(SITTER).value as object), address: outside },
      }),
    );
    expect(run.files("form-3506")).toBe(false);
  });

  it("does not file when the wages alone put federal AGI over $100,000", () => {
    const run = evaluate(factsWith({ [ORCHARD_W2]: { ...orchard, box1: 70_000 } }));
    expect(run.files("form-3506")).toBe(false);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_3506", false)]);
    expect(run.files("form-3506")).toBe(false);
  });
});

describe("with no FTB 3506 facts, Form 540 is unchanged", () => {
  it("lines 40 and 47 are blank and line 48 is line 35", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_3506", false)]);
    expect([
      run.value("form-540", "line.40_child_dependent_care_credit"),
      run.value("form-540", "line.47_total_credits"),
      run.value("form-540", "line.48_tax_after_credits"),
    ]).toEqual([undefined, undefined, 830]);
  });
});

describe("Form 540 and Schedule P (540) receive line 12", () => {
  it("line 40 is line 12; line 48 is line 35 less it", () => {
    const run = evaluate();
    expect(ftb(run, LINE_12)).toBe(258);
    expect([
      run.value("form-540", "line.40_child_dependent_care_credit"),
      run.value("form-540", "line.47_total_credits"),
      run.value("form-540", "line.48_tax_after_credits"),
    ]).toEqual([258, 258, 572]);
  });

  it("with Schedule P, line 40 is Section A1 line 5 column (b)", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_schedule_p", true)]);
    const row = ["col_a", "col_b", "col_c"].map((column) =>
      run.value("schedule-p", `1.part3.5_child_dependent_care_credit_${column}`),
    );
    const excess = run.value("schedule-p", "1.part3.3_excess_tax_offset_by_credits_col_c");
    expect(excess).toBe(830);
    expect(row).toEqual([258, 258, 830 - 258]);
    expect(run.value("form-540", "line.40_child_dependent_care_credit")).toBe(258);
  });
});

describe("what FTB 3506 asks", () => {
  it("asks for the Part I household money", () => {
    const run = evaluate(factsWith({}, [CA_DEPENDENT_CARE_KEYS.householdFunds]));
    expect(run.pending()).toContain(CA_DEPENDENT_CARE_KEYS.householdFunds);
    expect(ftb(run, "0.part1.row1_source_of_income_left")).toBe("Interest");
    expect(ftb(run, "0.part1.row1_source_of_income_right")).toBe(undefined);
  });

  it("asks a provider's phone number and kind when they are not known", () => {
    const { phone: _phone, providerType: _type, ...bare } = preschool;
    const run = evaluate(factsWith({ [PRESCHOOL]: bare }));
    expect(run.pending()).toContain(PRESCHOOL);
    expect(ftb(run, "0.line.1d_person_or_organization_provider1")).toBe(undefined);
  });

  it("a household employee is a person who cares in the taxpayer's home", () => {
    const sitter = factOf(SITTER).value as DependentCareProviderFactValue;
    const { providerType: _type, ...rest } = sitter;
    const run = evaluate(factsWith({ [SITTER]: { ...rest, householdEmployee: true } }));
    expect(ftb(run, "0.line.1d_person_or_organization_provider2")).toBe("person");
    expect(ftb(run, "0.line.1f_address_where_care_provided_provider2")).toBe(
      "2716 Almond Row, Fresno, CA 93704",
    );
  });

  it("with care partly outside California, asks each person's California expenses", () => {
    const outside = { line1: "1 Peach St", city: "Reno", state: "NV", zip: "89501" };
    const sitter = factOf(SITTER).value as DependentCareProviderFactValue;
    const run = evaluate(factsWith({ [SITTER]: { ...sitter, careAddress: outside } }));
    expect(run.pending()).toEqual(expect.arrayContaining([MATEO, INES]));
    expect(ftb(run, "0.line.1a_care_provider_name_provider2")).toBe(undefined);
    const answered = evaluate(
      factsWith({
        [SITTER]: { ...sitter, careAddress: outside },
        [MATEO]: { ...(factOf(MATEO).value as object), californiaExpensesPaid: 4_300 },
        [INES]: { ...ines, californiaExpensesPaid: 1_000 },
      }),
    );
    expect(ftb(answered, "1.line.31_total_column_e_expenses")).toBe(5_300);
  });

  it("asks the California 2024 expenses when 2024 expenses were paid in 2025", () => {
    const run = evaluate(factsWith({ [DEPENDENT_CARE_KEYS.priorYearExpensesPaid]: 1_000 }));
    expect(run.pending()).toContain(CA_DEPENDENT_CARE_KEYS.priorYearExpensesPaid);
  });
});

describe("line 2 and the dollar limit", () => {
  it("leaves out a person in the taxpayer's custody 50% of the year or less", () => {
    const run = evaluate(factsWith({ [INES]: { ...ines, physicalCustodyPercent: 50 } }));
    expect(ftb(run, "0.line.2_row2_first_name_col_a")).toBe(undefined);
    expect(ftb(run, "1.line.28_expense_limit")).toBe(3_000);
    // 3,000 − 2,200 = 800; Mateo's 4,300; Form 2441 line 31 (two persons) 3,800.
    expect(ftb(run, "1.line.33_smallest_of_line_30_31_32")).toBe(800);
  });
});

describe("the gaps", () => {
  it("a Form 540NR return leaves the earned income lines unsupported", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_540nr", true)]);
    // Part IV lines 19 and 20 come first; line 3 waits on line 33 behind them.
    expect(run.gap("form-3506", "1.line.19_your_earned_income")).toBe(true);
    expect(run.gap("form-3506", "1.line.20_spouse_earned_income")).toBe(true);
    expect(ftb(run, LINE_12)).toBe(undefined);
    // With no benefits, lines 4 and 5 themselves are the gap.
    const noBenefits = evaluate(factsWith({ [ORCHARD_W2]: { ...orchard, box10: undefined } }), [
      decision("decisions.scope.must_file_540nr", true),
    ]);
    expect(noBenefits.gap("form-3506", "0.line.4_your_earned_income")).toBe(true);
    expect(noBenefits.gap("form-3506", "0.line.5_spouse_rdp_earned_income")).toBe(true);
  });

  it("Pub. 503, Jim and Sharon: deemed income for a student spouse is not modeled", () => {
    const run = evaluate(factsWith({ [DEPENDENT_CARE_KEYS.studentOrDisabledSpouse]: true }));
    expect(run.gap("form-3506", "1.line.20_spouse_earned_income")).toBe(true);
    // Form 540 waits rather than print a tax without the credit.
    expect(run.value("form-540", "line.48_tax_after_credits")).toBe(undefined);
  });

  it("a third provider goes on a statement that is not modeled", () => {
    const third = added(makeDependentCareProviderFactKey("third"), { ...preschool, name: "Third" });
    const run = evaluate(factsWith({}, [], [third]));
    expect(run.gap("form-3506", "0.line.1a_care_provider_name_provider2")).toBe(true);
  });
});

describe("the prior-year worksheet fills line 11", () => {
  it("with 2024 California expenses paid in 2025", () => {
    const facts = factsWith(
      { [DEPENDENT_CARE_KEYS.priorYearExpensesPaid]: 1_500 },
      [],
      [
        added(CA_DEPENDENT_CARE_KEYS.priorYearExpensesPaid, 1_500),
        added(CA_DEPENDENT_CARE_KEYS.priorYearWorksheet, {
          expensesPaidIn2024: 1_000,
          qualifyingPersons: 2,
          excludedBenefits: 0,
          yourEarnedIncome: 30_000,
          spouseEarnedIncome: 24_000,
          priorYearLine6: 1_000,
          federalAgi: 54_000,
          californiaAgi: 54_000,
        }),
      ],
    );
    const run = evaluate(facts);
    expect(ftb(run, "1.worksheet.15_prior_year_expenses_credit")).toBe(129);
    expect(ftb(run, "0.line.11_prior_year_expenses_credit")).toBe(129);
    expect(ftb(run, LINE_12)).toBe(258 + 129);
  });
});
