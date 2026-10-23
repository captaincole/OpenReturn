import { asFormat, asNum, asNumOrNull, asStr, asStrOrNull, type SourceFormat } from "./corpusStore";
import { ensureCorpusSchema, getCorpusDb } from "./libsql";

/*
 * The reference library: every document in corpus.db, for the web app's
 * Reference Library page, federal (IRS) first, and one HTML document's
 * headings for the library's document page. Read-only; the corpus CLI
 * owns the writes.
 */

export interface LibraryDocument {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  format: SourceFormat;
  /** When the publisher issued it ("YYYY-MM[-DD]"); null when unknown. */
  published: string | null;
  totalPages: number;
  blockCount: number;
}

export async function listLibrary(): Promise<LibraryDocument[]> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute(
    `SELECT d.doc_id, d.title, d.publisher, d.tax_year, d.source_url, d.total_pages,
            d.format, d.published,
            (SELECT count(*) FROM ref_blocks b WHERE b.doc_id = d.doc_id) AS block_count
     FROM ref_documents d
     ORDER BY d.publisher = 'IRS' DESC, d.publisher, d.title`,
  );
  return res.rows.map((r) => ({
    docId: asStr(r.doc_id),
    title: asStr(r.title),
    publisher: asStr(r.publisher),
    taxYear: asNumOrNull(r.tax_year),
    sourceUrl: asStrOrNull(r.source_url),
    format: asFormat(r.format),
    published: asStrOrNull(r.published),
    totalPages: asNum(r.total_pages),
    blockCount: asNum(r.block_count),
  }));
}

/** A heading in an HTML document; anchor is the heading's id in the HTML. */
export interface LibrarySection {
  anchor: string;
  heading: string;
  /** Anchor of the enclosing heading, or null for a top-level one. */
  parent: string | null;
}

/* The headings of one document, in order, for the library page's contents rail. */
export async function listSections(docId: string): Promise<LibrarySection[]> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT s.heading_slug, s.heading, p.heading_slug AS parent_slug
          FROM ref_sections s LEFT JOIN ref_sections p ON p.section_id = s.parent_section_id
          WHERE s.doc_id = ? AND s.heading_slug != 'preamble'
          ORDER BY s.ordinal`,
    args: [docId],
  });
  return res.rows.map((r) => ({
    anchor: asStr(r.heading_slug),
    heading: asStr(r.heading),
    parent: asStrOrNull(r.parent_slug),
  }));
}
