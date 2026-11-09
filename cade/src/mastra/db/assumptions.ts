/*
 * Assumptions: numbers the taxpayer gave for calculations only ("about
 * $12,000"). Same shape as tax_facts, in their own table, so no reader of the
 * facts can take one for a fact. The engine fills gaps with them and reports
 * the ones in use; a return with any in use is not ready to file.
 */

import type { Scope } from "./appDb";
import { listFacts, recordFacts, type TaxFact, type TaxFactRow } from "./taxFacts";

export const recordAssumptions = (scope: Scope, assumptions: TaxFact[]): Promise<void> =>
  recordFacts(scope, assumptions, "assumptions");

/* Newest first, as the engine supersedes. */
export const listAssumptions = (scope: Scope): Promise<TaxFactRow[]> =>
  listFacts(scope, { limit: 500 }, "assumptions");
