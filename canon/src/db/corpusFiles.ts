import { ensureCorpusSchema, getCorpusDb } from "./libsql";

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

export async function docIdsWithSource(): Promise<Set<string>> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute(`SELECT doc_id FROM ref_document_files`);
  return new Set(res.rows.map((row) => String(row.doc_id)));
}
