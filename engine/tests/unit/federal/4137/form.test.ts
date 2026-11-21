/*
 * Form 4137 on a whole return: who files, the rows, the copies for each spouse,
 * and the lines that receive its results (Form 1040 line 1c, Schedule 2 line 5,
 * Form 8959 line 2, Schedule SE line 8b). The synthetic delphine scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeBusinessFactKey,
  makeTipsFactKey,
  makeW2FactKey,
  type TipsFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow, identityFact } from "../../../helpers/fixtureBuilders.js";
import { delphineScenario as base } from "../../../scenarios/synthetic/delphine/index.js";

const isWages = (fact: TaxFactRow) => fact.category === "wages";
const otherFacts = base.facts.filter((fact) => !isWages(fact));
const template = base.facts.find(isWages)!;

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

const tips = (slug: string, value: Partial<TipsFactValue>): TaxFactRow =>
  factRow(makeTipsFactKey(slug), {
    employerName: `${slug} Inc`,
    employerEin: "00-0000001",
    tipsReceived: 0,
    tipsReported: 0,
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
  wages: TaxFactRow[],
  extraDecisions: AIDecisionRow[] = [],
  extraFacts: TaxFactRow[] = [],
) {
  const keys = new Set(extraDecisions.map((each) => each.decisionKey));
  const result = evaluateScenario({
    filing: { id: "form-4137-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...extraFacts, ...wages],
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
  return { files, field, value, filingInfo: result.filingInfo };
}

const LINE_1C = "line.1c";
const SCHEDULE_2_LINE_5 = "0.line.5_ss_medicare_tax_unreported_tips";

describe("no tips, nothing changes", () => {
  const run = evaluate([w2("plain", {})]);

  it("files no Form 4137 and no Schedule 2", () => {
    expect([run.files("form-4137"), run.files("schedule-2")]).toEqual([false, false]);
  });

  it("leaves Form 1040 line 1c blank (not unsupported) and line 1z the W-2 wages", () => {
    const line1c = run.field("form-1040", LINE_1C);
    expect(line1c?.ok).toBe(false);
    expect(line1c && !line1c.ok && line1c.unsupported).toBeFalsy();
    expect(run.value("form-1040", "line.1z")).toBe(30000);
  });

  it("a W-2 box 8 of 0 is no allocated tip", () => {
    expect(evaluate([w2("zero", { box8: 0 })]).files("form-4137")).toBe(false);
  });
});

describe("who files (irs-4137-form-2025::sec::what-s-new::b02)", () => {
  it("files for unreported tips, with Schedule 2", () => {
    const run = evaluate([
      w2("cafe", { box7: 2000 }),
      tips("cafe", { tipsReceived: 2500, tipsReported: 2000 }),
    ]);
    expect([run.files("form-4137"), run.files("schedule-2")]).toEqual([true, true]);
  });

  it("files for W-2 box 8 allocated tips with no tip record", () => {
    const run = evaluate([w2("casino", { box7: 1000, box8: 600 })]);
    expect(run.files("form-4137")).toBe(true);
    expect(run.value("form-4137", "0.line.4_unreported_tips")).toBe(600);
    expect(run.value("form-1040", LINE_1C)).toBe(600);
  });

  it("a tip record replaces the box 8 default for its employer", () => {
    const run = evaluate([
      w2("casino", { box7: 1000, box8: 600 }),
      tips("casino", { tipsReceived: 1200, tipsReported: 1000 }),
    ]);
    expect(run.value("form-4137", "0.line.4_unreported_tips")).toBe(200);
  });

  it("a record showing every tip reported: no form even with box 8", () => {
    const run = evaluate([
      w2("casino", { box7: 1000, box8: 600 }),
      tips("casino", { tipsReceived: 1000, tipsReported: 1000 }),
    ]);
    expect(run.files("form-4137")).toBe(false);
    expect(run.value("form-1040", LINE_1C)).toBeUndefined();
  });

  it("Pub. 531 Blue Ocean: tips only in a month under $20 reach line 1c with no Form 4137", () => {
    const run = evaluate([
      w2("blue-ocean", { box1: 17000, box3: 10000, box5: 17000, box7: 7000 }),
      tips("blue-ocean", { tipsReceived: 7018, tipsReported: 7000, tipsUnder20InAMonth: 18 }),
    ]);
    expect(run.files("form-4137")).toBe(false);
    expect(run.value("form-1040", LINE_1C)).toBe(18);
    expect(run.value("form-1040", "line.1z")).toBe(17018);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(
      [w2("cafe", {}), tips("cafe", { tipsReceived: 500, tipsReported: 0 })],
      [decision("decisions.scope.must_file_4137", false)],
    );
    expect(run.files("form-4137")).toBe(false);
    expect(run.value("schedule-2", SCHEDULE_2_LINE_5)).toBeUndefined();
  });
});

describe("line 1 rows", () => {
  it("a sixth employer makes the rows unsupported; lines 2 through 13 count every row", () => {
    const slugs = ["a", "b", "c", "d", "e", "f"];
    const run = evaluate(
      slugs.flatMap((slug) => [
        w2(slug, { box3: 1000, box5: 1000 }),
        tips(slug, { tipsReceived: 100 }),
      ]),
    );
    const rowA = run.field("form-4137", "0.line.1_row_a_employer_tips_col_c");
    expect(rowA && !rowA.ok && rowA.unsupported).toBe(true);
    expect(run.value("form-4137", "0.line.2_total_tips_received")).toBe(600);
    expect(run.value("form-4137", "0.line.8_social_security_wages_tips")).toBe(6000);
  });
});

describe("married filing jointly: one form for each spouse", () => {
  const joint = [decision("decisions.scope.filing_status", "married_filing_jointly")];
  const spouseIdentity = [
    identityFact({
      userId: base.userId,
      taxYear: base.taxYear,
      suffix: "spouse.name.first",
      value: "Remy",
    }),
    identityFact({
      userId: base.userId,
      taxYear: base.taxYear,
      suffix: "spouse.name.last",
      value: "Arceneaux",
    }),
    identityFact({
      userId: base.userId,
      taxYear: base.taxYear,
      suffix: "spouse.ssn",
      value: "400-00-4138",
    }),
  ];

  it("only the spouse's tips: the form names the spouse", () => {
    const run = evaluate(
      [
        w2("bar", { owner: "spouse", box7: 100 }),
        tips("bar", { tipsReceived: 1100, tipsReported: 100 }),
      ],
      joint,
      spouseIdentity,
    );
    expect(run.value("form-4137", "0.header.taxpayer_name")).toBe("Remy Arceneaux");
    expect(run.value("form-4137", "0.line.8_social_security_wages_tips")).toBe(30100);
  });

  it("both spouses: two copies, and Schedule 2 line 5 and Form 8959 line 2 add both", () => {
    const run = evaluate(
      [
        w2("bar", { owner: "spouse" }),
        tips("bar", { tipsReceived: 1000, tipsReported: 0 }),
        w2("cafe", { owner: "taxpayer" }),
        tips("cafe", { tipsReceived: 2000, tipsReported: 0 }),
      ],
      [...joint, decision("decisions.scope.must_file_8959", true)],
      spouseIdentity,
    );
    const filers = (run.filingInfo as { form4137Filers?: Array<{ owner: string }> }).form4137Filers;
    expect(filers?.map((filer) => filer.owner)).toEqual(["taxpayer", "spouse"]);
    // Taxpayer: 2,000 × 7.65% = 153 (124 + 29); spouse: 1,000 → 62 + 15 = 77 (14.50 rounds up).
    expect(run.value("form-4137", "0.line.13_total_tax_unreported_tips")).toBe(153);
    expect(run.value("schedule-2", SCHEDULE_2_LINE_5)).toBe(230);
    expect(run.value("form-8959", "0.line.2_unreported_tips")).toBe(3000);
    expect(run.value("form-1040", LINE_1C)).toBe(3000);
  });

  it("a tip record that neither it nor its W-2 places waits, and is asked", () => {
    const run = evaluate(
      [
        factRow(makeW2FactKey("bar"), {
          employerName: "Bar",
          employerEin: "00-1",
          box1: 1,
          box2: 0,
        }),
        tips("bar", { tipsReceived: 900 }),
      ],
      joint,
      spouseIdentity,
    );
    expect(run.files("form-4137")).toBe(true);
    expect(run.value("form-4137", "0.line.2_total_tips_received")).toBeUndefined();
    expect(run.filingInfo.missingInputs?.["form-4137"]).toContain(makeTipsFactKey("bar"));
  });
});

describe("Schedule SE line 8b (Form 4137 line 10)", () => {
  const business = factRow(
    makeBusinessFactKey("catering"),
    { activity: "catering", grossReceipts: 20000, sellsGoods: false, materiallyParticipated: true },
    "self_employment",
  );

  it("takes the taxpayer's line 10 and adds it to line 8d", () => {
    const run = evaluate(
      [w2("cafe", { box7: 0 }), tips("cafe", { tipsReceived: 3000, tipsReported: 0 })],
      [],
      [business],
    );
    expect(run.files("schedule-se")).toBe(true);
    expect(run.value("schedule-se", "0.line.8b")).toBe(3000);
    expect(run.value("schedule-se", "0.line.8d")).toBe(33000);
  });
});
