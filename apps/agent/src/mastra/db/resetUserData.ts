import { luca } from "../agents/luca";
import { getAppDb, ensureAppSchema, asStr, asNum } from "./appDb";
import { deleteBlob } from "./blobStore";

/*
 * Per-user data reset is the only reset path. POST /app/session/reset
 * calls resetCurrentUserData below; the web UI no longer has a button
 * for it. There is no wholesale-truncate path; for that, delete
 * .data/app.db and reseed.
 *
 * Filings + filing_members are deliberately NOT wiped. A reset returns
 * the filing to a known-empty state (zero facts, decisions, questions,
 * documents, requests) and must not force the owner to re-create the
 * filing. The row and membership persist; everything inside the filing
 * is cleared.
 */

export interface PerUserResetResult {
  domainRowsDeleted: number;
  mastraThreadsDeleted: number;
  documentsDeleted: number;
}

/*
 * Per-user data reset, used by /app/session/reset. Deletes only the
 * calling user's data: domain rows (explicit WHERE user_id, since RLS
 * left with Postgres), Mastra threads, and documents (metadata rows AND
 * their local blob files).
 */
export async function resetCurrentUserData(
  userId: string,
): Promise<PerUserResetResult> {
  await ensureAppSchema();
  const db = getAppDb();

  /*
   * Capture document storage paths BEFORE the row deletes. Deleted rows
   * lose the pointers to the bytes in storage and orphan them.
   */
  const docPaths = await db.execute({
    sql: `SELECT storage_path FROM user_documents WHERE user_id = ?`,
    args: [userId],
  });
  const storagePaths = docPaths.rows.map((r) => asStr(r.storage_path));

  // Domain + document tables, with explicit user_id scoping.
  const tables = [
    "tax_facts",
    "open_questions",
    "ai_decisions",
    "user_documents",
    "requested_actions",
    "review_run_steps",
    "review_runs",
  ] as const;
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const res = await db.execute({
      sql: `DELETE FROM ${t} WHERE user_id = ?`,
      args: [userId],
    });
    counts[t] = asNum(res.rowsAffected);
  }

  /*
   * Blob files that match the deleted rows. Best-effort per file; a
   * missing blob is already the desired end state.
   */
  await Promise.all(storagePaths.map((p) => deleteBlob(p)));

  /*
   * Mastra memory cleanup goes through Memory.deleteThread(), not raw
   * SQL. Mastra owns the cascade (messages, observational memory, vector
   * embeddings when semantic recall is enabled). The documented API
   * keeps us aligned with future additions to the teardown path. We list
   * this user's threads, then delete each one.
   */
  let mastraThreadsDeleted = 0;
  const memory = await luca.getMemory();
  if (memory) {
    const { threads } = await memory.listThreads({
      filter: { resourceId: userId },
      perPage: false,
    });
    await Promise.all(threads.map((t) => memory.deleteThread(t.id)));
    mastraThreadsDeleted = threads.length;
  }
  return {
    domainRowsDeleted:
      counts.tax_facts +
      counts.open_questions +
      counts.ai_decisions +
      counts.requested_actions +
      counts.review_run_steps +
      counts.review_runs,
    mastraThreadsDeleted,
    documentsDeleted: counts.user_documents,
  };
}
