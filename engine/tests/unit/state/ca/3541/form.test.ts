/*
 * FTB 3541 on a whole return: who files, what it asks, the credit taken with
 * and without Schedule P (540), the gaps, Part IV, the forms that read it, and
 * "no facts, nothing changes". The synthetic moria (no Schedule P) and
 * lyrelle (Schedule P, the election) scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  isCaFilmCreditFactKey,
  makeCaFilmCreditFactKey,
  type CaFilmCreditFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { domonScenario } from "../../../../scenarios/synthetic/domon/index.js";
import { kirunaScenario } from "../../../../scenarios/synthetic/kiruna/index.js";
import { lyrelleScenario } from "../../../../scenarios/synthetic/lyrelle/index.js";
import { moriaScenario as base } from "../../../../scenarios/synthetic/moria/index.js";
import type { Scenario } from "../../../../types.js";

const PROGRAM_30: CaFilmCreditFactValue = {
  certificateNumber: 7488,
  yearIssued: 2024,
  copyrightRegistrationNumber: "PA0000000001",
  source: "pass_through",
  credit: 3000,
  carryoverFromPriorYear: 0,
  owner: { name: "Test Features LP", idType: "fein", idNumber: "000000001" },
};

const filmFact = (scenario: Scenario, slug: string, value: Partial<CaFilmCreditFactValue>) =>
  ({
    id: `f-${slug}`,
    userId: scenario.userId,
    taxYear: scenario.taxYear,
    category: "other",
    key: makeCaFilmCreditFactKey(slug),
    value,
    sourceNote: "test",
    createdAt: "2026-11-26T00:00:00Z",
  }) as TaxFactRow;

const withoutFilm = (facts: TaxFactRow[]) =>
  facts.filter((fact) => !isCaFilmCreditFactKey(fact.key));
const withFilm = (scenario: Scenario, ...values: Array<Partial<CaFilmCreditFactValue>>) => [
  ...withoutFilm(scenario.facts),
  ...values.map((value, index) => filmFact(scenario, `cert-${index}`, value)),
];
const withoutOtherState = (facts: TaxFactRow[]) =>
  facts.filter((fact) => !fact.key.startsWith("other_state_tax."));

const decision = (scenario: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: scenario.userId,
    taxYear: scenario.taxYear,
    key,
    decision: value,
    rationale: "test",
  });
const withDecision = (scenario: Scenario, key: string, value: unknown) => [
  ...scenario.decisions.filter((each) => each.decisionKey !== key),
  decision(scenario, key, value),
];

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3541-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-3541", id);
  const form540 = (id: string) => value("form-540", `line.${id}`);
  const missing = result.forms.get("form-3541")?.missingInputs ?? [];
  return { files, field, value, line, form540, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

describe("FTB 3541 who files", () => {
  it("files with the moria certificate and asks nothing", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-3541")).toBe(true);
    expect(run.missing).toEqual([]);
  });

  it("does not file with a credit and a carryover of 0", () => {
    const facts = withFilm(base, { ...PROGRAM_30, credit: 0, carryoverFromPriorYear: 0 });
    expect(evaluate(facts).files("form-3541")).toBe(false);
  });

  it("does not file without a California return, or when the decision says no", () => {
    expect(
      evaluate(base.facts, withDecision(base, "decisions.scope.must_file_ca_540", false)).files(
        "form-3541",
      ),
    ).toBe(false);
    expect(
      evaluate(base.facts, withDecision(base, "decisions.scope.must_file_3541", false)).files(
        "form-3541",
      ),
    ).toBe(false);
  });

  it("asks for a certificate with an answer missing, and for the price of a bought credit", () => {
    const partial = withFilm(base, { certificateNumber: 7001, credit: 2000 });
    expect(evaluate(partial).missing).toEqual([makeCaFilmCreditFactKey("cert-0")]);
    const bought = withFilm(base, { ...PROGRAM_30, source: "purchased", owner: PROGRAM_30.owner });
    const run = evaluate(bought);
    expect(run.missing).toEqual([makeCaFilmCreditFactKey("cert-0")]);
    expect(run.line("0.line.11_total_available_credit")).toBeUndefined();
  });
});

describe("FTB 3541 with no Schedule P (540)", () => {
  it("moria: the credit and the Utah credit go on Form 540 lines 43 and 44", () => {
    const run = evaluate(base.facts);
    expect([run.form540("43_credit_name"), run.form540("43_credit_code")]).toEqual([
      "Program 3.0 Motion Picture",
      "239",
    ]);
    expect([run.form540("43_credit_amount"), run.form540("44_credit_code")]).toEqual([4500, "187"]);
    expect(run.value("schedule-s", "0.line.2_california_tax_liability")).toBe(18075 - 4500);
  });

  it("limits the credit to the tax left and carries the rest", () => {
    const run = evaluate(
      withFilm(base, { ...PROGRAM_30, credit: 30000, carryoverFromPriorYear: 1500 }),
    );
    const tax = run.form540("35_total_tax_after_credits") as number;
    expect(run.line("1.line.12a_credit_claimed")).toBe(tax);
    expect(run.line("1.line.13_credit_carryover_future_years")).toBe(31500 - tax);
    expect(run.form540("48_tax_after_credits")).toBe(0);
  });

  it("shares a code's credit among its certificates, the oldest first", () => {
    const newer = { ...PROGRAM_30, certificateNumber: 7600, yearIssued: 2025, credit: 30000 };
    const older = {
      ...PROGRAM_30,
      certificateNumber: 7100,
      yearIssued: 2023,
      credit: 0,
      carryoverFromPriorYear: 5000,
    };
    const run = evaluate(withoutOtherState(withFilm(base, newer, older)));
    const tax = run.form540("35_total_tax_after_credits") as number;
    expect(run.line("1.line.12a_credit_claimed")).toBe(tax - 5000);
    expect(run.form540("43_credit_amount")).toBe(tax);
  });

  it("an original credit needs Schedule P (540) Section A2", () => {
    const original = { ...PROGRAM_30, certificateNumber: 3001, yearIssued: 2017 };
    const facts = withoutOtherState(withFilm(base, original));
    expect(evaluate(facts).files("schedule-p")).toBe(true);
    const run = evaluate(facts, withDecision(base, "decisions.scope.must_file_schedule_p", false));
    expect(isGap(run.field("form-3541", "1.line.12a_credit_claimed"))).toBe(true);
    expect(isGap(run.field("form-540", "line.43_credit_amount"))).toBe(true);
  });
});

describe("FTB 3541 gaps", () => {
  it("a credit sold to others: line 6 and the credit taken are gaps", () => {
    const run = evaluate(withFilm(base, { ...PROGRAM_30, soldToOthers: 1000 }));
    expect(isGap(run.field("form-3541", "0.line.6_credit_sold_to_entities"))).toBe(true);
    expect(isGap(run.field("form-3541", "1.line.12a_credit_claimed"))).toBe(true);
    expect(run.line("0.line.2_credit_from_passthrough_entities")).toBe(3000);
  });

  it("a credit bought below its amount is a gap from line 10; at its amount it is taken", () => {
    const bought = { ...PROGRAM_30, source: "purchased" as const };
    const below = evaluate(withFilm(base, { ...bought, purchasePrice: 2700 }));
    expect(below.line("0.line.3_credit_purchased_from_entities")).toBe(3000);
    expect(isGap(below.field("form-3541", "0.line.11_total_available_credit"))).toBe(true);
    const atAmount = evaluate(withFilm(base, { ...bought, purchasePrice: 3000 }));
    expect(atAmount.line("1.line.12a_credit_claimed")).toBe(3000);
  });

  it("a credit through a disregarded entity is a gap on line 12a", () => {
    const run = evaluate(withFilm(base, { ...PROGRAM_30, throughDisregardedEntity: true }));
    expect(run.line("0.line.11_total_available_credit")).toBe(3000);
    expect(isGap(run.field("form-3541", "1.line.12a_credit_claimed"))).toBe(true);
  });

  it("an original carryover past its six years is a gap; within them it is taken", () => {
    const carryover = {
      ...PROGRAM_30,
      certificateNumber: 3127,
      credit: 0,
      carryoverFromPriorYear: 1200,
    };
    const expired = evaluate(withoutOtherState(withFilm(base, { ...carryover, yearIssued: 2018 })));
    expect(isGap(expired.field("form-3541", "0.line.5a_credit_carryover_prior_year"))).toBe(true);
    expect(isGap(expired.field("form-3541", "0.line.11_total_available_credit"))).toBe(true);
    expect(isGap(expired.field("form-3541", "1.line.12a_credit_claimed"))).toBe(true);
    const lastYear = evaluate(
      withoutOtherState(withFilm(base, { ...carryover, yearIssued: 2019 })),
    );
    expect(lastYear.line("0.line.5a_credit_carryover_prior_year")).toBe(1200);
    expect(lastYear.line("0.line.11_total_available_credit")).toBe(1200);
  });

  it("a new credit's carryover keeps nine years", () => {
    const newCredit = {
      ...PROGRAM_30,
      certificateNumber: 5408,
      yearIssued: 2016,
      credit: 0,
      carryoverFromPriorYear: 1200,
    };
    const run = evaluate(withoutOtherState(withFilm(base, newCredit)));
    expect(run.line("0.line.11_total_available_credit")).toBe(1200);
  });

  it("film credits over $5,000,000 are a gap", () => {
    const run = evaluate(withFilm(base, { ...PROGRAM_30, credit: 5_000_001 }));
    expect(isGap(run.field("form-3541", "1.line.12a_credit_claimed"))).toBe(true);
  });

  it("a fourth Section B2 credit is a gap (kiruna's three passive credits and a film credit)", () => {
    const facts = withFilm(kirunaScenario, PROGRAM_30);
    const run = evaluate(facts, kirunaScenario.decisions);
    expect(isGap(run.field("schedule-p", "3.part3.16_credit_code"))).toBe(true);
    expect(isGap(run.field("form-540", "line.45_schedule_p_credits"))).toBe(true);
  });
});

describe("FTB 3541 Part IV", () => {
  const PROGRAM_40 = {
    ...PROGRAM_30,
    certificateNumber: 8300,
    yearIssued: 2025,
    source: "generated" as const,
    credit: 40000,
    owner: undefined,
    refundableElection: true,
  };

  it("elects with no later credit: line 74 takes line 25", () => {
    const run = evaluate(withoutOtherState(withFilm(base, PROGRAM_40)));
    const tax = run.form540("35_total_tax_after_credits") as number;
    expect(run.line("1.line.21_ca_income_tax_liability")).toBe(tax);
    expect(run.line("1.line.22_available_credit_elected_refundable")).toBe(40000 - tax);
    expect(run.line("1.line.12d_program_4_credit_elected_refundable")).toBe(40000 - tax);
    expect(run.line("1.line.13_credit_carryover_future_years")).toBe(0);
    expect(run.form540("74_motion_picture_production_credit")).toBe(
      run.line("1.line.25_refundable_credits_claimed"),
    );
    expect(run.line("0.header.refundable_program_4_0_election")).toBe(true);
  });

  it("a later credit (Schedule S) makes Part IV and line 74 gaps", () => {
    const run = evaluate(withFilm(base, PROGRAM_40));
    expect(isGap(run.field("form-3541", "1.line.21_ca_income_tax_liability"))).toBe(true);
    expect(isGap(run.field("form-540", "line.74_motion_picture_production_credit"))).toBe(true);
    expect(isGap(run.field("form-540", "line.78_total_payments"))).toBe(true);
  });

  it("no election for a bought credit, and none below the tax", () => {
    const bought = {
      ...PROGRAM_40,
      source: "purchased" as const,
      purchasePrice: 40000,
      owner: PROGRAM_30.owner,
    };
    const run = evaluate(withoutOtherState(withFilm(base, bought)));
    expect(run.line("1.line.20_program_4_credit_amount")).toBeUndefined();
    expect(run.line("0.header.refundable_program_4_0_election")).toBe(false);
    expect(run.form540("74_motion_picture_production_credit")).toBeUndefined();
    const small = evaluate(withoutOtherState(withFilm(base, { ...PROGRAM_40, credit: 2000 })));
    expect(small.line("1.line.22_available_credit_elected_refundable")).toBe(0);
    expect(small.line("1.line.23_total_refundable_amount")).toBeUndefined();
  });

  it("two program 4.0 certificates with an election are a gap", () => {
    const second = { ...PROGRAM_40, certificateNumber: 8301, refundableElection: false };
    const run = evaluate(withoutOtherState(withFilm(base, PROGRAM_40, second)));
    expect(isGap(run.field("form-3541", "1.line.20_program_4_credit_amount"))).toBe(true);
  });
});

describe("FTB 3541 and the forms after it", () => {
  it("FTB 3804-CR takes the tax left after the film credit", () => {
    const domon = { ...domonScenario, facts: withoutOtherState(domonScenario.facts) };
    const before = evaluate(domon.facts, domon.decisions);
    const pte = before.value("form-3804-cr", "0.part2.4_credit_claimed_current_year") as number;
    const tax = before.form540("35_total_tax_after_credits") as number;
    const credit = tax - 100;
    const run = evaluate(withFilm(domon, { ...PROGRAM_30, credit }), domon.decisions);
    expect(run.value("form-3804-cr", "0.part2.4_credit_claimed_current_year")).toBe(
      Math.min(pte, tax - credit),
    );
  });
});

describe("no FTB 3541 facts, nothing changes", () => {
  it("lyrelle without certificates: no form, no Schedule P (540), line 74 keeps its reason", () => {
    const run = evaluate(withoutFilm(lyrelleScenario.facts), lyrelleScenario.decisions);
    expect(run.files("form-3541")).toBe(false);
    expect(run.files("schedule-p")).toBe(false);
    expect(isGap(run.field("form-540", "line.74_motion_picture_production_credit"))).toBe(true);
    expect(run.form540("47_total_credits")).toBeUndefined();
    expect(run.form540("48_tax_after_credits")).toBe(run.form540("35_total_tax_after_credits"));
  });

  it("Schedule P (540) line 6 keeps its reason with no film credit", () => {
    const facts = withoutFilm(lyrelleScenario.facts);
    const decisions = withDecision(lyrelleScenario, "decisions.scope.must_file_schedule_p", true);
    const run = evaluate(facts, decisions);
    expect(isGap(run.field("schedule-p", "2.part3.6_credit_code"))).toBe(true);
    expect(isGap(run.field("schedule-p", "3.part3.16_credit_code"))).toBe(true);
  });
});
