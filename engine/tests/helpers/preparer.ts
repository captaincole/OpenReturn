/*
 * decisions.rounding.* is not an AI decision: Cade never records it. It lets a
 * comparison match another preparer's filed return.
 */

import type { AIDecisionRow } from "../../src/facts/rows.js";
import type { Scenario } from "../types.js";
import { decisionRow } from "./fixtureBuilders.js";

export function decisionsWithPreparerStyle(scenario: Scenario): AIDecisionRow[] {
  const scheduleB = scenario.preparer?.rounding?.scheduleB;
  if (!scheduleB) return scenario.decisions;
  const style = decisionRow({
    userId: scenario.userId,
    taxYear: scenario.taxYear,
    key: "decisions.rounding.schedule_b",
    decision: scheduleB,
    rationale: "Preparer style (Scenario.preparer.rounding), not an AI decision.",
  });
  return [...scenario.decisions, style];
}
