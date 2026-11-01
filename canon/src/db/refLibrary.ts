import { asFormat, asNum, asNumOrNull, asStr, asStrOrNull, type SourceFormat } from "./corpusStore";
import { ensureCorpusSchema, getCorpusDb } from "./libsql";

export interface LibraryDocument {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  format: SourceFormat;
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
  return res.rows.map((row) => ({
    docId: asStr(row.doc_id),
    title: asStr(row.title),
    publisher: asStr(row.publisher),
    taxYear: asNumOrNull(row.tax_year),
    sourceUrl: asStrOrNull(row.source_url),
    format: asFormat(row.format),
    published: asStrOrNull(row.published),
    totalPages: asNum(row.total_pages),
    blockCount: asNum(row.block_count),
  }));
}

export interface LibrarySection {
  anchor: string;
  heading: string;
  parent: string | null;
}

export async function listSections(docId: string): Promise<LibrarySection[]> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT s.heading_slug, s.heading, p.heading_slug AS parent_slug
          FROM ref_sections s LEFT JOIN ref_sections p ON p.section_id = s.parent_section_id
          WHERE s.doc_id = ? AND s.heading_slug != 'preamble'
          ORDER BY s.ordinal`,
    args: [docId],
  });
  return res.rows.map((row) => ({
    anchor: asStr(row.heading_slug),
    heading: asStr(row.heading),
    parent: asStrOrNull(row.parent_slug),
  }));
}
