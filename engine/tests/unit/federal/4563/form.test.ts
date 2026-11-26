/*
 * Form 4563 on a whole return: who files, one form per person, the forms that
 * take line 15 (the MAGI lines), the shared standard deduction, the gaps, and
 * "no facts, nothing changes". The synthetic berylla scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  SPOUSE_KEYS,
  makeAmericanSamoaExclusionFactKey,
  makeBusinessFactKey,
  type AmericanSamoaExclusionFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import type { Form4563FilingInfo } from "../../../../src/federal/4563/filingInfo.js";
import { alimonyGap } from "../../../../src/federal/4563/receivers.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { beryllaDecisions } from "../../../scenarios/synthetic/berylla/decisions.js";
import {
  BERYLLA_TAX_YEAR,
  BERYLLA_USER_ID,
  americanSamoaIncome,
  beryllaFacts,
} from "../../../scenarios/synthetic/berylla/facts.js";

const TAXPAYER_KEY = makeAmericanSamoaExclusionFactKey("taxpayer");
const SPOUSE_KEY = makeAmericanSamoaExclusionFactKey("spouse");
const withoutExclusion = beryllaFacts.filter((fact) => fact.key !== TAXPAYER_KEY);
const UNSUPPORTED = { ok: false, unsupported: true };
const LINE_15 = 57150;

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  id: `f-test-${key}`,
  userId: BERYLLA_USER_ID,
  taxYear: BERYLLA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote: "test",
  createdAt: "2026-11-26T00:00:00Z",
});

const exclusion = (value: Partial<AmericanSamoaExclusionFactValue>, key = TAXPAYER_KEY) =>
  row("foreign", key, { ...americanSamoaIncome, ...value });

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: BERYLLA_USER_ID,
    taxYear: BERYLLA_TAX_YEAR,
    key,
    decision: value,
    rationale: "test",
  });

const replaced = (key: string, value: unknown) => [
  ...beryllaDecisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = beryllaDecisions) {
  const result = evaluateScenario({
    filing: { id: "form-4563-test", taxYear: BERYLLA_TAX_YEAR },
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
  const info = result.filingInfo as Form4563FilingInfo;
  return { files, field, value, info };
}

describe("Form 4563 who files", () => {
  it("files for a bona fide resident of American Samoa with income to exclude", () => {
    const run = evaluate(beryllaFacts);
    expect(run.files("form-4563")).toBe(true);
    expect(run.info.missingInputs?.["form-4563"]).toEqual([]);
  });

  it("a person who was not a resident all year files none, and the income the fact holds makes line 9 a gap", () => {
    const run = evaluate([...withoutExclusion, exclusion({ bonaFideResidentAllYear: false })]);
    expect(run.files("form-4563")).toBe(false);
    expect(run.value("schedule-8812", "0.line.2c_form_4563_line_15")).toBeUndefined();
    // "If you do not qualify for the exclusion ... Report all your taxable income" (omb-no-1545-0074::b03).
    expect(run.info.form4563IncomeNotExcluded).toEqual([TAXPAYER_KEY]);
    expect(run.field("form-1040", "line.9")).toMatchObject(UNSUPPORTED);
    expect(run.value("form-1040", "line.11a")).toBeUndefined();
  });

  it("a fact with no income that files no form leaves line 9 as it is without the fact", () => {
    const none: Partial<AmericanSamoaExclusionFactValue> = {
      bonaFideResidentAllYear: false,
      wages: undefined,
      interest: undefined,
      dividends: undefined,
      business: undefined,
      capitalGain: undefined,
      rentalAndRoyalties: undefined,
      farm: undefined,
      otherIncome: undefined,
    };
    const run = evaluate([...withoutExclusion, exclusion(none)]);
    expect(run.info.form4563IncomeNotExcluded).toEqual([]);
    expect(run.value("form-1040", "line.9")).toBe(
      evaluate(withoutExclusion).value("form-1040", "line.9"),
    );
  });

  it("a resident with no income to exclude files none", () => {
    const none: Partial<AmericanSamoaExclusionFactValue> = {
      wages: undefined,
      interest: undefined,
      dividends: undefined,
      business: undefined,
      capitalGain: undefined,
      rentalAndRoyalties: undefined,
      farm: undefined,
      otherIncome: undefined,
    };
    expect(evaluate([...withoutExclusion, exclusion(none)]).files("form-4563")).toBe(false);
  });

  it("the decision wins, and the income the fact holds makes line 9 a gap", () => {
    const decisions = [...beryllaDecisions, decision("decisions.scope.must_file_4563", false)];
    const run = evaluate(beryllaFacts, decisions);
    expect(run.files("form-4563")).toBe(false);
    expect(run.field("form-1040", "line.9")).toMatchObject(UNSUPPORTED);
  });

  it("filed by decision with no fact: the fact is a missing input, and line 15's readers wait", () => {
    const decisions = [...beryllaDecisions, decision("decisions.scope.must_file_4563", true)];
    const run = evaluate(withoutExclusion, decisions);
    expect(run.info.missingInputs?.["form-4563"]).toEqual([TAXPAYER_KEY]);
    expect(run.value("schedule-8812", "0.line.2c_form_4563_line_15")).toBeUndefined();
    expect(run.value("form-1040", "line.6b")).toBeUndefined();
  });

  it("a fact without Part I's answers files the form and is listed again", () => {
    const run = evaluate([...withoutExclusion, row("foreign", TAXPAYER_KEY, { interest: 500 })]);
    expect(run.files("form-4563")).toBe(true);
    expect(run.info.missingInputs?.["form-4563"]).toEqual([TAXPAYER_KEY]);
  });

  it("while the form waits, the shared deduction and both MAGI lines wait, not the full amounts", () => {
    const run = evaluate([...withoutExclusion, row("foreign", TAXPAYER_KEY, { interest: 500 })]);
    expect(typeof run.value("form-1040", "line.11b")).toBe("number");
    expect(run.field("form-1040", "line.12e")).toMatchObject({ ok: false });
    expect(run.field("form-1040", "line.12e")).not.toMatchObject(UNSUPPORTED);
    expect(run.value("schedule-1-a", "0.line.3_modified_agi")).toBeUndefined();
    expect(run.value("schedule-8812", "0.line.3_modified_agi")).toBeUndefined();
  });
});

describe("Form 4563 for each person", () => {
  const spouse = [
    row("identity", SPOUSE_KEYS.firstName, "Ilo"),
    row("identity", SPOUSE_KEYS.lastName, "Saulevai"),
    row("identity", SPOUSE_KEYS.occupation, "Fisherman"),
    row("identity", SPOUSE_KEYS.ssn, "400-00-4566"),
    row("identity", SPOUSE_KEYS.dob, "02/02/1960"),
  ];
  const spouseExclusion = exclusion(
    { wages: undefined, interest: 700, otherIncome: undefined, absences: [] },
    SPOUSE_KEY,
  );

  it("a spouse's fact on a single return is not on this return", () => {
    const run = evaluate([...beryllaFacts, spouseExclusion]);
    expect(run.info.form4563Filers?.map((filer) => filer.owner)).toEqual(["taxpayer"]);
  });

  it("on a joint return each spouse has a copy, and line 15 of both is added back", () => {
    const decisions = replaced("decisions.scope.filing_status", "married_filing_jointly");
    const run = evaluate([...beryllaFacts, ...spouse, spouseExclusion], decisions);
    const filers = run.info.form4563Filers ?? [];
    expect(filers.map((filer) => filer.owner)).toEqual(["taxpayer", "spouse"]);
    const spouseLine15 = 700 + 300 + 400 + 250 + 4000 + 3600 + 100 - 300;
    expect(filers[1].lines.line15).toBe(spouseLine15);
    expect(run.value("schedule-8812", "0.line.2c_form_4563_line_15")).toBe(LINE_15 + spouseLine15);
  });
});

describe("No Form 4563 facts: nothing changes", () => {
  const run = evaluate(withoutExclusion);

  it("files no Form 4563 and leaves the add-back lines blank", () => {
    expect(run.files("form-4563")).toBe(false);
    expect(run.value("form-1040", "line.9")).toBe(1100 + 900 + 22000 + 4000);
    expect(run.value("schedule-8812", "0.line.2c_form_4563_line_15")).toBeUndefined();
    expect(run.value("schedule-1-a", "0.line.2d_form_4563_line_15")).toBeUndefined();
    expect(run.value("schedule-1-a", "0.line.3_modified_agi")).toBe(
      run.value("form-1040", "line.11b"),
    );
  });

  it("the full standard deduction: $15,750 plus $2,000 for 65 or older", () => {
    expect(run.value("form-1040", "line.12e")).toBe(17750);
  });

  it("the 1040 worksheet's taxable social security: $24,000 + $9,000 is $8,000 over $25,000, so half of it", () => {
    expect(run.value("form-1040", "line.6b")).toBe(4000);
  });

  it("the full student loan interest under $85,000", () => {
    expect(run.value("schedule-1", "1.line.21")).toBe(1800);
  });

  it("the main home box is checked for a U.S. address", () => {
    expect(run.value("form-1040", "header.main_home_us_over_half_year")).toBe(true);
  });
});

describe("Form 4563 and Form 1040", () => {
  const run = evaluate(beryllaFacts);

  it("line 12e: $17,750 x $39,300 / ($39,300 + $62,600) = $6,846 (Pub. 570, Standard Deduction)", () => {
    expect(run.value("form-1040", "line.12e")).toBe(6846);
  });

  it("line 6b: Pub. 915 Worksheet 1 line 5 adds line 15, so 85% of the benefits are taxable", () => {
    expect(run.value("form-1040", "line.6b")).toBe(15300);
  });

  it("the main home box is blank: American Samoa is not in the United States", () => {
    expect(run.value("form-1040", "header.main_home_us_over_half_year")).toBeUndefined();
  });

  it("a business on Schedule C: the gross income of the U.S. side is not figured, so line 12e is a gap", () => {
    const business = row("self_employment", makeBusinessFactKey("lanai-crafts"), {
      owner: "taxpayer",
      activity: "Craft sales online to buyers in Hawaii",
      name: "Lanai Crafts",
      accountingMethod: "cash",
      materiallyParticipated: true,
      startedThisYear: false,
      paymentsRequire1099: false,
      sellsGoods: false,
      grossReceipts: 300,
      expenses: { supplies: 100 },
    });
    const gap = evaluate([...beryllaFacts, business]);
    expect(gap.field("form-1040", "line.12e")).toMatchObject(UNSUPPORTED);
  });

  it("itemized deductions are shared line by line: Schedule A line 17 and line 12e are gaps", () => {
    const decisions = replaced("decisions.itemize_vs_standard", "itemized");
    const gap = evaluate(beryllaFacts, decisions);
    expect(gap.field("form-1040", "line.12e")).toMatchObject(UNSUPPORTED);
    expect(gap.field("schedule-a", "0.line.17_total_itemized_deductions")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("a nonresident alien has no standard deduction: line 12e is a gap", () => {
    const facts = [...withoutExclusion, exclusion({ usCitizenOrResident: false })];
    expect(evaluate(facts).field("form-1040", "line.12e")).toMatchObject(UNSUPPORTED);
  });
});

describe("Form 4563 and the other taxes", () => {
  it("self-employment income with $400 or more of net earnings: Schedule 2 lines 4 and 21 are gaps", () => {
    const facts = [
      ...withoutExclusion,
      exclusion({ business: { amount: 5000, grossIncome: 9000 } }),
    ];
    const run = evaluate(facts);
    expect(run.field("schedule-2", "0.line.4_self_employment_tax")).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-2", "1.line.21_total_other_taxes")).toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.23")).toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.24")).toMatchObject(UNSUPPORTED);
  });

  it("berylla's $350 of lines 10 and 13 is $323 of net earnings: no tax and no Schedule 2", () => {
    expect(evaluate(beryllaFacts).files("schedule-2")).toBe(false);
  });

  it("W-2AS Medicare wages over $200,000: Schedule 2 line 11 is a gap", () => {
    const wages = { amount: 210000, medicareWages: 210000 };
    const run = evaluate([...withoutExclusion, exclusion({ wages })]);
    expect(run.field("schedule-2", "0.line.11_additional_medicare_tax")).toMatchObject(UNSUPPORTED);
  });

  it("joint, one W-2AS with $220,000 of Medicare wages: under $250,000, but Form 8959 files for its withholding, so line 24 is a gap", () => {
    const spouse = [
      row("identity", SPOUSE_KEYS.firstName, "Ilo"),
      row("identity", SPOUSE_KEYS.lastName, "Saulevai"),
      row("identity", SPOUSE_KEYS.occupation, "Homemaker"),
      row("identity", SPOUSE_KEYS.ssn, "400-00-4566"),
      row("identity", SPOUSE_KEYS.dob, "02/02/1960"),
    ];
    const wages = { amount: 220000, medicareWages: 220000 };
    const decisions = replaced("decisions.scope.filing_status", "married_filing_jointly");
    const run = evaluate([...withoutExclusion, ...spouse, exclusion({ wages })], decisions);
    expect(run.field("schedule-2", "0.line.11_additional_medicare_tax")).toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.24")).toMatchObject(UNSUPPORTED);
    expect(run.value("form-1040", "line.34")).toBeUndefined();
  });

  it("joint, W-2AS Medicare wages of $150,000: no withholding, under the threshold, no gap", () => {
    const decisions = replaced("decisions.scope.filing_status", "married_filing_jointly");
    const wages = { amount: 150000, medicareWages: 150000 };
    const spouse = [
      row("identity", SPOUSE_KEYS.firstName, "Ilo"),
      row("identity", SPOUSE_KEYS.lastName, "Saulevai"),
      row("identity", SPOUSE_KEYS.occupation, "Homemaker"),
    ];
    const run = evaluate([...withoutExclusion, ...spouse, exclusion({ wages })], decisions);
    expect(run.field("schedule-2", "0.line.11_additional_medicare_tax")).not.toMatchObject(
      UNSUPPORTED,
    );
  });

  it("alimony paid is shared by gross income: a gap with an exclusion, nothing without", () => {
    const filer = evaluate(beryllaFacts).info.form4563Filers?.[0];
    const files = { "form-4563": { decisionKey: "x", value: true, derivation: undefined } };
    expect(alimonyGap({ mustFile: files, form4563Filers: [filer!] })).toMatchObject({
      unsupported: true,
    });
    expect(alimonyGap({ mustFile: files, form4563Filers: [] })).toBeUndefined();
  });
});
