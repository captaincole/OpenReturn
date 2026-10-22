import { ensureCorpusSchema, getCorpusDb } from "./libsql";

/*
 * Source PDFs stored in corpus.db (ref_document_files). Written by the
 * ingest pipeline and by `corpus sync` for documents ingested before the
 * table existed; read by the reference library's PDF route.
 */

export async function setDocumentPdf(docId: string, pdf: Uint8Array): Promise<void> {
  await ensureCorpusSchema();
  await getCorpusDb().execute({
    sql: `INSERT INTO ref_document_files (doc_id, pdf) VALUES (?, ?)
          ON CONFLICT(doc_id) DO UPDATE SET pdf = excluded.pdf`,
    args: [docId, pdf],
  });
}

export async function getDocumentPdf(docId: string): Promise<Uint8Array<ArrayBuffer> | null> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT pdf FROM ref_document_files WHERE doc_id = ?`,
    args: [docId],
  });
  const pdf = res.rows[0]?.pdf;
  return pdf instanceof ArrayBuffer ? new Uint8Array(pdf) : null;
}

/** docIds that have a stored PDF. */
export async function docIdsWithPdf(): Promise<Set<string>> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute(`SELECT doc_id FROM ref_document_files`);
  return new Set(res.rows.map((r) => String(r.doc_id)));
}
