import type { InValue, Row } from "@libsql/client";
import { parseJurisdictions, publisherFilter, type Jurisdiction } from "../jurisdiction";
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
import { isLawLibrary, jurisdictionOfLibrary, openLibraryDb, type Library } from "./libsql";

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
  return terms.map((term) => `"${term}"`).join(" OR ");
}

export async function getBlock(
  blockId: string,
  library: Library = "corpus",
): Promise<BlockDetail | null> {
  const db = await openLibraryDb(library);
  const res = await db.execute({
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
  const row = res.rows[0];
  if (!row) return null;
  const documentTitle = asStr(row.doc_title) || "(unknown)";
  const sectionHeading = asStrOrNull(row.section_heading);
  const pageNum = asNum(row.page_num);
  const format = asFormat(row.format);
  return {
    blockId: asStr(row.block_id),
    docId: asStr(row.doc_id),
    documentTitle,
    format,
    publisher: asStr(row.publisher) || "(unknown)",
    taxYear: asNumOrNull(row.tax_year),
    sectionId: asStrOrNull(row.section_id),
    sectionHeading,
    pageNum,
    blockType: asStr(row.block_type) as RefBlockType,
    text: asStr(row.text),
    charStart: asNum(row.char_start),
    charEnd: asNum(row.char_end),
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

/*
 * Each leg's filters; a null one is off. Each leg applies them before its
 * top-N, so a filtered search still gets a full list of the blocks it keeps.
 */
interface LegFilter {
  docId: InValue;
  /** Keeps blocks whose id starts with this: a law section's blocks start with its section id. */
  blockIdPrefix: InValue;
  /** Keeps blocks of these publishers' documents, as a JSON array (the jurisdictions on). */
  publishers: InValue;
}

const FILTER_SQL = `(? IS NULL OR doc_id = ?)
            AND (? IS NULL OR substr(block_id, 1, length(?)) = ?)
            AND (? IS NULL OR doc_id IN (SELECT doc_id FROM ref_documents
                   WHERE publisher IN (SELECT value FROM json_each(?))))`;
const filterArgs = (filter: LegFilter): InValue[] => [
  filter.docId,
  filter.docId,
  filter.blockIdPrefix,
  filter.blockIdPrefix,
  filter.blockIdPrefix,
  filter.publishers,
  filter.publishers,
];

function legFilter(args: {
  filterDocId?: string;
  blockIdPrefix?: string;
  jurisdictions?: readonly Jurisdiction[];
}): LegFilter {
  const publishers = publisherFilter(args.jurisdictions);
  return {
    docId: args.filterDocId ?? null,
    blockIdPrefix: args.blockIdPrefix ?? null,
    publishers: publishers === null ? null : JSON.stringify(publishers),
  };
}

// bm25 is lower-is-better; the query negates it so fts_rank is higher-is-better.
async function ftsLeg(
  library: Library,
  queryText: string,
  filter: LegFilter,
  matchCount: number,
): Promise<Map<string, number>> {
  const ranks = new Map<string, number>();
  const ftsQuery = toFtsMatchQuery(queryText);
  if (!ftsQuery) return ranks;
  const db = await openLibraryDb(library);
  const res = await db.execute({
    sql: `SELECT block_id, -bm25(ref_blocks_fts) AS rank
          FROM ref_blocks_fts
          WHERE ref_blocks_fts MATCH ?
            AND ${FILTER_SQL}
          ORDER BY rank DESC
          LIMIT ?`,
    args: [ftsQuery, ...filterArgs(filter), matchCount],
  });
  for (const row of res.rows) ranks.set(asStr(row.block_id), asNum(row.rank));
  return ranks;
}

// Exact brute-force scan on purpose: fast enough at low-thousands of blocks.
async function vectorLeg(
  library: Library,
  queryEmbedding: number[],
  filter: LegFilter,
  matchCount: number,
): Promise<Map<string, number>> {
  const distances = new Map<string, number>();
  const db = await openLibraryDb(library);
  const res = await db.execute({
    sql: `SELECT block_id, vector_distance_cos(embedding, vector32(?)) AS distance
          FROM ref_blocks
          WHERE embedding IS NOT NULL
            AND ${FILTER_SQL}
          ORDER BY distance ASC
          LIMIT ?`,
    args: [vectorLiteral(queryEmbedding), ...filterArgs(filter), matchCount],
  });
  for (const row of res.rows) distances.set(asStr(row.block_id), asNum(row.distance));
  return distances;
}

async function callMatch(args: {
  queryText: string | null;
  queryEmbedding: number[] | null;
  matchCount: number;
  filterDocId?: string;
  blockIdPrefix?: string;
  jurisdictions?: readonly Jurisdiction[];
  library: Library;
}): Promise<MatchRow[]> {
  const db = await openLibraryDb(args.library);
  const filter = legFilter(args);

  const ftsRank = args.queryText
    ? await ftsLeg(args.library, args.queryText, filter, args.matchCount)
    : new Map<string, number>();
  const vecDist = args.queryEmbedding
    ? await vectorLeg(args.library, args.queryEmbedding, filter, args.matchCount)
    : new Map<string, number>();

  const blockIds = [...new Set([...ftsRank.keys(), ...vecDist.keys()])];
  if (blockIds.length === 0) return [];

  const placeholders = blockIds.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT b.block_id, b.doc_id, b.section_id, b.page_num, b.block_type,
                 b.text, b.contextualized_text,
                 d.title AS doc_title, s.heading AS section_heading, d.format, d.published
          FROM ref_blocks b
          JOIN ref_documents d ON d.doc_id = b.doc_id
          LEFT JOIN ref_sections s ON s.section_id = b.section_id
          WHERE b.block_id IN (${placeholders})`,
    args: blockIds,
  });

  return res.rows.map((row: Row): MatchRow => {
    const id = asStr(row.block_id);
    return {
      block_id: id,
      doc_id: asStr(row.doc_id),
      section_id: asStrOrNull(row.section_id),
      page_num: asNum(row.page_num),
      block_type: asStr(row.block_type),
      text: asStr(row.text),
      contextualized_text: asStrOrNull(row.contextualized_text),
      doc_title: asStr(row.doc_title),
      section_heading: asStrOrNull(row.section_heading),
      format: asFormat(row.format),
      published: asStrOrNull(row.published),
      fts_rank: ftsRank.has(id) ? ftsRank.get(id)! : null,
      vector_distance: vecDist.has(id) ? vecDist.get(id)! : null,
    };
  });
}

export interface SearchOpts {
  query: string;
  docId?: string;
  limit?: number;
  /** Which library file to search; "corpus" unless named. */
  library?: Library;
  /** Only these jurisdictions' documents; every jurisdiction when unset. */
  jurisdictions?: readonly Jurisdiction[];
}

/* An empty list or an unknown value throws here, not as a search with no hits. */
const checkedJurisdictions = (named?: readonly Jurisdiction[]): Jurisdiction[] | undefined =>
  named === undefined ? undefined : parseJurisdictions(named);

/** FTS-only. New code uses hybridSearchRefDocs. */
export async function searchRefDocs(opts: SearchOpts): Promise<SearchHit[]> {
  const limit = Math.min(opts.limit ?? 5, 25);
  const rows = await callMatch({
    queryText: opts.query,
    queryEmbedding: null,
    matchCount: limit,
    filterDocId: opts.docId,
    jurisdictions: checkedJurisdictions(opts.jurisdictions),
    library: opts.library ?? "corpus",
  });
  return (
    rows
      .filter((row) => row.fts_rank != null)
      // The exposed score is negated back to lower-is-better.
      .sort((left, right) => (right.fts_rank ?? 0) - (left.fts_rank ?? 0))
      .slice(0, limit)
      .map((row) => rowToHit(row, -(row.fts_rank ?? 0)))
  );
}

export interface HybridSearchOpts {
  query: string;
  docId?: string;
  limit?: number;
  candidatesPerLeg?: number;
  mode?: "fts" | "vector" | "hybrid";
  /** Which library file to search; "corpus" unless named. */
  library?: Library;
  /** Only blocks whose id starts with this (one law section: its section id + "::"). */
  blockIdPrefix?: string;
  /** Only these jurisdictions' documents; every jurisdiction when unset. */
  jurisdictions?: readonly Jurisdiction[];
}

/*
 * Falls back to FTS-only when the vector leg cannot run (Ollama down, or
 * stored vectors from another model), so search always works.
 */
export async function hybridSearchRefDocs(opts: HybridSearchOpts): Promise<SearchHit[]> {
  const limit = Math.min(opts.limit ?? 8, 25);
  const cands = Math.min(opts.candidatesPerLeg ?? 50, 100);
  const jurisdictions = checkedJurisdictions(opts.jurisdictions);

  const mode = opts.mode ?? "hybrid";
  const library = opts.library ?? "corpus";
  const queryEmbedding =
    mode === "vector" || mode === "hybrid" ? await embedQueryIfUsable(opts.query, library) : null;
  if (queryEmbedding == null && mode === "vector") return [];

  const rows = await callMatch({
    queryText: mode === "vector" ? null : opts.query,
    queryEmbedding: mode === "fts" ? null : queryEmbedding,
    matchCount: cands,
    filterDocId: opts.docId,
    blockIdPrefix: opts.blockIdPrefix,
    jurisdictions,
    library,
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
      .filter((row) => value(row) != null)
      .sort((left, right) =>
        higherIsBetter ? value(right)! - value(left)! : value(left)! - value(right)!,
      );
    return new Map(ranked.map((row, i) => [row.block_id, i + 1]));
  };
  const ftsRanks = ranks((row) => row.fts_rank, true);
  const vectorRanks = ranks((row) => row.vector_distance, false);
  const rrf = (rank: number | undefined) => (rank === undefined ? 0 : 1 / (RRF_K + rank));
  return rows
    .map((row) => ({
      row,
      score: rrf(ftsRanks.get(row.block_id)) + rrf(vectorRanks.get(row.block_id)),
    }))
    .sort((left, right) => right.score - left.score);
}

const reembedCommand = (library: Library): string =>
  isLawLibrary(library)
    ? `law reembed --jurisdiction ${jurisdictionOfLibrary(library)} --all`
    : "reembed --all";

// Cross-model cosine distances are meaningless, so a model mismatch skips the vector leg.
async function embedQueryIfUsable(query: string, library: Library): Promise<number[] | null> {
  const { resolveEmbeddings, embedQuery } = await import("../refdocs/embeddings");
  try {
    const embedCfg = resolveEmbeddings();
    const stored = await storedEmbeddingModel(library);
    if (stored !== null && stored !== embedCfg.id) {
      console.warn(
        `[hybridSearchRefDocs] ${library} embeddings were built with ${stored} ` +
          `but the active model is ${embedCfg.id} — skipping the vector ` +
          `leg (FTS-only). Run \`npm run corpus -- ${reembedCommand(library)}\` to rebuild.`,
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
