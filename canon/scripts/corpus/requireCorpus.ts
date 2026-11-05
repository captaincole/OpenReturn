import { existsSync } from "node:fs";
import { corpusDbPath, getCorpusDb } from "../../src/db/libsql";

async function countDocuments(): Promise<number> {
  try {
    const result = await getCorpusDb().execute("SELECT count(*) AS total FROM ref_documents");
    return Number(result.rows[0]?.total ?? 0);
  } catch {
    return 0; // no ref_documents table: an empty file
  }
}

/* A read on an empty corpus prints nothing, which looks like "no such section". Stop instead. */
export async function requireCorpus(): Promise<void> {
  const path = corpusDbPath();
  if (existsSync(path) && (await countDocuments()) > 0) return;
  throw new Error(
    `${path} has no documents. A git worktree has no canon/.data: set CORPUS_DB_PATH ` +
      "in canon/.env to the main checkout's corpus.db, or run `npm run corpus -- fetch`.",
  );
}
