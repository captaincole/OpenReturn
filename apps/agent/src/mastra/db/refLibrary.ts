import type { SourceFormat } from "../../refdocs/walkCorpus";
import { asNum, asNumOrNull, asStr, asStrOrNull } from "./corpusStore";
import { ensureCorpusSchema, getCorpusDb } from "./libsql";

/*
 * The reference library: every document in corpus.db, for the web app's
 * Reference Library page, federal (IRS) first. Read-only; the corpus CLI
 * owns the writes.
 */

export interface LibraryDocument {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  format: SourceFormat;
  totalPages: number;
  blockCount: number;
}

export async function listLibrary(): Promise<LibraryDocument[]> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute(
    `SELECT d.doc_id, d.title, d.publisher, d.tax_year, d.source_url, d.total_pages,
            (SELECT count(*) FROM ref_blocks b WHERE b.doc_id = d.doc_id) AS block_count,
            EXISTS (SELECT 1 FROM ref_document_html h WHERE h.doc_id = d.doc_id) AS is_html
     FROM ref_documents d
     ORDER BY d.publisher = 'IRS' DESC, d.publisher, d.title`,
  );
  return res.rows.map((r) => ({
    docId: asStr(r.doc_id),
    title: asStr(r.title),
    publisher: asStr(r.publisher),
    taxYear: asNumOrNull(r.tax_year),
    sourceUrl: asStrOrNull(r.source_url),
    format: Number(r.is_html) === 1 ? "html" : "pdf",
    totalPages: asNum(r.total_pages),
    blockCount: asNum(r.block_count),
  }));
}
