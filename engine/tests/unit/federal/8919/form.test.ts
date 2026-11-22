/*
 * Form 8919 on a whole return: who files, the rows, the copies for each spouse,
 * the 1099s a firm names, and the lines that receive its results (Form 1040
 * line 1g, Schedule 2 line 6, Form 8959 line 3, Schedule SE line 8c, Schedule
 * CA (540) line 1g). The synthetic egwene and gawyn scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  isUncollectedWagesFactKey,
  makeBusinessFactKey,
  makeMiscIncomeFactKey,
  makeNonemployeeCompensationFactKey,
  makeTipsFactKey,
  makeUncollectedWagesFactKey,
  makeW2FactKey,
  type UncollectedWagesFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow, identityFact } from "../../../helpers/fixtureBuilders.js";
import { egweneScenario as base } from "../../../scenarios/synthetic/egwene/index.js";
import { gawynScenario } from "../../../scenarios/synthetic/gawyn/index.js";

const isIncome = (fact: TaxFactRow) =>
  fact.category === "wages" || fact.category === "self_employment";
const identity = base.facts.filter((fact) => !isIncome(fact));
const template = base.facts.find(isIncome)!;

const factRow = (key: string, value: unknown, category = "wages"): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});

const w2 = (slug: string, value: Partial<W2FactValue>): TaxFactRow =>
  factRow(makeW2FactKey(slug), {
    employerName: `${slug} Inc`,
    employerEin: "00-0000001",
    box1: 30000,
    box2: 1000,
    box3: 30000,
    box5: 30000,
    ...value,
  });

const firm = (slug: string, value: Partial<UncollectedWagesFactValue>): TaxFactRow =>
  factRow(makeUncollectedWagesFactKey(slug), {
    firmName: `${slug} LLC`,
    firmTin: "00-0000002",
    reasonCode: "G",
    received1099: false,
    wages: 10000,
    ...value,
  });

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(
  income: TaxFactRow[],
  extraDecisions: AIDecisionRow[] = [],
  extraFacts: TaxFactRow[] = [],
) {
  const keys = new Set(extraDecisions.map((each) => each.decisionKey));
  const result = evaluateScenario({
    filing: { id: "form-8919-test", taxYear: base.taxYear },
    facts: [...identity, ...extraFacts, ...income],
    decisions: [...base.decisions.filter((each) => !keys.has(each.decisionKey)), ...extraDecisions],
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
  const isBlank = (formId: string, id: string) => {
    const found = field(formId, id);
    return found !== undefined && !found.ok && !found.unsupported;
  };
  return { files, field, value, isBlank, filingInfo: result.filingInfo };
}

const LINE_1G = "line.1g";
const SCHEDULE_2_LINE_6 = "0.line.6_uncollected_ss_medicare_tax_wages";
const FORM_8959_LINE_3 = "0.line.3_wages_form_8919";
const LINE_6 = "0.line.6_total_wages";
const LINE_8 = "0.line.8_total_social_security_wages_tips";
const LINE_13 = "0.line.13_total_uncollected_tax";

describe("no Form 8919 facts, nothing changes", () => {
  const run = evaluate([w2("plain", {})], [decision("decisions.scope.must_file_8959", true)]);

  it("files no Form 8919 and no Schedule 2", () => {
    const plain = evaluate([w2("plain", {})]);
    expect([plain.files("form-8919"), plain.files("schedule-2")]).toEqual([false, false]);
  });

  it("leaves Form 1040 line 1g blank (not unsupported), and line 1z the W-2 wages", () => {
    expect(run.isBlank("form-1040", LINE_1G)).toBe(true);
    expect(run.value("form-1040", "line.1z")).toBe(30000);
  });

  it("leaves Form 8959 line 3 blank; line 4 is line 1", () => {
    expect(run.isBlank("form-8959", FORM_8959_LINE_3)).toBe(true);
    expect(run.value("form-8959", "0.line.4_total_medicare_wages")).toBe(30000);
  });

  it("leaves Schedule SE line 8c blank (egwene without her firms)", () => {
    const withBusiness = evaluate(
      base.facts.filter((fact) => !isUncollectedWagesFactKey(fact.key)),
    );
    expect(withBusiness.files("schedule-se")).toBe(true);
    expect(withBusiness.isBlank("schedule-se", "0.line.8c")).toBe(true);
    // Line 8d is line 8a alone; line 10 takes the social security part again.
    expect(withBusiness.value("schedule-se", "0.line.8d")).toBe(140000);
    expect(withBusiness.value("schedule-se", "0.line.10")).toBe(1374);
  });

  it("leaves Schedule CA (540) line 1g blank (gawyn without the firms)", () => {
    const result = evaluateScenario({
      filing: { id: "form-8919-ca", taxYear: gawynScenario.taxYear },
      facts: gawynScenario.facts.filter((fact) => !isUncollectedWagesFactKey(fact.key)),
      decisions: gawynScenario.decisions,
      authEmail: null,
    });
    const line1g = result.forms
      .get("schedule-ca")
      ?.fields.find((each) => each.fieldId === "schedule-ca.0.line.1g_federal")?.result;
    expect(line1g?.ok).toBe(false);
    expect(line1g && !line1g.ok && line1g.unsupported).toBeFalsy();
  });
});

describe("who files (irs-8919-form-2025::sec::omb-no-1545-0074::b01)", () => {
  it("a firm with wages files Form 8919 and Schedule 2", () => {
    const run = evaluate([w2("plain", {}), firm("acme", {})]);
    expect([run.files("form-8919"), run.files("schedule-2")]).toEqual([true, true]);
    // 10,000 × 7.65% = 765 (620 + 145).
    expect(run.value("form-8919", LINE_13)).toBe(765);
    expect(run.value("schedule-2", SCHEDULE_2_LINE_6)).toBe(765);
    expect(run.value("schedule-2", "0.line.7_total_additional_ss_medicare_tax")).toBe(765);
    expect(run.value("form-1040", LINE_1G)).toBe(10000);
    expect(run.value("form-1040", "line.1z")).toBe(40000);
  });

  it("a firm with $0 of wages files no form", () => {
    expect(evaluate([firm("acme", { wages: 0 })]).files("form-8919")).toBe(false);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate([firm("acme", {})], [decision("decisions.scope.must_file_8919", false)]);
    expect(run.files("form-8919")).toBe(false);
    expect(run.value("form-1040", LINE_1G)).toBeUndefined();
    expect(run.value("schedule-2", SCHEDULE_2_LINE_6)).toBeUndefined();
  });

  it("an explicit decision true with no firm: the lines stay blank", () => {
    const run = evaluate([w2("plain", {})], [decision("decisions.scope.must_file_8919", true)]);
    expect(run.files("form-8919")).toBe(true);
    expect(run.isBlank("form-8919", LINE_6)).toBe(true);
  });
});

describe("lines 1 through 5", () => {
  it("a code A firm with no date: column (d) waits, and Cade is asked", () => {
    const run = evaluate([firm("acme", { reasonCode: "A" })]);
    expect(run.isBlank("form-8919", "0.line.1_firm_col_d")).toBe(true);
    expect(run.filingInfo.missingInputs?.["form-8919"]).toContain(
      makeUncollectedWagesFactKey("acme"),
    );
    expect(run.value("form-8919", LINE_6)).toBe(10000);
  });

  it("a sixth firm makes the rows unsupported; line 6 counts every firm", () => {
    const run = evaluate(["a", "b", "c", "d", "e", "f"].map((slug) => firm(slug, { wages: 1000 })));
    const row = run.field("form-8919", "0.line.1_firm_col_f");
    expect(row && !row.ok && row.unsupported).toBe(true);
    expect(run.value("form-8919", LINE_6)).toBe(6000);
  });
});

describe("line 8 (irs-8919-form-2025::sec::omb-no-1545-0074::b02)", () => {
  it("adds W-2 boxes 3 and 7 and Form 4137 line 10", () => {
    const tips = factRow(makeTipsFactKey("cafe"), {
      employerName: "cafe Inc",
      employerEin: "00-0000001",
      tipsReceived: 2000,
      tipsReported: 500,
    });
    const run = evaluate([w2("cafe", { box7: 500 }), tips, firm("acme", {})]);
    expect(run.value("form-4137", "0.line.10_tips_subject_social_security_tax")).toBe(1500);
    expect(run.value("form-8919", LINE_8)).toBe(32000);
  });
});

describe("the 1099s a firm names (irs-8919-form-2025::sec::lines-1-through-5::b02)", () => {
  const necKey = makeNonemployeeCompensationFactKey("acme", "2025");
  const nec = factRow(necKey, { payerName: "acme LLC", box1: 10000 }, "self_employment");

  it("a 1099-NEC with no business is asked about; one that a firm names is not", () => {
    const alone = evaluate([nec]);
    expect(alone.filingInfo.missingInputs?.["schedule-c"]).toContain(necKey);
    const named = evaluate([nec, firm("acme", { received1099: true, form1099Keys: [necKey] })]);
    expect(named.filingInfo.missingInputs?.["schedule-c"] ?? []).not.toContain(necKey);
    expect(named.value("form-8919", "0.line.1_firm_col_e")).toBe(true);
  });

  it("a 1099-MISC box 3 that a firm names is not Schedule 1 line 8z too", () => {
    const miscKey = makeMiscIncomeFactKey("acme");
    const misc = factRow(miscKey, { payerName: "acme LLC", box3: 10000 }, "other");
    const alone = evaluate([w2("plain", {}), misc]);
    expect(alone.value("form-1040", "line.8")).toBe(10000);
    const named = evaluate([
      w2("plain", {}),
      misc,
      firm("acme", { received1099: true, form1099Keys: [miscKey] }),
    ]);
    expect(named.value("form-1040", "line.8") ?? 0).toBe(0);
    expect(named.value("form-1040", LINE_1G)).toBe(10000);
  });
});

describe("Form 8959 (irs-8959-inst-2025::sec::who-must-file::b01, line-3::b01)", () => {
  it("Form 8919 wages count toward the threshold and fill line 3", () => {
    const big = w2("big", { box1: 192000, box3: 176100, box5: 192000 });
    const run = evaluate([big, firm("acme", {})]);
    expect(run.files("form-8959")).toBe(true);
    expect(run.value("form-8959", FORM_8959_LINE_3)).toBe(10000);
    // 192,000 + 10,000 − 200,000 = 2,000 × 0.9% = 18.
    expect(run.value("form-8959", "0.line.6_excess_medicare_wages")).toBe(2000);
    expect(run.value("form-8959", "0.line.7_additional_medicare_tax_wages")).toBe(18);
  });

  it("at exactly the threshold it does not file (more than $200,000)", () => {
    const run = evaluate([
      w2("big", { box1: 190000, box3: 176100, box5: 190000 }),
      firm("acme", {}),
    ]);
    expect(run.files("form-8959")).toBe(false);
  });

  it("without the Form 8919 wages the same W-2 files no Form 8959", () => {
    const run = evaluate([w2("big", { box1: 192000, box3: 176100, box5: 192000 })]);
    expect(run.files("form-8959")).toBe(false);
  });

  it("over the threshold with them: line 7 taxes the excess", () => {
    const run = evaluate([
      w2("big", { box1: 195000, box3: 176100, box5: 195000 }),
      firm("acme", { wages: 15000 }),
    ]);
    // 195,000 + 15,000 − 200,000 = 10,000 × 0.9% = 90.
    expect(run.value("form-8959", "0.line.7_additional_medicare_tax_wages")).toBe(90);
    // Line 8 is over line 7: no social security tax on the Form 8919 wages.
    expect(run.value("form-8919", "0.line.10_wages_subject_social_security_tax")).toBe(0);
    expect(run.value("form-8919", LINE_13)).toBe(218); // 15,000 × 1.45% = 217.50
  });
});

describe("married filing jointly: one form for each spouse", () => {
  const joint = [decision("decisions.scope.filing_status", "married_filing_jointly")];
  const spouse = [
    ["spouse.name.first", "Mireille"],
    ["spouse.name.last", "Marchetti"],
    ["spouse.ssn", "400-00-8929"],
  ].map(([suffix, value]) =>
    identityFact({ userId: base.userId, taxYear: base.taxYear, suffix, value }),
  );

  it("a firm with no owner waits, and Cade is asked", () => {
    const run = evaluate([firm("acme", {})], joint, spouse);
    expect(run.files("form-8919")).toBe(true);
    expect(run.isBlank("form-8919", LINE_6)).toBe(true);
    expect(run.filingInfo.missingInputs?.["form-8919"]).toContain(
      makeUncollectedWagesFactKey("acme"),
    );
  });

  it("only the spouse's firm: the form names the spouse, and Schedule SE line 8c stays blank", () => {
    const business = factRow(
      makeBusinessFactKey("photo"),
      { activity: "photo", grossReceipts: 20000, sellsGoods: false, materiallyParticipated: true },
      "self_employment",
    );
    const run = evaluate(
      [w2("plain", { owner: "taxpayer" }), firm("acme", { owner: "spouse" })],
      joint,
      [...spouse, business],
    );
    expect(run.value("form-8919", "0.header.taxpayer_name")).toBe("Mireille Marchetti");
    expect(run.value("form-8919", LINE_8)).toBe(0);
    expect(run.files("schedule-se")).toBe(true);
    expect(run.value("schedule-se", "0.line.8c")).toBeUndefined();
  });

  it("gawyn: two copies; line 1g, Schedule 2 line 6 and Form 8959 line 3 add both", () => {
    const result = evaluateScenario({
      filing: { id: "gawyn-8959", taxYear: gawynScenario.taxYear },
      facts: gawynScenario.facts,
      decisions: [
        ...gawynScenario.decisions,
        decisionRow({
          userId: gawynScenario.userId,
          taxYear: gawynScenario.taxYear,
          key: "decisions.scope.must_file_8959",
          decision: true,
          rationale: "test",
        }),
      ],
      authEmail: null,
    });
    const get = (formId: string, id: string) => {
      const found = result.forms
        .get(formId)
        ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
      return found?.ok ? found.value : undefined;
    };
    const filers = (result.filingInfo as { form8919Filers?: Array<{ owner: string }> })
      .form8919Filers;
    expect(filers?.map((filer) => filer.owner)).toEqual(["taxpayer", "spouse"]);
    expect(get("form-1040", LINE_1G)).toBe(42500);
    expect(get("schedule-2", SCHEDULE_2_LINE_6)).toBe(3251); // 1,377 + 1,874
    expect(get("form-8959", FORM_8959_LINE_3)).toBe(42500);
    expect(get("schedule-ca", "0.line.1g_federal")).toBe(42500);
  });
});
