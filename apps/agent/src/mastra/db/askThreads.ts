import {
  asJson,
  asNum,
  asNumOrNull,
  asStr,
  asStrOrNull,
  ensureAppSchema,
  getAppDb,
  nowIso,
} from "./appDb";

/*
 * Persistence for tax-code Q&A. Two tables (DDL in appDb.ts):
 *   ask_threads — one row per first question
 *   ask_turns   — one row per question in a thread
 *
 * Threads are person-scoped: every query filters by user_id. A turn is
 * inserted as 'running', and the answer pipeline (workflows/askTurn)
 * completes or fails it in the background. log_json holds the pipeline's
 * raw queries, retrieval and step timings — the query log we monitor
 * search quality from.
 */

export type AskTurnStatus = "running" | "completed" | "failed";
export type AskCoverage = "covered" | "partial" | "not_covered";
/** Which pipeline step a running turn is in; the page shows it as progress. */
export type AskStage = "formulating" | "retrieving" | "answering";

/** One numbered reference behind an `[n]` marker in the answer. */
export interface AskCitation {
  n: number;
  blockId: string;
  docId: string;
  documentTitle: string;
  sectionHeading: string | null;
  pageNum: number;
  quote: string;
}

export interface AskTurn {
  id: string;
  index: number;
  question: string;
  status: AskTurnStatus;
  stage: AskStage | null;
  answer: string | null;
  coverage: AskCoverage | null;
  citations: AskCitation[];
  /** Documents that would cover what the library does not (partial / not_covered). */
  missingDocuments: string[];
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface AskThread {
  id: string;
  title: string;
  createdAt: string;
  turns: AskTurn[];
}

/*
 * A turn still 'running' after this long lost its background run (a
 * dev-server reload or crash). Reads report it as failed so the page
 * stops polling.
 */
const STALE_RUNNING_MS = 10 * 60 * 1000;

function rowToTurn(r: Record<string, unknown>): AskTurn {
  const createdAt = asStr(r.created_at);
  let status = asStr(r.status) as AskTurnStatus;
  let error = asStrOrNull(r.error);
  if (status === "running" && Date.now() - Date.parse(createdAt) > STALE_RUNNING_MS) {
    status = "failed";
    error = "The answer was interrupted. Ask again.";
  }
  return {
    id: asStr(r.id),
    index: asNum(r.turn_index),
    question: asStr(r.question),
    status,
    stage: status === "running" ? (asStrOrNull(r.stage) as AskStage | null) : null,
    answer: asStrOrNull(r.answer),
    coverage: asStrOrNull(r.coverage) as AskCoverage | null,
    citations: (asJson(r.citations_json) as AskCitation[] | null) ?? [],
    missingDocuments: (asJson(r.missing_docs_json) as string[] | null) ?? [],
    error,
    createdAt,
    completedAt: asStrOrNull(r.completed_at),
    durationMs: asNumOrNull(r.duration_ms),
  };
}

/** Creates a thread and its first turn (status 'running'). */
export async function createAskThread(
  userId: string,
  question: string,
): Promise<{ threadId: string; turnId: string }> {
  await ensureAppSchema();
  const threadId = crypto.randomUUID();
  const turnId = crypto.randomUUID();
  const now = nowIso();
  await getAppDb().batch(
    [
      {
        sql: `INSERT INTO ask_threads (id, user_id, title, created_at) VALUES (?, ?, ?, ?)`,
        args: [threadId, userId, question, now],
      },
      {
        sql: `INSERT INTO ask_turns (id, thread_id, user_id, turn_index, question, status, created_at)
              VALUES (?, ?, ?, 0, ?, 'running', ?)`,
        args: [turnId, threadId, userId, question, now],
      },
    ],
    "write",
  );
  return { threadId, turnId };
}

export type AddTurnResult = { turnId: string } | { error: "not_found" | "busy" };

/*
 * Appends a follow-up turn. Refuses while the previous turn is still
 * running: each turn reads the earlier answers as context.
 */
export async function addAskTurn(
  userId: string,
  threadId: string,
  question: string,
): Promise<AddTurnResult> {
  const thread = await getAskThread(userId, threadId);
  if (!thread) return { error: "not_found" };
  if (thread.turns.some((t) => t.status === "running")) return { error: "busy" };
  const turnId = crypto.randomUUID();
  await getAppDb().execute({
    sql: `INSERT INTO ask_turns (id, thread_id, user_id, turn_index, question, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'running', ?)`,
    args: [turnId, threadId, userId, thread.turns.length, question, nowIso()],
  });
  return { turnId };
}

export async function getAskThread(userId: string, threadId: string): Promise<AskThread | null> {
  await ensureAppSchema();
  const db = getAppDb();
  const t = await db.execute({
    sql: `SELECT id, title, created_at FROM ask_threads WHERE id = ? AND user_id = ?`,
    args: [threadId, userId],
  });
  const row = t.rows[0];
  if (!row) return null;
  const turns = await db.execute({
    sql: `SELECT * FROM ask_turns WHERE thread_id = ? AND user_id = ? ORDER BY turn_index`,
    args: [threadId, userId],
  });
  return {
    id: asStr(row.id),
    title: asStr(row.title),
    createdAt: asStr(row.created_at),
    turns: turns.rows.map((r) => rowToTurn(r as Record<string, unknown>)),
  };
}

export async function setAskTurnStage(turnId: string, stage: AskStage): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `UPDATE ask_turns SET stage = ? WHERE id = ? AND status = 'running'`,
    args: [stage, turnId],
  });
}

export interface CompleteAskTurnArgs {
  answer: string;
  coverage: AskCoverage | null;
  citations: AskCitation[];
  missingDocuments: string[];
  log: unknown;
  durationMs: number;
}

export async function completeAskTurn(turnId: string, args: CompleteAskTurnArgs): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `UPDATE ask_turns
          SET status = 'completed', answer = ?, coverage = ?, citations_json = ?,
              missing_docs_json = ?, log_json = ?, completed_at = ?, duration_ms = ?
          WHERE id = ?`,
    args: [
      args.answer,
      args.coverage,
      JSON.stringify(args.citations),
      JSON.stringify(args.missingDocuments),
      JSON.stringify(args.log),
      nowIso(),
      args.durationMs,
      turnId,
    ],
  });
}

export async function failAskTurn(
  turnId: string,
  error: string,
  log: unknown,
  durationMs: number,
): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `UPDATE ask_turns
          SET status = 'failed', error = ?, log_json = ?, completed_at = ?, duration_ms = ?
          WHERE id = ?`,
    args: [error, JSON.stringify(log), nowIso(), durationMs, turnId],
  });
}
