import { createClient, type Client } from "@libsql/client";
import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Per-user DOMAIN data (tax_facts, ai_decisions, filings, …) lives in a
 * local libsql/SQLite file, separate from corpus.db, which is a prebuilt
 * shippable asset. This replaces the Supabase Postgres domain tables and
 * RLS.
 *
 * RLS left with Postgres, so scoping is explicit: every helper in
 * taxFacts/aiDecisions/etc. takes a `Scope { userId, filingId }` and
 * writes the WHERE clauses that RLS added before. filing_members holds
 * exactly one owner membership per filing; the CPA-reviewer multi-user
 * surface was removed with the self-hosted transition.
 *
 * Path resolution mirrors db/libsql.ts: APP_DB_PATH env wins, else
 * <cade>/.data/app.db anchored to this module so cwd does not
 * matter.
 */

const MODULE_DIR = dirname(fileURLToPath(import.meta.url)); // …/src/mastra/db
const DEFAULT_DB_PATH = resolve(MODULE_DIR, "../../../.data/app.db");

function appDbPath(): string {
  return process.env.APP_DB_PATH ? resolve(process.env.APP_DB_PATH) : DEFAULT_DB_PATH;
}

/**
 * Explicit per-request scoping; the replacement for RLS. Built by
 * requireUserContext (agent) or the membership-verified route handlers.
 */
export interface Scope {
  userId: string;
  filingId: string;
}

/*
 * Cell readers. libsql row values are typed string | number | bigint |
 * ArrayBuffer | null. Exported for the domain helper modules.
 */
export const asStr = (v: unknown): string => (v == null ? "" : String(v));
export const asStrOrNull = (v: unknown): string | null => (v == null ? null : String(v));
export const asNum = (v: unknown): number => (v == null ? 0 : Number(v));
export const asNumOrNull = (v: unknown): number | null => (v == null ? null : Number(v));
/** Parse a TEXT column holding JSON; null stays null. */
export const asJson = (v: unknown): unknown => (v == null ? null : JSON.parse(String(v)));

/**
 * ISO timestamp written from JS. String ordering matches the old
 * Postgres timestamptz values the web app sorts on.
 */
export const nowIso = (): string => new Date().toISOString();

let cached: Client | null = null;
let schemaReady: Promise<void> | null = null;

export function getAppDb(): Client {
  if (cached) return cached;
  const path = appDbPath();
  mkdirSync(dirname(path), { recursive: true });
  cached = createClient({ url: `file:${path}` });
  return cached;
}

/*
 * Idempotent schema DDL; every statement is CREATE … IF NOT EXISTS.
 * SQLite type mapping from the Postgres migrations: uuid → TEXT,
 * jsonb → TEXT (JSON.stringify at write, JSON.parse at read),
 * timestamptz → TEXT (ISO). ensureAppSchema executes the list in one
 * batch, in order.
 */
const APP_SCHEMA_DDL: string[] = [
  /*
   * The single owner of this instance. Identity = the instance. The
   * row holds profile data (name/email, used for form prefill and
   * authEmail) and the web gate's credentials (scrypt password hash
   * plus the HMAC secret for session cookies). The web app's
   * first-run /setup screen creates it. The agent only READS it;
   * ownerMiddleware resolves the owner as the resource id for every
   * request.
   */
  `CREATE TABLE IF NOT EXISTS owner (
           id            TEXT PRIMARY KEY,
           email         TEXT NOT NULL,
           display_name  TEXT NOT NULL,
           password_hash TEXT NOT NULL,
           session_secret TEXT NOT NULL,
           created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         )`,
  `CREATE TABLE IF NOT EXISTS filings (
           id         TEXT PRIMARY KEY,
           tax_year   INTEGER NOT NULL,
           status     TEXT NOT NULL DEFAULT 'draft',
           created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         )`,
  `CREATE INDEX IF NOT EXISTS idx_filings_tax_year ON filings(tax_year)`,
  `CREATE TABLE IF NOT EXISTS filing_members (
           filing_id  TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
           user_id    TEXT NOT NULL,
           role       TEXT NOT NULL CHECK (role IN ('owner')),
           added_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
           revoked_at TEXT,
           PRIMARY KEY (filing_id, user_id)
         )`,
  `CREATE INDEX IF NOT EXISTS idx_filing_members_user ON filing_members(user_id) WHERE revoked_at IS NULL`,
  `CREATE TABLE IF NOT EXISTS tax_facts (
           id          TEXT PRIMARY KEY,
           user_id     TEXT NOT NULL,
           filing_id   TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
           tax_year    INTEGER NOT NULL,
           category    TEXT NOT NULL,
           fact_key    TEXT NOT NULL,
           fact_value  TEXT,
           source_note TEXT,
           created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         )`,
  `CREATE INDEX IF NOT EXISTS idx_tax_facts_filing ON tax_facts(filing_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_tax_facts_key ON tax_facts(filing_id, fact_key)`,
  `CREATE TABLE IF NOT EXISTS open_questions (
           id          TEXT PRIMARY KEY,
           user_id     TEXT NOT NULL,
           filing_id   TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
           status      TEXT NOT NULL DEFAULT 'open',
           question    TEXT NOT NULL,
           context     TEXT,
           decision_id TEXT,
           created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
           resolved_at TEXT
         )`,
  `CREATE INDEX IF NOT EXISTS idx_open_questions_filing ON open_questions(filing_id, status)`,
  `CREATE TABLE IF NOT EXISTS ai_decisions (
           id                       TEXT PRIMARY KEY,
           user_id                  TEXT NOT NULL,
           filing_id                TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
           tax_year                 INTEGER NOT NULL,
           decision_key             TEXT NOT NULL,
           decision                 TEXT,
           rationale                TEXT NOT NULL,
           supporting_fact_keys     TEXT,
           confidence               TEXT NOT NULL,
           dissenting_considerations TEXT,
           authority_citations      TEXT,
           source_note              TEXT,
           created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
           verdict                  TEXT,
           verdict_reason           TEXT,
           verdict_at               TEXT,
           latest_review_run_id     TEXT
         )`,
  `CREATE INDEX IF NOT EXISTS idx_ai_decisions_filing ON ai_decisions(filing_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS user_documents (
           id           TEXT PRIMARY KEY,
           user_id      TEXT NOT NULL,
           filing_id    TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
           category     TEXT NOT NULL CHECK (category IN ('drafts','finals','uploads')),
           scenario     TEXT,
           filename     TEXT NOT NULL,
           storage_path TEXT NOT NULL,
           size_bytes   INTEGER,
           mime_type    TEXT,
           expires_at   TEXT,
           created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
           metadata     TEXT
         )`,
  `CREATE INDEX IF NOT EXISTS idx_user_documents_filing ON user_documents(filing_id, category, created_at)`,
  `CREATE TABLE IF NOT EXISTS requested_actions (
           id                   TEXT PRIMARY KEY,
           user_id              TEXT NOT NULL,
           filing_id            TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
           tax_year             INTEGER NOT NULL,
           kind                 TEXT NOT NULL CHECK (kind IN ('upload','confirm','decide')),
           title                TEXT NOT NULL,
           detail               TEXT,
           document_type        TEXT,
           accept_pattern       TEXT,
           status               TEXT NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open','processing','resolved','skipped','dismissed')),
           resolved_document_id TEXT,
           created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
           resolved_at          TEXT
         )`,
  `CREATE INDEX IF NOT EXISTS idx_requested_actions_filing ON requested_actions(filing_id, status, created_at)`,
  `CREATE TABLE IF NOT EXISTS review_runs (
           id              TEXT PRIMARY KEY,
           decision_id     TEXT NOT NULL,
           user_id         TEXT NOT NULL,
           filing_id       TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
           status          TEXT NOT NULL CHECK (status IN ('running','completed','failed')),
           final_verdict   TEXT,
           iteration_count INTEGER,
           error           TEXT,
           started_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
           completed_at    TEXT,
           duration_ms     INTEGER
         )`,
  `CREATE INDEX IF NOT EXISTS idx_review_runs_decision ON review_runs(decision_id)`,
  `CREATE TABLE IF NOT EXISTS review_run_steps (
           id          TEXT PRIMARY KEY,
           run_id      TEXT NOT NULL,
           user_id     TEXT NOT NULL,
           filing_id   TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
           iteration   INTEGER NOT NULL,
           step_kind   TEXT NOT NULL,
           input_json  TEXT,
           output_json TEXT,
           duration_ms INTEGER,
           created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         )`,
  `CREATE INDEX IF NOT EXISTS idx_review_run_steps_run ON review_run_steps(run_id, iteration)`,
  /*
   * Tax-code Q&A ("Ask the tax code"). Person-scoped, not filing-scoped.
   * One thread per first question, one turn per question in it. The turn
   * rows double as the query log: log_json keeps the pipeline's queries,
   * retrieval and step timings raw. See db/askThreads.ts.
   */
  `CREATE TABLE IF NOT EXISTS ask_threads (
           id         TEXT PRIMARY KEY,
           user_id    TEXT NOT NULL,
           title      TEXT NOT NULL,
           created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         )`,
  `CREATE TABLE IF NOT EXISTS ask_turns (
           id             TEXT PRIMARY KEY,
           thread_id      TEXT NOT NULL REFERENCES ask_threads(id) ON DELETE CASCADE,
           user_id        TEXT NOT NULL,
           turn_index     INTEGER NOT NULL,
           question       TEXT NOT NULL,
           status         TEXT NOT NULL CHECK (status IN ('running','completed','failed')),
           stage          TEXT,
           answer         TEXT,
           coverage       TEXT CHECK (coverage IN ('covered','partial','not_covered')),
           citations_json TEXT,
           missing_docs_json TEXT,
           log_json       TEXT,
           error          TEXT,
           created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
           completed_at   TEXT,
           duration_ms    INTEGER
         )`,
  `CREATE INDEX IF NOT EXISTS idx_ask_turns_thread ON ask_turns(thread_id, turn_index)`,
];

export function ensureAppSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const db = getAppDb();
    // FK ON DELETE CASCADE (domain rows → filings) needs this per connection.
    await db.execute("PRAGMA foreign_keys = ON");
    await db.batch(APP_SCHEMA_DDL, "write");
  })();
  return schemaReady;
}

/*
 * ---------------------------------------------------------------------------
 * Owner — the instance's single user. See the owner table comment above.
 * ---------------------------------------------------------------------------
 */

export interface Owner {
  id: string;
  email: string;
  displayName: string;
}

/** The instance owner, or null before first-run setup completes. */
export async function getOwner(): Promise<Owner | null> {
  await ensureAppSchema();
  const res = await getAppDb().execute(`SELECT id, email, display_name FROM owner LIMIT 1`);
  const r = res.rows[0];
  if (!r) return null;
  return { id: asStr(r.id), email: asStr(r.email), displayName: asStr(r.display_name) };
}
