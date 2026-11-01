import type { InValue, Row } from "@libsql/client";
import {
  asJson,
  asNum,
  asStr,
  asStrOrNull,
  ensureAppSchema,
  getAppDb,
  nowIso,
  type Scope,
} from "./appDb";

/* Explicit Scope everywhere: reads filter on filing_id, writes stamp user_id and filing_id. */

import type { TaxFactRow } from "@openreturn/engine/facts";
export type { TaxFactRow };

export interface TaxFact {
  id: string;
  userId: string;
  filingId: string;
  taxYear: number;
  category: string;
  key: string;
  value: unknown;
  sourceNote?: string;
}

function rowToFact(row: Row): TaxFactRow {
  return {
    id: asStr(row.id),
    userId: asStr(row.user_id),
    taxYear: asNum(row.tax_year),
    category: asStr(row.category),
    key: asStr(row.fact_key),
    value: asJson(row.fact_value),
    sourceNote: asStrOrNull(row.source_note),
    createdAt: asStr(row.created_at),
  };
}

function insertFact(fact: TaxFact) {
  return {
    sql: `INSERT INTO tax_facts
            (id, user_id, filing_id, tax_year, category, fact_key, fact_value, source_note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      fact.id,
      fact.userId,
      fact.filingId,
      fact.taxYear,
      fact.category,
      fact.key,
      JSON.stringify(fact.value ?? null),
      fact.sourceNote ?? null,
      nowIso(),
    ],
  };
}

export async function recordFact(scope: Scope, fact: TaxFact): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute(insertFact(fact));
  void scope; // scoping is explicit via fact.userId/filingId on insert
}

/** One transaction: every row is stored, or none. */
export async function recordFacts(scope: Scope, facts: TaxFact[]): Promise<void> {
  await ensureAppSchema();
  await getAppDb().batch(facts.map(insertFact), "write");
  void scope; // scoping is explicit via fact.userId/filingId on insert
}

export interface ListFactsOpts {
  filingId?: string;
  taxYear?: number;
  category?: string;
  limit?: number;
}

export async function listFacts(scope: Scope, opts: ListFactsOpts = {}): Promise<TaxFactRow[]> {
  await ensureAppSchema();
  const conds: string[] = ["filing_id = ?"];
  const args: InValue[] = [opts.filingId ?? scope.filingId];
  if (opts.taxYear !== undefined) {
    conds.push("tax_year = ?");
    args.push(opts.taxYear);
  }
  if (opts.category) {
    conds.push("category = ?");
    args.push(opts.category);
  }
  args.push(Math.min(opts.limit ?? 100, 500));
  const res = await getAppDb().execute({
    sql: `SELECT * FROM tax_facts WHERE ${conds.join(" AND ")}
          ORDER BY created_at DESC LIMIT ?`,
    args,
  });
  return res.rows.map(rowToFact);
}

export async function listFactsByKeys(
  scope: Scope,
  taxYear: number,
  keys: string[],
): Promise<TaxFactRow[]> {
  if (keys.length === 0) return [];
  await ensureAppSchema();
  const placeholders = keys.map(() => "?").join(",");
  const res = await getAppDb().execute({
    sql: `SELECT * FROM tax_facts
          WHERE filing_id = ? AND tax_year = ? AND fact_key IN (${placeholders})
          ORDER BY created_at DESC`,
    args: [scope.filingId, taxYear, ...keys],
  });
  // tax_facts is append-only; collapse to the latest row per fact_key.
  const latest = new Map<string, TaxFactRow>();
  for (const row of res.rows) {
    const key = asStr(row.fact_key);
    if (latest.has(key)) continue;
    latest.set(key, rowToFact(row));
  }
  return Array.from(latest.values());
}

export interface OpenQuestion {
  id: string;
  userId: string;
  filingId: string;
  question: string;
  context?: string;
  /* Set by the review workflow, so the decision can be reviewed again once the user answers. */
  decisionId?: string;
}

export interface OpenQuestionRow {
  id: string;
  userId: string;
  status: string;
  question: string;
  context: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

function rowToQuestion(row: Row): OpenQuestionRow {
  return {
    id: asStr(row.id),
    userId: asStr(row.user_id),
    status: asStr(row.status),
    question: asStr(row.question),
    context: asStrOrNull(row.context),
    createdAt: asStr(row.created_at),
    resolvedAt: asStrOrNull(row.resolved_at),
  };
}

export async function noteQuestion(scope: Scope, question: OpenQuestion): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `INSERT INTO open_questions
            (id, user_id, filing_id, status, question, context, decision_id, created_at)
          VALUES (?, ?, ?, 'open', ?, ?, ?, ?)`,
    args: [
      question.id,
      question.userId,
      question.filingId,
      question.question,
      question.context ?? null,
      question.decisionId ?? null,
      nowIso(),
    ],
  });
  void scope;
}

export async function listOpenQuestions(
  scope: Scope,
  status: "open" | "resolved" | "all" = "open",
): Promise<OpenQuestionRow[]> {
  await ensureAppSchema();
  const conds = ["filing_id = ?"];
  const args: InValue[] = [scope.filingId];
  if (status !== "all") {
    conds.push("status = ?");
    args.push(status);
  }
  const res = await getAppDb().execute({
    sql: `SELECT * FROM open_questions WHERE ${conds.join(" AND ")}
          ORDER BY created_at DESC LIMIT 200`,
    args,
  });
  return res.rows.map(rowToQuestion);
}

export async function resolveQuestion(scope: Scope, id: string): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `UPDATE open_questions SET status = 'resolved', resolved_at = ?
          WHERE id = ? AND filing_id = ?`,
    args: [nowIso(), id, scope.filingId],
  });
}
