import { OUTCOMES, type Outcome } from "../../src/mastra/deductions/openDoor";
import { avg } from "../lib/markdown";
import type { EvalModel } from "../lib/models";
import type { FlowScores, ModelScores } from "../lib/overview";
import { CASES } from "./cases";
import type { DoorResult } from "./report";

export const OUTCOME_TITLES: Record<Outcome, string> = {
  counts_here: "Counts here",
  counts_elsewhere: "Counts elsewhere",
  does_not_count: "Does not count",
  not_sure: "Not sure",
};

/* The outcomes that a case expects: the report's columns and the capabilities. */
export const EXPECTED_OUTCOMES = OUTCOMES.filter((outcome) =>
  CASES.some((testCase) => testCase.outcome === outcome),
);

/* Why a run fails; undefined when it passes. */
export function failure(result: DoorResult): string | undefined {
  if (result.error) return `failed: ${result.error}`;
  if (!result.recorded.length) return "recorded no expense";
  const wrongOutcome = result.recorded.find((expense) => expense.outcome !== result.expected);
  if (wrongOutcome) return `recorded ${wrongOutcome.outcome}`;
  const wrongItem = result.recorded.find(
    (expense) => result.expectedItem && expense.item !== result.expectedItem,
  );
  if (wrongItem) return `recorded the item ${wrongItem.item ?? "(none)"}`;
  if (result.amountKeys.length) return `wrote an amount: ${result.amountKeys.join(", ")}`;
  if (result.closedDoor) return "closed the door";
  return undefined;
}

export const passed = (result: DoorResult) => failure(result) === undefined;

export const share = (results: DoorResult[]) =>
  results.length ? results.filter(passed).length / results.length : 0;

function modelScores(model: EvalModel, results: DoorResult[]): ModelScores {
  const mine = results.filter((result) => result.model === model.label);
  const cases = new Set(mine.map((result) => result.case)).size;
  const capabilities: Record<string, number> = {};
  for (const outcome of EXPECTED_OUTCOMES) {
    const runs = mine.filter((result) => result.expected === outcome);
    if (runs.length) capabilities[OUTCOME_TITLES[outcome]] = share(runs);
  }
  return {
    label: model.label,
    id: model.id,
    score: avg(Object.values(capabilities)),
    capabilities,
    partial: cases < CASES.length ? `${cases}/${CASES.length} cases` : undefined,
  };
}

export function deductionsFlowScores(models: EvalModel[], results: DoorResult[]): FlowScores {
  return {
    flow: "deductions",
    title: "Deductions",
    definition:
      'Each case is one expense a taxpayer names at the open door of the deductions conversation ("anything else you paid that might count?"). Cade, with the conversation\'s instructions and tools, must record one of four outcomes for it. A run is correct when the outcome matches the label (and the item, when the expense counts here), no amount is written, and the door stays open. Each capability is the share of correct runs for one expected outcome; the flow score is their mean. No case expects "not sure" yet: each such expense counts, and no deduction item covers it.',
    report: "deductions.md",
    capabilities: EXPECTED_OUTCOMES.map((outcome) => OUTCOME_TITLES[outcome]),
    models: models.map((model) => modelScores(model, results)),
  };
}
