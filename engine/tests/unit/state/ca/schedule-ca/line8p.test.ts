/*
 * Schedule CA line 8p, the federal excess business loss adjustment
 * (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b04). Column A copies
 * Schedule 1 line 8p; columns B and C wait for FTB 3461 (Form 461
 * QUESTIONS.md item 13). The base is the synthetic juilin scenario, moved to
 * California.
 */

import { describe, expect, it } from "vitest";
import type { AIDecisionRow } from "../../../../../src/facts/rows.js";
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

function evaluateInCalifornia() {
  const result = evaluateScenario({
    filing: { id: "schedule-ca-line-8p-test", taxYear: base.taxYear },
    facts: base.facts,
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

  it("columns B and C stay gaps for FTB 3461", () => {
    const { field } = evaluateInCalifornia();
    expect(field("schedule-ca.1.line.b8p_subtractions")?.unsupported).toBe(true);
    expect(field("schedule-ca.1.line.b8p_additions")?.unsupported).toBe(true);
  });
});
