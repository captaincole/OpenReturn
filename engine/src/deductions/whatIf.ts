/*
 * The passes of the forms the deductions module reads: the return as if it
 * itemizes (decisions.itemize_vs_standard = itemized), on the facts and the
 * assumptions in use, with some amounts changed for a what-if. The forms stay
 * the only calculator.
 */

import { evaluateForms, type FormsPass } from "../evaluateForms.js";
import type { AIDecisionRow, TaxFactRow } from "../facts/rows.js";

const ITEMIZE_KEY = "decisions.itemize_vs_standard";

/** New values for fact keys that already have a row. */
export type Changes = Readonly<Record<string, number>>;
export type ItemizedRun = (changes?: Changes) => FormsPass;

/* The engine reads only the key and the value; the rest fills the row shape. */
function itemizeDecision(taxYear: number): AIDecisionRow {
  return {
    id: "deductions-as-if-itemized",
    userId: "",
    taxYear,
    decisionKey: ITEMIZE_KEY,
    decision: "itemized",
    rationale: "The deductions comparison: the return as if it itemizes.",
    supportingFactKeys: [],
    confidence: "high",
    dissentingConsiderations: null,
    authorityCitations: null,
    sourceNote: null,
    createdAt: "",
    verdict: null,
    verdictReason: null,
    verdictAt: null,
  };
}

/* Facts and decisions are superseded (one row per key), as evaluateScenario passes them. */
export function itemizedRun(
  taxYear: number,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[],
): ItemizedRun {
  const asIfItemized = [
    itemizeDecision(taxYear),
    ...decisions.filter((decision) => decision.decisionKey !== ITEMIZE_KEY),
  ];
  return (changes = {}) =>
    evaluateForms(
      taxYear,
      facts.map((fact) =>
        Object.hasOwn(changes, fact.key) ? { ...fact, value: changes[fact.key] } : fact,
      ),
      asIfItemized,
    );
}
