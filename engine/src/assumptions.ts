/*
 * Assumptions: numbers the taxpayer gave for calculations only ("about $12,000
 * of mortgage interest"), not facts. An assumption fills a fact key that has
 * no fact; it never overrides one, so the document that arrives later replaces
 * it with no cleanup. A return with any assumption in use is not ready to file
 * (pendingInputs lists them).
 */

import type { TaxFactRow } from "./facts/rows.js";

export interface FilledFacts {
  /** The facts, then each assumption in use: what the forms read. */
  facts: TaxFactRow[];
  /** The assumptions whose key has no fact. */
  assumptionsInUse: TaxFactRow[];
}

/* Both lists are superseded (one row per key). */
export function fillGaps(facts: TaxFactRow[], assumptions: TaxFactRow[]): FilledFacts {
  const stated = new Set(facts.map((fact) => fact.key));
  const assumptionsInUse = assumptions.filter((assumption) => !stated.has(assumption.key));
  return { facts: [...facts, ...assumptionsInUse], assumptionsInUse };
}
