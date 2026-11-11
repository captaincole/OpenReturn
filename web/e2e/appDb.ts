import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { DATA_ENV } from "./run";

/* Playwright's module loader cannot load node:sqlite, so get the builtin directly. */
const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");

function query<T>(sql: string): T[] {
  const db = new DatabaseSync(DATA_ENV.APP_DB_PATH, { readOnly: true });
  try {
    return db.prepare(sql).all() as T[];
  } finally {
    db.close();
  }
}

const parse = (text: string | null): unknown => {
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export function latestW2(): Record<string, unknown> | undefined {
  const rows = query<{ fact_value: string | null }>(
    "SELECT fact_value FROM tax_facts WHERE category = 'wages' ORDER BY created_at DESC LIMIT 1",
  );
  return rows[0] ? (parse(rows[0].fact_value) as Record<string, unknown>) : undefined;
}

/* Rows are append-only: ascending order lets the newest row per key win. */
export function latestDecisions(): Map<string, unknown> {
  const rows = query<{ decision_key: string; decision: string | null }>(
    "SELECT decision_key, decision FROM ai_decisions ORDER BY created_at ASC",
  );
  return new Map(rows.map((row) => [row.decision_key, parse(row.decision)]));
}

export function unreviewedDecisions(): number {
  const [row] = query<{ n: number }>(
    "SELECT count(*) AS n FROM ai_decisions WHERE verdict IS NULL OR verdict = 'pending'",
  );
  return row.n;
}

export function verdictCounts(): Record<string, number> {
  const rows = query<{ verdict: string | null; n: number }>(
    "SELECT verdict, count(*) AS n FROM ai_decisions GROUP BY verdict",
  );
  return Object.fromEntries(rows.map((row) => [row.verdict ?? "null", row.n]));
}

/* A run's stored documents in one category. ULID names sort by time, so oldest first. */
export function findFiles(category: string, name: RegExp): string[] {
  const root = DATA_ENV.DOCUMENTS_PATH;
  const files = readdirSync(root, { recursive: true }) as string[];
  return files
    .filter((file) => file.split("/").at(-2) === category && name.test(file.split("/").pop()!))
    .sort()
    .map((file) => resolve(root, file));
}

/* The newest row of each fact key. */
export function latestFacts(): Map<string, { category: string; value: unknown }> {
  const rows = query<{ category: string; fact_key: string; fact_value: string | null }>(
    "SELECT category, fact_key, fact_value FROM tax_facts ORDER BY created_at ASC",
  );
  return new Map(
    rows.map((row) => [row.fact_key, { category: row.category, value: parse(row.fact_value) }]),
  );
}
