/*
 * Form 8915-F on a whole return: who files, what Form 1040 lines 4b and 5b and
 * Form 5329 take from it, Form 8606 lines 15b and 25b, and the cases the
 * engine does not figure. The synthetic agelmar and sorilea scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeDisasterRetirementFactKey,
  type DisasterRetirementFactValue,
  type RetirementDistributionFactValue,
  type RothIraFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { partIIIFigures } from "../../../../src/federal/8606/partIII.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  DISASTER_FORM,
  HARDSHIP_401K_KEY,
  MARINE_401K_KEY,
  TRADITIONAL_IRA_KEY,
} from "../../../scenarios/synthetic/agelmar/facts.js";
import { agelmarScenario as base } from "../../../scenarios/synthetic/agelmar/index.js";
import { sorileaScenario } from "../../../scenarios/synthetic/sorilea/index.js";

const FORM_KEY = makeDisasterRetirementFactKey("taxpayer-2024");
const isForm = (fact: TaxFactRow) => fact.key.startsWith("retirement.qualified_disaster.");
const otherFacts = base.facts.filter((fact) => !isForm(fact));
const template = base.facts.find(isForm)!;

const form = (value: Partial<DisasterRetirementFactValue>, key = FORM_KEY): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  key,
  value: { ...DISASTER_FORM, ...value },
});

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
    filing: { id: "form-8915-f-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const evaluated = result.forms.get(formId);
    return evaluated?.mustFile.ok ? evaluated.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  return { files, field, value };
}

const UNSUPPORTED = { ok: false, unsupported: true };
const LINE_4B = "line.4b";
const LINE_5B = "line.5b";
const FORM = "form-8915-f";

describe("Form 8915-F who files", () => {
  it("files for a qualified disaster distribution this year (who-must-file::b01)", () => {
    const run = evaluate([...otherFacts, form({})]);
    expect(run.files(FORM)).toBe(true);
  });

  it("files for income spread from an earlier year alone: lines 12–15 and 23–26, no Part I", () => {
    const run = evaluate([
      ...otherFacts,
      form({ qualifiedDisasterDistributions: [], homePurchaseDistributions: [] }),
    ]);
    expect(run.files(FORM)).toBe(true);
    expect(run.value(FORM, "1.line.6_total_qualified_disaster_distributions")).toBeUndefined();
    expect(run.value(FORM, "2.line.8_amount_on_line_2_col_b_no")).toBeUndefined();
    expect(run.value(FORM, "2.line.12_income_for_prior_years")).toBe(2_000);
    expect(run.value(FORM, "2.line.15_amount_subject_to_tax")).toBe(500);
    expect(run.value(FORM, "2.line.26_amount_subject_to_tax")).toBe(334);
    // The 1099-Rs stay ordinary: 25,000 + 334 on line 4b, 13,800 + 11,400 + 500 on line 5b.
    expect(run.value("form-1040", LINE_4B)).toBe(25_334);
    expect(run.value("form-1040", LINE_5B)).toBe(25_700);
  });

  it("does not file when nothing applies: a distribution outside every disaster's period", () => {
    const run = evaluate([
      ...otherFacts,
      form({
        qualifiedDisasterDistributions: [
          { distributionKey: TRADITIONAL_IRA_KEY, date: "2025-10-01" },
        ],
        homePurchaseDistributions: [],
        lastYearForm: undefined,
        repaymentsThisYear: undefined,
      }),
    ]);
    expect(run.files(FORM)).toBe(false);
    expect(run.value("form-1040", LINE_4B)).toBe(25_000);
  });

  it("the decision wins: false keeps the 1099-Rs as they are", () => {
    const run = evaluate(
      [...otherFacts, form({})],
      [...base.decisions, decision("decisions.scope.must_file_8915_f", false)],
    );
    expect(run.files(FORM)).toBe(false);
    expect(run.value("form-1040", LINE_4B)).toBe(25_000);
    expect(run.value("form-1040", LINE_5B)).toBe(25_200);
  });
});

describe("Form 8915-F: no facts, nothing changes", () => {
  it("without the fact, Form 1040 and Form 5329 read the 1099-Rs as before", () => {
    const run = evaluate(otherFacts);
    expect(run.files(FORM)).toBe(false);
    expect(run.value("form-1040", LINE_4B)).toBe(25_000);
    expect(run.value("form-1040", LINE_5B)).toBe(25_200);
    // Code 1 on every 1099-R and no exception: Schedule 2 line 8 takes 10% without Form 5329.
    expect(run.files("form-5329")).toBe(false);
    expect(run.value("schedule-2", "0.line.8_additional_tax_iras_tax_favored_accounts")).toBe(
      5_020,
    );
  });

  it("Form 8606 lines 15b and 25b stay unfigured without a Form 8915-F fact", () => {
    const facts = sorileaScenario.facts.filter((fact) => !isForm(fact));
    const run = evaluateScenario({
      filing: { id: "form-8606-test", taxYear: 2025 },
      facts,
      decisions: sorileaScenario.decisions,
      authEmail: null,
    });
    const line15b = run.forms
      .get("form-8606")
      ?.fields.find(
        (each) => each.fieldId === "form-8606.1.line.15b_qualified_disaster_distributions",
      );
    expect(line15b?.result).toMatchObject(UNSUPPORTED);
  });
});

describe("Form 8915-F results on other forms", () => {
  it("Form 1040 lines 4b and 5b take lines 26, 15 and 32; lines 4a and 5a keep box 1", () => {
    const run = evaluate(base.facts);
    expect(run.value("form-1040", "line.4a")).toBe(25_000);
    expect(run.value("form-1040", LINE_4B)).toBe(4_000 + 7_334);
    expect(run.value("form-1040", "line.5a")).toBe(27_000);
    expect(run.value("form-1040", LINE_5B)).toBe(5_100 + 6_400);
  });

  it("Form 5329 line 1 leaves out the qualified amounts and the repaid Part IV part", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-5329")).toBe(true);
    expect(run.value("form-5329", "0.line.1_early_distributions_in_income")).toBe(4_000 + 6_400);
  });

  it("the box on lines 11 and 22 puts the whole taxable amount in this year", () => {
    const run = evaluate([...otherFacts, form({ electNotToSpread: true })]);
    expect(run.value(FORM, "2.line.11_elect_not_to_spread")).toBe(true);
    expect(run.value(FORM, "2.line.11_taxable_amount_this_year")).toBe(13_800);
    expect(run.value(FORM, "2.line.22_taxable_amount_this_year")).toBe(21_000);
  });

  it("a disaster with its $22,000 used: line 1e is 0, line 7 is taxable, earlier income stays", () => {
    const [used] = DISASTER_FORM.disasters;
    const run = evaluate([
      ...otherFacts,
      form({
        disasters: [{ ...used, earlierQualifiedDisasterDistributions: 22_000 }],
        qualifiedDisasterDistributions: [
          { distributionKey: TRADITIONAL_IRA_KEY, date: "2025-02-01" },
        ],
        homePurchaseDistributions: [],
      }),
    ]);
    // The form, line 1e: "If the amount on line 1e is zero, complete lines 2 through 4 in column (a), skip line 5, enter -0- on line 6".
    expect(run.value(FORM, "1.line.1a_disaster_distribution_limit_col_b")).toBe(22_000);
    expect(run.value(FORM, "1.line.1b_prior_year_disaster_distributions_col_b")).toBe(22_000);
    expect(run.value(FORM, "1.line.1e_total_available_disaster_distribution_col_b")).toBe(0);
    expect(run.value(FORM, "1.line.3_traditional_ira_distributions_col_a")).toBe(25_000);
    expect(run.value(FORM, "1.line.3_traditional_ira_distributions_col_b")).toBeUndefined();
    expect(run.value(FORM, "1.line.5b_distributions_less_line_5a_col_b")).toBeUndefined();
    expect(run.value(FORM, "1.line.6_total_qualified_disaster_distributions")).toBe(0);
    expect(run.value(FORM, "1.line.7_taxable_amount")).toBe(52_000);
    // The earlier year's spread income still comes in (Appendix A, part-ii::b01).
    expect(run.value(FORM, "2.line.12_income_for_prior_years")).toBe(2_000);
    // The 1099-Rs stay ordinary, as with no Part I.
    expect(run.value("form-1040", LINE_4B)).toBe(25_334);
    expect(run.value("form-1040", LINE_5B)).toBe(25_700);
  });

  it("Worksheet 1B: a distribution outside one disaster's period leaves lines 1a–1e blank", () => {
    const run = evaluate([
      ...otherFacts,
      form({
        qualifiedDisasterDistributions: [
          { distributionKey: TRADITIONAL_IRA_KEY, date: "2025-05-01" },
          { distributionKey: MARINE_401K_KEY, date: "2025-02-14" },
        ],
      }),
    ]);
    expect(
      run.value(FORM, "1.line.1e_total_available_disaster_distribution_col_b"),
    ).toBeUndefined();
    /*
     * DR-9917-FL (through 04/08/2025): $14,000 room takes the 401(k)'s February $15,000 first.
     * DR-9922-FL (through 07/08/2025): $22,000 takes the last $1,000 of it and $21,000 of the IRA.
     */
    expect(run.value(FORM, "1.line.2_retirement_plan_distributions_col_b")).toBe(15_000);
    expect(run.value(FORM, "1.line.3_traditional_ira_distributions_col_b")).toBe(21_000);
    expect(run.value(FORM, "1.line.5b_distributions_less_line_5a_col_b")).toBe(36_000);
  });
});

describe("Form 8606 with Form 8915-F", () => {
  it("Example 1 (irs-8606-inst-2025::sec::example-1-in-february-2025-an-11-000::b01): 15b $20,000, 8915-F line 18 $20,000", () => {
    const run = evaluateScenario({
      filing: { id: "sorilea-test", taxYear: 2025 },
      facts: sorileaScenario.facts,
      decisions: sorileaScenario.decisions,
      authEmail: null,
    });
    const value = (formId: string, id: string) => {
      const result = run.forms
        .get(formId)
        ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
      return result?.ok ? result.value : undefined;
    };
    expect(value("form-8606", "1.line.15a_line_7_minus_line_12")).toBe(30_000);
    expect(value("form-8606", "1.line.15b_qualified_disaster_distributions")).toBe(20_000);
    expect(value(FORM, "2.line.18_form_8606_line_15b")).toBe(20_000);
    expect(value("form-1040", LINE_4B)).toBe(10_000 + 6_667);
  });

  it("Roth Example 1 (…-2::b01): line 25a $30,000, 25b $20,000, 25c $10,000", () => {
    const row: RetirementDistributionFactValue = {
      payerName: "Roth IRA",
      box1: 33_000,
      box7: "J",
      box7IraSepSimple: false,
    };
    const roth: RothIraFactValue = { contributionBasis: 3_000, conversionAndRolloverBasis: 0 };
    expect(partIIIFigures([row], roth, 22_000)).toMatchObject({
      line21: 33_000,
      line25a: 30_000,
      line25b: 20_000,
      line25c: 10_000,
    });
    expect(partIIIFigures([row], roth).line25c).toBe(30_000);
  });
});

describe("Form 8915-F cases the engine does not figure", () => {
  const gapOf = (facts: TaxFactRow[]) =>
    evaluate(facts).field(FORM, "2.line.15_amount_subject_to_tax");

  it("a distribution dated outside 2025", () => {
    const facts = [
      ...otherFacts,
      form({
        qualifiedDisasterDistributions: [
          { distributionKey: TRADITIONAL_IRA_KEY, date: "2024-12-30" },
        ],
      }),
    ];
    expect(gapOf(facts)).toMatchObject(UNSUPPORTED);
    expect(evaluate(facts).field("form-1040", LINE_4B)).toMatchObject(UNSUPPORTED);
  });

  it("a 1099-R that is not on the return", () => {
    const facts = [
      ...otherFacts,
      form({
        qualifiedDisasterDistributions: [
          { distributionKey: "payer.none.distributions.x", date: "2025-02-01" },
        ],
      }),
    ];
    expect(gapOf(facts)).toMatchObject(UNSUPPORTED);
  });

  it("item B 2020: no 2025 lines exist for 2020 disasters", () => {
    expect(gapOf([...otherFacts, form({ disasterYear: 2020 })])).toMatchObject(UNSUPPORTED);
  });

  it("one person with Part I on two forms (the later form's available distributions)", () => {
    const flood2025 = { ...DISASTER_FORM.disasters[1], beginningDate: "2025-01-02" };
    const facts = [
      ...otherFacts,
      form({
        homePurchaseDistributions: [],
        qualifiedDisasterDistributions: [
          { distributionKey: TRADITIONAL_IRA_KEY, amount: 10_000, date: "2025-03-03" },
        ],
      }),
      form(
        {
          disasterYear: 2025,
          disasters: [flood2025],
          qualifiedDisasterDistributions: [
            { distributionKey: HARDSHIP_401K_KEY, date: "2025-01-20" },
          ],
          homePurchaseDistributions: [],
        },
        makeDisasterRetirementFactKey("taxpayer-2025"),
      ),
    ];
    expect(evaluate(facts).field("form-1040", LINE_5B)).toMatchObject(UNSUPPORTED);
  });

  it("more than two Part I disasters: the statement box is a gap, the lines still figure", () => {
    const third = { ...DISASTER_FORM.disasters[1], femaNumber: "DR-9925-FL" };
    const run = evaluate([...otherFacts, form({ disasters: [...DISASTER_FORM.disasters, third] })]);
    expect(run.field(FORM, "1.line.part1_disaster_table_more_than_two_disasters")).toMatchObject(
      UNSUPPORTED,
    );
    expect(run.value(FORM, "1.line.1d_limit_for_new_disasters_col_b")).toBe(44_000);
    expect(run.value(FORM, "1.line.5b_distributions_less_line_5a_col_b")).toBe(40_000);
  });
});
