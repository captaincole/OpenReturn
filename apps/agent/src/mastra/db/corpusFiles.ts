import type { SourceFormat } from "../../refdocs/walkCorpus";
import { ensureCorpusSchema, getCorpusDb } from "./libsql";

/*
 * Each document's source file, stored in corpus.db so the published file
 * is the whole library: PDFs in ref_document_files, cleaned HTML pages in
 * ref_document_html. Written by the ingest pipeline and by `corpus sync`
 * (for a current document whose file is not stored yet); read by the
 * reference library's routes and by fetchSource.
 */

export async function setDocumentSource(
  docId: string,
  format: SourceFormat,
  bytes: Uint8Array,
): Promise<void> {
  await ensureCorpusSchema();
  const db = getCorpusDb();
  // A document that changed format keeps one stored source.
  await db.execute({
    sql: `DELETE FROM ${format === "html" ? "ref_document_files" : "ref_document_html"} WHERE doc_id = ?`,
    args: [docId],
  });
  await db.execute(
    format === "html"
      ? {
          sql: `INSERT INTO ref_document_html (doc_id, html) VALUES (?, ?)
                ON CONFLICT(doc_id) DO UPDATE SET html = excluded.html`,
          args: [docId, new TextDecoder().decode(bytes)],
        }
      : {
          sql: `INSERT INTO ref_document_files (doc_id, pdf) VALUES (?, ?)
                ON CONFLICT(doc_id) DO UPDATE SET pdf = excluded.pdf`,
          args: [docId, bytes],
        },
  );
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

export async function getDocumentHtml(docId: string): Promise<string | null> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT html FROM ref_document_html WHERE doc_id = ?`,
    args: [docId],
  });
  const html = res.rows[0]?.html;
  return typeof html === "string" ? html : null;
}

/** The stored source file as bytes (HTML as UTF-8), or null. */
export async function getDocumentSource(
  docId: string,
  format: SourceFormat,
): Promise<Uint8Array | null> {
  if (format === "pdf") return getDocumentPdf(docId);
  const html = await getDocumentHtml(docId);
  return html === null ? null : new TextEncoder().encode(html);
}

/** docIds that have a stored source file, either format. */
export async function docIdsWithSource(): Promise<Set<string>> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute(
    `SELECT doc_id FROM ref_document_files UNION SELECT doc_id FROM ref_document_html`,
  );
  return new Set(res.rows.map((r) => String(r.doc_id)));
}
