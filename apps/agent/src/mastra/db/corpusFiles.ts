import { ensureCorpusSchema, getCorpusDb } from "./libsql";

/*
 * Each document's source file, stored in corpus.db (ref_document_files)
 * so the published file is the whole library: a PDF's bytes, or a
 * cleaned HTML page as UTF-8 (ref_documents.format says which). Written
 * by the ingest pipeline and by `corpus sync` (for a current document
 * whose file is not stored yet); read by fetchSource and the reference
 * library's routes.
 */

export async function setDocumentSource(docId: string, source: Uint8Array): Promise<void> {
  await ensureCorpusSchema();
  await getCorpusDb().execute({
    sql: `INSERT INTO ref_document_files (doc_id, source) VALUES (?, ?)
          ON CONFLICT(doc_id) DO UPDATE SET source = excluded.source`,
    args: [docId, source],
  });
}

export async function getDocumentSource(docId: string): Promise<Uint8Array<ArrayBuffer> | null> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT source FROM ref_document_files WHERE doc_id = ?`,
    args: [docId],
  });
  const source = res.rows[0]?.source;
  return source instanceof ArrayBuffer ? new Uint8Array(source) : null;
}

/** docIds that have a stored source file. */
export async function docIdsWithSource(): Promise<Set<string>> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute(`SELECT doc_id FROM ref_document_files`);
  return new Set(res.rows.map((r) => String(r.doc_id)));
}
