/*
 * Schedule P (540) line 18 on a whole return: the limit on California itemized
 * deductions does not apply for AMT, so line 19 takes line 18 away (the form
 * prints line 18 in parentheses). The tcb-ca-005 scenario is the base, with
 * wages raised over the federal AGI threshold for a joint return ($504,411).
 */

import { describe, expect, it } from "vitest";
import type { W2FactValue } from "../../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { tcbCa005Scenario as base } from "../../../../scenarios/tcb-ca-005/index.js";

const isW2 = (fact: TaxFactRow) => (fact.value as Partial<W2FactValue>)?.box1 !== undefined;

/* The base facts with the first W-2's wages raised by `extraWages` in boxes 1 and 16. */
function factsWithWages(extraWages: number): TaxFactRow[] {
  const firstW2 = base.facts.find(isW2);
  return base.facts.map((fact) => {
    if (fact !== firstW2) return fact;
    const w2 = fact.value as W2FactValue;
    return { ...fact, value: { ...w2, box1: w2.box1 + extraWages } };
  });
}

function scheduleP(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "schedule-p-line-18-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const value = (id: string) => {
    const found = result.forms
      .get("schedule-p")
      ?.fields.find((each) => each.fieldId === `schedule-p.${id}`)?.result;
    return found?.ok ? (found.value as number | undefined) : undefined;
  };
  return {
    line14: value("0.line.14_total_adjustments_preferences") ?? 0,
    line15: value("0.line.15_taxable_income") ?? 0,
    line16: value("0.line.16_nol_deductions") ?? 0,
    line17: value("0.line.17_amti_exclusion") ?? 0,
    line18: value("1.line.18_itemized_deductions_limitation"),
    line19: value("1.line.19_combine_lines_14_through_18"),
  };
}

describe("Schedule P (540) line 18, the itemized deductions limitation", () => {
  it("is blank under the federal AGI threshold, and line 19 adds lines 14 to 17", () => {
    const lines = scheduleP(base.facts);
    expect(lines.line18).toBeUndefined();
    expect(lines.line19).toBe(lines.line14 + lines.line15 + lines.line16 - lines.line17);
  });

  it("is taken away on line 19 over the threshold", () => {
    const lines = scheduleP(factsWithWages(400000));
    expect(lines.line18).toBeGreaterThan(0);
    expect(lines.line19).toBe(
      lines.line14 + lines.line15 + lines.line16 - lines.line17 - (lines.line18 ?? 0),
    );
  });
});
