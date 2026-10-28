import type { InValue, Row } from "@libsql/client";
import {
  asFormat,
  asNum,
  asNumOrNull,
  asStr,
  asStrOrNull,
  storedEmbeddingModel,
  vectorLiteral,
  type RefBlockType,
  type SourceFormat,
} from "./corpusStore";
import { ensureCorpusSchema, getCorpusDb } from "./libsql";

export interface SearchHit {
  blockId: string;
  docId: string;
  documentTitle: string;
  format: SourceFormat;
  published: string | null;
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
  format: SourceFormat;
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

function buildCitation(
  documentTitle: string,
  sectionHeading: string | null,
  pageNum: number,
  format: SourceFormat,
): string {
  const parts = [documentTitle];
  if (sectionHeading && sectionHeading !== "(Preamble)") {
    parts.push(`§ ${sectionHeading}`);
  }
  if (format === "pdf") parts.push(`p. ${pageNum}`);
  return parts.join(", ");
}

/*
 * FTS5 MATCH throws on bare operator characters (-, ", *, :), so free text
 * becomes quoted alphanumeric tokens joined with OR for recall.
 */
function toFtsMatchQuery(raw: string): string | null {
  const terms = raw.toLowerCase().match(/[a-z0-9]+/g);
  if (!terms || terms.length === 0) return null;
  return terms.map((t) => `"${t}"`).join(" OR ");
}

export async function getBlock(blockId: string): Promise<BlockDetail | null> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT b.block_id, b.doc_id, b.section_id, b.page_num, b.block_type,
                 b.text, b.char_start, b.char_end,
                 d.title AS doc_title, d.publisher, d.tax_year,
                 s.heading AS section_heading, d.format
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
  const format = asFormat(d.format);
  return {
    blockId: asStr(d.block_id),
    docId: asStr(d.doc_id),
    documentTitle,
    format,
    publisher: asStr(d.publisher) || "(unknown)",
    taxYear: asNumOrNull(d.tax_year),
    sectionId: asStrOrNull(d.section_id),
    sectionHeading,
    pageNum,
    blockType: asStr(d.block_type) as RefBlockType,
    text: asStr(d.text),
    charStart: asNum(d.char_start),
    charEnd: asNum(d.char_end),
    citation: buildCitation(documentTitle, sectionHeading, pageNum, format),
  };
}

export interface MatchRow {
  block_id: string;
  doc_id: string;
  section_id: string | null;
  page_num: number;
  block_type: string;
  text: string;
  contextualized_text: string | null;
  doc_title: string;
  section_heading: string | null;
  format: SourceFormat;
  published: string | null;
  fts_rank: number | null;
  vector_distance: number | null;
}

function rowToHit(row: MatchRow, score: number): SearchHit {
  return {
    blockId: row.block_id,
    docId: row.doc_id,
    documentTitle: row.doc_title,
    format: row.format,
    published: row.published,
    sectionId: row.section_id,
    sectionHeading: row.section_heading,
    pageNum: row.page_num,
    blockType: row.block_type as RefBlockType,
    text: row.text,
    snippet: row.text.slice(0, 200),
    score,
    citation: buildCitation(row.doc_title, row.section_heading, row.page_num, row.format),
  };
}

// bm25 is lower-is-better; the query negates it so fts_rank is higher-is-better.
async function ftsLeg(
  queryText: string,
  filterDocId: InValue,
  matchCount: number,
): Promise<Map<string, number>> {
  const ranks = new Map<string, number>();
  const ftsQuery = toFtsMatchQuery(queryText);
  if (!ftsQuery) return ranks;
  const res = await getCorpusDb().execute({
    sql: `SELECT block_id, -bm25(ref_blocks_fts) AS rank
          FROM ref_blocks_fts
          WHERE ref_blocks_fts MATCH ?
            AND (? IS NULL OR doc_id = ?)
          ORDER BY rank DESC
          LIMIT ?`,
    args: [ftsQuery, filterDocId, filterDocId, matchCount],
  });
  for (const r of res.rows) ranks.set(asStr(r.block_id), asNum(r.rank));
  return ranks;
}

// Exact brute-force scan on purpose: fast enough at low-thousands of blocks.
async function vectorLeg(
  queryEmbedding: number[],
  filterDocId: InValue,
  matchCount: number,
): Promise<Map<string, number>> {
  const distances = new Map<string, number>();
  const res = await getCorpusDb().execute({
    sql: `SELECT block_id, vector_distance_cos(embedding, vector32(?)) AS distance
          FROM ref_blocks
          WHERE embedding IS NOT NULL
            AND (? IS NULL OR doc_id = ?)
          ORDER BY distance ASC
          LIMIT ?`,
    args: [vectorLiteral(queryEmbedding), filterDocId, filterDocId, matchCount],
  });
  for (const r of res.rows) distances.set(asStr(r.block_id), asNum(r.distance));
  return distances;
}

async function callMatch(args: {
  queryText: string | null;
  queryEmbedding: number[] | null;
  matchCount: number;
  filterDocId?: string;
}): Promise<MatchRow[]> {
  await ensureCorpusSchema();
  const filterDocId: InValue = args.filterDocId ?? null;

  const ftsRank = args.queryText
    ? await ftsLeg(args.queryText, filterDocId, args.matchCount)
    : new Map<string, number>();
  const vecDist = args.queryEmbedding
    ? await vectorLeg(args.queryEmbedding, filterDocId, args.matchCount)
    : new Map<string, number>();

  const blockIds = [...new Set([...ftsRank.keys(), ...vecDist.keys()])];
  if (blockIds.length === 0) return [];

  const placeholders = blockIds.map(() => "?").join(",");
  const res = await getCorpusDb().execute({
    sql: `SELECT b.block_id, b.doc_id, b.section_id, b.page_num, b.block_type,
                 b.text, b.contextualized_text,
                 d.title AS doc_title, s.heading AS section_heading, d.format, d.published
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
      format: asFormat(r.format),
      published: asStrOrNull(r.published),
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

/** FTS-only. New code uses hybridSearchRefDocs. */
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
      // The exposed score is negated back to lower-is-better.
      .sort((a, b) => (b.fts_rank ?? 0) - (a.fts_rank ?? 0))
      .slice(0, limit)
      .map((r) => rowToHit(r, -(r.fts_rank ?? 0)))
  );
}

export interface HybridSearchOpts {
  query: string;
  docId?: string;
  limit?: number;
  candidatesPerLeg?: number;
  mode?: "fts" | "vector" | "hybrid";
}

/*
 * Falls back to FTS-only when the vector leg cannot run (Ollama down, or
 * stored vectors from another model), so search always works.
 */
export async function hybridSearchRefDocs(opts: HybridSearchOpts): Promise<SearchHit[]> {
  const limit = Math.min(opts.limit ?? 8, 25);
  const cands = Math.min(opts.candidatesPerLeg ?? 50, 100);

  const mode = opts.mode ?? "hybrid";
  const queryEmbedding =
    mode === "vector" || mode === "hybrid" ? await embedQueryIfUsable(opts.query) : null;
  if (queryEmbedding == null && mode === "vector") return [];

  const rows = await callMatch({
    queryText: mode === "vector" ? null : opts.query,
    queryEmbedding: mode === "fts" ? null : queryEmbedding,
    matchCount: cands,
    filterDocId: opts.docId,
  });
  if (rows.length === 0) return [];

  return fuseByRank(rows)
    .slice(0, limit)
    .map(({ row, score }) => rowToHit(row, score));
}

const RRF_K = 60;

/*
 * Fuse by rank, never by raw score: bm25 runs ~10-30 and cosine is at most 1,
 * so a max() of raw scores let any keyword hit outrank every vector-only hit.
 */
export function fuseByRank(rows: MatchRow[]): { row: MatchRow; score: number }[] {
  const ranks = (value: (r: MatchRow) => number | null, higherIsBetter: boolean) => {
    const ranked = rows
      .filter((r) => value(r) != null)
      .sort((a, b) => (higherIsBetter ? value(b)! - value(a)! : value(a)! - value(b)!));
    return new Map(ranked.map((r, i) => [r.block_id, i + 1]));
  };
  const ftsRanks = ranks((r) => r.fts_rank, true);
  const vectorRanks = ranks((r) => r.vector_distance, false);
  const rrf = (rank: number | undefined) => (rank === undefined ? 0 : 1 / (RRF_K + rank));
  return rows
    .map((row) => ({
      row,
      score: rrf(ftsRanks.get(row.block_id)) + rrf(vectorRanks.get(row.block_id)),
    }))
    .sort((a, b) => b.score - a.score);
}

// Cross-model cosine distances are meaningless, so a model mismatch skips the vector leg.
async function embedQueryIfUsable(query: string): Promise<number[] | null> {
  const { resolveEmbeddings, embedQuery } = await import("../refdocs/embeddings");
  try {
    const embedCfg = resolveEmbeddings();
    const stored = await storedEmbeddingModel();
    if (stored !== null && stored !== embedCfg.id) {
      console.warn(
        `[hybridSearchRefDocs] corpus embeddings were built with ${stored} ` +
          `but the active model is ${embedCfg.id} — skipping the vector ` +
          `leg (FTS-only). Run \`npm run corpus -- reembed --all\` to rebuild.`,
      );
      return null;
    }
    return await embedQuery(embedCfg, query);
  } catch (err) {
    console.warn(
      `[hybridSearchRefDocs] vector leg unavailable, falling back to ` +
        `keyword search: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}
