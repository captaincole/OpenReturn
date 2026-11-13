/*
 * Schedule 1 line 8z and Form 1099-G box 5: RTAA payments belong on line 8z
 * (irs-pub-525-2025::sec::reemployment-trade-adjustment-assis::b01), which the
 * engine does not add yet. The tcb-ca-001 return with box 5 added to its 1099-G.
 */

import { describe, expect, it } from "vitest";
import {
  isGovernmentPaymentsFactKey,
  type GovernmentPaymentsFactValue,
} from "../../../../src/facts/index.js";
import { evaluateScenario } from "../../../../src/index.js";
import { tcbCa001Scenario as base } from "../../../scenarios/tcb-ca-001/index.js";

function line8z(box5: number | undefined) {
  const facts = base.facts.map((fact) =>
    isGovernmentPaymentsFactKey(fact.key)
      ? { ...fact, value: { ...(fact.value as GovernmentPaymentsFactValue), box5 } }
      : fact,
  );
  const result = evaluateScenario({
    filing: { id: "schedule-1-line-8z-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const form = result.forms.get("schedule-1")!;
  return form.fields.find((field) => field.fieldId === "schedule-1.0.line.8z")!.result;
}

describe("Schedule 1 line 8z with a 1099-G", () => {
  it("is unsupported when box 5 holds RTAA payments", () => {
    const result = line8z(1200);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.unsupported === true ? result.reason : undefined).toContain(
      "box 5",
    );
  });

  it("is not unsupported with no box 5", () => {
    const result = line8z(undefined);
    expect(!result.ok && result.unsupported === true).toBe(false);
  });
});
