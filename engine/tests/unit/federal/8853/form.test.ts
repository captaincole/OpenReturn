/*
 * Form 8853 on a whole return: who files, the answers it waits for, the cases
 * it does not model, and the lines other forms take. The synthetic thaddeus
 * scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  ARCHER_MSA_KEYS,
  LTC_KEYS,
  makeHsaDistributionFactKey,
  makeLtcBenefitsFactKey,
  makeW2FactKey,
  type HsaDistributionFactValue,
  type LtcBenefitsFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { hollisScenario } from "../../../scenarios/synthetic/hollis/index.js";
import { thaddeusScenario as base } from "../../../scenarios/synthetic/thaddeus/index.js";

const isFormInput = (fact: TaxFactRow) =>
  fact.category === "hsa" || fact.category === "medical" || fact.category === "wages";
const otherFacts = base.facts.filter((fact) => !isFormInput(fact));
const template = base.facts.find((fact) => fact.category === "hsa")!;

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});
const answer = (key: string, value: unknown) =>
  row(key.startsWith("medical.") ? "medical" : "hsa", key, value);
const sa = (id: string, value: Partial<HsaDistributionFactValue>) =>
  row("hsa", makeHsaDistributionFactKey("trust", id), {
    payerName: "Trust",
    box1: 1000,
    box3: "1",
    box5: "Archer MSA",
    ...value,
  });
const ltc = (id: string, value: Partial<LtcBenefitsFactValue>) =>
  row("medical", makeLtcBenefitsFactKey("insurer", id), {
    payerName: "Insurer",
    insuredName: "Ilse Varnholt",
    insuredSsn: "400-00-8855",
    box1: 10000,
    box3: "per_diem",
    box4: true,
    box5: "chronically_ill",
    ...value,
  });
const w2 = (box12: W2FactValue["box12"]) =>
  row("wages", makeW2FactKey("puget-cedar"), {
    ...(base.facts.find((fact) => fact.category === "wages")!.value as W2FactValue),
    box12,
  });
const spouseW2 = (box12: W2FactValue["box12"]) =>
  row("wages", makeW2FactKey("spouse-clinic"), {
    ...(base.facts.find((fact) => fact.category === "wages")!.value as W2FactValue),
    owner: "spouse",
    box12,
  });
const wagesNoCodeR = base.facts.find((fact) => fact.category === "wages")!;

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(facts: TaxFactRow[], extraDecisions: AIDecisionRow[] = [], from = otherFacts) {
  const result = evaluateScenario({
    filing: { id: "form-8853-test", taxYear: base.taxYear },
    facts: [...from, ...facts],
    decisions: [
      ...base.decisions.filter(
        (kept) => !extraDecisions.some((extra) => extra.decisionKey === kept.decisionKey),
      ),
      ...extraDecisions,
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
  const reason = (formId: string, id: string) => {
    const found = field(formId, id);
    return found && !found.ok ? found.reason : undefined;
  };
  const missing = () => evaluateMissing(result);
  return { files, field, value, reason, missing };
}

function evaluateMissing(result: ReturnType<typeof evaluateScenario>): readonly string[] {
  return result.filingInfo?.missingInputs?.["form-8853"] ?? [];
}

const FORM = "form-8853";

describe("Form 8853 with no MSA or LTC facts: nothing changes", () => {
  const run = evaluate([], [], hollisScenario.facts);
  it("does not file, and the lines that take its results keep their reasons", () => {
    const hollis = evaluateScenario({
      filing: { id: "hollis", taxYear: 2025 },
      facts: hollisScenario.facts,
      decisions: hollisScenario.decisions,
      authEmail: null,
    });
    const mustFile = hollis.forms.get(FORM)?.mustFile;
    expect(mustFile?.ok === true ? mustFile.value : undefined).toBe(false);
    expect(run.files(FORM)).toBe(false);
  });

  it("Schedule 1 lines 8e and 23 and Schedule 2 lines 17e and 17f stay unsupported", () => {
    const fields = [
      ["schedule-1", "0.line.8e", "No Form 8853 (Archer MSA / LTC) scenario yet"],
      ["schedule-1", "1.line.23", "Form 8853 (Archer MSA) not ingested; no scenario."],
      [
        "schedule-2",
        "1.line.17e_additional_tax_archer_msa_distributions",
        "Form 8853 (Archer MSA) not ingested; no Archer MSA scenario yet",
      ],
      [
        "schedule-2",
        "1.line.17f_additional_tax_medicare_advantage_msa_distributions",
        "Form 8853 (Medicare Advantage MSA) not ingested; no scenario yet",
      ],
    ];
    const scheduleRun = evaluate(
      [],
      [
        decision("decisions.scope.must_file_schedule_1", true),
        decision("decisions.scope.must_file_schedule_2", true),
      ],
      hollisScenario.facts,
    );
    for (const [form, id, text] of fields) expect(scheduleRun.reason(form, id)).toBe(text);
  });
});

describe("Form 8853 who files (who-must-file::b01)", () => {
  it("files for the taxpayer's own Archer MSA contribution", () => {
    expect(
      evaluate([wagesNoCodeR, answer(ARCHER_MSA_KEYS.ownContributions, 500)]).files(FORM),
    ).toBe(true);
  });

  it("files for employer contributions (W-2 code R): line 5 is -0-, lines 3 and 4 blank", () => {
    const run = evaluate([
      w2([{ code: "R", amount: 1800 }]),
      answer(ARCHER_MSA_KEYS.ownContributions, 0),
    ]);
    expect(run.files(FORM)).toBe(true);
    expect([
      run.value(FORM, "0.line.1_employer_contributions"),
      run.value(FORM, "0.line.3_limitation"),
      run.value(FORM, "0.line.4_compensation"),
      run.value(FORM, "0.line.5_archer_msa_deduction"),
    ]).toEqual([1800, undefined, undefined, 0]);
  });

  it("files for an Archer MSA 1099-SA, and Form 8889 does not", () => {
    const run = evaluate([
      wagesNoCodeR,
      sa("a", {}),
      answer(ARCHER_MSA_KEYS.qualifiedMedicalExpenses, 1000),
    ]);
    expect([run.files(FORM), run.files("form-8889")]).toEqual([true, false]);
  });

  it("a reimbursed-basis 1099-LTC alone does not file the form (the Section C chart)", () => {
    expect(evaluate([wagesNoCodeR, ltc("r", { box3: "reimbursed" })]).files(FORM)).toBe(false);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(
      [wagesNoCodeR, sa("a", {})],
      [decision("decisions.scope.must_file_8853", false)],
    );
    expect(run.files(FORM)).toBe(false);
  });
});

describe("Form 8853 waits for its answers", () => {
  it("an Archer distribution waits for line 7, and Schedule 1 line 8e waits too", () => {
    const run = evaluate([wagesNoCodeR, sa("a", { box1: 2500 })]);
    expect(run.value(FORM, "0.line.6c_net_distributions")).toBe(2500);
    expect(run.value(FORM, "0.line.8_taxable_archer_msa_distributions")).toBeUndefined();
    expect(run.missing()).toContain(ARCHER_MSA_KEYS.qualifiedMedicalExpenses);
    expect(run.field("schedule-1", "0.line.8e")?.ok).toBe(false);
    expect(run.reason("schedule-1", "0.line.8e")).not.toContain("No Form 8853");
  });

  it("all of it rolled over: line 8 is -0- with no line 7 question", () => {
    const run = evaluate([
      wagesNoCodeR,
      sa("a", { box1: 900 }),
      answer(ARCHER_MSA_KEYS.rolledOverOrExcessWithdrawn, 900),
    ]);
    expect([
      run.value(FORM, "0.line.7_archer_qualified_medical_expenses"),
      run.value(FORM, "0.line.8_taxable_archer_msa_distributions"),
    ]).toEqual([undefined, 0]);
    expect(run.missing()).not.toContain(ARCHER_MSA_KEYS.qualifiedMedicalExpenses);
  });

  it("Part I waits for the coverage and the compensation", () => {
    const run = evaluate([wagesNoCodeR, answer(ARCHER_MSA_KEYS.ownContributions, 500)]);
    expect(run.missing()).toEqual(
      expect.arrayContaining([ARCHER_MSA_KEYS.coverage, ARCHER_MSA_KEYS.compensation]),
    );
    expect(run.value(FORM, "0.line.5_archer_msa_deduction")).toBeUndefined();
  });
});

describe("Form 8853 cases the engine does not model", () => {
  it("a death distribution (code 4) leaves Part II and Schedule 1 line 8e unsupported", () => {
    const run = evaluate([wagesNoCodeR, sa("a", { box3: "4" })]);
    expect(run.field(FORM, "0.line.8_taxable_archer_msa_distributions")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.field("schedule-1", "0.line.8e")).toMatchObject({ ok: false, unsupported: true });
  });

  it("Medicare Advantage distributions for both spouses: Section B is unsupported", () => {
    const run = evaluate([
      wagesNoCodeR,
      sa("m1", { box5: "MA MSA", owner: "taxpayer" }),
      sa("m2", { box5: "MA MSA", owner: "spouse" }),
    ]);
    expect(run.field(FORM, "0.line.12_taxable_medicare_advantage_distributions")).toMatchObject({
      unsupported: true,
    });
  });

  it("another payee for the insured (line 15 Yes): lines 21–26 are unsupported", () => {
    const run = evaluate([wagesNoCodeR, ltc("a", {}), answer(LTC_KEYS.otherPayees, true)]);
    expect(run.value(FORM, "1.line.15_other_person_received_payments_yes")).toBe(true);
    expect(run.value(FORM, "1.line.20_total_per_diem_payments")).toBe(10000);
    expect(run.field(FORM, "1.line.26_taxable_payments")).toMatchObject({ unsupported: true });
  });

  it("self-only plans, the spouse's employer funds the spouse's MSA: two statements, not -0-", () => {
    const run = evaluate([
      wagesNoCodeR,
      spouseW2([{ code: "R", amount: 1500 }]),
      answer(ARCHER_MSA_KEYS.coverage, [
        { months: 12, coverage: "self-only", annualDeductible: 3600, owner: "taxpayer" },
      ]),
      answer(ARCHER_MSA_KEYS.ownContributions, 2000),
      answer(ARCHER_MSA_KEYS.compensation, 60000),
    ]);
    expect(run.field(FORM, "0.line.5_archer_msa_deduction")).toMatchObject({ unsupported: true });
    expect(run.reason(FORM, "0.line.5_archer_msa_deduction")).toContain("Both spouses");
  });

  it("family coverage, the spouse's employer contributes: line 5 is -0- (neither deducts)", () => {
    const run = evaluate([
      wagesNoCodeR,
      spouseW2([{ code: "R", amount: 1500 }]),
      answer(ARCHER_MSA_KEYS.coverage, [
        { months: 12, coverage: "family", annualDeductible: 6000, owner: "taxpayer" },
      ]),
      answer(ARCHER_MSA_KEYS.ownContributions, 2000),
    ]);
    expect(run.value(FORM, "0.line.5_archer_msa_deduction")).toBe(0);
  });

  it("two insureds need two Sections C", () => {
    const run = evaluate([wagesNoCodeR, ltc("a", {}), ltc("b", { insuredSsn: "400-00-9999" })]);
    expect(run.field(FORM, "1.header.more_than_one_section_c")).toMatchObject({
      unsupported: true,
    });
  });
});

describe("Section C filing requirements (multiple-payees::b01, start-here-2::b01)", () => {
  it("only terminally ill accelerated death benefits: -0- on line 26, lines 18–25 blank", () => {
    const run = evaluate([
      wagesNoCodeR,
      ltc("a", { box1: 0, box2: 20000, box4: false, box5: "terminally_ill" }),
      answer(LTC_KEYS.otherPayees, false),
    ]);
    expect(run.value(FORM, "1.line.16_insured_terminally_ill_yes")).toBe(true);
    expect([
      run.value(FORM, "1.line.19_accelerated_death_benefits"),
      run.value(FORM, "1.line.26_taxable_payments"),
    ]).toEqual([undefined, 0]);
    expect(run.missing()).not.toContain(LTC_KEYS.periodDays);
  });

  it("a contract that is not qualified: lines 14a, 14b and 17 only", () => {
    const run = evaluate([wagesNoCodeR, ltc("a", { box4: false })]);
    expect(run.value(FORM, "1.line.17_gross_ltc_per_diem_payments")).toBe(10000);
    expect([
      run.value(FORM, "1.line.18_qualified_ltc_contract_payments"),
      run.value(FORM, "1.line.26_taxable_payments"),
    ]).toEqual([undefined, undefined]);
    expect(run.missing()).toEqual([]);
  });

  it("no box 5 on the 1099-LTC: line 16 is asked", () => {
    const run = evaluate([
      wagesNoCodeR,
      ltc("a", { box5: undefined }),
      answer(LTC_KEYS.otherPayees, false),
    ]);
    expect(run.missing()).toContain(LTC_KEYS.insuredTerminallyIll);
  });
});

describe("Form 8889 line 4 takes Form 8853 lines 1 and 2", () => {
  it("with an HSA too", () => {
    const run = evaluate([
      w2([{ code: "R", amount: 700 }]),
      answer(ARCHER_MSA_KEYS.ownContributions, 300),
      row("hsa", "hsa.coverage_type", "self-only"),
    ]);
    expect(run.value("form-8889", "0.line.4_archer_msa_contributions")).toBe(1000);
  });

  const spouseArcher = (hsaCoverage: string) => [
    wagesNoCodeR,
    answer(ARCHER_MSA_KEYS.coverage, [
      { months: 12, coverage: "self-only", annualDeductible: 3600, owner: "spouse" },
    ]),
    answer(ARCHER_MSA_KEYS.ownContributions, 2000),
    answer(ARCHER_MSA_KEYS.compensation, 50000),
    row("hsa", "hsa.coverage_type", hsaCoverage),
  ];

  it("the spouse's self-only Archer MSA leaves a self-only HSA's limit alone (pub 969 b06)", () => {
    const run = evaluate(spouseArcher("self-only"));
    expect(run.value(FORM, "0.line.2_archer_msa_contributions")).toBe(2000);
    expect(run.value("form-8889", "0.line.4_archer_msa_contributions")).toBe(0);
  });

  it("with family HSA coverage the spouse's Archer MSA counts (the 8889 line 4 text)", () => {
    const run = evaluate(spouseArcher("family"));
    expect(run.value("form-8889", "0.line.4_archer_msa_contributions")).toBe(2000);
  });
});

describe("FTB 3805P Part III takes Form 8853 (ca-3805p-inst-2025 Part III, b01–b03)", () => {
  const caDecisions = [
    decision("decisions.scope.must_file_ca_540", true),
    decision("decisions.scope.ca_residency", "full_year_resident"),
  ];
  it("one account holder: line 9 = line 8, line 10b = 12.5% of the part with no exception", () => {
    const run = evaluate(
      [
        wagesNoCodeR,
        sa("a", { box1: 3000 }),
        answer(ARCHER_MSA_KEYS.qualifiedMedicalExpenses, 1000),
      ],
      caDecisions,
    );
    expect(run.files("form-3805p")).toBe(true);
    expect([
      run.value("form-3805p", "0.part3.line_9_taxable_archer_msa_distribution"),
      run.value("form-3805p", "0.part3.line_10a_archer_msa_tax_exception"),
      run.value("form-3805p", "0.part3.line_10b_archer_msa_tax_due"),
    ]).toEqual([2000, undefined, 250]);
  });
});
