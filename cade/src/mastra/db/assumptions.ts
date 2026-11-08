/*
 * Assumptions: numbers the taxpayer gave for calculations only ("about
 * $12,000"). Same shape as tax_facts, in their own table, so no reader of the
 * facts can take one for a fact. The engine fills gaps with them and reports
 * the ones in use; a return with any in use is not ready to file.
 */

import type { InValue } from "@libsql/client";
import { ensureAppSchema, getAppDb, nowIso, type Scope } from "./appDb";
import { rowToFact, type TaxFact, type TaxFactRow } from "./taxFacts";

export async function recordAssumptions(scope: Scope, assumptions: TaxFact[]): Promise<void> {
  await ensureAppSchema();
  await getAppDb().batch(
    assumptions.map((assumption) => ({
      sql: `INSERT INTO assumptions
              (id, user_id, filing_id, tax_year, category, fact_key, fact_value, source_note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        assumption.id,
        assumption.userId,
        assumption.filingId,
        assumption.taxYear,
        assumption.category,
        assumption.key,
        JSON.stringify(assumption.value ?? null),
        assumption.sourceNote ?? null,
        nowIso(),
      ],
    })),
    "write",
  );
  void scope; // scoping is explicit via userId/filingId on insert
}

/* Newest first, as the engine supersedes. */
export async function listAssumptions(
  scope: Scope,
  opts: { taxYear?: number; limit?: number } = {},
): Promise<TaxFactRow[]> {
  await ensureAppSchema();
  const conds = ["filing_id = ?"];
  const args: InValue[] = [scope.filingId];
  if (opts.taxYear !== undefined) {
    conds.push("tax_year = ?");
    args.push(opts.taxYear);
  }
  args.push(Math.min(opts.limit ?? 500, 500));
  const res = await getAppDb().execute({
    sql: `SELECT * FROM assumptions WHERE ${conds.join(" AND ")}
          ORDER BY created_at DESC LIMIT ?`,
    args,
  });
  return res.rows.map(rowToFact);
}
