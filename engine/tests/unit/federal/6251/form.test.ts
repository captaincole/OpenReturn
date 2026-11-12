/*
 * Form 6251 evaluated from facts: the 26%/28% path with no Part III (form line 7),
 * Part III's skip of lines 33–37 (the form's gate after line 32), and line 2c waiting
 * on last year's AMT Form 4952 carryover
 * (irs-6251-inst-2025::sec::line-2c-investment-interest::b01, Step 2).
 * The returns start from tcb-us-001 (README.md) and change a few facts.
 */

import { describe, expect, it } from "vitest";
import { AMT_KEYS, INVESTMENT_INTEREST_KEYS, isTradeFact } from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs, readyToFile } from "../../../../src/index.js";
import { tcbUs001Scenario as base } from "../../../scenarios/tcb-us-001/index.js";

type Changes = Record<string, unknown>;

/* base's facts with each changed key's value replaced (or added), and the listed keys dropped. */
function facts(changes: Changes, drop: (fact: TaxFactRow) => boolean = () => false): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !drop(fact))
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  const added = Object.entries(changes)
    .filter(([key]) => !kept.some((fact) => fact.key === key))
    .map(([key, value]) => ({
      ...kept[0]!,
      id: `f-${key}`,
      category: "investment_income",
      key,
      value,
    }));
  return [...kept, ...added];
}

/* base's decisions with each changed key's value replaced (or added). */
function decisions(changes: Changes): AIDecisionRow[] {
  const kept = base.decisions.map((row) =>
    row.decisionKey in changes ? { ...row, decision: changes[row.decisionKey] } : row,
  );
  const added = Object.entries(changes)
    .filter(([key]) => !kept.some((row) => row.decisionKey === key))
    .map(([decisionKey, decision]) => ({
      ...kept[0]!,
      id: `dec-${decisionKey}`,
      decisionKey,
      decision,
    }));
  return [...kept, ...added];
}

function evaluate(factRows: TaxFactRow[], decisionRows: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: base.name, taxYear: base.taxYear },
    facts: factRows,
    decisions: decisionRows,
  });
  const line = (fieldId: string) => {
    const formId = fieldId.startsWith("form-1040.") ? "form-1040" : fieldId.split(".")[0]!;
    const field = result.forms
      .get(formId)
      ?.fields.find((candidate) => candidate.fieldId === fieldId);
    return field?.result.ok ? field.result.value : undefined;
  };
  return { result, line };
}

/* A single filer who takes the standard deduction and sells nothing: no Schedule A, D or 4952. */
const STANDARD = decisions({
  "decisions.scope.filing_status": "single",
  "decisions.scope.has_reportable_sales": false,
  "decisions.scope.must_file_schedule_d": false,
  "decisions.scope.must_file_8949": false,
  "decisions.scope.must_file_schedule_a": false,
  "decisions.itemize_vs_standard": "standard",
  "decisions.scope.must_file_4952": false,
});

describe("Form 6251 evaluated", () => {
  it("figures line 7 at 26%/28% when nothing sends the filer to Part III", () => {
    const { line } = evaluate(
      facts({}, (fact) => isTradeFact(fact)),
      STANDARD,
    );
    // 1,100,000 wages less the 15,750 standard deduction, added back, plus the 250,000 spread.
    expect(line("form-6251.0.line.4_alternative_minimum_taxable_income")).toBe(1350000);
    expect(line("form-6251.0.line.5_exemption")).toBeUndefined();
    expect(line("form-6251.0.line.6_amti_less_exemption")).toBe(1350000);
    expect(line("form-6251.0.line.7_tax_on_line_6")).toBe(373218); // 28% less 4,782
    expect(line("form-6251.1.line.12_amount_from_line_6")).toBeUndefined();
  });

  it("skips lines 33–37 when lines 32 and 12 are the same", () => {
    // 15,750 of wages, a 300,000 long-term gain, no ISO spread: filed on the explicit decision.
    const w2 = base.facts.find((fact) => fact.category === "wages")!;
    const { line } = evaluate(
      facts({
        [w2.key]: { ...(w2.value as object), box1: 15750, box2: 0, box5: 15750, box6: 0 },
        [AMT_KEYS.isoExerciseSpread]: 0,
        [base.facts.find((fact) => isTradeFact(fact))!.key]: {
          tradeId: "payer-d-01",
          description: "Shares",
          dateAcquired: "01/01/1999",
          dateSold: "01/01/2025",
          proceeds: 400000,
          costBasis: 100000,
        },
      }),
      decisions({
        "decisions.scope.filing_status": "single",
        "decisions.scope.must_file_schedule_a": false,
        "decisions.itemize_vs_standard": "standard",
        "decisions.scope.must_file_4952": false,
        "decisions.scope.must_file_6251": true,
      }),
    );
    expect(line("form-6251.0.line.6_amti_less_exemption")).toBe(227650);
    expect(line("form-6251.1.line.12_amount_from_line_6")).toBe(227650);
    expect(line("form-6251.1.line.32_add_lines_23_30")).toBe(227650);
    for (const skipped of [
      "form-6251.1.line.33_line_22_minus_32",
      "form-6251.1.line.34_tax_at_twenty_percent",
      "form-6251.1.line.35_add_lines_17_32_33",
      "form-6251.1.line.36_line_12_minus_35",
      "form-6251.1.line.37_tax_at_twenty_five_percent",
    ]) {
      expect(line(skipped)).toBeUndefined();
    }
    expect(line("form-6251.1.line.38_add_lines_18_31_34_37")).toBe(26895); // 15% of 179,300
    expect(line("form-6251.0.line.7_tax_on_line_6")).toBe(26895);
  });

  it("waits on line 4 while line 2c needs last year's AMT carryover", () => {
    const waiting = evaluate(facts({ [INVESTMENT_INTEREST_KEYS.disallowedCarryover]: 650 }));
    expect(waiting.line("form-6251.0.line.2c_investment_interest_expense")).toBeUndefined();
    expect(waiting.line("form-6251.0.line.4_alternative_minimum_taxable_income")).toBeUndefined();
    expect(waiting.line("schedule-2.0.line.2_alternative_minimum_tax")).toBeUndefined();
    const pending = pendingInputs(waiting.result);
    expect(pending.pendingFacts).toContain(INVESTMENT_INTEREST_KEYS.amtDisallowedCarryover);
    expect(readyToFile(pending)).toBe(false);

    const answered = evaluate(
      facts({
        [INVESTMENT_INTEREST_KEYS.disallowedCarryover]: 650,
        [INVESTMENT_INTEREST_KEYS.amtDisallowedCarryover]: 400,
        [INVESTMENT_INTEREST_KEYS.electedQualifiedDividendsAndGain]: 80000,
      }),
    );
    // Regular line 8 is 75,650 and AMT line 8 is 75,400.
    expect(answered.line("form-6251.0.line.2c_investment_interest_expense")).toBe(250);
    expect(answered.line("form-6251.0.line.4_alternative_minimum_taxable_income")).toBe(6237600);
  });
});
