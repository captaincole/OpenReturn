/*
 * Form 6765 on a whole return: who files, the section 280C reduction on
 * Schedule C, the Form 3800 sources, Section D, the gaps, and "no facts,
 * nothing changes". The synthetic cowin (the regular credit, no election, a
 * K-1) and dena (the ASC, the 280C and payroll tax elections) are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  RESEARCH_CREDIT_KEY,
  makeGeneralBusinessCreditFactKey,
  type GeneralBusinessCreditFactValue,
  type ResearchCreditFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  LAB_KEY,
  research as cowinResearch,
  lab,
} from "../../../scenarios/synthetic/cowin/facts.js";
import { cowinScenario as cowin } from "../../../scenarios/synthetic/cowin/index.js";
import { research as denaResearch } from "../../../scenarios/synthetic/dena/facts.js";
import { denaScenario as dena } from "../../../scenarios/synthetic/dena/index.js";
import type { Scenario } from "../../../types.js";

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (base: Scenario, category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const replaced = (facts: TaxFactRow[], key: string, value: unknown) =>
  facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));

const withResearch = (base: Scenario, change: Partial<ResearchCreditFactValue>) => {
  const current = base.facts.find((fact) => fact.key === RESEARCH_CREDIT_KEY)!
    .value as ResearchCreditFactValue;
  return replaced(base.facts, RESEARCH_CREDIT_KEY, { ...current, ...change });
};

function evaluate(
  base: Scenario,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
) {
  const result = evaluateScenario({
    filing: { id: "form-6765-test", taxYear: base.taxYear },
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
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line: (id: string) => value("form-6765", id), missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_28 = "1.line.28_subtract_27_from_13_or_26";
const LINE_29 = "1.line.29_pass_through_research_credit";
const LINE_30 = "1.line.30_total_current_year_credit";
const LINE_33A = "1.line.33a_qsb_payroll_tax_election";
const LINE_36 = "1.line.36_payroll_tax_credit_amount";
const WAGES = "0.line.26";
const ROW_4I = "3.part3.4i_form_6765_esb_col_g";
const ROW_4I_PASSIVE = "3.part3.4i_form_6765_esb_col_d";
const ROW_1C = "2.part3.1c_form_6765_col_g";
const CREDITS = "0.line.6a";

describe("Form 6765 who files", () => {
  it("the taxpayer's own research files it; line 30 is line 28 and the K-1's line 29", () => {
    const run = evaluate(cowin, cowin.facts);
    expect(run.files("form-6765")).toBe(true);
    expect(run.line(LINE_28)).toBe(42_800);
    expect(run.line(LINE_29)).toBe(3_000);
    expect(run.line(LINE_30)).toBe(45_800);
  });

  it("a K-1 research credit alone does not file it, and still reaches Form 3800 line 1c (general-instructions::b01)", () => {
    const run = evaluate(
      cowin,
      cowin.facts.filter((fact) => fact.key !== RESEARCH_CREDIT_KEY),
    );
    expect(run.files("form-6765")).toBe(false);
    expect(run.value("form-3800", ROW_1C)).toBe(3_000);
    expect(run.value("form-3800", ROW_4I)).toBeUndefined();
  });

  it("the decision files it with no fact, and the form asks for one", () => {
    const facts = dena.facts.filter((fact) => fact.key !== RESEARCH_CREDIT_KEY);
    const run = evaluate(dena, facts, [
      ...dena.decisions,
      decision(dena, "decisions.scope.must_file_6765", true),
    ]);
    expect(run.files("form-6765")).toBe(true);
    expect(run.missing("form-6765")).toContain(RESEARCH_CREDIT_KEY);
    expect(run.line(LINE_28)).toBeUndefined();
  });

  it("the reduced credit election with no QREs files the form and claims no credit (item-a-section-280c-election::b01)", () => {
    const run = evaluate(
      dena,
      withResearch(dena, { expenses: undefined, energyConsortiaPayments: undefined }),
    );
    expect(run.files("form-6765")).toBe(true);
    expect(run.line("0.header.a_reduced_credit_280c_yes")).toBe(true);
    expect(run.line(LINE_28)).toBeUndefined();
    expect(run.files("form-3800")).toBe(false);
  });
});

describe("Form 6765 and the deduction (section 280C)", () => {
  it("without the election Schedule C line 26 is the wages less line 28", () => {
    const run = evaluate(cowin, cowin.facts);
    expect(run.value("schedule-c", WAGES)).toBe(1_500_000 - 42_800);
  });

  it("with the election the wages stay as stated", () => {
    const run = evaluate(dena, dena.facts);
    expect(run.value("schedule-c", WAGES)).toBe(2_340_000);
  });

  it("no research fact, nothing changes: Schedule C line 26 is the stated wages", () => {
    const run = evaluate(
      cowin,
      cowin.facts.filter((fact) => fact.key !== RESEARCH_CREDIT_KEY),
    );
    expect(run.value("schedule-c", WAGES)).toBe(1_500_000);
  });

  it("a credit larger than the lines that hold the research expenses is a gap on line 28", () => {
    const small = {
      ...lab,
      expenses: { ...lab.expenses, wages: 20_000, supplies: 1_000, contractLabor: 0 },
    };
    const run = evaluate(cowin, replaced(cowin.facts, LAB_KEY, small));
    expect(isGap(run.field("form-6765", LINE_28))).toBe(true);
    expect(run.value("schedule-c", WAGES)).toBe(20_000);
  });

  it("research in a business that is not on the return is a gap on line 28", () => {
    const run = evaluate(cowin, withResearch(cowin, { businessKey: "business.elsewhere" }));
    expect(isGap(run.field("form-6765", LINE_28))).toBe(true);
    expect(run.value("schedule-c", WAGES)).toBe(1_500_000);
  });
});

describe("Form 6765 on Form 3800", () => {
  it("an eligible small business goes on line 4i, the K-1 that is not one on line 1c; Schedule 3 line 6a takes both", () => {
    const run = evaluate(cowin, cowin.facts);
    expect(run.value("form-3800", ROW_4I)).toBe(42_800);
    expect(run.value("form-3800", ROW_1C)).toBe(3_000);
    expect(run.value("schedule-3", CREDITS)).toBe(45_800);
  });

  it("average gross receipts over $50 million go on line 1c (eligible-small-business-for-purposes-of::b01)", () => {
    const run = evaluate(
      cowin,
      withResearch(cowin, { grossReceiptsPriorYears: [60e6, 60e6, 60e6] }),
    );
    expect(run.value("form-3800", ROW_4I)).toBeUndefined();
    expect(run.value("form-3800", "2.part3.1c_form_6765_col_a")).toBe(2);
  });

  it("a passive business's credit is a passive source, so Form 8582-CR files for it", () => {
    const passive = { ...lab, materiallyParticipated: false };
    const run = evaluate(cowin, replaced(cowin.facts, LAB_KEY, passive));
    expect(run.files("form-8582-cr")).toBe(true);
    // A passive business's own profit is a gap on Form 8582, so the tax and Form 3800 wait on it (as Form 5884's test).
    expect(run.value("form-3800", ROW_4I_PASSIVE)).toBeUndefined();
    expect(run.value("form-3800", ROW_4I)).toBeUndefined();
  });

  it("an unanswered material participation waits on the business (Schedule C line G)", () => {
    const unanswered = { ...lab, materiallyParticipated: undefined };
    const run = evaluate(cowin, replaced(cowin.facts, LAB_KEY, unanswered));
    expect(run.missing("form-3800")).toContain(LAB_KEY);
  });

  it("the research limitation waits on the attributable taxable income (lines-1c-and-4i::b01)", () => {
    const run = evaluate(cowin, withResearch(cowin, { attributableTaxableIncome: undefined }));
    expect(run.missing("form-3800")).toContain(RESEARCH_CREDIT_KEY);
  });

  it("a hand-stated line 4i credit next to the fact is a gap, not a second credit", () => {
    const stated: GeneralBusinessCreditFactValue = {
      sourceForm: "6765",
      line: "4i",
      amount: 42_800,
      passive: false,
    };
    const facts = [
      ...cowin.facts,
      row(cowin, "other", makeGeneralBusinessCreditFactKey("lab-research"), stated),
    ];
    const run = evaluate(cowin, facts);
    expect(isGap(run.field("form-3800", "3.part3.5_add_lines_4a_4z_col_g"))).toBe(true);
  });
});

describe("Form 6765 Section D", () => {
  it("the payroll tax credit is the smallest of lines 28, 34 and 35", () => {
    const run = evaluate(dena, dena.facts);
    expect(run.line(LINE_33A)).toBe(true);
    expect(run.line("1.line.34_elected_payroll_tax_credit")).toBe(20_000);
    expect(run.line("1.line.35_gbc_carryforward_current_year")).toBe(8_460);
    expect(run.line(LINE_36)).toBe(8_460);
  });

  it("no election leaves Section D blank with the boxes unchecked", () => {
    const run = evaluate(cowin, cowin.facts);
    expect(run.line(LINE_33A)).toBe(false);
    expect(run.line(LINE_36)).toBeUndefined();
  });

  it("an election by a business that is not a qualified small business is a gap", () => {
    const election = { ...denaResearch.payrollTaxElection!, firstYearWithGrossReceipts: 2015 };
    const run = evaluate(dena, withResearch(dena, { payrollTaxElection: election }));
    expect(isGap(run.field("form-6765", LINE_33A))).toBe(true);
    expect(isGap(run.field("form-6765", LINE_36))).toBe(true);
    expect(run.line(LINE_28)).toBe(65_001);
  });
});

describe("Form 6765 waits and gaps", () => {
  it("QREs with no method wait on the fact: line 28 is blank and the form asks (face-page-1::b01)", () => {
    const run = evaluate(cowin, withResearch(cowin, { method: undefined }));
    expect(run.line(LINE_28)).toBeUndefined();
    expect(run.missing("form-6765")).toContain(RESEARCH_CREDIT_KEY);
    expect(run.value("schedule-c", WAGES)).toBe(1_500_000);
  });

  it("more than 15 business components: Total from attachments is a gap, the credit still computes (how-to-complete-section-g::b03)", () => {
    const components = Array.from({ length: 17 }, (_, index) => ({
      name: `Component ${index + 1}`,
      type: "product" as const,
      directResearchWages: 20_000 + 1_000 * index,
    }));
    const run = evaluate(cowin, withResearch(cowin, { businessComponents: components }));
    const attached = "3.line.50_total_from_attachments_direct_research_wages";
    expect(isGap(run.field("form-6765", attached))).toBe(true);
    // 17 × 20,000 + 1,000 × (0 + 1 + … + 16) = 476,000.
    expect(run.line("3.line.50_total_direct_research_wages")).toBe(476_000);
    expect(typeof run.line(LINE_28)).toBe("number");
  });

  it("the cowin fact with its method asks nothing", () => {
    expect(evaluate(cowin, cowin.facts).missing("form-6765")).toEqual([]);
  });

  const inCalifornia = (facts: TaxFactRow[]) =>
    evaluate(cowin, facts, [
      ...cowin.decisions.filter((each) => each.decisionKey !== "decisions.scope.must_file_ca_540"),
      decision(cowin, "decisions.scope.must_file_ca_540", true),
    ]);
  const LINE_3B = "0.line.b3_subtractions";

  it("a California return with the federal 280C reduction makes Schedule CA line 3 a gap (ftb-pub-1001-2025 ::b05)", () => {
    const run = inCalifornia(cowin.facts);
    expect(isGap(run.field("schedule-ca", LINE_3B))).toBe(true);
    expect(isGap(run.field("schedule-ca", "0.line.b3_additions"))).toBe(true);
  });

  it("with the reduced credit election nothing is reduced, so line 3 is not a research gap", () => {
    const run = inCalifornia(withResearch(cowin, { reducedCreditElection: true }));
    expect(isGap(run.field("schedule-ca", LINE_3B))).toBe(false);
  });
});

describe("Form 6765 lines an individual leaves blank", () => {
  it("the corporate basic research lines and the estate and trust lines stay blank", () => {
    const run = evaluate(cowin, cowin.facts);
    for (const id of [
      "0.line.2_basic_research_payments",
      "0.line.4_subtract_3_from_2",
      "1.line.31_allocated_to_beneficiaries",
      "1.line.46_basic_research_payments",
    ]) {
      expect(run.line(id)).toBeUndefined();
    }
    expect(run.line("1.line.41_asc_730_directive_no")).toBe(true);
    expect(run.line("1.line.section_f_a_complete_section_g_no")).toBe(true);
    expect(cowinResearch.businessComponents).toHaveLength(4);
    expect(run.line("2.line.49_row_4_col_c_name")).toBe("Aggregate Business Components");
    expect(run.line("2.line.49_row_4_col_a_ein")).toBeUndefined();
  });
});
