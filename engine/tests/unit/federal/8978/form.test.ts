/*
 * Form 8978 on a whole return: who files, what it asks for, where line 14
 * goes, and that a return without a Form 8986 does not change. The synthetic
 * vandene (a positive line 14) and harine (a negative one) are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  isForm8986FactKey,
  isPartnerAdjustmentYearFactKey,
  makePartnerAdjustmentYearFactKey,
  type Form8986FactValue,
  type PartnerAdjustmentYearFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { negativeReportingYearTax } from "../../../../src/federal/8978/receivers.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { harineScenario } from "../../../scenarios/synthetic/harine/index.js";
import { vandeneScenario } from "../../../scenarios/synthetic/vandene/index.js";
import type { Scenario } from "../../../types.js";

const YEAR_2021 = makePartnerAdjustmentYearFactKey(2021);

function evaluate(scenario: Scenario, facts: TaxFactRow[], decisions?: AIDecisionRow[]) {
  const result = evaluateScenario({
    filing: { id: "form-8978-test", taxYear: scenario.taxYear },
    facts,
    decisions: decisions ?? scenario.decisions,
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
  const line = (id: string) => value("form-8978", id);
  const missing = result.forms.get("form-8978")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

/* The scenario's facts with each fact for a key changed (undefined drops it). */
function factsWith(scenario: Scenario, changes: Record<string, unknown>): TaxFactRow[] {
  return scenario.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
}

const valueOf = <T>(scenario: Scenario, key: string) =>
  scenario.facts.find((fact) => fact.key === key)!.value as T;

const without8978Facts = (scenario: Scenario) =>
  scenario.facts.filter(
    (fact) => !isForm8986FactKey(fact.key) && !isPartnerAdjustmentYearFactKey(fact.key),
  );

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const COPPERLINE = "form_8986.copperline-ventures-2021";

describe("Form 8978 who files", () => {
  it("files with a Form 8986 furnished in 2025, and asks for nothing more", () => {
    const run = evaluate(vandeneScenario, vandeneScenario.facts);
    expect(run.files("form-8978")).toBe(true);
    expect(run.missing).toEqual([]);
  });

  it("does not file with no Form 8986, or with one furnished in 2024 (that year's return)", () => {
    expect(evaluate(vandeneScenario, without8978Facts(vandeneScenario)).files("form-8978")).toBe(
      false,
    );
    const earlier = vandeneScenario.facts
      .filter((fact) => !isForm8986FactKey(fact.key) || fact.key === COPPERLINE)
      .map((fact) =>
        fact.key === COPPERLINE
          ? { ...fact, value: { ...(fact.value as object), dateFurnished: "2024-11-30" } }
          : fact,
      );
    expect(evaluate(vandeneScenario, earlier).files("form-8978")).toBe(false);
  });

  it("an explicit decision false still wins", () => {
    const decisions = [
      ...vandeneScenario.decisions,
      decisionRow({
        userId: vandeneScenario.userId,
        taxYear: vandeneScenario.taxYear,
        key: "decisions.scope.must_file_8978",
        decision: false,
        rationale: "test",
      }),
    ];
    const run = evaluate(vandeneScenario, vandeneScenario.facts, decisions);
    expect(run.files("form-8978")).toBe(false);
    expect(run.value("form-1040", "line.16")).toBe(33_467);
  });
});

describe("Form 8978 asks for each answer it needs", () => {
  it("asks for a first affected year's fact and leaves the totals blank", () => {
    const run = evaluate(vandeneScenario, factsWith(vandeneScenario, { [YEAR_2021]: undefined }));
    expect(run.missing).toContain(YEAR_2021);
    expect(run.line("0.line.14_total_increase_decrease_reporting_year_tax")).toBeUndefined();
    expect(run.value("form-1040", "line.16")).toBeUndefined();
  });

  it("asks again while the penalty a Form 8986 lists has no amount", () => {
    const year = valueOf<PartnerAdjustmentYearFactValue>(vandeneScenario, YEAR_2021);
    const changed = { ...year, bbaAudit: { ...year.bbaAudit!, penalties: undefined } };
    const run = evaluate(vandeneScenario, factsWith(vandeneScenario, { [YEAR_2021]: changed }));
    expect(run.missing).toEqual([YEAR_2021]);
  });

  it("asks whether the return was extended once a penalty is above 0", () => {
    const year = valueOf<PartnerAdjustmentYearFactValue>(vandeneScenario, YEAR_2021);
    const changed = { ...year, returnExtended: undefined };
    const run = evaluate(vandeneScenario, factsWith(vandeneScenario, { [YEAR_2021]: changed }));
    expect(run.missing).toEqual([YEAR_2021]);
  });
});

describe("Form 8978 line 14 on the return", () => {
  it("above 0: Form 1040 line 16 adds it and box 3 names Form 8978 (irs-1040-inst-2025::sec::line-16::b02)", () => {
    const run = evaluate(vandeneScenario, vandeneScenario.facts);
    const before = evaluate(vandeneScenario, without8978Facts(vandeneScenario));
    expect(run.line("0.line.14_total_increase_decrease_reporting_year_tax")).toBe(7_718);
    expect(run.value("form-1040", "line.16")).toBe(
      (before.value("form-1040", "line.16") as number) + 7_718,
    );
    expect(run.value("form-1040", "line.16_from_other_form")).toBe(true);
    expect(run.value("form-1040", "line.16_other_form_number")).toBe("Form 8978 7,718");
    expect(run.files("schedule-3")).toBe(false);
  });

  it("below 0: Schedule 3 line 6l up to Form 1040 line 18, the rest on Schedule 2 line 17z up to the chapter 1 taxes", () => {
    const run = evaluate(harineScenario, harineScenario.facts);
    const line18 = run.value("form-1040", "line.18") as number;
    expect(run.line("0.line.14_total_increase_decrease_reporting_year_tax")).toBe(-3_736);
    expect(run.value("schedule-3", "0.line.6l")).toBe(line18);
    expect(run.value("schedule-2", "1.line.17z_other_taxes_amount")).toBe(-500);
    expect(run.value("schedule-2", "1.line.17z_other_taxes_description")).toBe("Form 8978 ADJ");
    expect(run.value("form-1040", "line.16")).toBe(1_355);
  });

  it("below 0 but less than line 18: line 6l takes all of it and line 17z stays as it was", () => {
    const fernhollow = valueOf<Form8986FactValue>(
      harineScenario,
      "form_8986.fernhollow-orchards-2022",
    );
    const smaller = {
      ...fernhollow,
      adjustments: [{ ...fernhollow.adjustments[0]!, netAdjustment: -5_000 }],
    };
    const year2022 = valueOf<PartnerAdjustmentYearFactValue>(
      harineScenario,
      makePartnerAdjustmentYearFactKey(2022),
    );
    const run = evaluate(
      harineScenario,
      factsWith(harineScenario, {
        "form_8986.fernhollow-orchards-2022": smaller,
        [makePartnerAdjustmentYearFactKey(2022)]: {
          ...year2022,
          attributeAdjustments: [],
          aar: { incomeTax: 3_700 },
        },
      }),
    );
    const total = run.line("0.line.14_total_increase_decrease_reporting_year_tax") as number;
    expect(total).toBe(3_700 - 4_457 + 216);
    expect(run.value("schedule-3", "0.line.6l")).toBe(-total);
    expect(isGap(run.field("schedule-2", "1.line.17z_other_taxes_amount"))).toBe(true);
  });

  it("Form 6251 line 10 and Form 1116 line 20 are lower by a negative line 14", () => {
    const run = evaluateScenario({
      filing: { id: "t", taxYear: harineScenario.taxYear },
      facts: harineScenario.facts,
      decisions: harineScenario.decisions,
      authEmail: null,
    });
    expect(negativeReportingYearTax(run.filingInfo!)).toBe(3_736);
  });
});

describe("Form 8978 gaps", () => {
  it("a Form 8986 line the engine cannot sort is a gap on the form and on Form 1040 line 16", () => {
    const copperline = valueOf<Form8986FactValue>(vandeneScenario, COPPERLINE);
    const odd = {
      ...copperline,
      adjustments: [{ lineNumber: "99", lineTitle: "Unknown", netAdjustment: 1 }],
    };
    const run = evaluate(vandeneScenario, factsWith(vandeneScenario, { [COPPERLINE]: odd }));
    expect(isGap(run.field("form-8978", "0.line.13_increase_decrease_to_tax_col_a"))).toBe(true);
    expect(isGap(run.field("form-1040", "line.16"))).toBe(true);
  });
});

describe("no Form 8986, nothing changes", () => {
  it("Schedule 3 line 6l and Schedule 2 line 17z keep their old reasons", () => {
    const run = evaluate(harineScenario, without8978Facts(harineScenario));
    expect(run.files("form-8978")).toBe(false);
    expect(run.files("schedule-3")).toBe(false);
    expect(isGap(run.field("schedule-2", "1.line.17z_other_taxes_amount"))).toBe(true);
    expect(isGap(run.field("form-1040", "line.16_from_other_form"))).toBe(true);
    expect(run.value("form-1040", "line.24")).toBe(1_855);
  });
});
