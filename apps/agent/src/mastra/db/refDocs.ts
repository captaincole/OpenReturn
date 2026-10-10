import type { InValue, Row } from "@libsql/client";
import { getCorpusDb, ensureCorpusSchema } from "./libsql";

/*
 * ---------------------------------------------------------------------------
 * Public types — consumed by src/mastra/tools/refDocs.ts and
 * src/refdocs/ingest.ts.
 * ---------------------------------------------------------------------------
 */

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

export interface SearchHit {
  blockId: string;
  docId: string;
  documentTitle: string;
  sectionId: string | null;
  sectionHeading: string | null;
  pageNum: number;
  blockType: RefBlockType;
  text: string;
  snippet: string;
  score: number;
  citation: string;
}

export interface BlockDetail {
  blockId: string;
  docId: string;
  documentTitle: string;
  publisher: string;
  taxYear: number | null;
  sectionId: string | null;
  sectionHeading: string | null;
  pageNum: number;
  blockType: RefBlockType;
  text: string;
  charStart: number;
  charEnd: number;
  citation: string;
}

/*
 * ---------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------
 */

function buildCitation(
  documentTitle: string,
  sectionHeading: string | null,
  pageNum: number,
): string {
  const parts = [documentTitle];
  if (sectionHeading && sectionHeading !== "(Preamble)") {
    parts.push(`§ ${sectionHeading}`);
  }
  parts.push(`p. ${pageNum}`);
  return parts.join(", ");
}

/*
 * libsql's vector32() parses the canonical "[1,2,3]" text form into an
 * F32_BLOB. We pass the JSON literal and let SQL convert it, both on
 * insert and inside the vector_distance_cos() query argument.
 */
function vectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/*
 * FTS5 MATCH has its own query grammar. It throws on bare operator
 * characters (-, ", *, :, etc). Queries arrive as free text, so we reduce
 * them to alphanumeric tokens, quote each token, and join them with OR
 * for recall. bm25 still ranks blocks that match more terms higher, and
 * the merged best-of-leg scoring decides final order. Returns null when
 * no searchable token survives, so the caller skips the FTS leg.
 */
function toFtsMatchQuery(raw: string): string | null {
  const terms = raw.toLowerCase().match(/[a-z0-9]+/g);
  if (!terms || terms.length === 0) return null;
  return terms.map((t) => `"${t}"`).join(" OR ");
}

/*
 * libsql cell readers. Row values are typed
 * string | number | bigint | ArrayBuffer | null.
 */
const asStr = (v: unknown): string => (v == null ? "" : String(v));
const asStrOrNull = (v: unknown): string | null => (v == null ? null : String(v));
const asNum = (v: unknown): number => (v == null ? 0 : Number(v));
const asNumOrNull = (v: unknown): number | null => (v == null ? null : Number(v));

/*
 * ---------------------------------------------------------------------------
 * Single-row lookups
 * ---------------------------------------------------------------------------
 */

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

export async function getBlock(blockId: string): Promise<BlockDetail | null> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT b.block_id, b.doc_id, b.section_id, b.page_num, b.block_type,
                 b.text, b.char_start, b.char_end,
                 d.title AS doc_title, d.publisher, d.tax_year,
                 s.heading AS section_heading
          FROM ref_blocks b
          JOIN ref_documents d ON d.doc_id = b.doc_id
          LEFT JOIN ref_sections s ON s.section_id = b.section_id
          WHERE b.block_id = ? LIMIT 1`,
    args: [blockId],
  });
  const d = res.rows[0];
  if (!d) return null;
  const documentTitle = asStr(d.doc_title) || "(unknown)";
  const sectionHeading = asStrOrNull(d.section_heading);
  const pageNum = asNum(d.page_num);
  return {
    blockId: asStr(d.block_id),
    docId: asStr(d.doc_id),
    documentTitle,
    publisher: asStr(d.publisher) || "(unknown)",
    taxYear: asNumOrNull(d.tax_year),
    sectionId: asStrOrNull(d.section_id),
    sectionHeading,
    pageNum,
    blockType: asStr(d.block_type) as RefBlockType,
    text: asStr(d.text),
    charStart: asNum(d.char_start),
    charEnd: asNum(d.char_end),
    citation: buildCitation(documentTitle, sectionHeading, pageNum),
  };
}

/*
 * ---------------------------------------------------------------------------
 * Hybrid retrieval — the TS port of the Postgres match_ref_blocks() RPC.
 * It runs the FTS5 leg and the native-vector leg separately, merges and
 * dedupes the hits in JS, then joins back for display columns. FTS-only
 * and vector-only paths use the same call with one input set to null.
 * ---------------------------------------------------------------------------
 */

interface MatchRow {
  block_id: string;
  doc_id: string;
  section_id: string | null;
  page_num: number;
  block_type: string;
  text: string;
  contextualized_text: string | null;
  doc_title: string;
  section_heading: string | null;
  fts_rank: number | null;
  vector_distance: number | null;
}

function rowToHit(row: MatchRow, score: number): SearchHit {
  return {
    blockId: row.block_id,
    docId: row.doc_id,
    documentTitle: row.doc_title,
    sectionId: row.section_id,
    sectionHeading: row.section_heading,
    pageNum: row.page_num,
    blockType: row.block_type as RefBlockType,
    text: row.text,
    snippet: row.text.slice(0, 200),
    score,
    citation: buildCitation(row.doc_title, row.section_heading, row.page_num),
  };
}

async function callMatch(args: {
  queryText: string | null;
  queryEmbedding: number[] | null;
  matchCount: number;
  filterDocId?: string;
}): Promise<MatchRow[]> {
  await ensureCorpusSchema();
  const db = getCorpusDb();
  const filterDocId: InValue = args.filterDocId ?? null;

  /*
   * fts_rank: higher is better. bm25 is lower-is-better, so the query
   * negates it to match the orientation the rest of the code assumes.
   */
  const ftsRank = new Map<string, number>();
  const vecDist = new Map<string, number>();

  // FTS leg
  const ftsQuery = args.queryText ? toFtsMatchQuery(args.queryText) : null;
  if (ftsQuery) {
    const res = await db.execute({
      sql: `SELECT block_id, -bm25(ref_blocks_fts) AS rank
            FROM ref_blocks_fts
            WHERE ref_blocks_fts MATCH ?
              AND (? IS NULL OR doc_id = ?)
            ORDER BY rank DESC
            LIMIT ?`,
      args: [ftsQuery, filterDocId, filterDocId, args.matchCount],
    });
    for (const r of res.rows) ftsRank.set(asStr(r.block_id), asNum(r.rank));
  }

  // Vector leg: exact brute-force cosine scan (no ANN index).
  if (args.queryEmbedding) {
    const res = await db.execute({
      sql: `SELECT block_id, vector_distance_cos(embedding, vector32(?)) AS distance
            FROM ref_blocks
            WHERE embedding IS NOT NULL
              AND (? IS NULL OR doc_id = ?)
            ORDER BY distance ASC
            LIMIT ?`,
      args: [vectorLiteral(args.queryEmbedding), filterDocId, filterDocId, args.matchCount],
    });
    for (const r of res.rows) vecDist.set(asStr(r.block_id), asNum(r.distance));
  }

  const blockIds = [...new Set([...ftsRank.keys(), ...vecDist.keys()])];
  if (blockIds.length === 0) return [];

  // Fetch display columns for the union of hits.
  const placeholders = blockIds.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT b.block_id, b.doc_id, b.section_id, b.page_num, b.block_type,
                 b.text, b.contextualized_text,
                 d.title AS doc_title, s.heading AS section_heading
          FROM ref_blocks b
          JOIN ref_documents d ON d.doc_id = b.doc_id
          LEFT JOIN ref_sections s ON s.section_id = b.section_id
          WHERE b.block_id IN (${placeholders})`,
    args: blockIds,
  });

  return res.rows.map((r: Row): MatchRow => {
    const id = asStr(r.block_id);
    return {
      block_id: id,
      doc_id: asStr(r.doc_id),
      section_id: asStrOrNull(r.section_id),
      page_num: asNum(r.page_num),
      block_type: asStr(r.block_type),
      text: asStr(r.text),
      contextualized_text: asStrOrNull(r.contextualized_text),
      doc_title: asStr(r.doc_title),
      section_heading: asStrOrNull(r.section_heading),
      fts_rank: ftsRank.has(id) ? ftsRank.get(id)! : null,
      vector_distance: vecDist.has(id) ? vecDist.get(id)! : null,
    };
  });
}

export interface SearchOpts {
  query: string;
  docId?: string;
  limit?: number;
}

/**
 * Legacy FTS-only search. It has no callers in the repo today; new code
 * uses hybridSearchRefDocs.
 */
export async function searchRefDocs(opts: SearchOpts): Promise<SearchHit[]> {
  const limit = Math.min(opts.limit ?? 5, 25);
  const rows = await callMatch({
    queryText: opts.query,
    queryEmbedding: null,
    matchCount: limit,
    filterDocId: opts.docId,
  });
  return (
    rows
      .filter((r) => r.fts_rank != null)
      /*
       * fts_rank: higher is better. Sort descending, then return the
       * negated value so the exposed score reads lower-is-better.
       */
      .sort((a, b) => (b.fts_rank ?? 0) - (a.fts_rank ?? 0))
      .slice(0, limit)
      .map((r) => rowToHit(r, -(r.fts_rank ?? 0)))
  );
}

export interface HybridSearchOpts {
  query: string;
  docId?: string;
  /** Top-K returned to the caller. Default 8. */
  limit?: number;
  /**
   * Candidate count pulled from each leg before the merge. More
   * candidates give more recall. Default 50.
   */
  candidatesPerLeg?: number;
  /**
   * Force a specific retrieval path. Default "hybrid", which degrades to
   * FTS when the local embedding model is unavailable or stale.
   */
  mode?: "fts" | "vector" | "hybrid";
}

/**
 * Hybrid retrieval: FTS top-N ∪ vector top-N → merged ordering → top-K.
 *
 * Falls back to keyword (FTS-only) retrieval when the vector leg cannot
 * run. Search always works; only semantic quality degrades:
 *   - Ollama down or model not pulled → FTS-only with a warning.
 *   - Stored vectors built by a different embedding model than the active
 *     one → FTS-only with a warning. Fix: `npm run corpus -- reembed --all`.
 */
export async function hybridSearchRefDocs(opts: HybridSearchOpts): Promise<SearchHit[]> {
  const limit = Math.min(opts.limit ?? 8, 25);
  const cands = Math.min(opts.candidatesPerLeg ?? 50, 100);

  const { resolveEmbeddings, embedQuery } = await import("../../refdocs/embeddings");
  const mode = opts.mode ?? "hybrid";

  /*
   * Embed the query only when the vector leg will run. Two guards: the
   * stored vectors must come from the active model (cross-model cosine
   * distances are meaningless), and the local embedding endpoint must
   * respond.
   */
  let queryEmbedding: number[] | null = null;
  if (mode === "vector" || mode === "hybrid") {
    try {
      const embedCfg = resolveEmbeddings();
      const stored = await storedEmbeddingModel();
      if (stored !== null && stored !== embedCfg.id) {
        console.warn(
          `[hybridSearchRefDocs] corpus embeddings were built with ${stored} ` +
            `but the active model is ${embedCfg.id} — skipping the vector ` +
            `leg (FTS-only). Run \`npm run corpus -- reembed --all\` to rebuild.`,
        );
      } else {
        queryEmbedding = await embedQuery(embedCfg, opts.query);
      }
    } catch (err) {
      console.warn(
        `[hybridSearchRefDocs] vector leg unavailable, falling back to ` +
          `keyword search: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (queryEmbedding == null && mode === "vector") return [];
  }

  const rows = await callMatch({
    queryText: mode === "vector" ? null : opts.query,
    queryEmbedding: mode === "fts" ? null : queryEmbedding,
    matchCount: cands,
    filterDocId: opts.docId,
  });
  if (rows.length === 0) return [];

  /*
   * Merged ordering: blocks that hit both legs come first, then the best
   * single-leg signal. We do not normalize bm25 against cosine;
   * both-legs agreement is the strongest cheap relevance signal. The
   * retired Voyage pipeline reranked here with rerank-2.5. A local
   * cross-encoder is the future option if ordering quality becomes the
   * bottleneck.
   */
  const scored = rows
    .map((r) => {
      const ftsScore = r.fts_rank ?? 0;
      const vecScore = r.vector_distance != null ? 1 / (1 + r.vector_distance) : 0;
      const bothLegs = r.fts_rank != null && r.vector_distance != null ? 1 : 0;
      return { row: r, score: bothLegs + Math.max(ftsScore, vecScore) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ row, score }) => rowToHit(row, score));
}

/*
 * ---------------------------------------------------------------------------
 * Mutations — used by the ingest pipeline.
 * ---------------------------------------------------------------------------
 */

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
  const db = getCorpusDb();
  /*
   * Batched UPDATEs inside a transaction. The DB is a local file with no
   * network round-trip, so the concurrent-worker pool from the Postgres
   * version is not needed.
   */
  const CHUNK = 500;
  for (let i = 0; i < pairs.length; i += CHUNK) {
    const slice = pairs.slice(i, i + CHUNK);
    await db.batch(
      slice.map((p) => ({
        sql: `UPDATE ref_blocks SET embedding = vector32(?) WHERE block_id = ?`,
        args: [vectorLiteral(p.embedding), p.blockId] as InValue[],
      })),
      "write",
    );
  }
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
  const db = getCorpusDb();

  // 1) document
  await db.execute({
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

  // 2) pages
  const PAGE_CHUNK = 500;
  for (let i = 0; i < pages.length; i += PAGE_CHUNK) {
    const slice = pages.slice(i, i + PAGE_CHUNK);
    await db.batch(
      slice.map((p) => ({
        sql: `INSERT INTO ref_pages (doc_id, page_num, char_start, char_end)
              VALUES (?, ?, ?, ?)`,
        args: [p.docId, p.pageNum, p.charStart, p.charEnd] as InValue[],
      })),
      "write",
    );
  }

  // 3) sections
  const SECTION_CHUNK = 500;
  for (let i = 0; i < sections.length; i += SECTION_CHUNK) {
    const slice = sections.slice(i, i + SECTION_CHUNK);
    await db.batch(
      slice.map((s) => ({
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
        ] as InValue[],
      })),
      "write",
    );
  }

  /*
   * 4) blocks plus their FTS5 mirror rows. An embedding goes through
   *    vector32() when present, else NULL (pre-embed ingest; the embed
   *    step UPDATEs it later).
   */
  const BLOCK_CHUNK = 200;
  for (let i = 0; i < blocks.length; i += BLOCK_CHUNK) {
    const slice = blocks.slice(i, i + BLOCK_CHUNK);
    const stmts = slice.flatMap((b) => {
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
          args: [b.blockId, b.docId, b.contextualizedText ?? b.text] as InValue[],
        },
      ];
    });
    await db.batch(stmts, "write");
  }
}

/*
 * ---------------------------------------------------------------------------
 * Corpus inspection helpers — used by the corpus CLI subcommands
 * (scripts/corpus/) so they do not reach past this module into the DB
 * client directly.
 * ---------------------------------------------------------------------------
 */

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

/*
 * ---------------------------------------------------------------------------
 * Corpus metadata (ref_meta) — which embedding model built the stored vectors.
 * ---------------------------------------------------------------------------
 */

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
