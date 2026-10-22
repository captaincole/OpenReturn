/*
 * A preparer's style reaches the engine as an input row
 * (`decisions.rounding.*`). It is not an AI decision: Cade never records
 * it, and Summa's own returns use the IRS default. It exists so a
 * comparison against another preparer's filed return can match how
 * that preparer formatted it. Set it on `Scenario.preparer.rounding`.
 */

import type { AIDecisionRow } from "../../src/facts/rows.js";
import type { Scenario } from "../types.js";
import { decisionRow } from "./fixtureBuilders.js";

/** The scenario's decisions plus one row per preparer rounding choice. */
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
