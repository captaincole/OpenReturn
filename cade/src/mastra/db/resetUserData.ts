import { cade } from "../agents/cade";
import { asNum, asStr, ensureAppSchema, getAppDb } from "./appDb";
import { deleteBlob } from "./blobStore";

/* Keeps filings and filing_members on purpose: a reset empties the filing, not removes it. */

export interface PerUserResetResult {
  domainRowsDeleted: number;
  mastraThreadsDeleted: number;
  documentsDeleted: number;
}

/* Deletes only the caller's data: every query scopes by user_id explicitly. */
export async function resetCurrentUserData(userId: string): Promise<PerUserResetResult> {
  await ensureAppSchema();
  const db = getAppDb();

  /* Read the storage paths BEFORE the row deletes, or the blobs are orphaned. */
  const docPaths = await db.execute({
    sql: `SELECT storage_path FROM user_documents WHERE user_id = ?`,
    args: [userId],
  });
  const storagePaths = docPaths.rows.map((r) => asStr(r.storage_path));

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

  await Promise.all(storagePaths.map((p) => deleteBlob(p)));

  /* Memory.deleteThread, not raw SQL: Mastra owns the cascade (messages, memory, vectors). */
  let mastraThreadsDeleted = 0;
  const memory = await cade.getMemory();
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
