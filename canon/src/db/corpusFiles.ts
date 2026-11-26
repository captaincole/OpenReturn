import { openLibraryDb, type Library } from "./libsql";

export async function setDocumentSource(
  docId: string,
  source: Uint8Array,
  library: Library = "corpus",
): Promise<void> {
  const db = await openLibraryDb(library);
  await db.execute({
    sql: `INSERT INTO ref_document_files (doc_id, source) VALUES (?, ?)
          ON CONFLICT(doc_id) DO UPDATE SET source = excluded.source`,
    args: [docId, source],
  });
}

export async function getDocumentSource(
  docId: string,
  library: Library = "corpus",
): Promise<Uint8Array<ArrayBuffer> | null> {
  const db = await openLibraryDb(library);
  const res = await db.execute({
    sql: `SELECT source FROM ref_document_files WHERE doc_id = ?`,
    args: [docId],
  });
  const source = res.rows[0]?.source;
  return source instanceof ArrayBuffer ? new Uint8Array(source) : null;
}

export async function docIdsWithSource(library: Library = "corpus"): Promise<Set<string>> {
  const db = await openLibraryDb(library);
  const res = await db.execute(`SELECT doc_id FROM ref_document_files`);
  return new Set(res.rows.map((row) => String(row.doc_id)));
}
