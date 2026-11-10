/*
 * The state of the deductions conversation, for its two readers: Cade
 * (get-deductions) and the web app (the Deductions tab and the card on the
 * return page, through /app/state). Every number is the engine's. Pure.
 */

import type { EvaluatedScenario } from "@openreturn/engine";
import { ITEMIZE_KEY, planClosing, SCHEDULE_A_KEY } from "./closing";
import { deductionsFlow, valuesByKey } from "./flow";
import { namedExpenses } from "./openDoor";

/* What Cade reads at the start of a turn. */
export function deductionsState(scenario: EvaluatedScenario) {
  const { items, comparison } = scenario.deductions;
  const recorded = (decisionKey: string) =>
    scenario.decisions.find((decision) => decision.decisionKey === decisionKey)?.decision ?? null;
  return {
    taxYear: scenario.filing.taxYear,
    ...deductionsFlow(scenario),
    items: items.map(({ id, title, status, amount, assumed, missing }) => ({
      id,
      title,
      status,
      amount: amount ?? null,
      assumed,
      missing,
    })),
    comparison: { federal: comparison?.federal ?? null, ca: comparison?.ca ?? null },
    recordedDecisions: {
      itemizeOrStandard: recorded(ITEMIZE_KEY),
      scheduleAFiles: recorded(SCHEDULE_A_KEY),
    },
  };
}

/*
 * What the web app reads: Cade's state, the expenses the taxpayer named at the
 * open door, and the closing's paragraph and records. The paragraph says
 * "Deductions are done", so it is null until the conversation is closed.
 */
export function deductionsView(scenario: EvaluatedScenario) {
  const state = deductionsState(scenario);
  const closing = planClosing(scenario);
  return {
    ...state,
    namedExpenses: namedExpenses(valuesByKey(scenario.facts), scenario.decisions),
    summary: state.next.step === "closed" ? (closing?.summary ?? null) : null,
    records: closing?.records ?? [],
  };
}
