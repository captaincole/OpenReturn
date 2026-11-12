/*
 * Schedule D lines 6 and 14: a capital loss carried over from last year is a
 * positive amount in parentheses that lines 7 and 15 subtract
 * (irs-1040sd-inst-2025::sec::capital-loss-carryover-worksheet-lines-6-and-14::b02, b03).
 * The tcb-us-008 filer (MFS, no sales) with the carryovers below.
 */

import { describe, expect, it } from "vitest";
import { CAPITAL_LOSS_CARRYOVER_KEYS } from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { tcbUs008Scenario as base } from "../../../scenarios/tcb-us-008/index.js";

const carryovers = new Set<string>(Object.values(CAPITAL_LOSS_CARRYOVER_KEYS));

function scheduleD(shortTerm?: number, longTerm?: number) {
  const carryoverFact = (key: string, value: number): TaxFactRow => ({
    ...base.facts.find((fact) => fact.key === CAPITAL_LOSS_CARRYOVER_KEYS.shortTerm)!,
    id: `f-${key}`,
    key,
    value,
  });
  const facts = [
    ...base.facts.filter((fact) => !carryovers.has(fact.key)),
    ...(shortTerm === undefined
      ? []
      : [carryoverFact(CAPITAL_LOSS_CARRYOVER_KEYS.shortTerm, shortTerm)]),
    ...(longTerm === undefined
      ? []
      : [carryoverFact(CAPITAL_LOSS_CARRYOVER_KEYS.longTerm, longTerm)]),
  ];
  const result = evaluateScenario({
    filing: { id: "schedule-d-carryover-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const form = result.forms.get("schedule-d");
  const line = (id: string) => {
    const field = form?.fields.find((each) => each.fieldId === `schedule-d.${id}`);
    return field?.result.ok ? field.result.value : undefined;
  };
  return {
    files: form?.mustFile.ok ? form.mustFile.value : undefined,
    line6: line("0.line.6_short_term_loss_carryover"),
    line7: line("0.line.7_net_short_term_gain_loss"),
    line14: line("0.line.14_long_term_loss_carryover"),
    line15: line("0.line.15_net_long_term_gain_loss"),
    line21: line("1.line.21_allowable_loss"),
  };
}

describe("Schedule D capital loss carryovers", () => {
  it.each([
    // label, short-term, long-term, lines 6, 7, 14, 15, 21
    ["short-term only", 8507, undefined, 8507, -8507, undefined, 0, 1500],
    ["long-term only", undefined, 2000, undefined, 0, 2000, -2000, 1500],
    ["both", 500, 700, 500, -500, 700, -700, 1200],
  ] as Array<[string, number?, number?, number?, number?, number?, number?, number?]>)(
    "%s",
    (_, shortTerm, longTerm, line6, line7, line14, line15, line21) => {
      expect(scheduleD(shortTerm, longTerm)).toEqual({
        files: true,
        line6,
        line7,
        line14,
        line15,
        line21,
      });
    },
  );

  it("does not file Schedule D with no carryover and no sale", () => {
    expect(scheduleD().files).toBe(false);
  });
});
