import type { AskCitation, AskCoverage, AskStage } from "../canon/schemas";
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

/* Threads are person-scoped: every read filters by user_id. */

export type AskTurnStatus = "running" | "completed" | "failed";
export type { AskCitation, AskCoverage, AskStage };

export interface AskTurn {
  id: string;
  index: number;
  question: string;
  status: AskTurnStatus;
  stage: AskStage | null;
  answer: string | null;
  coverage: AskCoverage | null;
  citations: AskCitation[];
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

/* A turn 'running' this long lost its background run (reload or crash): report it failed. */
const STALE_RUNNING_MS = 10 * 60 * 1000;

function rowToTurn(row: Record<string, unknown>): AskTurn {
  const createdAt = asStr(row.created_at);
  let status = asStr(row.status) as AskTurnStatus;
  let error = asStrOrNull(row.error);
  if (status === "running" && Date.now() - Date.parse(createdAt) > STALE_RUNNING_MS) {
    status = "failed";
    error = "The answer was interrupted. Ask again.";
  }
  return {
    id: asStr(row.id),
    index: asNum(row.turn_index),
    question: asStr(row.question),
    status,
    stage: status === "running" ? (asStrOrNull(row.stage) as AskStage | null) : null,
    answer: asStrOrNull(row.answer),
    coverage: asStrOrNull(row.coverage) as AskCoverage | null,
    citations: (asJson(row.citations_json) as AskCitation[] | null) ?? [],
    missingDocuments: (asJson(row.missing_docs_json) as string[] | null) ?? [],
    error,
    createdAt,
    completedAt: asStrOrNull(row.completed_at),
    durationMs: asNumOrNull(row.duration_ms),
  };
}

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

/* Refuses while a turn is running: each turn reads the earlier answers as context. */
export async function addAskTurn(
  userId: string,
  threadId: string,
  question: string,
): Promise<AddTurnResult> {
  const thread = await getAskThread(userId, threadId);
  if (!thread) return { error: "not_found" };
  if (thread.turns.some((turn) => turn.status === "running")) return { error: "busy" };
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
  const res = await db.execute({
    sql: `SELECT id, title, created_at FROM ask_threads WHERE id = ? AND user_id = ?`,
    args: [threadId, userId],
  });
  const row = res.rows[0];
  if (!row) return null;
  const turns = await db.execute({
    sql: `SELECT * FROM ask_turns WHERE thread_id = ? AND user_id = ? ORDER BY turn_index`,
    args: [threadId, userId],
  });
  return {
    id: asStr(row.id),
    title: asStr(row.title),
    createdAt: asStr(row.created_at),
    turns: turns.rows.map((turnRow) => rowToTurn(turnRow as Record<string, unknown>)),
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
