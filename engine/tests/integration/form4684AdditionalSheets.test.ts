import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { makeCasualtyEventFactKey, type CasualtyEventFactValue } from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows";
import { ADDITIONAL_SHEETS_GAP } from "../../src/federal/4684/lines.js";
import { tcbUs002Scenario as base } from "../scenarios/tcb-us-002/index.js";

/*
 * irs-4684-inst-2025::sec::section-a-personal-use-property::b01: "If more than
 * four items were lost or damaged, use additional sheets". tcb-us-002's monsoon
 * (the second event) gets five properties: its lines 10–12 and the totals on
 * lines 13–18 need the additional sheets, which the engine does not prepare.
 */
const MONSOON_KEY = makeCasualtyEventFactKey("monsoon");

function evaluate() {
  const facts = base.facts.map((fact): TaxFactRow => {
    if (fact.key !== MONSOON_KEY) return fact;
    const event = fact.value as CasualtyEventFactValue;
    return { ...fact, value: { ...event, properties: Array(5).fill(event.properties[0]) } };
  });
  const scenario = evaluateScenario({
    filing: { id: "form-4684-additional-sheets-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  return (formId: string, fieldId: string) =>
    scenario.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${fieldId}`)
      ?.result;
}

describe("Form 4684 with more than four properties in one event", () => {
  const result = evaluate();

  it("keeps the first event's line 10 on the first copy", () => {
    expect(result("form-4684", "0.line.10_casualty_theft_loss")).toMatchObject({ ok: true });
  });

  it("makes the totals on lines 13–18 unsupported, with the reason", () => {
    for (const line of [
      "0.line.13_total_gains",
      "0.line.14_total_losses",
      "0.line.15_net_gain_or_qualified_disaster_loss",
      "0.line.16_losses_less_gains",
      "0.line.17_ten_percent_agi",
      "0.line.18_deductible_loss",
    ]) {
      expect(result("form-4684", line), line).toEqual({
        ok: false,
        unsupported: true,
        reason: ADDITIONAL_SHEETS_GAP,
      });
    }
  });

  it("carries the gap to Schedule A line 16; 1040 line 12e behind it is blank, not asked", () => {
    expect(result("schedule-a", "0.line.16_other_itemized_deductions_amount")).toMatchObject({
      unsupported: true,
      reason: ADDITIONAL_SHEETS_GAP,
    });
    const line12e = result("form-1040", "line.12e");
    expect(line12e?.ok).toBe(false);
    expect(line12e).not.toHaveProperty("unsupported", true);
  });
});
