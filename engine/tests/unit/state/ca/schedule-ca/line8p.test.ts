/*
 * Schedule CA line 8p, the federal excess business loss adjustment
 * (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b04). Column A copies
 * Schedule 1 line 8p; column B takes it out and column C adds FTB 3461 line
 * 16 (state/ca/schedule-ca/excessBusinessLoss.ts). The base is the synthetic
 * juilin scenario, moved to California.
 */

import { describe, expect, it } from "vitest";
import { CA_BUSINESS_LOSS_LIMIT_KEYS } from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { juilinScenario as base } from "../../../../scenarios/synthetic/juilin/index.js";

const CA_KEYS = ["decisions.scope.must_file_ca_540", "decisions.scope.ca_residency"];

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

/* No FTB 3461 carryover from 2024 (line 14b). */
const NO_CARRYOVER: TaxFactRow = {
  ...base.facts[0],
  id: "f-no-carryover",
  category: "other",
  key: CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearCarryover,
  value: 0,
};

function evaluateInCalifornia() {
  const result = evaluateScenario({
    filing: { id: "schedule-ca-line-8p-test", taxYear: base.taxYear },
    facts: [...base.facts, NO_CARRYOVER],
    decisions: [
      ...base.decisions.filter((row) => !CA_KEYS.includes(row.decisionKey)),
      decision("decisions.scope.must_file_ca_540", true),
      decision("decisions.scope.ca_residency", "full_year"),
    ],
  });
  const field = (fieldId: string) =>
    result.forms.get(fieldId.split(".")[0])?.fields.find((entry) => entry.fieldId === fieldId)
      ?.result as { ok: boolean; value?: unknown; unsupported?: boolean } | undefined;
  return { field };
}

describe("Schedule CA line 8p", () => {
  it("column A copies Schedule 1 line 8p, and line 9a column A holds it", () => {
    const { field } = evaluateInCalifornia();
    const federal = field("schedule-1.0.line.8p");
    expect(federal?.ok).toBe(true);
    expect(federal?.value).toBeGreaterThan(0);
    expect(field("schedule-ca.1.line.b8p_federal")?.value).toBe(federal?.value);
    expect(field("schedule-ca.2.line.b9a_federal")?.value).toBe(
      field("schedule-1.0.line.9")?.value,
    );
  });

  it("column B takes the federal amount out and column C adds FTB 3461 line 16", () => {
    const { field } = evaluateInCalifornia();
    const federal = field("schedule-1.0.line.8p")?.value as number;
    const line16 = field("form-3461.0.line.16_excess_business_loss")?.value as number;
    expect(line16).toBeLessThan(0);
    expect(field("schedule-ca.1.line.b8p_subtractions")?.value).toBe(federal);
    expect(field("schedule-ca.1.line.b8p_additions")?.value).toBe(0 - line16);
  });
});
