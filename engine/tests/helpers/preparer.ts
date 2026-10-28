/*
 * decisions.rounding.* is not an AI decision: Cade never records it. It lets a
 * comparison match another preparer's filed return.
 */

import type { AIDecisionRow } from "../../src/facts/rows.js";
import type { Scenario } from "../types.js";
import { decisionRow } from "./fixtureBuilders.js";

export function decisionsWithPreparerStyle(s: Scenario): AIDecisionRow[] {
  const scheduleB = s.preparer?.rounding?.scheduleB;
  if (!scheduleB) return s.decisions;
  const style = decisionRow({
    userId: s.userId,
    taxYear: s.taxYear,
    key: "decisions.rounding.schedule_b",
    decision: scheduleB,
    rationale: "Preparer style (Scenario.preparer.rounding), not an AI decision.",
  });
  return [...s.decisions, style];
}
