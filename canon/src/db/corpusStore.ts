import type { InValue } from "@libsql/client";
import { ensureCorpusSchema, getCorpusDb } from "./libsql";

export type SourceFormat = "pdf" | "html";

export interface RefDocument {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourcePath: string;
  sourceUrl: string | null;
  sha256: string;
  totalPages: number;
  totalChars: number;
  canonicalTextPath: string;
  /** "html" documents have no pages: everything is page 1, cited by section. */
  format: SourceFormat;
  published: string | null;
}

export interface RefPage {
  docId: string;
  pageNum: number;
  charStart: number;
  charEnd: number;
}

export interface RefSection {
  sectionId: string;
  docId: string;
  heading: string;
  headingSlug: string;
  parentSectionId: string | null;
  ordinal: number;
  firstPage: number;
  charStart: number;
  charEnd: number;
}

export type RefBlockType =
  "paragraph" | "heading" | "list_item" | "table" | "table_row" | "callout";

export interface RefBlock {
  blockId: string;
  docId: string;
  sectionId: string | null;
  pageNum: number;
  blockType: RefBlockType;
  ordinal: number;
  text: string;
  charStart: number;
  charEnd: number;
  metadata?: Record<string, unknown>;
  contextualSummary?: string | null;
  contextualizedText?: string | null;
  blockTextSha1?: string | null;
  embedding?: number[] | null;
}

export const asStr = (value: unknown): string => (value == null ? "" : String(value));
export const asStrOrNull = (value: unknown): string | null =>
  value == null ? null : String(value);
export const asNum = (value: unknown): number => (value == null ? 0 : Number(value));
export const asNumOrNull = (value: unknown): number | null =>
  value == null ? null : Number(value);

// vector32() needs the "[1,2,3]" string form; a JS array silently fails.
export function vectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

interface BatchStmt {
  sql: string;
  args: InValue[];
}

async function batchChunked<T>(
  rows: T[],
  chunkSize: number,
  toStmts: (row: T) => BatchStmt[],
): Promise<void> {
  const db = getCorpusDb();
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.batch(rows.slice(i, i + chunkSize).flatMap(toStmts), "write");
  }
}

export async function getDocument(docId: string): Promise<RefDocument | null> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT doc_id, title, publisher, tax_year, source_path, source_url,
                 sha256, total_pages, total_chars, canonical_text_path, format, published
          FROM ref_documents WHERE doc_id = ? LIMIT 1`,
    args: [docId],
  });
  const row = res.rows[0];
  if (!row) return null;
  return {
    docId: asStr(row.doc_id),
    title: asStr(row.title),
    publisher: asStr(row.publisher),
    taxYear: asNumOrNull(row.tax_year),
    sourcePath: asStr(row.source_path),
    sourceUrl: asStrOrNull(row.source_url),
    sha256: asStr(row.sha256),
    totalPages: asNum(row.total_pages),
    totalChars: asNum(row.total_chars),
    canonicalTextPath: asStr(row.canonical_text_path),
    format: asFormat(row.format),
    published: asStrOrNull(row.published),
  };
}

export async function setDocumentPublished(docId: string, published: string | null) {
  await ensureCorpusSchema();
  await getCorpusDb().execute({
    sql: `UPDATE ref_documents SET published = ? WHERE doc_id = ?`,
    args: [published, docId],
  });
}

export const asFormat = (value: unknown): SourceFormat => (value === "html" ? "html" : "pdf");

export async function deleteDocument(docId: string): Promise<void> {
  await ensureCorpusSchema();
  const db = getCorpusDb();
  // The FTS5 mirror has no FK, so the cascade does not reach it.
  await db.execute({ sql: `DELETE FROM ref_blocks_fts WHERE doc_id = ?`, args: [docId] });
  await db.execute({ sql: `DELETE FROM ref_documents WHERE doc_id = ?`, args: [docId] });
}

export async function setBlockEmbeddings(
  pairs: { blockId: string; embedding: number[] }[],
  opts: { embeddingModel?: string } = {},
): Promise<void> {
  if (pairs.length === 0) return;
  await ensureCorpusSchema();
  await batchChunked(pairs, 500, (pair) => [
    {
      sql: `UPDATE ref_blocks SET embedding = vector32(?) WHERE block_id = ?`,
      args: [vectorLiteral(pair.embedding), pair.blockId],
    },
  ]);
  if (opts.embeddingModel) {
    await setCorpusMeta("embedding_model", opts.embeddingModel);
  }
}

export interface IngestPayload {
  document: RefDocument;
  pages: RefPage[];
  sections: RefSection[];
  blocks: RefBlock[];
}

async function insertDocumentRow(doc: RefDocument): Promise<void> {
  await getCorpusDb().execute({
    sql: `INSERT INTO ref_documents
            (doc_id, title, publisher, tax_year, source_path, source_url,
             sha256, total_pages, total_chars, canonical_text_path, format, published)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      doc.docId,
      doc.title,
      doc.publisher,
      doc.taxYear,
      doc.sourcePath,
      doc.sourceUrl,
      doc.sha256,
      doc.totalPages,
      doc.totalChars,
      doc.canonicalTextPath,
      doc.format,
      doc.published,
    ],
  });
}

/* Not atomic across the tree. Call deleteDocument() first to replace a doc. */
export async function writeDocument(payload: IngestPayload): Promise<void> {
  await ensureCorpusSchema();
  const { document: doc, pages, sections, blocks } = payload;

  await insertDocumentRow(doc);

  await batchChunked(pages, 500, (page) => [
    {
      sql: `INSERT INTO ref_pages (doc_id, page_num, char_start, char_end)
            VALUES (?, ?, ?, ?)`,
      args: [page.docId, page.pageNum, page.charStart, page.charEnd],
    },
  ]);

  await batchChunked(sections, 500, (section) => [
    {
      sql: `INSERT INTO ref_sections
              (section_id, doc_id, heading, heading_slug, parent_section_id,
               ordinal, first_page, char_start, char_end)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        section.sectionId,
        section.docId,
        section.heading,
        section.headingSlug,
        section.parentSectionId,
        section.ordinal,
        section.firstPage,
        section.charStart,
        section.charEnd,
      ],
    },
  ]);

  await batchChunked(blocks, 200, blockInsertStmts);
}

function blockInsertStmts(block: RefBlock): BatchStmt[] {
  const hasEmbedding = !!(block.embedding && block.embedding.length > 0);
  const embExpr = hasEmbedding ? "vector32(?)" : "NULL";
  const blockArgs: InValue[] = [
    block.blockId,
    block.docId,
    block.sectionId,
    block.pageNum,
    block.blockType,
    block.ordinal,
    block.text,
    block.charStart,
    block.charEnd,
    block.metadata ? JSON.stringify(block.metadata) : null,
    block.contextualSummary ?? null,
    block.contextualizedText ?? null,
    block.blockTextSha1 ?? null,
  ];
  if (hasEmbedding) blockArgs.push(vectorLiteral(block.embedding!));
  return [
    {
      sql: `INSERT INTO ref_blocks
              (block_id, doc_id, section_id, page_num, block_type, ordinal,
               text, char_start, char_end, metadata_json, contextual_summary,
               contextualized_text, block_text_sha1, embedding)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${embExpr})`,
      args: blockArgs,
    },
    {
      sql: `INSERT INTO ref_blocks_fts (block_id, doc_id, content)
            VALUES (?, ?, ?)`,
      args: [block.blockId, block.docId, block.contextualizedText ?? block.text],
    },
  ];
}

export async function listDocuments(): Promise<{ docId: string; sha256: string }[]> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute(
    `SELECT doc_id, sha256 FROM ref_documents ORDER BY doc_id`,
  );
  return res.rows.map((row) => ({ docId: asStr(row.doc_id), sha256: asStr(row.sha256) }));
}

export async function tableCounts(): Promise<Record<string, number>> {
  await ensureCorpusSchema();
  const db = getCorpusDb();
  const tables = ["ref_documents", "ref_pages", "ref_sections", "ref_blocks"];
  const out: Record<string, number> = {};
  for (const table of tables) {
    const res = await db.execute(`SELECT count(*) AS n FROM ${table}`);
    out[table] = asNum(res.rows[0]?.n);
  }
  return out;
}

export async function countBlocksByDoc(
  docId: string,
): Promise<{ blocks: number; embedded: number }> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT count(*) AS blocks,
                 count(embedding) AS embedded
          FROM ref_blocks WHERE doc_id = ?`,
    args: [docId],
  });
  return {
    blocks: asNum(res.rows[0]?.blocks),
    embedded: asNum(res.rows[0]?.embedded),
  };
}

/** all=true lists every block, for a full re-embed after a model switch. */
export async function listBlocksWithoutEmbeddings(
  opts: { all?: boolean } = {},
): Promise<{ blockId: string; docId: string; contextualizedText: string | null; text: string }[]> {
  await ensureCorpusSchema();
  const where = opts.all ? "" : "WHERE embedding IS NULL ";
  const res = await getCorpusDb().execute(
    `SELECT block_id, doc_id, contextualized_text, text
     FROM ref_blocks ${where}ORDER BY block_id`,
  );
  return res.rows.map((row) => ({
    blockId: asStr(row.block_id),
    docId: asStr(row.doc_id),
    contextualizedText: asStrOrNull(row.contextualized_text),
    text: asStr(row.text),
  }));
}

async function getCorpusMeta(key: string): Promise<string | null> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT value FROM ref_meta WHERE key = ?`,
    args: [key],
  });
  return res.rows.length > 0 ? asStr(res.rows[0].value) : null;
}

async function setCorpusMeta(key: string, value: string): Promise<void> {
  await ensureCorpusSchema();
  await getCorpusDb().execute({
    sql: `INSERT INTO ref_meta (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [key, value],
  });
}

export async function storedEmbeddingModel(): Promise<string | null> {
  return getCorpusMeta("embedding_model");
}
