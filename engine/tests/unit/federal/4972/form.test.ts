/*
 * Form 4972 on a whole return: who files, what waits, the cases the engine does
 * not print, and the forms that take its results (Form 1040 lines 5a, 5b and 16,
 * Form 6251 line 10). The synthetic siuan scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeLumpSumDistributionFactKey,
  makeRetirementDistributionFactKey,
  type LumpSumDistributionFactValue,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { LUMP_SUM_KEY } from "../../../scenarios/synthetic/siuan/facts.js";
import { siuanScenario as base } from "../../../scenarios/synthetic/siuan/index.js";

const FATHER_KEY = makeLumpSumDistributionFactKey("father");
const template = base.facts.find((fact) => fact.key === FATHER_KEY)!;
const answers = template.value as LumpSumDistributionFactValue;
const row1099 = base.facts.find((fact) => fact.key === LUMP_SUM_KEY)!;
const box = row1099.value as RetirementDistributionFactValue;
const others = base.facts.filter((fact) => fact.key !== FATHER_KEY && fact.key !== LUMP_SUM_KEY);

const lumpSum = (
  value: Partial<LumpSumDistributionFactValue> = {},
  slug = "father",
): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeLumpSumDistributionFactKey(slug),
  value: { ...answers, ...value },
});

const distribution = (
  value: Partial<RetirementDistributionFactValue> = {},
  id = "lump-sum",
): TaxFactRow => ({
  ...row1099,
  id: `f-${id}`,
  key: makeRetirementDistributionFactKey("harlow-tool-works", id),
  value: { ...box, ...value },
});

/* Part II and Part III with no NUA, exclusion or estate tax: the simple beneficiary. */
const PLAIN = { includeNua: false, deathBenefitExclusion: undefined, federalEstateTax: undefined };

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-4972-test", taxYear: base.taxYear },
    facts: [...others, ...extra],
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
  const line = (id: string) => value("form-1040", id);
  return { files, field, value, line, pending: pendingInputs(result) };
}

const LINE_30 = "0.line.30_tax_on_lump_sum_distribution";
const LINE_7 = "0.line.7_capital_gain_tax";
const BOX_2 = "line.16_from_form_4972";
const UNSUPPORTED = { ok: false, unsupported: true };
const SIUAN = [lumpSum(), distribution()];

describe("Form 4972 who files", () => {
  it("files for a beneficiary whose Part I answers allow the form and who elects", () => {
    const run = evaluate(SIUAN);
    expect(run.files("form-4972")).toBe(true);
    expect(run.value("form-4972", LINE_30)).toBe(5_706);
  });

  it("does not file when line 1 is No (not the entire balance)", () => {
    expect(evaluate([lumpSum({ entireBalance: false }), distribution()]).files("form-4972")).toBe(
      false,
    );
  });

  it("does not file when part was rolled over (line 2 Yes)", () => {
    expect(
      evaluate([lumpSum({ rolledOverAnyPart: true }), distribution()]).files("form-4972"),
    ).toBe(false);
  });

  it("does not file when the participant was born after January 1, 1936", () => {
    const run = evaluate([lumpSum({ participantBornBefore1936: false }), distribution()]);
    expect(run.files("form-4972")).toBe(false);
  });

  it("does not file after an earlier election as this participant's beneficiary (line 5b Yes)", () => {
    const run = evaluate([lumpSum({ priorElectionAsBeneficiary: true }), distribution()]);
    expect(run.files("form-4972")).toBe(false);
  });

  it("does not file for a participant with an earlier election from the own plan (line 5a Yes)", () => {
    const run = evaluate([
      lumpSum({
        ...PLAIN,
        receivedAs: "participant",
        participantFiveYears: true,
        priorElectionOwnPlan: true,
      }),
      distribution(),
    ]);
    expect(run.files("form-4972")).toBe(false);
  });

  it("does not file for a participant in the plan less than 5 years", () => {
    const run = evaluate([
      lumpSum({ ...PLAIN, receivedAs: "participant", participantFiveYears: false }),
      distribution(),
    ]);
    expect(run.files("form-4972")).toBe(false);
  });

  it("does not file with no election, or for an IRA distribution", () => {
    const none = evaluate([
      lumpSum({ capitalGainElection: false, tenYearOption: false }),
      distribution(),
    ]);
    const ira = evaluate([lumpSum(), distribution({ box7IraSepSimple: true })]);
    expect([none.files("form-4972"), ira.files("form-4972")]).toEqual([false, false]);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(SIUAN, [
      ...base.decisions,
      decision("decisions.scope.must_file_4972", false),
    ]);
    expect(run.files("form-4972")).toBe(false);
    expect(run.line("line.5b")).toBe(24_000 + 46_000);
  });

  it("an explicit decision true with no fact: the lines and line 16 are unsupported", () => {
    const run = evaluate(
      [distribution()],
      [...base.decisions, decision("decisions.scope.must_file_4972", true)],
    );
    expect(run.field("form-4972", LINE_30)).toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.16")).toMatchObject(UNSUPPORTED);
  });
});

describe("Form 4972 waits for an answer", () => {
  it("a participant with no line 4(c) answer: the form files and asks for the fact", () => {
    const fact = lumpSum({ ...PLAIN, receivedAs: "participant", participantFiveYears: undefined });
    const run = evaluate([fact, distribution()]);
    expect(run.files("form-4972")).toBe(true);
    expect(run.value("form-4972", LINE_30)).toBeUndefined();
    expect(run.line("line.16")).toBeUndefined();
    expect(run.pending.pendingFacts).toContain(fact.key);
  });

  it("a named Form 1099-R that is not on record: the form asks for it", () => {
    const missing = makeRetirementDistributionFactKey("harlow-tool-works", "second");
    const run = evaluate([lumpSum({ distributionKeys: [LUMP_SUM_KEY, missing] }), distribution()]);
    expect(run.value("form-4972", LINE_30)).toBeUndefined();
    expect(run.pending.pendingFacts).toContain(missing);
  });
});

describe("Form 4972 and Form 1040", () => {
  it("no lump-sum fact: nothing changes (the 1099-R stays on lines 5a and 5b)", () => {
    const run = evaluate([distribution()]);
    expect(run.files("form-4972")).toBe(false);
    expect([run.line("line.5a"), run.line("line.5b")]).toEqual([24_000 + 52_000, 24_000 + 46_000]);
    expect(run.line(BOX_2)).toBeUndefined();
  });

  it("Part III: the distribution leaves lines 5a and 5b; line 16 adds line 30 and checks box 2", () => {
    const run = evaluate(SIUAN);
    expect([run.line("line.5a"), run.line("line.5b")]).toEqual([24_000, 24_000]);
    expect(run.line("line.16")).toBe(26 + 5_706);
    expect(run.line(BOX_2)).toBe(true);
  });

  it("Part II only: lines 5a and 5b keep the ordinary part (plus NUA line F); line 16 adds line 7", () => {
    const run = evaluate([
      lumpSum({
        tenYearOption: false,
        deathBenefitExclusion: undefined,
        federalEstateTax: undefined,
      }),
      distribution(),
    ]);
    // NUA Worksheet: C = 0.12, E = 720, F = 5,280, G = 6,240; line 7 = 1,248.
    expect(run.value("form-4972", LINE_7)).toBe(1_248);
    expect(run.value("form-4972", LINE_30)).toBeUndefined();
    expect(run.line("line.5a")).toBe(24_000 + 52_000 - 5_520);
    expect(run.line("line.5b")).toBe(24_000 + 46_000 - 5_520 + 5_280);
    expect(run.line(BOX_2)).toBe(true);
  });

  it("Part II only with a death benefit exclusion: lines 5a and 5b are unsupported", () => {
    const run = evaluate([lumpSum({ tenYearOption: false }), distribution()]);
    expect(run.field("form-1040", "line.5b")).toMatchObject(UNSUPPORTED);
  });

  it("two participants: the printed form is unsupported, line 16 adds both taxes", () => {
    const mother = lumpSum(
      {
        ...PLAIN,
        distributionKeys: [makeRetirementDistributionFactKey("harlow-tool-works", "mother")],
      },
      "mother",
    );
    const run = evaluate([lumpSum(PLAIN), distribution(), mother, distribution({}, "mother")]);
    expect(run.field("form-4972", LINE_30)).toMatchObject(UNSUPPORTED);
    // Both distributions leave line 5, so the tax on taxable income stays 26.
    const one = evaluate([lumpSum(PLAIN), distribution()]).value("form-4972", LINE_30) as number;
    expect(run.line("line.16")).toBe(26 + one * 2);
    expect(run.line(BOX_2)).toBe(true);
  });

  it("an alternate payee: Part I lines 3 to 5b are unsupported, the tax is figured", () => {
    const run = evaluate([lumpSum({ ...PLAIN, receivedAs: "alternate_payee" }), distribution()]);
    expect(run.field("form-4972", "0.line.3_beneficiary_born_before_1936_yes")).toMatchObject(
      UNSUPPORTED,
    );
    expect(typeof run.value("form-4972", LINE_30)).toBe("number");
  });

  it("a shared distribution with estate tax: the tax and line 16 are unsupported", () => {
    const run = evaluate([
      lumpSum({ includeNua: false }),
      distribution({ box9a: 50, box8Percent: 50 }),
    ]);
    expect(run.field("form-4972", LINE_30)).toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.16")).toMatchObject(UNSUPPORTED);
  });

  it("a shared distribution: the Step 5 worksheet prints and gives line 29", () => {
    const run = evaluate([lumpSum(PLAIN), distribution({ box9a: 50, box8Percent: 50 })]);
    expect(
      run.value("form-4972", "2.multiple_recipients_worksheet.b_percentage_of_distribution"),
    ).toBe("50%");
    expect(run.value("form-4972", "0.line.29_line_25_less_line_28")).toBe(
      run.value("form-4972", "2.multiple_recipients_worksheet.c_share_of_tax"),
    );
  });
});

describe("Form 4972 and Form 6251", () => {
  it("line 10 takes Form 1040 line 16 less the Form 4972 tax", () => {
    const run = evaluate(SIUAN, [
      ...base.decisions,
      decision("decisions.scope.must_file_6251", true),
    ]);
    expect(run.value("form-6251", "0.line.10_regular_tax_less_credits")).toBe(26);
  });

  it("with no Form 4972 line 10 is Form 1040 line 16", () => {
    const run = evaluate(
      [distribution()],
      [...base.decisions, decision("decisions.scope.must_file_6251", true)],
    );
    expect(run.value("form-6251", "0.line.10_regular_tax_less_credits")).toBe(run.line("line.16"));
  });
});
