import { hybridSearchRefDocs } from "../db/corpusSearch";
import { asStr } from "../db/corpusStore";
import { openLibraryDb } from "../db/libsql";
import {
  jurisdictionOfLawSource,
  lawSourcesOf,
  parseJurisdictions,
  type Jurisdiction,
} from "../jurisdiction";
import { parseLawTarget, sourceOfTarget, type LawSource } from "./citation";
import { CITATION_HINT, lawDocIdOf, requireLaw, sourceOfFormat, targetSectionId } from "./lawRead";

/*
 * Hybrid search of law.db only: the statute, the regulations, California's
 * code, or some of them. The corpus search is the same code with library "law"; this adds
 * each hit's source and the citation and headings from its block's
 * metadata, which the corpus hit shape does not carry.
 *
 * With several sources, each one is searched on its own and the hits are
 * taken in turn: statute, regulations, california. The regulations hold four times the
 * statute's passages: one ranking over both pushed 57% of the statute's
 * hits out of the top 8 and lost two statute sections of the eval's 44
 * cases (docs/evals/law.md); taking turns lost none.
 */

export type SearchMode = "fts" | "vector" | "hybrid";

export interface LawSearchOpts {
  query: string;
  /** One source only; the statute and the regulations unless named. */
  source?: LawSource;
  /** The sources of these jurisdictions (jurisdiction.ts); with source, a check on it. */
  jurisdictions?: readonly Jurisdiction[];
  /** One section, "469", "1400Z-2", "1.469-5T" or "CA 17041"; its subdivisions are not a filter. */
  section?: string;
  limit?: number;
  mode?: SearchMode;
}

export interface LawHit {
  blockId: string;
  source: LawSource;
  /** "26 U.S.C. § 469(h)(2)", "26 CFR § 1.469-5T(a)(1)", "Cal. Rev. & Tax. Code § 17041(a)". */
  citation: string;
  sectionHeading: string | null;
  headings: string[];
  text: string;
  score: number;
}

/*
 * With no source and no jurisdictions named: the federal law only.
 * California answers only when it is named (source "california", or
 * jurisdictions with "CA"): a federal question should not get California
 * hits. docs/evals/law.md has the measurement.
 */
export const DEFAULT_SOURCES: readonly LawSource[] = ["statute", "regulations"];

export async function searchLaw(opts: LawSearchOpts): Promise<LawHit[]> {
  const sources = sourcesToSearch(opts);
  await requireLaw();
  if (sources.length === 1) return searchSource(opts, sources[0]);
  const lists: LawHit[][] = [];
  for (const one of sources) lists.push(await searchSource(opts, one));
  return takeTurns(lists).slice(0, opts.limit ?? DEFAULT_LIMIT);
}

/* The sources a search reads. Input errors are thrown before law.db opens. */
export function sourcesToSearch(opts: Omit<LawSearchOpts, "query">): LawSource[] {
  const jurisdictions =
    opts.jurisdictions === undefined ? undefined : parseJurisdictions(opts.jurisdictions);
  const source = opts.section ? sectionSource(opts.section, opts.source) : opts.source;
  if (!source) return jurisdictions ? lawSourcesOf(jurisdictions) : [...DEFAULT_SOURCES];
  if (jurisdictions) requireSourceOn(source, jurisdictions, opts.section);
  return [source];
}

// A source (or a section's own source) outside the named jurisdictions is a mistake, not an empty search.
function requireSourceOn(source: LawSource, on: Jurisdiction[], section?: string): void {
  const owner = jurisdictionOfLawSource(source);
  if (on.includes(owner)) return;
  const what = section
    ? `section "${section}" is in source "${source}", which`
    : `source "${source}"`;
  throw new Error(
    `${what} is ${owner} law, and jurisdictions ${JSON.stringify(on)} does not include "${owner}". Add "${owner}" to jurisdictions, or leave out source.`,
  );
}

const DEFAULT_LIMIT = 8;

/** The first hit of each list, then the second of each, …; a short list just ends. */
function takeTurns(lists: LawHit[][]): LawHit[] {
  const longest = Math.max(0, ...lists.map((list) => list.length));
  const out: LawHit[] = [];
  for (let rank = 0; rank < longest; rank++)
    for (const list of lists) if (list[rank]) out.push(list[rank]);
  return out;
}

async function searchSource(opts: LawSearchOpts, source: LawSource): Promise<LawHit[]> {
  const docId = await lawDocIdOf(source);
  if (docId === null) return [];
  const hits = await hybridSearchRefDocs({
    query: opts.query,
    limit: opts.limit,
    mode: opts.mode,
    library: "law",
    docId,
    blockIdPrefix: opts.section ? await sectionPrefix(opts.section) : undefined,
  });
  const metadata = await blockMetadata(hits.map((hit) => hit.blockId));
  return hits.map((hit) => ({
    blockId: hit.blockId,
    source: sourceOfFormat(hit.format),
    citation: metadata.get(hit.blockId)?.citation ?? hit.citation,
    sectionHeading: hit.sectionHeading,
    headings: metadata.get(hit.blockId)?.headings ?? [],
    text: hit.text,
    score: hit.score,
  }));
}

// A section filter names its own source; naming the other one too is a mistake, not an empty search.
function sectionSource(section: string, source: LawSource | undefined): LawSource {
  const target = parseLawTarget(section);
  if (!target || target.kind === "block")
    throw new Error(`"${section}" is not a section number (${CITATION_HINT})`);
  const own = sourceOfTarget(target);
  if (source && source !== own)
    throw new Error(`"${section}" is a section of the ${own}, not of the ${source}`);
  return own;
}

async function sectionPrefix(section: string): Promise<string> {
  const target = parseLawTarget(section);
  if (!target || target.kind === "block")
    throw new Error(`"${section}" is not a section number (${CITATION_HINT})`);
  const sectionId = await targetSectionId(target);
  return `${sectionId}::`;
}

interface HitMetadata {
  citation?: string;
  headings?: string[];
}

async function blockMetadata(blockIds: string[]): Promise<Map<string, HitMetadata>> {
  if (blockIds.length === 0) return new Map();
  const db = await openLibraryDb("law");
  const res = await db.execute({
    sql: `SELECT block_id, metadata_json FROM ref_blocks
          WHERE block_id IN (${blockIds.map(() => "?").join(",")})`,
    args: blockIds,
  });
  return new Map(
    res.rows.map((row) => [
      asStr(row.block_id),
      JSON.parse(asStr(row.metadata_json) || "{}") as HitMetadata,
    ]),
  );
}
