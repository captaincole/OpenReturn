/*
 * Form 8396 on a whole return: who files, what it asks, the lines it fills on
 * Schedule 3, Schedule A, Schedule 8812 and Schedule CA (540), the cases the
 * engine leaves to a person, and "no facts, nothing changes". The synthetic
 * wren scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeDependentFactKey,
  MORTGAGE_CREDIT_KEYS,
  MORTGAGE_KEYS,
  type MortgageCreditCertificateFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { wrenScenario as base } from "../../../scenarios/synthetic/wren/index.js";

const isCreditFact = (fact: TaxFactRow) =>
  fact.key === MORTGAGE_CREDIT_KEYS.certificate ||
  fact.key.startsWith("prior_year.mortgage_credit");
const certificateFact = base.facts.find((fact) => fact.key === MORTGAGE_CREDIT_KEYS.certificate)!;
const baseCertificate = certificateFact.value as MortgageCreditCertificateFactValue;

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const withFact = (facts: TaxFactRow[], key: string, value: unknown, category = "other") => [
  ...facts.filter((fact) => fact.key !== key),
  { ...certificateFact, id: `f-${key}`, key, value, category },
];

const withCertificate = (overrides: Partial<MortgageCreditCertificateFactValue>) =>
  withFact(
    base.facts,
    MORTGAGE_CREDIT_KEYS.certificate,
    { ...baseCertificate, ...overrides },
    "mortgage",
  );

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8396-test", taxYear: base.taxYear },
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
  return { files, field, value, pending: pendingInputs(result) };
}

const LINE_8A = "0.line.8a_mortgage_interest_form1098";
const LINE_8 = "0.line.8_tax_liability_limitation";
const LINE_9 = "0.line.9_current_year_mortgage_interest_credit";
const UNSUPPORTED = { ok: false, unsupported: true };

describe("Form 8396 who files and what it asks", () => {
  it("files with a certificate, and Schedule 3 files with it", () => {
    const run = evaluate(base.facts);
    expect([run.files("form-8396"), run.files("schedule-3")]).toEqual([true, true]);
    expect(run.pending.pendingFacts).toEqual([]);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8396", false),
    ]);
    expect(run.files("form-8396")).toBe(false);
  });

  it("a carryforward with no certificate files the form and asks for the certificate", () => {
    const facts = base.facts.filter((fact) => fact.key !== MORTGAGE_CREDIT_KEYS.certificate);
    const run = evaluate(facts);
    expect(run.files("form-8396")).toBe(true);
    expect(run.pending.pendingFacts).toContain(MORTGAGE_CREDIT_KEYS.certificate);
    expect(run.value("form-8396", "0.line.7_total_credit_available")).toBeUndefined();
    expect(run.value("schedule-a", LINE_8A)).toBeUndefined();
  });

  it("a certificate asks each carryforward; 0 is an answer", () => {
    const facts = base.facts.filter(
      (fact) => fact.key !== MORTGAGE_CREDIT_KEYS.carryforwardFrom2023,
    );
    expect(evaluate(facts).pending.pendingFacts).toEqual([
      MORTGAGE_CREDIT_KEYS.carryforwardFrom2023,
    ]);
    const zero = evaluate(withFact(base.facts, MORTGAGE_CREDIT_KEYS.carryforwardFrom2023, 0));
    expect(zero.value("form-8396", "0.line.5_carryforward_from_2023")).toBeUndefined();
    expect(zero.value("form-8396", "0.line.7_total_credit_available")).toBe(2_900);
  });
});

describe("no Form 8396 facts, nothing changes", () => {
  const run = evaluate(base.facts.filter((fact) => !isCreditFact(fact)));

  it("the form does not file, and Schedule A line 8a is the whole 1098 interest", () => {
    expect(run.files("form-8396")).toBe(false);
    expect(run.value("schedule-a", LINE_8A)).toBe(11_520);
  });

  it("Schedule 3 line 6g is blank and line 8 is the energy credit alone", () => {
    expect(run.value("schedule-3", "0.line.6g")).toBeUndefined();
    expect(run.value("schedule-3", "0.line.8")).toBe(360);
  });
});

describe("Form 8396 results on other forms", () => {
  it("Schedule A line 8a is the 1098 interest less line 3; Schedule 3 line 6g is line 9", () => {
    const run = evaluate(base.facts);
    expect(run.value("schedule-a", LINE_8A)).toBe(11_520 - 2_000);
    expect(run.value("schedule-3", "0.line.6g")).toBe(1_727);
    expect(run.value("form-1040", "line.20")).toBe(2_087);
  });

  it("no tax left: lines 8 and 9 are 0 and the whole credit carries", () => {
    const facts = withFact(base.facts, "charitable.cash", 9_000, "charitable");
    const raised = evaluate(withFact(facts, MORTGAGE_KEYS.interestForm1098, 30_000, "mortgage"));
    const line18 = raised.value("form-8396", "1.line8_worksheet.1_form_1040_line_18") as number;
    expect(line18).toBeLessThanOrEqual(360);
    expect(raised.value("form-8396", LINE_8)).toBe(0);
    expect(raised.value("form-8396", LINE_9)).toBe(0);
    expect(raised.value("form-8396", "0.line.17_2025_carryforward_to_2026")).toBe(2_000);
  });

  it("line 3 more than the 1098 interest leaves Schedule A line 8a to a person", () => {
    const run = evaluate(withFact(base.facts, MORTGAGE_KEYS.interestForm1098, 1_500, "mortgage"));
    expect(run.field("schedule-a", LINE_8A)).toMatchObject(UNSUPPORTED);
  });

  it("different rates in the year of refinancing: lines 1 to 3 and Schedule A line 8a are unsupported", () => {
    const run = evaluate(
      withCertificate({
        reissued: { creditUnderOriginalCertificate: 1_800, ratesDifferThisYear: true },
      }),
    );
    expect(run.field("form-8396", "0.line.3_interest_times_credit_rate")).toMatchObject(
      UNSUPPORTED,
    );
    expect(run.field("form-8396", "0.line.2_certificate_credit_rate")).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-a", LINE_8A)).toMatchObject(UNSUPPORTED);
  });

  it("a main home at another address prints in the header", () => {
    const run = evaluate(withCertificate({ homeAddress: "12 Heron Way, Tampa, FL 33611" }));
    expect(run.value("form-8396", "0.header.main_home_address")).toBe(
      "12 Heron Way, Tampa, FL 33611",
    );
  });

  it("a Form 1116 filer: the worksheet would miss Schedule 3 line 1, so lines 8 and 9 are unsupported", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_1116", true),
    ]);
    expect(run.field("form-8396", LINE_8)).toMatchObject(UNSUPPORTED);
    expect(run.field("form-8396", LINE_9)).toMatchObject(UNSUPPORTED);
    expect(run.value("form-8396", "0.line.7_total_credit_available")).toBe(3_350);
  });
});

describe("Form 8396 with a qualifying child under 17", () => {
  const child: TaxFactRow = {
    ...certificateFact,
    id: "f-child",
    category: "dependents",
    key: makeDependentFactKey("juniper-castellano"),
    value: {
      firstName: "Juniper",
      lastName: "Castellano",
      ssn: "400-00-8397",
      relationship: "Daughter",
      dob: "05/01/2019",
      monthsLivedWithYou: 12,
      livedInUs: true,
      usCitizenOrResident: true,
      fullTimeStudent: false,
      permanentlyDisabled: false,
    },
  };
  const run = evaluate([...base.facts, child]);

  it("Credit Limit Worksheet B applies: line 8 and Schedule 8812 line 13 are unsupported", () => {
    expect(run.value("schedule-8812", "0.line.4_qualifying_children_under_17")).toBe(1);
    expect(run.field("form-8396", LINE_8)).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-8812", "0.line.13_credit_limit_worksheet_a")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("lines 1 to 7 still print", () => {
    expect(run.value("form-8396", "0.line.7_total_credit_available")).toBe(3_350);
  });
});

describe("Schedule CA (540) line 8 column C", () => {
  const caDecisions = [
    ...base.decisions.filter(
      (row) =>
        row.decisionKey !== "decisions.scope.must_file_ca_540" &&
        row.decisionKey !== "decisions.scope.ca_residency",
    ),
    decision("decisions.scope.must_file_ca_540", true),
    decision("decisions.scope.ca_residency", "full_year"),
  ];

  it("adds back the federal mortgage interest credit (Form 8396 line 3) on lines 8a and 8e", () => {
    const run = evaluate(base.facts, caDecisions);
    expect(run.value("schedule-ca", "4.page2.interest_8a_additions")).toBe(2_000);
    expect(run.value("schedule-ca", "4.page2.interest_8e_additions")).toBe(2_000);
    expect(run.value("schedule-ca", "4.page2.interest_10_additions")).toBe(2_000);
  });

  it("without Form 8396 both lines keep their reasons", () => {
    const run = evaluate(
      base.facts.filter((fact) => !isCreditFact(fact)),
      caDecisions,
    );
    expect(run.field("schedule-ca", "4.page2.interest_8a_additions")).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-ca", "4.page2.interest_8e_additions")).toMatchObject(UNSUPPORTED);
  });
});
