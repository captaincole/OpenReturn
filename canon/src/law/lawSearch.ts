import { hybridSearchRefDocs } from "../db/corpusSearch";
import { asStr } from "../db/corpusStore";
import { openLibraryDb } from "../db/libsql";
import { parseLawTarget, sectionIdOf } from "./citation";
import { lawDocId, requireLaw } from "./lawRead";

/*
 * Hybrid search of law.db only. The corpus search is the same code with
 * library "law"; this adds the Code citation and headings from each
 * block's metadata, which the corpus hit shape does not carry.
 */

export type SearchMode = "fts" | "vector" | "hybrid";

export interface LawSearchOpts {
  query: string;
  /** One Code section, "469" or "1400Z-2"; its subdivisions are not a filter. */
  section?: string;
  limit?: number;
  mode?: SearchMode;
}

export interface LawHit {
  blockId: string;
  citation: string;
  sectionHeading: string | null;
  headings: string[];
  text: string;
  score: number;
}

export async function searchLaw(opts: LawSearchOpts): Promise<LawHit[]> {
  await requireLaw();
  const hits = await hybridSearchRefDocs({
    query: opts.query,
    limit: opts.limit,
    mode: opts.mode,
    library: "law",
    blockIdPrefix: opts.section ? await sectionPrefix(opts.section) : undefined,
  });
  const metadata = await blockMetadata(hits.map((hit) => hit.blockId));
  return hits.map((hit) => ({
    blockId: hit.blockId,
    citation: metadata.get(hit.blockId)?.citation ?? hit.citation,
    sectionHeading: hit.sectionHeading,
    headings: metadata.get(hit.blockId)?.headings ?? [],
    text: hit.text,
    score: hit.score,
  }));
}

async function sectionPrefix(section: string): Promise<string> {
  const target = parseLawTarget(section);
  if (target?.kind !== "citation") throw new Error(`"${section}" is not a Code section number`);
  return `${sectionIdOf(await lawDocId(), target.section)}::`;
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
