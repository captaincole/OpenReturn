import type { InValue } from "@libsql/client";
import { ensureCorpusSchema, getCorpusDb } from "./libsql";

/*
 * Corpus write + inspection side: document-tree ingest, embeddings,
 * ref_meta, and the read-only helpers the corpus CLI subcommands
 * (scripts/corpus/) use so they do not reach past this module into the
 * DB client directly. The runtime retrieval path lives in
 * corpusSearch.ts; it shares this module's types and low-level helpers.
 */

// ─── Corpus row types — consumed by src/refdocs/ (ingest pipeline) ───────

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

// ─── Low-level helpers (shared with corpusSearch.ts) ─────────────────────

/*
 * libsql cell readers. Row values are typed
 * string | number | bigint | ArrayBuffer | null.
 */
export const asStr = (v: unknown): string => (v == null ? "" : String(v));
export const asStrOrNull = (v: unknown): string | null => (v == null ? null : String(v));
export const asNum = (v: unknown): number => (v == null ? 0 : Number(v));
export const asNumOrNull = (v: unknown): number | null => (v == null ? null : Number(v));

/*
 * libsql's vector32() parses the canonical "[1,2,3]" text form into an
 * F32_BLOB. We pass the JSON literal and let SQL convert it, both on
 * insert and inside the vector_distance_cos() query argument.
 */
export function vectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

interface BatchStmt {
  sql: string;
  args: InValue[];
}

/*
 * Chunked db.batch writes inside a transaction per chunk. The DB is a
 * local file with no network round-trip, so the concurrent-worker pool
 * from the Postgres version is not needed.
 */
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

// ─── Single-row lookups ──────────────────────────────────────────────────

export async function getDocument(docId: string): Promise<RefDocument | null> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT doc_id, title, publisher, tax_year, source_path, source_url,
                 sha256, total_pages, total_chars, canonical_text_path
          FROM ref_documents WHERE doc_id = ? LIMIT 1`,
    args: [docId],
  });
  const d = res.rows[0];
  if (!d) return null;
  return {
    docId: asStr(d.doc_id),
    title: asStr(d.title),
    publisher: asStr(d.publisher),
    taxYear: asNumOrNull(d.tax_year),
    sourcePath: asStr(d.source_path),
    sourceUrl: asStrOrNull(d.source_url),
    sha256: asStr(d.sha256),
    totalPages: asNum(d.total_pages),
    totalChars: asNum(d.total_chars),
    canonicalTextPath: asStr(d.canonical_text_path),
  };
}

// ─── Mutations — used by the ingest pipeline ─────────────────────────────

export async function deleteDocument(docId: string): Promise<void> {
  await ensureCorpusSchema();
  const db = getCorpusDb();
  /*
   * FK ON DELETE CASCADE clears ref_pages/sections/blocks. The FTS5
   * mirror has no FK relation, so delete its rows explicitly first.
   */
  await db.execute({ sql: `DELETE FROM ref_blocks_fts WHERE doc_id = ?`, args: [docId] });
  await db.execute({ sql: `DELETE FROM ref_documents WHERE doc_id = ?`, args: [docId] });
}

export async function setBlockEmbeddings(
  pairs: { blockId: string; embedding: number[] }[],
  opts: { embeddingModel?: string } = {},
): Promise<void> {
  if (pairs.length === 0) return;
  await ensureCorpusSchema();
  await batchChunked(pairs, 500, (p) => [
    {
      sql: `UPDATE ref_blocks SET embedding = vector32(?) WHERE block_id = ?`,
      args: [vectorLiteral(p.embedding), p.blockId],
    },
  ]);
  /*
   * Stamp the model that produced these vectors. The search path uses it
   * to detect a model switch (see storedEmbeddingModel and
   * hybridSearchRefDocs).
   */
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

/**
 * Writes a full document tree. The write is not atomic across the tree.
 * Call deleteDocument() first to replace a doc. Re-run on partial
 * failure; the FK cascade cleans up orphans on the next delete.
 */
export async function writeDocument(payload: IngestPayload): Promise<void> {
  await ensureCorpusSchema();
  const { document: d, pages, sections, blocks } = payload;

  await getCorpusDb().execute({
    sql: `INSERT INTO ref_documents
            (doc_id, title, publisher, tax_year, source_path, source_url,
             sha256, total_pages, total_chars, canonical_text_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      d.docId,
      d.title,
      d.publisher,
      d.taxYear,
      d.sourcePath,
      d.sourceUrl,
      d.sha256,
      d.totalPages,
      d.totalChars,
      d.canonicalTextPath,
    ],
  });

  await batchChunked(pages, 500, (p) => [
    {
      sql: `INSERT INTO ref_pages (doc_id, page_num, char_start, char_end)
            VALUES (?, ?, ?, ?)`,
      args: [p.docId, p.pageNum, p.charStart, p.charEnd],
    },
  ]);

  await batchChunked(sections, 500, (s) => [
    {
      sql: `INSERT INTO ref_sections
              (section_id, doc_id, heading, heading_slug, parent_section_id,
               ordinal, first_page, char_start, char_end)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        s.sectionId,
        s.docId,
        s.heading,
        s.headingSlug,
        s.parentSectionId,
        s.ordinal,
        s.firstPage,
        s.charStart,
        s.charEnd,
      ],
    },
  ]);

  await batchChunked(blocks, 200, blockInsertStmts);
}

/*
 * One block insert plus its FTS5 mirror row. An embedding goes through
 * vector32() when present, else NULL (pre-embed ingest; the embed step
 * UPDATEs it later).
 */
function blockInsertStmts(b: RefBlock): BatchStmt[] {
  const hasEmbedding = !!(b.embedding && b.embedding.length > 0);
  const embExpr = hasEmbedding ? "vector32(?)" : "NULL";
  const blockArgs: InValue[] = [
    b.blockId,
    b.docId,
    b.sectionId,
    b.pageNum,
    b.blockType,
    b.ordinal,
    b.text,
    b.charStart,
    b.charEnd,
    b.metadata ? JSON.stringify(b.metadata) : null,
    b.contextualSummary ?? null,
    b.contextualizedText ?? null,
    b.blockTextSha1 ?? null,
  ];
  if (hasEmbedding) blockArgs.push(vectorLiteral(b.embedding!));
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
      args: [b.blockId, b.docId, b.contextualizedText ?? b.text],
    },
  ];
}

// ─── Corpus inspection — used by the corpus CLI subcommands ──────────────

/** All ingested docs (doc_id + sha256). For `corpus status` drift detection and `corpus check`. */
export async function listDocuments(): Promise<{ docId: string; sha256: string }[]> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute(
    `SELECT doc_id, sha256 FROM ref_documents ORDER BY doc_id`,
  );
  return res.rows.map((r) => ({ docId: asStr(r.doc_id), sha256: asStr(r.sha256) }));
}

/** Row counts per corpus table. For `corpus check`. */
export async function tableCounts(): Promise<Record<string, number>> {
  await ensureCorpusSchema();
  const db = getCorpusDb();
  const tables = ["ref_documents", "ref_pages", "ref_sections", "ref_blocks"];
  const out: Record<string, number> = {};
  for (const t of tables) {
    const res = await db.execute(`SELECT count(*) AS n FROM ${t}`);
    out[t] = asNum(res.rows[0]?.n);
  }
  return out;
}

/** Block + embedded-block counts for one doc. For `corpus check`. */
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

/**
 * Blocks with no embedding yet; the recovery input for `corpus reembed`.
 * Pass all=true to list every block, for a full re-embed after an
 * embedding-model switch.
 */
export async function listBlocksWithoutEmbeddings(
  opts: { all?: boolean } = {},
): Promise<{ blockId: string; docId: string; contextualizedText: string | null; text: string }[]> {
  await ensureCorpusSchema();
  const where = opts.all ? "" : "WHERE embedding IS NULL ";
  const res = await getCorpusDb().execute(
    `SELECT block_id, doc_id, contextualized_text, text
     FROM ref_blocks ${where}ORDER BY block_id`,
  );
  return res.rows.map((r) => ({
    blockId: asStr(r.block_id),
    docId: asStr(r.doc_id),
    contextualizedText: asStrOrNull(r.contextualized_text),
    text: asStr(r.text),
  }));
}

// ─── Corpus metadata (ref_meta) ──────────────────────────────────────────

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

/**
 * The embedding-model id that built the stored vectors. Null means no
 * embed by current code has run; every writer stamps the id on embed.
 */
export async function storedEmbeddingModel(): Promise<string | null> {
  return getCorpusMeta("embedding_model");
}
