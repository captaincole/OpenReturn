/*
 * Form 5329 Part I and Schedule 2 line 8 on a whole return: the alex filer
 * (single, born 2002) with Tom Jones's $3,000 early IRA distribution
 * (irs-pub-590b-2025::sec::additional-10-tax::b01).
 */

import { describe, expect, it } from "vitest";
import {
  makeEarlyDistributionExceptionKey,
  makeRetirementDistributionFactKey,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { FEDERAL_FORMS } from "../../../../src/federal/index.js";
import { evaluateScenario } from "../../../../src/index.js";
import { alexScenario as base } from "../../../scenarios/alex/index.js";

const template = base.facts[0];
const fact = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});
const IRA_KEY = makeRetirementDistributionFactKey("broker", "ira-1");
const ira = fact("retirement", IRA_KEY, {
  payerName: "Broker",
  box1: 3000,
  box2a: 3000,
  box7: "1",
  box7IraSepSimple: true,
});

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "form-5329-test", taxYear: base.taxYear },
    facts: [...base.facts, ...extra],
    decisions: [...base.decisions, ...decisions],
    authEmail: null,
  });
  const field = (formId: string, id: string) => {
    const found = result.forms
      .get(formId)
      ?.fields.find((each) => each.fieldId === `${formId}.${id}`);
    return found?.result.ok ? found.result.value : undefined;
  };
  const files = (formId: string) => {
    const mustFile = result.forms.get(formId)?.mustFile;
    return mustFile?.ok ? mustFile.value : undefined;
  };
  return {
    form5329: files("form-5329"),
    schedule2: files("schedule-2"),
    line8: field("schedule-2", "0.line.8_additional_tax_iras_tax_favored_accounts"),
    box8: field("schedule-2", "0.line.8_ira_tax_favored_accounts_not_required"),
    line21: field("schedule-2", "1.line.21_total_other_taxes"),
    part1: [
      field("form-5329", "0.line.1_early_distributions_in_income"),
      field("form-5329", "0.line.2_early_distributions_not_subject"),
      field("form-5329", "0.line.2_exception_number"),
      field("form-5329", "0.line.3_amount_subject_to_tax"),
      field("form-5329", "0.line.4_additional_tax_early_distributions"),
    ],
    name: field("form-5329", "0.header.taxpayer_name"),
  };
}

const mustFile5329 = {
  ...base.decisions[0],
  id: "dec-must-file-5329",
  decisionKey: "decisions.scope.must_file_5329",
  decision: true,
};

describe("Form 5329 Part I on a return", () => {
  it("with no early distribution, files neither Form 5329 nor a line 8", () => {
    const result = evaluate([]);
    expect(result.form5329).toBe(false);
    expect(result.line8).toBeUndefined();
    expect(result.box8).toBeUndefined();
  });

  // irs-1040-inst-2025::sec::line-8::b01–b02: code 1, no exception: 10% on line 8, box checked.
  it("code 1 with no exception: Schedule 2 line 8 takes $300 with the box checked, no form", () => {
    const result = evaluate([ira]);
    expect(result.form5329).toBe(false);
    expect(result.schedule2).toBe(true);
    expect([result.line8, result.box8, result.line21]).toEqual([300, true, 300]);
  });

  // irs-pub-590b-2025::sec::omb-no-1545-0074-2::b05: the filled-in form, lines 1–4.
  it("Tom Jones files the form: 3000, -0-, 3000, 300, and line 8 takes line 4", () => {
    const result = evaluate([ira], [mustFile5329]);
    expect(result.form5329).toBe(true);
    expect(result.part1).toEqual([3000, 0, undefined, 3000, 300]);
    expect(result.name).toBe("Alex Morales");
    expect([result.line8, result.box8]).toEqual([300, undefined]);
  });

  it("an exception files the form and lowers line 8", () => {
    const stated = fact("retirement", makeEarlyDistributionExceptionKey("broker", "ira-1"), {
      number: "08",
      amount: 1000,
    });
    const result = evaluate([ira, stated]);
    expect(result.form5329).toBe(true);
    expect(result.part1).toEqual([3000, 1000, "08", 2000, 200]);
    expect([result.line8, result.box8]).toEqual([200, undefined]);
  });
});

describe("Form 5329 copies", () => {
  const spec = FEDERAL_FORMS.find((form) => form.formId === "form-5329")!;
  const people = [
    { owner: "taxpayer" as const, rows: [], pending: false, needsForm: true, factKeys: [] },
    { owner: "spouse" as const, rows: [], pending: false, needsForm: false, factKeys: [] },
  ];

  it("renders one copy per person, and selects each person's copy", () => {
    const info = { form5329Filers: people };
    expect(spec.copies?.count(info)).toBe(2);
    expect(spec.copies?.select(info, 1)?.form5329CopyIndex).toBe(1);
  });
});
